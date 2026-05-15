"""
LLM service for AI-powered fashion recommendations.
Uses Gemini Flash free tier to generate smarter search queries
and personalized styling advice based on the user's body profile.
Falls back to rule-based query generation if no API key is configured.
"""
from __future__ import annotations

import json
import os
from typing import List, Dict

from app.services.fashion_rules import get_style_rules


def generate_search_queries_with_ai(
    body_shape: str, skin_undertone: str, color_season: str, face_shape: str,
    gender: str, predicted_size: str, occasion: str,
    budget_min: int, budget_max: int, rules: dict,
) -> List[Dict]:
    """
    Use Gemini to generate smart, specific search queries for Indian e-commerce.
    Returns a list of {category, query} dicts.
    Falls back to None if Gemini is not available.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return None

    try:
        return _call_gemini_for_queries(
            gemini_key, body_shape, skin_undertone, color_season, face_shape,
            gender, predicted_size, occasion, budget_min, budget_max, rules,
        )
    except Exception as e:
        print(f"Gemini query generation failed: {e}")
        return None


def _call_gemini_for_queries(
    api_key: str, body_shape: str, skin_undertone: str, color_season: str,
    face_shape: str, gender: str, predicted_size: str, occasion: str,
    budget_min: int, budget_max: int, rules: dict,
) -> List[Dict]:
    """Call Gemini Flash API to generate specific product search queries."""
    import httpx

    occasion_label = (occasion or "casual").replace("_", " ").title()

    # Strict occasion-specific guidance so Gemini doesn't mix categories
    occasion_rules = {
        "casual": "ONLY generate casual/relaxed items: graphic tshirts, polo tshirts, casual shirts, jeans, joggers, sneakers, casual watches. NO formal shirts, NO blazers, NO office trousers.",
        "office": "ONLY generate formal/professional items: formal shirts, tailored trousers, pencil skirts, blazers, formal shoes (oxford, pumps, loafers), leather belts, laptop bags. NO tshirts, NO jeans, NO cargo pants, NO kurtas, NO sneakers, NO casual items.",
        "party": "ONLY generate party/nightout items: sequin tops, satin shirts, bodycon dresses, cocktail dresses, velvet blazers, stilettos, statement jewelry, clutch bags. NO casual tshirts, NO formal office wear.",
        "wedding": "ONLY generate wedding/bridal items: sherwanis, lehengas, silk sarees, heavy embroidered outfits, bridal jewelry, ethnic footwear. NO casual or office items.",
        "festive": "ONLY generate festive/ethnic items: embroidered kurtas, silk kurta sets, anarkalis, festive sarees, ethnic jewelry, jutis/mojaris. NO western casual or office wear.",
        "date_night": "ONLY generate date night items: fitted shirts, slim jeans, elegant dresses, wrap tops, heeled boots, minimal jewelry, cologne/perfume. NO formal office wear, NO heavy ethnic wear.",
    }
    occ_key = (occasion or "casual").lower().replace(" ", "_")
    occ_guidance = occasion_rules.get(occ_key, occasion_rules["casual"])

    prompt = f"""You are an expert Indian fashion stylist. Generate 10 specific product search queries for the "{occasion_label}" occasion on Amazon India / Flipkart.

USER PROFILE:
- Body Shape: {body_shape}, Gender: {gender}, Size: {predicted_size}
- Skin: {skin_undertone} undertone, {color_season} season
- Budget: ₹{budget_min} - ₹{budget_max}

FLATTERING STYLES: {", ".join(rules["best_styles"][:5])}
BEST COLORS: {", ".join(rules["best_colors"][:5])}
AVOID: {", ".join(rules["avoid_styles"][:3])}

CRITICAL OCCASION RULES — "{occasion_label}":
{occ_guidance}

RULES:
1. Every query MUST be appropriate for "{occasion_label}" — DO NOT mix items from other occasions
2. Each query must be a realistic Amazon.in/Flipkart search string with gender, color, fabric, and style
3. Include at least 3 tops, 2 bottoms, 2 shoes, 1 accessory — all appropriate for {occasion_label}
4. Colors MUST come from the person's best colors above
5. Include the gender ("{gender}") in every search query

Return ONLY a JSON array of 10 objects:
[{{"category": "top|bottom|dress|kurta|saree|blazer|shoes|accessory", "query": "search string here"}}]"""

    resp = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 2000,
                "responseMimeType": "application/json",
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()

    text = data["candidates"][0]["content"]["parts"][0]["text"]
    parsed = json.loads(text)

    # Handle both list and dict-wrapped responses
    if isinstance(parsed, dict):
        # Gemini sometimes wraps in {"queries": [...]}
        for v in parsed.values():
            if isinstance(v, list):
                parsed = v
                break

    # Validate format
    valid = []
    for q in parsed:
        if isinstance(q, dict) and "category" in q and "query" in q:
            valid.append({"category": q["category"], "query": q["query"]})
    return valid if valid else None


def generate_style_tips(
    body_shape: str, skin_undertone: str, color_season: str,
    face_shape: str, gender: str, occasion: str,
) -> str:
    """
    Use Gemini to generate a short personalized style tip.
    Returns a string, or empty string if Gemini is unavailable.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    if not gemini_key:
        return ""

    try:
        import httpx
        prompt = f"""In 1-2 sentences, give a specific styling tip for a {gender} with {body_shape} body shape, {skin_undertone} undertone ({color_season} season), and {face_shape} face, dressing for {occasion or 'casual'} occasion. Be specific about colors and silhouettes. No generic advice."""

        resp = httpx.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 150},
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        print(f"Gemini style tips failed: {e}")
        return ""
