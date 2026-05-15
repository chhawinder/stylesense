"""
Ensemble service — generates 3 complete outfit ensembles using Gemini,
then matches each item to real products from Indian e-commerce.
"""
from __future__ import annotations

import json
import os
from typing import List, Dict

from app.services.fashion_rules import get_style_rules
from app.services.product_search import search_products_batch
from app.services.cache import get as cache_get, put as cache_put


# ── Mannequin image mapping (SVG placeholders per body shape x gender) ──

MANNEQUIN_IMAGES = {
    "hourglass_female": "/mannequins/hourglass-f.svg",
    "pear_female": "/mannequins/pear-f.svg",
    "apple_female": "/mannequins/apple-f.svg",
    "rectangle_female": "/mannequins/rectangle-f.svg",
    "inverted_triangle_female": "/mannequins/inverted-triangle-f.svg",
    "hourglass_male": "/mannequins/rectangle-m.svg",
    "pear_male": "/mannequins/rectangle-m.svg",
    "apple_male": "/mannequins/apple-m.svg",
    "rectangle_male": "/mannequins/rectangle-m.svg",
    "inverted_triangle_male": "/mannequins/inverted-triangle-m.svg",
}

# Color gradients for ensemble cards (mapped to season)
SEASON_GRADIENTS = {
    "spring": "linear-gradient(135deg, #FFDAB9 0%, #FF7F50 100%)",
    "summer": "linear-gradient(135deg, #B0C4DE 0%, #6A5ACD 100%)",
    "autumn": "linear-gradient(135deg, #D2691E 0%, #8B4513 100%)",
    "winter": "linear-gradient(135deg, #1E1E3F 0%, #2F4F4F 100%)",
}


def get_mannequin_image(body_shape: str, gender: str) -> str:
    key = f"{body_shape}_{gender}"
    return MANNEQUIN_IMAGES.get(key, MANNEQUIN_IMAGES.get(f"rectangle_{gender}", "/mannequins/rectangle-f.svg"))


async def generate_ensembles(
    body_shape: str, skin_undertone: str, color_season: str,
    face_shape: str, gender: str, predicted_size: str,
    kibbe_type: str, height_cm: float, occasion: str,
    budget_min: int, budget_max: int,
) -> Dict:
    """Generate 3 complete outfit ensembles with real product matches."""

    # Check cache (keyed on profile + occasion)
    cache_params = {
        "body": body_shape, "skin": skin_undertone, "season": color_season,
        "face": face_shape, "gender": gender, "size": predicted_size,
        "kibbe": kibbe_type, "occasion": occasion,
        "bmin": budget_min, "bmax": budget_max,
    }
    cached = cache_get("ensembles", cache_params)
    if cached is not None:
        return cached

    rules = get_style_rules(body_shape, skin_undertone, face_shape)
    mannequin = get_mannequin_image(body_shape, gender)

    # Phase 1: LLM ensemble planning
    ensembles_raw = _generate_ensemble_plans(
        body_shape, skin_undertone, color_season, face_shape,
        gender, predicted_size, kibbe_type, height_cm, occasion,
        budget_min, budget_max, rules,
    )

    if not ensembles_raw:
        ensembles_raw = _fallback_ensembles(body_shape, gender, occasion, rules)

    # Phase 2: Match each item to real products
    all_queries = []
    query_map = []  # track which ensemble/item each query belongs to
    for ei, ensemble in enumerate(ensembles_raw):
        for ii, item in enumerate(ensemble.get("items", [])):
            query = item.get("search_query", item.get("query", ""))
            if query:
                all_queries.append({"category": item.get("category", "top"), "query": query})
                query_map.append((ei, ii))

    # Search all products concurrently
    products = await search_products_batch(
        queries=all_queries[:12],  # cap at 12 queries to avoid rate limits
        budget_min=budget_min,
        budget_max=budget_max,
    )

    # Group products back to their ensemble items
    # Products come back as a flat list; distribute based on query order
    product_groups = _distribute_products(products, all_queries[:12])

    # Build final ensembles
    result_ensembles = []
    query_idx = 0
    for ei, ens in enumerate(ensembles_raw[:3]):
        items = []
        total = 0
        for ii, item in enumerate(ens.get("items", [])):
            matched = []
            if query_idx < len(product_groups):
                matched = product_groups[query_idx][:2]  # max 2 products per item
                query_idx += 1
            for p in matched:
                price = p.get("price", 0)
                if isinstance(price, str):
                    price = int("".join(c for c in price if c.isdigit()) or "0")
                total += price
            items.append({
                "category": item.get("category", ""),
                "style_notes": item.get("style_notes", item.get("description", "")),
                "color": item.get("color", ""),
                "products": matched,
            })

        result_ensembles.append({
            "name": ens.get("name", f"Ensemble {ei + 1}"),
            "style_score": ens.get("style_score", 90 - ei * 3),
            "description": ens.get("description", ""),
            "occasion": occasion,
            "total_price": total if total > 0 else None,
            "mannequin_image": mannequin,
            "items": items,
        })

    result = {
        "ensembles": result_ensembles,
        "style_rules": rules,
        "source": "gemini" if os.environ.get("GEMINI_API_KEY") else "rules",
    }

    # Cache for 30 minutes
    cache_put("ensembles", cache_params, result)

    return result


def _generate_ensemble_plans(
    body_shape, skin_undertone, color_season, face_shape,
    gender, predicted_size, kibbe_type, height_cm, occasion,
    budget_min, budget_max, rules,
):
    """Call Gemini to generate 3 ensemble plans."""
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return None

    try:
        import httpx

        occasion_label = (occasion or "casual").replace("_", " ").title()

        prompt = f"""You are a top-tier Indian fashion stylist with deep knowledge of Indian body types, skin tones, and fashion. Create 3 COMPLETE, STUNNING outfit ensembles specifically for the "{occasion_label}" occasion.

PERSON'S PROFILE:
- Body: {body_shape} shape, {height_cm}cm tall, size {predicted_size}
- Skin: {skin_undertone} undertone, {color_season} color season
- Style type: {kibbe_type or 'classic'} (Kibbe), {face_shape} face
- Gender: {gender}

WHAT FLATTERS THEM:
- Silhouettes: {", ".join(rules["best_styles"][:5])}
- Colors: {", ".join(rules["best_colors"][:6])}
- Indian wear: {", ".join(rules["indian_styles"][:4])}
- Necklines: {", ".join(rules["necklines"][:3])}
- AVOID: {", ".join(rules["avoid_styles"][:4])}

OCCASION CONTEXT — "{occasion_label}":
{"- Casual: relaxed everyday looks, comfortable fabrics, can be playful. Think brunch, mall, friends hangout." if "casual" in occasion else ""}{"- Office: professional yet stylish, structured pieces, muted or smart colors. Think boardroom, client meeting." if "office" in occasion else ""}{"- Party: bold, glamorous, statement pieces. Think club night, house party, cocktail event." if "party" in occasion else ""}{"- Wedding: opulent Indian wear, heavy embroidery, rich fabrics. Think baarat, reception, sangeet." if "wedding" in occasion else ""}{"- Festive: celebratory Indian wear, bright colors, moderate embellishment. Think Diwali, Eid, Navratri." if "festive" in occasion else ""}{"- Date Night: romantic, well-put-together, slightly sexy but classy. Think dinner date, rooftop bar." if "date" in occasion else ""}

RULES:
1. Each ensemble MUST have 4 items: main piece + complementary piece + footwear + accessory
2. All 3 ensembles must look COMPLETELY DIFFERENT from each other — different colors, different styles, different vibes
3. Ensemble 1: Contemporary/Western-inspired look for this occasion
4. Ensemble 2: Indian/Fusion look for this occasion
5. Ensemble 3: Bold/Experimental take on this occasion (push boundaries)
6. search_query must be an actual Amazon.in/Flipkart search (include "{gender}", color, fabric, style)
7. Colors MUST come from the person's recommended palette above
8. Budget: ₹{budget_min}-₹{budget_max} per ensemble

Return a JSON array of exactly 3 objects with this structure:
[
  {{
    "name": "Creative Ensemble Name",
    "style_score": 92,
    "description": "2 sentences explaining WHY this works for their {body_shape} body, {skin_undertone} skin, and the {occasion_label} occasion.",
    "items": [
      {{"category": "top|bottom|dress|kurta|blazer|shoes|accessory|saree", "style_notes": "Specific description", "color": "exact color", "search_query": "{gender} color style item fabric on Amazon India"}}
    ]
  }}
]"""

        resp = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.9,
                    "maxOutputTokens": 5000,
                    "responseMimeType": "application/json",
                },
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(text)

        # Handle wrapped responses
        if isinstance(parsed, dict):
            for v in parsed.values():
                if isinstance(v, list):
                    parsed = v
                    break

        if isinstance(parsed, list) and len(parsed) >= 1:
            return parsed[:3]
        return None
    except Exception as e:
        print(f"Gemini ensemble generation failed: {e}")
        return None


def _fallback_ensembles(body_shape, gender, occasion, rules):
    """Rule-based fallback when Gemini is unavailable."""
    colors = rules["best_colors"][:3]
    styles = rules["best_styles"][:4]
    indian = rules["indian_styles"][:2]

    if gender == "male":
        return [
            {
                "name": "Sharp & Polished",
                "style_score": 94,
                "description": f"A tailored look designed for your {body_shape.replace('_', ' ')} frame. Clean lines and structured shoulders create a commanding presence.",
                "items": [
                    {"category": "top", "style_notes": f"{colors[0].title()} slim-fit formal shirt", "color": colors[0], "search_query": f"men {colors[0]} slim fit formal shirt"},
                    {"category": "bottom", "style_notes": "Charcoal tailored trousers", "color": "charcoal", "search_query": "men charcoal tailored trousers slim fit"},
                    {"category": "shoes", "style_notes": "Brown leather oxford shoes", "color": "brown", "search_query": "men brown leather oxford shoes formal"},
                ],
            },
            {
                "name": "Weekend Explorer",
                "style_score": 91,
                "description": f"Relaxed yet put-together. The {colors[1]} tones complement your {rules.get('color_season', 'warm')} undertone perfectly.",
                "items": [
                    {"category": "top", "style_notes": f"{colors[1].title()} cotton polo t-shirt", "color": colors[1], "search_query": f"men {colors[1]} cotton polo tshirt"},
                    {"category": "bottom", "style_notes": "Indigo selvedge denim jeans", "color": "indigo", "search_query": "men indigo selvedge denim jeans"},
                    {"category": "shoes", "style_notes": "White minimal sneakers", "color": "white", "search_query": "men white minimal sneakers casual"},
                ],
            },
            {
                "name": "Festive Heritage",
                "style_score": 88,
                "description": f"A modern take on Indian elegance. The Nehru jacket adds structure to your {body_shape.replace('_', ' ')} silhouette.",
                "items": [
                    {"category": "kurta", "style_notes": f"Cream cotton silk kurta", "color": "cream", "search_query": "men cream cotton silk kurta"},
                    {"category": "blazer", "style_notes": f"{colors[0].title()} Nehru jacket silk", "color": colors[0], "search_query": f"men {colors[0]} Nehru jacket silk"},
                    {"category": "bottom", "style_notes": "Off-white churidar pants", "color": "off-white", "search_query": "men off white churidar pants cotton"},
                ],
            },
        ]

    return [
        {
            "name": "Effortless Chic",
            "style_score": 95,
            "description": f"Perfectly tailored for your {body_shape.replace('_', ' ')} shape. {styles[0].title()} silhouette in {colors[0]} flatters your {rules.get('color_season', 'warm')} coloring.",
            "items": [
                {"category": "kurta", "style_notes": f"{colors[0].title()} {styles[0]}", "color": colors[0], "search_query": f"women {colors[0]} {styles[0]}"},
                {"category": "bottom", "style_notes": f"{colors[1].title()} palazzo pants", "color": colors[1], "search_query": f"women {colors[1]} palazzo pants cotton"},
                {"category": "accessory", "style_notes": f"{rules['metals'][0].title()} statement earrings", "color": rules["metals"][0], "search_query": f"women {rules['metals'][0]} statement earrings"},
            ],
        },
        {
            "name": "Modern Heritage",
            "style_score": 92,
            "description": f"Indian elegance reimagined. {indian[0].title()} creates beautiful proportions for your frame.",
            "items": [
                {"category": "kurta", "style_notes": f"{colors[0].title()} {indian[0]}", "color": colors[0], "search_query": f"women {colors[0]} {indian[0]}"},
                {"category": "bottom", "style_notes": "Gold-bordered dupatta", "color": "gold", "search_query": f"women gold border dupatta silk"},
                {"category": "shoes", "style_notes": "Embellished kolhapuri chappals", "color": "gold", "search_query": "women embellished kolhapuri chappals"},
            ],
        },
        {
            "name": "Power Play",
            "style_score": 89,
            "description": f"A confident western look. Structured blazer balances your {body_shape.replace('_', ' ')} shape with refined sophistication.",
            "items": [
                {"category": "blazer", "style_notes": f"{colors[2].title()} structured blazer", "color": colors[2], "search_query": f"women {colors[2]} structured blazer"},
                {"category": "top", "style_notes": "White fitted blouse", "color": "white", "search_query": "women white fitted blouse formal"},
                {"category": "bottom", "style_notes": f"{colors[1].title()} tailored trousers", "color": colors[1], "search_query": f"women {colors[1]} tailored trousers"},
                {"category": "shoes", "style_notes": "Nude block heels", "color": "nude", "search_query": "women nude block heels"},
            ],
        },
    ]


def _distribute_products(products: list, queries: list) -> list:
    """Distribute a flat product list back into groups matching the query order."""
    groups = [[] for _ in queries]

    # Phase 1: match by search_query tag (exact match from scraper)
    unmatched = []
    for product in products:
        pq = (product.get("search_query", "") or "").lower().strip()
        placed = False
        if pq:
            for qi, q in enumerate(queries):
                qq = q.get("query", "").lower().strip()
                if pq == qq:
                    groups[qi].append(product)
                    placed = True
                    break
        if not placed:
            unmatched.append(product)

    # Phase 2: match remaining by category + title keyword scoring
    for product in unmatched:
        p_cat = (product.get("category", "") or "").lower()
        title = (product.get("title", "") or "").lower()
        best_match = 0
        best_score = -1
        for qi, q in enumerate(queries):
            q_cat = q.get("category", "").lower()
            words = q.get("query", "").lower().split()
            score = sum(1 for w in words if w in title)
            # Boost score if category matches
            if p_cat and q_cat and p_cat == q_cat:
                score += 3
            if score > best_score:
                best_score = score
                best_match = qi
        if best_score > 0:
            groups[best_match].append(product)

    return groups
