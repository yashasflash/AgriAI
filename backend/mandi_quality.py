"""
AgriAI — Mandi Data Quality & Integrity Safeguards (Feature 5 - Stage 3)
Provides configurable data quality validation, commodity separation safeguards,
and state name normalization without mutating underlying government database records.
"""

from typing import Dict, List, Optional, Tuple, Any


# =====================================================================
# 1. STATE NAME NORMALIZATION (Presentation Layer & Query Expansion)
# =====================================================================

# Presentation-layer aliases mapping government/regional spellings to standard names
STATE_DISPLAY_ALIASES: Dict[str, str] = {
    "keralam": "Kerala",
    "chattisgarh": "Chhattisgarh",
    "pondicherry": "Puducherry",
    "jammu and kashmir": "Jammu and Kashmir",
    "jammu & kashmir": "Jammu and Kashmir",
    "andaman and nicobar": "Andaman and Nicobar",
    "andaman & nicobar": "Andaman and Nicobar",
    "orissa": "Odisha"
}

# Bidirectional lookup for query expansion: given any variant, find all possible DB representations
STATE_QUERY_VARIANTS: Dict[str, List[str]] = {
    "kerala": ["Kerala", "Keralam"],
    "keralam": ["Kerala", "Keralam"],
    "chhattisgarh": ["Chhattisgarh", "Chattisgarh"],
    "chattisgarh": ["Chhattisgarh", "Chattisgarh"],
    "puducherry": ["Puducherry", "Pondicherry"],
    "pondicherry": ["Puducherry", "Pondicherry"],
    "jammu and kashmir": ["Jammu and Kashmir", "Jammu And Kashmir", "Jammu & Kashmir"],
    "jammu & kashmir": ["Jammu and Kashmir", "Jammu And Kashmir", "Jammu & Kashmir"],
    "andaman and nicobar": ["Andaman and Nicobar", "Andaman And Nicobar", "Andaman & Nicobar"],
    "andaman & nicobar": ["Andaman and Nicobar", "Andaman And Nicobar", "Andaman & Nicobar"],
    "odisha": ["Odisha", "Orissa"],
    "orissa": ["Odisha", "Orissa"]
}


def normalize_state_display(state_name: Optional[str]) -> str:
    """
    Returns the clean, standardized state name for presentation layer,
    while preserving the raw database values untouched.
    """
    if not state_name or not isinstance(state_name, str):
        return ""
    clean = state_name.strip()
    lookup = clean.lower()
    if lookup in STATE_DISPLAY_ALIASES:
        return STATE_DISPLAY_ALIASES[lookup]
    return clean.title() if clean.isupper() or clean.islower() else clean


def get_state_query_variants(state_name: Optional[str]) -> List[str]:
    """
    Expands a given state filter into all equivalent database variants
    so querying 'Kerala' automatically includes records stored as 'Keralam'.
    """
    if not state_name or not isinstance(state_name, str):
        return []
    clean = state_name.strip()
    if not clean or clean.lower() == "all":
        return []
    lookup = clean.lower()
    if lookup in STATE_QUERY_VARIANTS:
        return list(STATE_QUERY_VARIANTS[lookup])
    # Fallback to single original string
    return [clean]


# =====================================================================
# 2. COMMODITY SEPARATION & ISOLATION MATRIX
# =====================================================================

# Strict commodity classification mapping
COMMODITY_CATEGORIES: Dict[str, str] = {
    "tomato": "vegetables_fresh",
    "onion": "bulb_vegetables",
    "onion green": "leafy_vegetables",
    "potato": "tuber_vegetables",
    "wheat": "cereals_raw_grain",
    "wheat atta": "processed_cereal_flour",
    "cotton": "commercial_fibre_raw",
    "cotton seed": "oilseed_byproduct",
    "paddy(common)": "paddy_unmilled_common",
    "rice (paddy)": "paddy_unmilled_common",
    "paddy(fine/superfine/grade a)": "paddy_unmilled_grade_a",
    "paddy(basmati)": "paddy_unmilled_basmati",
    "rice": "rice_milled_table",
    "rice(fine/superfine/grade a)": "rice_milled_grade_a",
    "beaten rice": "rice_processed_poha",
    "broken rice": "rice_milling_byproduct",
    "soybean": "oilseeds_pulses",
    "bengal gram (chana)": "pulses_chana",
    "gram (chana)": "pulses_chana",
    "mustard": "oilseeds_mustard",
    "maize": "coarse_cereals",
    "finger millet (ragi)": "millets"
}


def are_commodities_comparable(commodity_a: Optional[str], commodity_b: Optional[str]) -> Tuple[bool, str]:
    """
    Enforces strict commodity separation so distinct agricultural variants
    (e.g., Onion vs Onion Green, Cotton vs Cotton Seed, Wheat vs Wheat Atta,
    Paddy vs milled Rice vs Beaten Rice) are never mistakenly merged or cross-compared.
    """
    if not commodity_a or not commodity_b:
        return False, "Missing commodity parameter for comparison."
    
    a_norm = commodity_a.strip().lower()
    b_norm = commodity_b.strip().lower()

    if a_norm == b_norm:
        return True, "Identical commodity matching."

    cat_a = COMMODITY_CATEGORIES.get(a_norm, "other")
    cat_b = COMMODITY_CATEGORIES.get(b_norm, "other")

    if cat_a != cat_b:
        return False, (
            f"Cannot compare '{commodity_a}' ({cat_a.replace('_', ' ')}) with "
            f"'{commodity_b}' ({cat_b.replace('_', ' ')}). They belong to distinct agricultural classes."
        )

    return False, f"Commodities '{commodity_a}' and '{commodity_b}' are distinct variants."


# =====================================================================
# 3. COMMODITY-AWARE SUSPICIOUS PRICE QUALITY SAFEGUARDS
# =====================================================================

# Realistic wholesale price bounds per Quintal (100 kg) based on official MSP and historical APMC records.
# Designed without an arbitrary universal minimum, accounting for specific crop economics.
COMMODITY_PRICE_BOUNDS: Dict[str, Dict[str, float]] = {
    "tomato": {
        "min_modal": 50.0,       # In quintals; < ₹50/Qtl (₹0.50/kg) indicates decimal/clerical error
        "max_modal": 15000.0,    # Upper extreme threshold
    },
    "onion": {
        "min_modal": 50.0,       # < ₹50/Qtl (e.g. ₹0.01, ₹0.12) indicates clerical error
        "max_modal": 16000.0,
    },
    "onion green": {
        "min_modal": 25.0,       # Leafy bunches
        "max_modal": 25000.0,
    },
    "potato": {
        "min_modal": 50.0,
        "max_modal": 10000.0,
    },
    "wheat": {
        "min_modal": 500.0,      # Official MSP is > ₹2,275/Qtl; < ₹500/Qtl is unrealistic
        "max_modal": 10000.0,
    },
    "wheat atta": {
        "min_modal": 800.0,      # Value-added processed flour
        "max_modal": 15000.0,
    },
    "cotton": {
        "min_modal": 1000.0,     # Official MSP is > ₹6,500/Qtl
        "max_modal": 25000.0,
    },
    "cotton seed": {
        "min_modal": 1000.0,
        "max_modal": 20000.0,
    },
    "paddy(common)": {
        "min_modal": 500.0,      # Official MSP is > ₹2,183/Qtl
        "max_modal": 8000.0,
    },
    "rice (paddy)": {
        "min_modal": 500.0,
        "max_modal": 8000.0,
    },
    "paddy(fine/superfine/grade a)": {
        "min_modal": 600.0,
        "max_modal": 10000.0,
    },
    "paddy(basmati)": {
        "min_modal": 1000.0,
        "max_modal": 12000.0,
    },
    "rice": {
        "min_modal": 800.0,      # Milled table rice
        "max_modal": 18000.0,
    },
    "rice(fine/superfine/grade a)": {
        "min_modal": 1000.0,
        "max_modal": 20000.0,
    },
    "beaten rice": {
        "min_modal": 1000.0,
        "max_modal": 40000.0,
    },
    "broken rice": {
        "min_modal": 500.0,
        "max_modal": 15000.0,
    },
    "soybean": {
        "min_modal": 500.0,
        "max_modal": 15000.0,
    }
}


def evaluate_price_quality(
    commodity: Optional[str],
    modal_price: float,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    unit: str = "Rs/Quintal"
) -> Dict[str, Any]:
    """
    Evaluates mandi price quality against crop-specific APMC wholesale economics.
    Flags clerical errors and outliers (e.g. ₹0.01 at Patti, ₹0.12 at Rania)
    WITHOUT deleting the original government records or mutating government values.

    Returns:
        {
            "is_suspicious": bool,
            "suspicious_reason": Optional[str],
            "severity": "none" | "low" | "high" | "critical"
        }
    """
    if modal_price is None or not isinstance(modal_price, (int, float)):
        return {
            "is_suspicious": True,
            "suspicious_reason": "Missing or non-numeric modal price.",
            "severity": "critical"
        }

    # 1. Zero or negative price check
    if modal_price <= 0:
        return {
            "is_suspicious": True,
            "suspicious_reason": f"Modal price ₹{modal_price} is zero or negative.",
            "severity": "critical"
        }

    # 2. Inverted bounds check
    if min_price is not None and max_price is not None:
        if min_price > max_price and max_price > 0:
            return {
                "is_suspicious": True,
                "suspicious_reason": f"Inverted price range: Minimum price (₹{min_price}) exceeds Maximum price (₹{max_price}).",
                "severity": "high"
            }

    # 3. Commodity-aware bounds check for Quintal-based wholesale trades
    comm_key = str(commodity or "").strip().lower()
    bounds = COMMODITY_PRICE_BOUNDS.get(comm_key)

    if bounds:
        min_bound = bounds["min_modal"]
        max_bound = bounds["max_modal"]

        if modal_price < min_bound:
            return {
                "is_suspicious": True,
                "suspicious_reason": (
                    f"Modal price ₹{modal_price:.2f}/{unit} is below the viable wholesale threshold "
                    f"for {commodity} (min ₹{min_bound:,.0f}/{unit}). Suspected decimal or clerical entry error."
                ),
                "severity": "critical" if modal_price < 5.0 else "high"
            }

        if modal_price > max_bound:
            return {
                "is_suspicious": True,
                "suspicious_reason": (
                    f"Modal price ₹{modal_price:.2f}/{unit} exceeds the typical wholesale ceiling "
                    f"for {commodity} (max ₹{max_bound:,.0f}/{unit}). Anomaly suspected."
                ),
                "severity": "high"
            }
    else:
        # Fallback heuristic for unlisted commodities with Rs/Quintal unit
        if "quintal" in unit.lower():
            if modal_price < 20.0:
                return {
                    "is_suspicious": True,
                    "suspicious_reason": (
                        f"Modal price ₹{modal_price:.2f}/{unit} is abnormally low for wholesale trading "
                        f"(suspected clerical entry error)."
                    ),
                    "severity": "critical"
                }
            if modal_price > 100000.0:
                return {
                    "is_suspicious": True,
                    "suspicious_reason": (
                        f"Modal price ₹{modal_price:.2f}/{unit} exceeds reasonable wholesale market ceilings."
                    ),
                    "severity": "high"
                }

    return {
        "is_suspicious": False,
        "suspicious_reason": None,
        "severity": "none"
    }
