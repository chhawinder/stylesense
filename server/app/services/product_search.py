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

from app.services.cache import get as cache_get, put as cache_put

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
            ("top", "women casual cotton tshirt round neck"),
            ("top", "women printed crop top casual"),
            ("top", "women oversized boyfriend tshirt"),
            ("kurta", "women short straight kurti cotton"),
            ("kurta", "women A-line printed kurti casual"),
            ("bottom", "women wide leg palazzo pants cotton"),
            ("bottom", "women mom fit denim jeans"),
            ("bottom", "women cotton culottes casual"),
            ("dress", "women casual midi shirt dress cotton"),
            ("dress", "women tiered maxi dress printed"),
            ("shoes", "women white canvas sneakers casual"),
            ("accessory", "women canvas tote bag casual"),
        ],
        "office": [
            ("top", "women formal office shirt cotton"),
            ("top", "women peplum blouse office wear"),
            ("top", "women turtleneck ribbed top formal"),
            ("bottom", "women formal straight trousers office"),
            ("bottom", "women pencil skirt knee length"),
            ("blazer", "women single breasted blazer office"),
            ("blazer", "women longline open front blazer"),
            ("dress", "women formal sheath dress midi"),
            ("kurta", "women cotton formal kurti office"),
            ("kurta", "women embroidered straight kurta pants set"),
            ("shoes", "women kitten heels pumps office"),
            ("accessory", "women structured laptop bag leather"),
        ],
        "party": [
            ("dress", "women sequin bodycon party dress"),
            ("dress", "women one shoulder cocktail dress"),
            ("dress", "women satin slip dress party"),
            ("top", "women shimmer crop top party"),
            ("top", "women off shoulder corset top"),
            ("bottom", "women faux leather leggings party"),
            ("bottom", "women sequin mini skirt"),
            ("shoes", "women stiletto high heels party"),
            ("shoes", "women platform block heels glitter"),
            ("accessory", "women beaded clutch bag party"),
            ("accessory", "women chandelier earrings statement"),
            ("accessory", "women rhinestone layered necklace"),
        ],
        "wedding": [
            ("saree", "women banarasi silk saree wedding"),
            ("saree", "women kanjivaram silk saree bridal"),
            ("saree", "women designer embroidered saree wedding"),
            ("kurta", "women bridal lehenga choli heavy"),
            ("kurta", "women designer anarkali gown wedding"),
            ("kurta", "women sharara suit heavy embroidered wedding"),
            ("dress", "women indo western gown wedding"),
            ("dress", "women floor length anarkali bridal"),
            ("accessory", "women kundan bridal jewelry set heavy"),
            ("accessory", "women potli bag bridal embroidered"),
            ("shoes", "women bridal heels embellished golden"),
            ("shoes", "women ethnic wedge sandals wedding"),
        ],
        "festive": [
            ("kurta", "women festive kurta palazzo set printed"),
            ("kurta", "women anarkali festive suit embroidered"),
            ("kurta", "women mirror work kurti festive"),
            ("saree", "women chanderi silk saree festive"),
            ("saree", "women linen saree handloom festive"),
            ("dress", "women ethnic maxi dress festive print"),
            ("dress", "women floor length ethnic gown festive"),
            ("accessory", "women oxidized jhumka earrings ethnic"),
            ("accessory", "women lac bangles set festive"),
            ("accessory", "women potli bag ethnic embroidered"),
            ("shoes", "women ethnic jutti mojari embroidered"),
            ("shoes", "women kolhapuri chappal women ethnic"),
        ],
        "date_night": [
            ("dress", "women bodycon midi dress date night"),
            ("dress", "women wrap dress satin going out"),
            ("dress", "women backless mini dress date"),
            ("top", "women satin camisole top lace"),
            ("top", "women mesh crop top date night"),
            ("bottom", "women high waist skinny jeans dark"),
            ("bottom", "women leather look mini skirt"),
            ("shoes", "women strappy high heels sandals"),
            ("shoes", "women pointed toe block heels"),
            ("accessory", "women chain sling bag compact"),
            ("accessory", "women layered delicate necklace gold"),
            ("accessory", "women perfume gift set women"),
        ],
    },
    "male": {
        "casual": [
            ("top", "men casual printed half sleeve shirt"),
            ("top", "men round neck graphic tshirt cotton"),
            ("top", "men polo collar tshirt branded"),
            ("top", "men henley full sleeve tshirt"),
            ("bottom", "men casual chinos trouser cotton"),
            ("bottom", "men cargo jogger pants"),
            ("bottom", "men relaxed fit denim jeans"),
            ("kurta", "men short kurta cotton casual"),
            ("shoes", "men white canvas sneakers"),
            ("shoes", "men slip on loafer shoes casual"),
            ("accessory", "men analog casual watch"),
            ("accessory", "men aviator sunglasses polarized"),
        ],
        "office": [
            ("top", "men formal slim fit shirt cotton"),
            ("top", "men striped office wear shirt"),
            ("top", "men button down collar formal shirt"),
            ("bottom", "men formal pleated trousers"),
            ("bottom", "men slim tapered office chinos"),
            ("blazer", "men single breasted office blazer"),
            ("blazer", "men formal two piece suit"),
            ("shoes", "men oxford leather formal shoes"),
            ("shoes", "men brogue derby shoes brown"),
            ("accessory", "men reversible leather belt formal"),
            ("accessory", "men silk tie with pocket square"),
            ("accessory", "men leather laptop bag office"),
        ],
        "party": [
            ("top", "men satin party wear shirt"),
            ("top", "men printed floral party shirt"),
            ("top", "men black sequin shirt party"),
            ("bottom", "men black slim fit party trousers"),
            ("bottom", "men ripped skinny jeans party"),
            ("blazer", "men velvet blazer party wear"),
            ("blazer", "men tuxedo jacket dinner"),
            ("shoes", "men patent leather loafers party"),
            ("shoes", "men suede chelsea boots"),
            ("accessory", "men chronograph watch luxury"),
            ("accessory", "men silver chain necklace"),
            ("accessory", "men eau de parfum premium"),
        ],
        "wedding": [
            ("kurta", "men designer sherwani wedding"),
            ("kurta", "men silk sherwani embroidered"),
            ("kurta", "men kurta pajama set silk wedding"),
            ("kurta", "men indo western wedding outfit"),
            ("blazer", "men nehru jacket silk wedding"),
            ("blazer", "men jodhpuri bandhgala suit"),
            ("bottom", "men churidar pajama silk"),
            ("shoes", "men ethnic juttis embroidered wedding"),
            ("shoes", "men nagra shoes golden wedding"),
            ("accessory", "men wedding brooch safa"),
            ("accessory", "men pearl mala groom"),
            ("accessory", "men dupatta stole silk wedding"),
        ],
        "festive": [
            ("kurta", "men festive kurta pajama set cotton"),
            ("kurta", "men silk kurta festive embroidered"),
            ("kurta", "men pathani suit festival"),
            ("kurta", "men angrakha kurta ethnic"),
            ("blazer", "men nehru jacket festive brocade"),
            ("blazer", "men ethnic waistcoat embroidered"),
            ("bottom", "men dhoti pants cotton ethnic"),
            ("shoes", "men kolhapuri chappal ethnic leather"),
            ("shoes", "men mojari jutti ethnic embroidered"),
            ("accessory", "men ethnic kada bracelet"),
            ("accessory", "men stole shawl pashmina"),
            ("accessory", "men brooch lapel pin ethnic"),
        ],
        "date_night": [
            ("top", "men slim fit black shirt date"),
            ("top", "men printed trendy shirt going out"),
            ("top", "men mandarin collar linen shirt"),
            ("bottom", "men stretch skinny jeans dark"),
            ("bottom", "men ankle length slim chinos"),
            ("blazer", "men casual blazer date night"),
            ("blazer", "men bomber jacket suede"),
            ("shoes", "men chelsea boots tan leather"),
            ("shoes", "men white premium sneakers minimal"),
            ("accessory", "men perfume eau de toilette fresh"),
            ("accessory", "men leather bracelet trendy"),
            ("accessory", "men minimalist analog watch"),
        ],
    },
}


def get_search_queries(gender: str, occasion: str, colors: list, styles: list) -> List[Dict]:
    """
    Generate search queries based on user profile and occasion.
    Incorporates body-shape-appropriate colors and styles into the queries.
    """
    gender_key = "male" if gender and gender.lower() == "male" else "female"
    occasion_key = occasion.lower().replace(" ", "_") if occasion else "casual"

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
QUERIES_PER_PAGE = 10  # scrape all queries for maximum product variety


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
    Results are cached for 30 minutes to avoid repeated scraping.
    """
    # Check cache first
    cache_key = {"queries": [q["query"] for q in queries], "bmin": budget_min, "bmax": budget_max}
    cached = cache_get("products", cache_key)
    if cached is not None:
        return cached

    # Scrape with connection pooling and concurrency limit
    connector = httpx.Limits(max_connections=10, max_keepalive_connections=5)
    async with httpx.AsyncClient(limits=connector) as client:
        # Use semaphore to limit concurrent requests (avoid getting blocked)
        sem = asyncio.Semaphore(6)

        async def _limited(coro):
            async with sem:
                return await coro

        tasks = []
        for q in queries:
            tasks.append(_limited(_search_and_tag(client, "amazon", q["query"], q["category"], limit=6)))
            tasks.append(_limited(_search_and_tag(client, "flipkart", q["query"], q["category"], limit=4)))

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

    # Cache for 30 minutes
    cache_put("products", cache_key, all_products)

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
