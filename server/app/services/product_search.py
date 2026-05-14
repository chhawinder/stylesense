"""
Product search service — scrapes real products from Indian e-commerce platforms.
Returns actual product listings with images, prices, and direct links.
"""
from __future__ import annotations

import asyncio
import re
from typing import List, Dict
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Encoding": "gzip, deflate",
}

TIMEOUT = 15


# ── Occasion → category search terms mapping ─────────────────────────────
OCCASION_QUERIES = {
    "female": {
        "casual": [
            ("top", "women casual kurti top"),
            ("top", "women casual t-shirt cotton"),
            ("bottom", "women palazzo pants casual"),
            ("bottom", "women casual jeans women"),
            ("dress", "women casual cotton dress"),
            ("dress", "women casual midi dress"),
            ("kurta", "women casual short kurti"),
            ("kurta", "women straight kurti cotton"),
            ("shoes", "women casual sneakers"),
            ("accessory", "women casual tote bag"),
        ],
        "office": [
            ("top", "women formal office blouse"),
            ("top", "women formal shirt cotton"),
            ("bottom", "women formal trousers slim"),
            ("bottom", "women office wear pants"),
            ("blazer", "women office blazer"),
            ("dress", "women formal midi dress office"),
            ("kurta", "women formal cotton kurta"),
            ("kurta", "women office wear kurti"),
            ("shoes", "women formal shoes low heel"),
            ("accessory", "women office laptop bag"),
        ],
        "party": [
            ("dress", "women party dress western"),
            ("dress", "women cocktail dress"),
            ("top", "women party sequin top"),
            ("top", "women party crop top"),
            ("bottom", "women party skirt"),
            ("bottom", "women leather pants party"),
            ("shoes", "women party high heels"),
            ("shoes", "women stiletto heels"),
            ("accessory", "women party clutch bag"),
            ("accessory", "women statement earrings party"),
        ],
        "wedding": [
            ("saree", "women silk saree wedding"),
            ("saree", "women banarasi saree bridal"),
            ("kurta", "women lehenga choli bridal"),
            ("kurta", "women designer anarkali wedding"),
            ("dress", "women anarkali gown wedding"),
            ("dress", "women indo western gown"),
            ("accessory", "women kundan jewelry set wedding"),
            ("accessory", "women bridal clutch"),
            ("shoes", "women ethnic heels wedding"),
            ("shoes", "women bridal sandals embellished"),
        ],
        "festive": [
            ("kurta", "women festive kurta set ethnic"),
            ("kurta", "women anarkali kurta festive"),
            ("saree", "women festive designer saree"),
            ("saree", "women chanderi saree"),
            ("dress", "women anarkali suit festive"),
            ("dress", "women ethnic gown festive"),
            ("accessory", "women ethnic jhumka earrings"),
            ("accessory", "women bangles set ethnic"),
            ("shoes", "women ethnic jutti mojari"),
            ("shoes", "women embroidered sandals"),
        ],
        "date night": [
            ("dress", "women date night dress bodycon"),
            ("dress", "women wrap dress stylish"),
            ("top", "women stylish crop top"),
            ("top", "women satin cami top"),
            ("bottom", "women high waist jeans skinny"),
            ("bottom", "women leather skirt mini"),
            ("shoes", "women block heels sandals"),
            ("shoes", "women strappy heels"),
            ("accessory", "women sling bag trendy"),
            ("accessory", "women perfume gift set"),
        ],
    },
    "male": {
        "casual": [
            ("top", "men casual shirt cotton"),
            ("top", "men polo t-shirt casual"),
            ("top", "men henley t-shirt"),
            ("bottom", "men casual chinos slim"),
            ("bottom", "men joggers casual cotton"),
            ("kurta", "men casual short kurta cotton"),
            ("kurta", "men cotton kurta casual"),
            ("shoes", "men casual sneakers white"),
            ("shoes", "men loafers casual"),
            ("accessory", "men casual watch analog"),
            ("accessory", "men sunglasses aviator"),
        ],
        "office": [
            ("top", "men formal shirt slim fit"),
            ("top", "men formal shirt white cotton"),
            ("bottom", "men formal trousers"),
            ("bottom", "men office chinos slim"),
            ("blazer", "men office blazer slim"),
            ("blazer", "men formal suit jacket"),
            ("shoes", "men formal oxford shoes leather"),
            ("shoes", "men formal derby shoes"),
            ("accessory", "men leather belt formal"),
            ("accessory", "men laptop bag leather"),
            ("accessory", "men formal tie silk"),
        ],
        "party": [
            ("top", "men party shirt printed"),
            ("top", "men satin shirt party"),
            ("bottom", "men party wear jeans"),
            ("bottom", "men slim trousers party"),
            ("blazer", "men party blazer"),
            ("blazer", "men velvet blazer"),
            ("shoes", "men loafers party"),
            ("shoes", "men chelsea boots"),
            ("accessory", "men party watch chronograph"),
            ("accessory", "men perfume"),
        ],
        "wedding": [
            ("kurta", "men sherwani wedding"),
            ("kurta", "men designer sherwani"),
            ("kurta", "men kurta pajama set silk"),
            ("kurta", "men indo western sherwani"),
            ("blazer", "men nehru jacket wedding"),
            ("blazer", "men jodhpuri suit wedding"),
            ("shoes", "men ethnic juttis mojari"),
            ("shoes", "men nagra shoes wedding"),
            ("accessory", "men brooch wedding"),
            ("accessory", "men safa turban wedding"),
        ],
        "festive": [
            ("kurta", "men festive kurta pajama set"),
            ("kurta", "men silk kurta festive"),
            ("kurta", "men pathani suit cotton"),
            ("blazer", "men nehru jacket ethnic"),
            ("blazer", "men ethnic waistcoat"),
            ("bottom", "men dhoti pants ethnic"),
            ("shoes", "men ethnic kolhapuri chappal"),
            ("shoes", "men mojari ethnic"),
            ("accessory", "men ethnic bracelet"),
            ("accessory", "men stole shawl"),
        ],
        "date night": [
            ("top", "men stylish shirt slim fit"),
            ("top", "men printed shirt trendy"),
            ("bottom", "men slim jeans stretch"),
            ("bottom", "men slim chinos"),
            ("blazer", "men casual blazer"),
            ("blazer", "men bomber jacket"),
            ("shoes", "men chelsea boots"),
            ("shoes", "men white sneakers premium"),
            ("accessory", "men perfume date"),
            ("accessory", "men bracelet trendy"),
        ],
    },
}


def get_search_queries(gender: str, occasion: str, colors: list, styles: list) -> List[Dict]:
    """
    Generate search queries based on user profile and occasion.
    Incorporates body-shape-appropriate colors and styles into the queries.
    """
    gender_key = "male" if gender and gender.lower() == "male" else "female"
    occasion_key = occasion.lower() if occasion else "casual"

    base_queries = OCCASION_QUERIES.get(gender_key, OCCASION_QUERIES["female"])
    queries = base_queries.get(occasion_key, base_queries["casual"])

    # Enhance queries with recommended colors
    enhanced = []
    for i, (category, query) in enumerate(queries):
        color = colors[i % len(colors)] if colors else ""
        enhanced.append({
            "category": category,
            "query": f"{query} {color}".strip(),
            "base_query": query,
        })

    return enhanced


# ── Amazon.in scraper ─────────────────────────────────────────────────────
def _parse_amazon_results(html: str, limit: int = 4) -> List[Dict]:
    """Parse Amazon.in search results page and extract product listings."""
    soup = BeautifulSoup(html, "html.parser")
    products = []

    # Find product cards by data-asin attribute (stable across layouts)
    for card in soup.select('[data-component-type="s-search-result"][data-asin]'):
        if len(products) >= limit:
            break

        asin = card.get("data-asin", "")
        if not asin:
            continue

        # Skip sponsored
        if card.select_one('[data-component-type="sp-sponsored-result"]'):
            continue

        # Image — find first img with amazon media src (class names are dynamic)
        img_tag = None
        for img in card.select("img"):
            src = img.get("src", "")
            if "m.media-amazon.com/images" in src:
                img_tag = img
                break

        # Title from h2
        title_tag = card.select_one("h2 span") or card.select_one("h2")

        if not img_tag or not title_tag:
            continue

        # Image — upscale to 466px
        img_src = img_tag.get("src", "")
        # Replace any size suffix with a larger one
        img_src = re.sub(r'\._[A-Z_]+\d+[^.]*_*\.', '._AC_SX466_.', img_src)
        if '._AC_SX466_.' not in img_src:
            # Fallback: just append before extension
            img_src = re.sub(r'\.jpg', '._AC_SX466_.jpg', img_src)

        # Product URL — construct from ASIN (most reliable)
        product_url = f"https://www.amazon.in/dp/{asin}"

        # Also try to get the actual link for better titles
        link_tag = card.select_one("h2 a")
        if link_tag:
            href = link_tag.get("href", "")
            if href.startswith("/"):
                product_url = f"https://www.amazon.in{href}".split("/ref=")[0]

        # Price — find ₹ followed by digits in the card
        price = None
        price_tag = card.select_one("span.a-price-whole")
        if price_tag:
            price_text = price_tag.get_text(strip=True).replace(",", "").replace(".", "")
            if price_text.isdigit():
                price = int(price_text)
        else:
            # Fallback: regex search for price pattern
            price_match = re.search(r'₹\s*([\d,]+)', card.get_text())
            if price_match:
                p = price_match.group(1).replace(",", "")
                if p.isdigit():
                    price = int(p)

        # Rating
        rating = None
        rating_tag = card.select_one("span.a-icon-alt")
        if rating_tag:
            m = re.search(r'([\d.]+)', rating_tag.get_text())
            if m:
                rating = float(m.group(1))

        title = title_tag.get_text(strip=True)
        if len(title) > 120:
            title = title[:117] + "..."

        products.append({
            "title": title,
            "brand": "",
            "price": price,
            "image_url": img_src,
            "product_url": product_url,
            "rating": rating,
            "platform": "Amazon",
        })

    return products


async def search_amazon(client: httpx.AsyncClient, query: str, limit: int = 4) -> List[Dict]:
    """Search Amazon.in and return real product listings."""
    url = f"https://www.amazon.in/s?k={quote_plus(query)}"
    try:
        resp = await client.get(url, headers=HEADERS, timeout=TIMEOUT, follow_redirects=True)
        resp.raise_for_status()
        return _parse_amazon_results(resp.text, limit)
    except Exception as e:
        print(f"Amazon search failed for '{query}': {e}")
        return []


# ── Flipkart scraper ──────────────────────────────────────────────────────
def _parse_flipkart_results(html: str, limit: int = 4) -> List[Dict]:
    """Parse Flipkart search results."""
    soup = BeautifulSoup(html, "html.parser")
    products = []

    # Flipkart product links contain /p/ in href
    for link in soup.select('a[href*="/p/"]'):
        if len(products) >= limit:
            break

        img_tag = link.select_one("img")
        if not img_tag:
            continue

        img_src = img_tag.get("src", "") or img_tag.get("data-src", "")
        if not img_src or "rukminim" not in img_src:
            continue

        title = img_tag.get("alt", "")
        if not title or len(title) < 5:
            continue

        href = link.get("href", "")
        product_url = f"https://www.flipkart.com{href}" if href.startswith("/") else href
        product_url = product_url.split("?")[0]  # clean params

        # Upscale image
        img_src = re.sub(r'/\d+/\d+/', '/416/416/', img_src)

        # Try to find price nearby
        price = None
        parent = link.find_parent("div")
        if parent:
            price_match = re.search(r'₹\s*([\d,]+)', parent.get_text())
            if price_match:
                price = int(price_match.group(1).replace(",", ""))

        if title in [p["title"] for p in products]:
            continue  # skip duplicates

        products.append({
            "title": title[:120],
            "brand": "",
            "price": price,
            "image_url": img_src,
            "product_url": product_url,
            "rating": None,
            "platform": "Flipkart",
        })

    return products


async def search_flipkart(client: httpx.AsyncClient, query: str, limit: int = 4) -> List[Dict]:
    """Search Flipkart and return real product listings."""
    url = f"https://www.flipkart.com/search?q={quote_plus(query)}"
    try:
        resp = await client.get(url, headers=HEADERS, timeout=TIMEOUT, follow_redirects=True)
        resp.raise_for_status()
        return _parse_flipkart_results(resp.text, limit)
    except Exception as e:
        print(f"Flipkart search failed for '{query}': {e}")
        return []


# ── Main search orchestrator ──────────────────────────────────────────────
QUERIES_PER_PAGE = 3  # scrape 3 queries per page request


def get_all_queries(gender: str, occasion: str, colors: List[str], styles: List[str]) -> List[Dict]:
    """Get all search queries for an occasion (used by the endpoint to split into pages)."""
    return get_search_queries(gender, occasion, colors, styles)


async def search_products_batch(
    queries: List[Dict],
    budget_min: int = 500,
    budget_max: int = 10000,
) -> List[Dict]:
    """
    Search real products for a batch of queries.
    Each query dict has {category, query}.
    Returns real products with images and direct links.
    """
    async with httpx.AsyncClient() as client:
        tasks = []
        for q in queries:
            # 6 from Amazon + 4 from Flipkart per query = ~10 per query
            tasks.append(_search_and_tag(client, "amazon", q["query"], q["category"], limit=6))
            tasks.append(_search_and_tag(client, "flipkart", q["query"], q["category"], limit=4))

        results = await asyncio.gather(*tasks)

    all_products = []
    seen_titles = set()
    for product_list in results:
        for p in product_list:
            short_title = p["title"][:50].lower()
            if short_title not in seen_titles:
                seen_titles.add(short_title)
                if p.get("price") and (p["price"] < budget_min * 0.5 or p["price"] > budget_max * 2):
                    continue
                all_products.append(p)

    return all_products


async def _search_and_tag(
    client: httpx.AsyncClient,
    platform: str,
    query: str,
    category: str,
    limit: int = 3,
) -> List[Dict]:
    """Search a platform and tag results with category."""
    if platform == "amazon":
        products = await search_amazon(client, query, limit)
    elif platform == "flipkart":
        products = await search_flipkart(client, query, limit)
    else:
        products = []

    for p in products:
        p["category"] = category
        p["search_query"] = query

    return products
