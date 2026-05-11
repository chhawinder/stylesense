"""
Core fashion domain knowledge — body shape rules, color palettes, face shape accessories.
These rules power the recommendation engine before and alongside LLM reasoning.
"""

BODY_SHAPE_RULES = {
    "hourglass": {
        "best": ["wrap dresses", "belted tops", "high-waisted jeans", "A-line skirts",
                  "fitted kurtas", "sarees with medium drape"],
        "avoid": ["boxy tops", "low-rise jeans", "shapeless tunics"],
        "indian": ["anarkali suits", "fitted blouses with flared lehenga", "belted salwar kameez"],
    },
    "pear": {
        "best": ["A-line kurtas", "boat neck tops", "flared palazzos",
                  "statement necklines", "structured shoulders"],
        "avoid": ["skinny jeans", "hip-hugging skirts", "tapered trousers"],
        "indian": ["peplum tops with straight pants", "cape style kurtas", "flared anarkalis"],
    },
    "apple": {
        "best": ["empire waist dresses", "V-necklines", "straight-leg pants",
                  "A-line tunics", "long cardigans"],
        "avoid": ["clingy fabrics", "high-waisted belts", "crop tops"],
        "indian": ["long straight kurtas", "draped sarees", "asymmetric hemlines"],
    },
    "rectangle": {
        "best": ["peplum tops", "ruffled blouses", "layered outfits",
                  "belted dresses", "flared skirts"],
        "avoid": ["boxy shapes", "straight-cut everything", "column dresses"],
        "indian": ["layered kurta sets", "sharara suits", "lehenga choli with volume"],
    },
    "inverted_triangle": {
        "best": ["wide-leg pants", "A-line skirts", "V-necks",
                  "simple tops with detailed bottoms"],
        "avoid": ["padded shoulders", "boat necks", "puff sleeves"],
        "indian": ["gharara pants", "simple kurta with embellished bottom", "saree with minimal pallu"],
    },
}

SKIN_TONE_PALETTES = {
    "warm_light": {
        "best_colors": ["peach", "coral", "warm beige", "golden yellow", "olive", "warm red"],
        "avoid_colors": ["stark white", "icy blue", "fuchsia"],
        "metals": ["gold", "rose gold"],
        "season": "spring",
    },
    "warm_medium": {
        "best_colors": ["mustard", "terracotta", "olive green", "warm red", "copper", "burnt orange"],
        "avoid_colors": ["neon pink", "icy pastels", "silver"],
        "metals": ["gold", "copper", "brass"],
        "season": "autumn",
    },
    "warm_deep": {
        "best_colors": ["mustard", "coral", "olive", "rust", "gold", "warm red", "emerald"],
        "avoid_colors": ["neon pink", "icy blue", "stark white"],
        "metals": ["gold", "rose gold", "copper"],
        "season": "autumn",
    },
    "cool_light": {
        "best_colors": ["lavender", "baby pink", "sky blue", "soft white", "mint", "mauve"],
        "avoid_colors": ["orange", "mustard", "warm brown"],
        "metals": ["silver", "platinum", "white gold"],
        "season": "summer",
    },
    "cool_medium": {
        "best_colors": ["royal blue", "emerald", "plum", "raspberry", "teal"],
        "avoid_colors": ["orange", "mustard", "warm beige"],
        "metals": ["silver", "white gold"],
        "season": "winter",
    },
    "cool_deep": {
        "best_colors": ["deep purple", "navy", "black", "true red", "bright white", "emerald"],
        "avoid_colors": ["pastels", "muted tones", "beige"],
        "metals": ["silver", "platinum"],
        "season": "winter",
    },
    "neutral": {
        "best_colors": ["soft white", "blush", "sage", "dusty rose", "camel", "navy"],
        "avoid_colors": ["extremely bright neons"],
        "metals": ["any"],
        "season": "any",
    },
}

FACE_SHAPE_ACCESSORIES = {
    "oval": {
        "necklines": ["any — most versatile face shape"],
        "earrings": ["any style works"],
        "glasses": ["any frame shape"],
        "hairstyles": ["any — experiment freely"],
    },
    "round": {
        "necklines": ["V-neck", "deep scoop", "U-neck"],
        "earrings": ["long drops", "angular shapes"],
        "glasses": ["angular", "rectangular", "cat-eye"],
        "hairstyles": ["layered", "side-parted", "volume on top"],
    },
    "square": {
        "necklines": ["scoop", "off-shoulder", "cowl neck"],
        "earrings": ["round hoops", "dangles"],
        "glasses": ["round", "oval", "rimless"],
        "hairstyles": ["soft waves", "side-swept bangs"],
    },
    "heart": {
        "necklines": ["boat neck", "V-neck", "scoop"],
        "earrings": ["chandelier", "teardrop"],
        "glasses": ["bottom-heavy frames", "aviator", "rimless"],
        "hairstyles": ["chin-length bob", "side-swept"],
    },
    "oblong": {
        "necklines": ["crew neck", "turtleneck", "wide collars"],
        "earrings": ["studs", "short drops", "wide hoops"],
        "glasses": ["wide frames", "aviator"],
        "hairstyles": ["bangs", "layers at jaw level"],
    },
    "diamond": {
        "necklines": ["V-neck", "sweetheart", "off-shoulder"],
        "earrings": ["studs", "small hoops"],
        "glasses": ["oval", "cat-eye", "rimless"],
        "hairstyles": ["side-parted", "chin-length layers"],
    },
}


def get_style_rules(body_shape: str, undertone: str, face_shape: str) -> dict:
    """Combine rules across body shape, skin tone, and face shape."""
    body = BODY_SHAPE_RULES.get(body_shape, BODY_SHAPE_RULES["rectangle"])

    # Find matching skin tone palette
    tone_key = f"{undertone}_medium"  # default to medium depth
    palette = SKIN_TONE_PALETTES.get(tone_key, SKIN_TONE_PALETTES["neutral"])

    face = FACE_SHAPE_ACCESSORIES.get(face_shape, FACE_SHAPE_ACCESSORIES["oval"])

    return {
        "best_styles": body["best"],
        "avoid_styles": body["avoid"],
        "indian_styles": body["indian"],
        "best_colors": palette["best_colors"],
        "avoid_colors": palette["avoid_colors"],
        "metals": palette["metals"],
        "color_season": palette["season"],
        "necklines": face["necklines"],
        "earrings": face["earrings"],
        "glasses": face["glasses"],
    }
