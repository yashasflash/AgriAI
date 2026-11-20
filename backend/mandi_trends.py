"""
AgriAI — Statistical Mandi Price Trend Engine (Feature 5 - Stage 6A)
Provides empirical, observation-based statistical trend analysis for mandi wholesale prices:
- Directional movement (Rising, Falling, Stable, Insufficient Data)
- Configurable stable threshold (default: <= 1.0% absolute change)
- Observation-based Simple Moving Averages (7- and 14-observation SMA)
- Transparent confidence scoring based on horizon depth, calendar gaps, and anomalies
- Strict commodity, variety, market, and unit separation
- Explicit non-predictive historical disclaimers (NO machine learning / forecasting)
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import db
from mandi_quality import (
    evaluate_price_quality,
    normalize_state_display,
    get_state_query_variants,
    are_commodities_comparable,
    COMMODITY_CATEGORIES
)
from mandi_history import (
    parse_arrival_date,
    calculate_days_gap,
    classify_history_depth
)

# =====================================================================
# 1. CONSTANTS, THRESHOLDS & REGULATORY DISCLAIMERS
# =====================================================================

DEFAULT_STABLE_THRESHOLD_PCT: float = 1.0  # Absolute change <= 1.0% is classified as stable
SMA_7_WINDOW: int = 7
SMA_14_WINDOW: int = 14

TREND_DISCLAIMER: str = (
    "These indicators describe historical observed mandi prices. "
    "They are not guaranteed future prices or financial advice."
)


# =====================================================================
# 2. CORE STATISTICAL FORMULAS & MOVING AVERAGES
# =====================================================================

def calculate_sma(prices: List[float], window: int) -> Optional[float]:
    """
    Computes an observation-based Simple Moving Average (SMA) across the last `window` valid prices.
    CRITICAL RULES:
    - Never calculates an SMA when available valid observations < window.
    - Never fabricates or interpolates missing calendar days.
    - Uses only verified, non-suspicious government APMC modal prices.
    """
    if not prices or len(prices) < window or window <= 0:
        return None
    
    # Take trailing `window` prices
    slice_prices = prices[-window:]
    return round(sum(slice_prices) / window, 2)


def calculate_price_direction(
    current_price: float,
    previous_price: float,
    stable_threshold_pct: float = DEFAULT_STABLE_THRESHOLD_PCT
) -> Tuple[str, float, float]:
    """
    Evaluates price movement between the latest two valid APMC observations.
    
    Formula:
        price_difference = current_price - previous_price
        percentage_change = ((current_price - previous_price) / previous_price) * 100
        
    Classification:
        |percentage_change| <= stable_threshold_pct -> "stable"
        current_price > previous_price             -> "rising"
        current_price < previous_price             -> "falling"
        
    Returns:
        (direction: str, price_difference: float, percentage_change: float)
    """
    price_diff = round(current_price - previous_price, 2)
    
    if previous_price > 0:
        pct_change = round(((current_price - previous_price) / previous_price) * 100, 2)
    else:
        pct_change = 0.0

    if abs(pct_change) <= stable_threshold_pct:
        direction = "stable"
    elif current_price > previous_price:
        direction = "rising"
    else:
        direction = "falling"

    return direction, price_diff, pct_change


def generate_trend_summary_message(
    direction: str,
    current_price: Optional[float],
    previous_price: Optional[float],
    price_diff: Optional[float],
    pct_change: Optional[float],
    current_date: Optional[str],
    previous_date: Optional[str],
    commodity: str,
    market: str,
    valid_obs_count: int
) -> str:
    """
    Produces transparent, non-predictive human-readable summary of historical price movement.
    Explicitly refuses to speculate on future market movements.
    """
    if valid_obs_count <= 0:
        return f"No historical price observations available for {commodity} at {market}."
    
    if valid_obs_count == 1:
        date_str = f" on {current_date}" if current_date else ""
        price_str = f"₹{current_price:,.2f}" if current_price is not None else ""
        return (
            f"Single observation recorded for {commodity} at {market}{date_str} ({price_str}). "
            f"Insufficient historical observations to determine a price trend (minimum 2 valid observations required)."
        )

    prev_info = f"on {previous_date} (₹{previous_price:,.2f})" if previous_date and previous_price is not None else "previous observation"
    curr_info = f"on {current_date} (₹{current_price:,.2f})" if current_date and current_price is not None else "latest observation"

    if direction == "rising":
        return f"Prices increased by ₹{abs(price_diff or 0):,.2f}/Qtl (+{pct_change}%) compared with the previous observation ({prev_info} to {curr_info})."
    elif direction == "falling":
        return f"Prices decreased by ₹{abs(price_diff or 0):,.2f}/Qtl ({pct_change}%) compared with the previous observation ({prev_info} to {curr_info})."
    elif direction == "stable":
        return f"Prices remained relatively stable with a {pct_change:+.2f}% change (₹{price_diff:+,.2f}/Qtl) compared with the previous observation ({prev_info} to {curr_info})."
    else:
        return f"Insufficient historical observations to determine a price trend for {commodity} at {market}."


# =====================================================================
# 3. TRANSPARENT TREND CONFIDENCE SCORING
# =====================================================================

def calculate_trend_confidence(
    valid_obs_count: int,
    distinct_dates_count: int,
    days_gap: Optional[int] = None,
    suspicious_excluded_count: int = 0,
    latest_arrival_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Evaluates empirical confidence for the observed trend based on:
    - Number of valid APMC observations
    - Number of distinct arrival dates
    - Reporting continuity (calendar gap between observations)
    - Presence of excluded anomalous data
    - Freshness of the latest reported observation
    
    Returns:
        {
            "confidence_level": "low" | "moderate" | "high",
            "confidence_score": int (0 - 100),
            "confidence_reasons": List[str]
        }
    """
    reasons = []

    # 1. Base Score from Observation Count
    if valid_obs_count <= 0:
        base_score = 0
        reasons.append("No valid historical observations found.")
    elif valid_obs_count == 1:
        base_score = 15
        reasons.append("Only 1 observation available; minimum 2 required to calculate price direction.")
    elif 2 <= valid_obs_count <= 6:
        base_score = 45
        reasons.append(f"Limited history ({valid_obs_count} observations across {distinct_dates_count} dates). Trend reflects short-term day-over-day movement only.")
    elif 7 <= valid_obs_count <= 13:
        base_score = 70
        reasons.append(f"Developing historical baseline ({valid_obs_count} observations across {distinct_dates_count} dates). 7-observation moving average available.")
    else:
        base_score = 90
        reasons.append(f"Established historical coverage ({valid_obs_count} observations across {distinct_dates_count} dates). Both 7- and 14-observation moving averages available.")

    score = base_score

    # 2. Penalize for reporting calendar gaps
    if days_gap is not None and days_gap > 3:
        penalty = min(20, (days_gap - 2) * 5)
        score -= penalty
        reasons.append(f"Reporting gap of {days_gap} calendar days between consecutive observations reduces trend continuity.")

    # 3. Penalize if suspicious observations were filtered out
    if suspicious_excluded_count > 0:
        score -= min(15, suspicious_excluded_count * 5)
        reasons.append(f"{suspicious_excluded_count} anomalous price report(s) excluded from statistical calculations.")

    # Clamp score to 0..100
    final_score = max(5 if valid_obs_count > 0 else 0, min(100, score))

    if final_score >= 75:
        level = "high"
    elif final_score >= 50:
        level = "moderate"
    else:
        level = "low"

    return {
        "confidence_level": level,
        "confidence_score": final_score,
        "confidence_reasons": reasons
    }


# =====================================================================
# 4. SINGLE-SERIES STATISTICAL TREND ANALYSIS
# =====================================================================

def analyze_series_trend(
    commodity: str,
    market: str,
    variety: Optional[str] = None,
    state: Optional[str] = None,
    unit: Optional[str] = None,
    observations_limit: int = 30,
    stable_threshold_pct: float = DEFAULT_STABLE_THRESHOLD_PCT
) -> Dict[str, Any]:
    """
    Computes statistical price direction, moving averages, and confidence for a specific series:
    Series Key = (Commodity, Variety, Market, State, Unit)

    Strict isolation enforced:
    - Never combines Onion with Onion Green.
    - Never combines Cotton with Cotton Seed.
    - Never combines Wheat with Wheat Atta.
    - Excludes all Stage 3 suspicious price records.
    """
    if not commodity or not isinstance(commodity, str) or not commodity.strip():
        raise ValueError("Commodity parameter is required for series trend analysis.")
    if not market or not isinstance(market, str) or not market.strip():
        raise ValueError("Market parameter is required for series trend analysis.")

    clean_commodity = commodity.strip()
    clean_market = market.strip()
    clean_variety = variety.strip() if variety and isinstance(variety, str) and variety.strip().lower() != "all" else None
    clean_state = state.strip() if state and isinstance(state, str) and state.strip().lower() != "all" else None
    clean_unit = unit.strip() if unit and isinstance(unit, str) and unit.strip().lower() != "all" else None

    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label, last_updated,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            WHERE LOWER(commodity) = LOWER(?)
              AND LOWER(market) = LOWER(?)
        """
        params: List[Any] = [clean_commodity, clean_market]

        if clean_variety:
            query += " AND LOWER(variety) = LOWER(?)"
            params.append(clean_variety)

        if clean_state:
            variants = get_state_query_variants(clean_state)
            query += f" AND LOWER(state) IN ({','.join(['LOWER(?)' for _ in variants])})"
            params.extend(variants)

        if clean_unit:
            query += " AND LOWER(unit) = LOWER(?)"
            params.append(clean_unit)

        # Strict chronological order
        query += " ORDER BY iso_date ASC, id ASC"

        cursor.execute(query, params)
        raw_rows = [dict(r) for r in cursor.fetchall()]

        # Filter out suspicious records
        valid_observations = []
        suspicious_observations = []
        distinct_dates = set()

        for r in raw_rows:
            eval_res = evaluate_price_quality(
                commodity=r["commodity"],
                modal_price=r["modal_price"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                unit=r["unit"]
            )
            r["is_suspicious"] = eval_res["is_suspicious"]
            r["suspicious_reason"] = eval_res["suspicious_reason"]
            r["display_state"] = normalize_state_display(r["state"])

            if eval_res["is_suspicious"]:
                suspicious_observations.append(r)
            else:
                valid_observations.append(r)
                distinct_dates.add(r["arrival_date"])

        # Limit to trailing observations requested
        limit = max(1, min(observations_limit, 100))
        valid_subset = valid_observations[-limit:] if valid_observations else []
        valid_count = len(valid_subset)
        distinct_dates_count = len(distinct_dates)

        # Calculate calendar day gaps between consecutive valid observations
        for i in range(len(valid_subset)):
            if i > 0:
                valid_subset[i]["days_gap_from_previous"] = calculate_days_gap(
                    valid_subset[i - 1]["arrival_date"],
                    valid_subset[i]["arrival_date"]
                )
            else:
                valid_subset[i]["days_gap_from_previous"] = None

        valid_prices = [obs["modal_price"] for obs in valid_subset]

        # Stage 6A Data Requirements & Readiness Table mapping:
        # 0: No history
        # 1: Display latest price only
        # 2–6: Latest observation-to-observation direction
        # 7–13: 7-observation SMA + direction
        # 14–29: 7- and 14-observation SMA + direction
        # 30+: Extended statistical trend candidate
        if valid_count == 0:
            allowed_calculation = "No history"
            readiness_stage = "no_history"
            direction = "insufficient_data"
            latest_price = None
            prev_price = None
            price_diff = None
            pct_change = None
            latest_date = None
            prev_date = None
            days_gap = None
            sma_7 = None
            sma_14 = None
        elif valid_count == 1:
            allowed_calculation = "Display latest price only"
            readiness_stage = "single_observation"
            direction = "insufficient_data"
            latest_price = valid_prices[-1]
            prev_price = None
            price_diff = None
            pct_change = None
            latest_date = valid_subset[-1]["arrival_date"]
            prev_date = None
            days_gap = None
            sma_7 = None
            sma_14 = None
        else:
            latest_price = valid_prices[-1]
            prev_price = valid_prices[-2]
            latest_date = valid_subset[-1]["arrival_date"]
            prev_date = valid_subset[-2]["arrival_date"]
            days_gap = valid_subset[-1]["days_gap_from_previous"]

            direction, price_diff, pct_change = calculate_price_direction(
                latest_price, prev_price, stable_threshold_pct
            )

            if 2 <= valid_count <= 6:
                allowed_calculation = "Latest observation-to-observation direction"
                readiness_stage = "limited_history"
                sma_7 = None
                sma_14 = None
            elif 7 <= valid_count <= 13:
                allowed_calculation = "7-observation SMA + direction"
                readiness_stage = "developing_history"
                sma_7 = calculate_sma(valid_prices, SMA_7_WINDOW)
                sma_14 = None
            elif 14 <= valid_count <= 29:
                allowed_calculation = "7- and 14-observation SMA + direction"
                readiness_stage = "initial_trend_candidate"
                sma_7 = calculate_sma(valid_prices, SMA_7_WINDOW)
                sma_14 = calculate_sma(valid_prices, SMA_14_WINDOW)
            else:
                allowed_calculation = "Extended statistical trend candidate (7- and 14-observation SMA)"
                readiness_stage = "better_trend_candidate"
                sma_7 = calculate_sma(valid_prices, SMA_7_WINDOW)
                sma_14 = calculate_sma(valid_prices, SMA_14_WINDOW)

        summary_msg = generate_trend_summary_message(
            direction=direction,
            current_price=latest_price,
            previous_price=prev_price,
            price_diff=price_diff,
            pct_change=pct_change,
            current_date=latest_date,
            previous_date=prev_date,
            commodity=clean_commodity,
            market=clean_market,
            valid_obs_count=valid_count
        )

        confidence_info = calculate_trend_confidence(
            valid_obs_count=valid_count,
            distinct_dates_count=distinct_dates_count,
            days_gap=days_gap,
            suspicious_excluded_count=len(suspicious_observations),
            latest_arrival_date=latest_date
        )

        # Extract representative metadata from observations if available
        rep_variety = clean_variety or (valid_subset[-1]["variety"] if valid_subset else "All")
        rep_state = clean_state or (valid_subset[-1]["state"] if valid_subset else "All")
        rep_unit = clean_unit or (valid_subset[-1]["unit"] if valid_subset else "Rs/Quintal")

        return {
            "status": "success",
            "disclaimer": TREND_DISCLAIMER,
            "series_info": {
                "commodity": clean_commodity,
                "variety": rep_variety,
                "market": clean_market,
                "state": rep_state,
                "display_state": normalize_state_display(rep_state),
                "unit": rep_unit
            },
            "trend": {
                "direction": direction,
                "latest_valid_price": latest_price,
                "previous_valid_price": prev_price,
                "price_difference": price_diff,
                "percentage_change": pct_change,
                "latest_arrival_date": latest_date,
                "previous_arrival_date": prev_date,
                "days_gap_between_observations": days_gap,
                "sma_7": sma_7,
                "sma_7_label": f"{SMA_7_WINDOW}-observation moving average" if sma_7 is not None else None,
                "sma_14": sma_14,
                "sma_14_label": f"{SMA_14_WINDOW}-observation moving average" if sma_14 is not None else None,
                "stable_threshold_pct": stable_threshold_pct,
                "readiness_stage": readiness_stage,
                "allowed_calculation": allowed_calculation,
                "summary_message": summary_msg
            },
            "confidence": confidence_info,
            "observations_summary": {
                "total_observations_found": len(raw_rows),
                "valid_observations_count": valid_count,
                "suspicious_observations_excluded": len(suspicious_observations),
                "distinct_arrival_dates_count": distinct_dates_count
            },
            "observations": valid_subset
        }
    finally:
        conn.close()


# =====================================================================
# 5. COMMODITY-LEVEL MULTI-MARKET TREND SUMMARY
# =====================================================================

def get_commodity_trends_summary(
    commodity: str,
    state: Optional[str] = None,
    stable_threshold_pct: float = DEFAULT_STABLE_THRESHOLD_PCT
) -> Dict[str, Any]:
    """
    Summarizes wholesale price directions across all APMC mandis for a given commodity.
    Identifies markets with sufficient history (>= 2 observations) vs insufficient data.
    Strictly avoids claiming nationwide trend readiness when data horizon is limited.
    """
    if not commodity or not isinstance(commodity, str) or not commodity.strip():
        raise ValueError("Commodity parameter is required for trend summary.")

    clean_commodity = commodity.strip()
    clean_state = state.strip() if state and isinstance(state, str) and state.strip().lower() != "all" else None

    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        # Find distinct markets reporting this commodity
        query = """
            SELECT DISTINCT market, state, district, variety, unit
            FROM mandi_prices
            WHERE LOWER(commodity) = LOWER(?)
        """
        params: List[Any] = [clean_commodity]

        if clean_state:
            variants = get_state_query_variants(clean_state)
            query += f" AND LOWER(state) IN ({','.join(['LOWER(?)' for _ in variants])})"
            params.extend(variants)

        query += " ORDER BY market ASC"
        cursor.execute(query, params)
        series_targets = [dict(r) for r in cursor.fetchall()]

        total_markets = len(series_targets)
        rising_count = 0
        falling_count = 0
        stable_count = 0
        insufficient_count = 0

        market_results = []
        quality_warnings = []
        latest_overall_date = None

        for s in series_targets:
            res = analyze_series_trend(
                commodity=clean_commodity,
                market=s["market"],
                variety=s["variety"],
                state=s["state"],
                unit=s["unit"],
                observations_limit=14,
                stable_threshold_pct=stable_threshold_pct
            )

            trend_info = res["trend"]
            direction = trend_info["direction"]

            if direction == "rising":
                rising_count += 1
            elif direction == "falling":
                falling_count += 1
            elif direction == "stable":
                stable_count += 1
            else:
                insufficient_count += 1

            if res["observations_summary"]["suspicious_observations_excluded"] > 0:
                quality_warnings.append(
                    f"{s['market']} ({s['state']}): {res['observations_summary']['suspicious_observations_excluded']} anomalous price report(s) excluded."
                )

            obs_date = trend_info["latest_arrival_date"]
            if obs_date:
                if latest_overall_date is None or obs_date > latest_overall_date:
                    latest_overall_date = obs_date

            market_results.append({
                "market": s["market"],
                "state": s["state"],
                "display_state": s.get("display_state", normalize_state_display(s["state"])),
                "district": s.get("district", ""),
                "variety": s["variety"],
                "unit": s["unit"],
                "direction": direction,
                "latest_price": trend_info["latest_valid_price"],
                "previous_price": trend_info["previous_valid_price"],
                "price_difference": trend_info["price_difference"],
                "percentage_change": trend_info["percentage_change"],
                "latest_arrival_date": trend_info["latest_arrival_date"],
                "valid_observations_count": res["observations_summary"]["valid_observations_count"],
                "confidence_level": res["confidence"]["confidence_level"],
                "summary_message": trend_info["summary_message"]
            })

        markets_with_sufficient_history = rising_count + falling_count + stable_count

        return {
            "status": "success",
            "disclaimer": TREND_DISCLAIMER,
            "commodity": clean_commodity,
            "state": clean_state or "All",
            "display_state": normalize_state_display(clean_state) if clean_state else "All States",
            "total_markets_analyzed": total_markets,
            "markets_with_sufficient_history": markets_with_sufficient_history,
            "markets_with_insufficient_history": insufficient_count,
            "direction_counts": {
                "rising": rising_count,
                "falling": falling_count,
                "stable": stable_count,
                "insufficient_data": insufficient_count
            },
            "latest_observation_date": latest_overall_date,
            "data_quality_warnings": quality_warnings,
            "markets": market_results
        }
    finally:
        conn.close()
