from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.recommendation import RecommendationRequest
from app.services.fashion_rules import get_style_rules
from app.services.llm_service import generate_search_queries_with_ai, generate_style_tips
from app.services.product_search import (
    get_all_queries, search_products_batch, QUERIES_PER_PAGE,
)

router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


@router.post("")
async def generate_recommendations(req: RecommendationRequest, db: Session = Depends(get_db)):
    """
    Paginated fashion recommendations.
    Page 0: generate all queries, scrape first batch, return products + pending_queries.
    Page 1+: receive pending_queries, scrape next batch, return products + remaining queries.
    """
    body_shape = req.body_shape or "rectangle"
    skin_undertone = req.skin_undertone or "warm"
    face_shape = req.face_shape or "oval"
    gender = req.gender or "female"
    occasion = req.occasion or "casual"

    rules = get_style_rules(
        body_shape=body_shape,
        undertone=skin_undertone,
        face_shape=face_shape,
    )

    # --- Determine which queries to scrape this page ---
    if req.page == 0:
        # First page: generate all queries
        ai_queries = generate_search_queries_with_ai(
            body_shape=body_shape,
            skin_undertone=skin_undertone,
            color_season=req.color_season or "autumn",
            face_shape=face_shape,
            gender=gender,
            predicted_size=req.predicted_size or "M",
            occasion=occasion,
            budget_min=req.budget_min,
            budget_max=req.budget_max,
            rules=rules,
        )

        source = "gemini" if ai_queries else "rules"

        if not ai_queries:
            ai_queries = get_all_queries(gender, occasion, rules["best_colors"], rules["best_styles"])
            source = "rules"

        all_queries = ai_queries

        # Generate style tip only on first page
        style_tip = generate_style_tips(
            body_shape=body_shape,
            skin_undertone=skin_undertone,
            color_season=req.color_season or "autumn",
            face_shape=face_shape,
            gender=gender,
            occasion=occasion,
        )
    else:
        # Subsequent pages: use pending queries from client
        all_queries = req.pending_queries or []
        source = "continuation"
        style_tip = ""

    # Split: scrape this batch, save rest for next page
    batch = all_queries[:QUERIES_PER_PAGE]
    remaining = all_queries[QUERIES_PER_PAGE:]

    # Scrape products for this batch
    products = await search_products_batch(
        queries=batch,
        budget_min=req.budget_min,
        budget_max=req.budget_max,
    )

    # Add personalized "why" to each product
    for p in products:
        color_note = ""
        for c in rules["best_colors"][:3]:
            if c.lower() in p.get("title", "").lower():
                color_note = f" {c.title()} complements your {skin_undertone} undertone."
                break
        p["why"] = f"Picked for your {body_shape.replace('_', ' ')} shape.{color_note}"

    return {
        "products": products,
        "style_rules": rules if req.page == 0 else None,
        "style_tip": style_tip,
        "occasion": occasion,
        "source": source,
        "total": len(products),
        "has_more": len(remaining) > 0,
        "pending_queries": remaining,
    }


@router.get("/rules")
async def get_fashion_rules():
    """Return fashion domain rules for client-side preview."""
    from app.services.fashion_rules import BODY_SHAPE_RULES, SKIN_TONE_PALETTES

    return {"body_shapes": BODY_SHAPE_RULES, "skin_tones": SKIN_TONE_PALETTES}
