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

    prompt = f"""You are an expert Indian fashion stylist. Generate 8 specific product search queries to find the PERFECT outfit on Amazon India and Flipkart for this person.

USER PROFILE:
- Body Shape: {body_shape}
- Gender: {gender}
- Size: {predicted_size} (Indian sizing)
- Skin Tone: {skin_undertone} undertone, {color_season} season
- Face Shape: {face_shape}
- Occasion: {occasion or "casual everyday"}
- Budget: ₹{budget_min} - ₹{budget_max}

STYLE RULES FOR THIS BODY TYPE:
- Best silhouettes: {", ".join(rules["best_styles"][:5])}
- Best colors: {", ".join(rules["best_colors"][:5])}
- Indian styles: {", ".join(rules["indian_styles"][:3])}
- Avoid: {", ".join(rules["avoid_styles"][:3])}

Generate 8 search queries. Each query should be a realistic search string someone would type on Amazon.in or Flipkart to find a specific product. Include the color, style, and gender in each query.

Return ONLY a JSON array of 8 objects, each with:
- "category": one of [top, bottom, dress, kurta, saree, blazer, accessory, shoes]
- "query": the exact search string (e.g. "women olive green A-line kurta cotton")

Return ONLY the JSON array, no markdown, no explanation."""

    resp = httpx.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.9,
                "maxOutputTokens": 1500,
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
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
