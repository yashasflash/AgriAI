"""
AgriAI — Historical Mandi Price Data Accumulation and Monitoring System (Feature 5 - Stage 5)
Provides comprehensive time-series tracking, coverage monitoring, calendar gap analysis,
depth classification, and quality safeguards for nationwide mandi market data.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import db
from mandi_quality import (
    evaluate_price_quality,
    normalize_state_display,
    get_state_query_variants,
    COMMODITY_CATEGORIES
)

# =====================================================================
# 1. READINESS CLASSIFICATION TAXONOMY
# =====================================================================

READINESS_TIERS = {
    "no_history": {
        "tier": "no_history",
        "label": "No History",
        "min_days": 0,
        "max_days": 0,
        "is_trend_ready": False,
        "is_ml_ready": False,
        "description": "Zero historical observations available."
    },
    "very_limited": {
        "tier": "very_limited",
        "label": "Very Limited History (1-6 days)",
        "min_days": 1,
        "max_days": 6,
        "is_trend_ready": False,
        "is_ml_ready": False,
        "description": "Insufficient for trend analysis or forecasting. Daily collection accumulation active."
    },
    "developing": {
        "tier": "developing",
        "label": "Developing History (7-13 days)",
        "min_days": 7,
        "max_days": 13,
        "is_trend_ready": False,
        "is_ml_ready": False,
        "description": "Short-span historical baseline developing. Insufficient for reliable statistical models."
    },
    "initial_trend_candidate": {
        "tier": "initial_trend_candidate",
        "label": "Initial Trend Candidate (14-29 days)",
        "min_days": 14,
        "max_days": 29,
        "is_trend_ready": True,
        "is_ml_ready": False,
        "description": "Candidate for preliminary moving averages and heuristic trend direction."
    },
    "better_trend_candidate": {
        "tier": "better_trend_candidate",
        "label": "Better Trend Candidate (30+ days)",
        "min_days": 30,
        "max_days": None,
        "is_trend_ready": True,
        "is_ml_ready": False,
        "description": "Eligible for statistical time-series analysis (ARIMA/Prophet candidate once full horizon reached)."
    }
}


def classify_history_depth(distinct_dates_count: int) -> Dict[str, Any]:
    """
    Classifies historical time-series depth based on the exact count of distinct arrival dates.
    Strictly avoids claiming ML readiness when data horizon is insufficient.
    """
    if distinct_dates_count <= 0:
        return dict(READINESS_TIERS["no_history"])
    elif 1 <= distinct_dates_count <= 6:
        return dict(READINESS_TIERS["very_limited"])
    elif 7 <= distinct_dates_count <= 13:
        return dict(READINESS_TIERS["developing"])
    elif 14 <= distinct_dates_count <= 29:
        return dict(READINESS_TIERS["initial_trend_candidate"])
    else:
        return dict(READINESS_TIERS["better_trend_candidate"])


# =====================================================================
# 2. DATE PARSING & CALENDAR GAP UTILITIES
# =====================================================================

def parse_arrival_date(date_str: Optional[str]) -> Optional[datetime]:
    """Parses standard Indian APMC date format DD/MM/YYYY or ISO YYYY-MM-DD."""
    if not date_str or not isinstance(date_str, str):
        return None
    cleaned = date_str.strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


def calculate_days_gap(date_earlier: Optional[str], date_later: Optional[str]) -> Optional[int]:
    """Calculates calendar days between two arrival dates."""
    d1 = parse_arrival_date(date_earlier)
    d2 = parse_arrival_date(date_later)
    if d1 and d2:
        return abs((d2 - d1).days)
    return None


# =====================================================================
# 3. OVERALL HISTORICAL ACCUMULATION STATUS
# =====================================================================

def get_overall_history_status() -> Dict[str, Any]:
    """
    Returns nationwide historical status across all commodities, markets, and dates.
    Calculates series distribution, depth tiers, and explicit forecasting readiness warning.
    """
    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        # Total counts
        cursor.execute("SELECT COUNT(*) FROM mandi_prices")
        total_records = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_agmarknet_baseline'")
        baseline_records = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_live'")
        live_records = cursor.fetchone()[0]

        # Distinct arrival dates
        cursor.execute("""
            SELECT DISTINCT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date ASC
        """)
        date_rows = cursor.fetchall()
        arrival_dates = [r["arrival_date"] for r in date_rows]
        distinct_dates_count = len(arrival_dates)
        earliest_date = arrival_dates[0] if arrival_dates else None
        latest_date = arrival_dates[-1] if arrival_dates else None

        # Distinct series: (commodity, variety, market, state, unit)
        cursor.execute("""
            SELECT commodity, variety, market, state, unit,
                   COUNT(DISTINCT arrival_date) as dates_count,
                   COUNT(*) as obs_count,
                   MIN(modal_price) as min_modal,
                   MAX(modal_price) as max_modal,
                   AVG(modal_price) as avg_modal
            FROM mandi_prices
            GROUP BY LOWER(commodity), LOWER(variety), LOWER(market), LOWER(state), LOWER(unit)
        """)
        series_rows = cursor.fetchall()
        total_unique_series = len(series_rows)

        # Depth distribution across tiers
        tier_counts = {
            "no_history": 0,
            "very_limited": 0,
            "developing": 0,
            "initial_trend_candidate": 0,
            "better_trend_candidate": 0
        }
        for s in series_rows:
            classification = classify_history_depth(s["dates_count"])
            tier_counts[classification["tier"]] += 1

        # Commodities, States, Markets counts
        cursor.execute("SELECT COUNT(DISTINCT commodity) FROM mandi_prices")
        commodities_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT state) FROM mandi_prices")
        states_count = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT market) FROM mandi_prices")
        markets_count = cursor.fetchone()[0]

        # Suspicious prices count
        cursor.execute("SELECT id, commodity, modal_price, min_price, max_price, unit FROM mandi_prices")
        all_price_rows = cursor.fetchall()
        suspicious_count = 0
        for r in all_price_rows:
            eval_res = evaluate_price_quality(
                commodity=r["commodity"],
                modal_price=r["modal_price"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                unit=r["unit"]
            )
            if eval_res["is_suspicious"]:
                suspicious_count += 1
        valid_records_count = total_records - suspicious_count

        # Latest sync log
        cursor.execute("""
            SELECT id, sync_time, status, source, details, fetched_count, valid_count,
                   inserted_count, updated_count, duplicate_count, rejected_count, arrival_dates
            FROM mandi_sync_log
            ORDER BY id DESC
            LIMIT 1
        """)
        last_sync_row = cursor.fetchone()
        last_sync = dict(last_sync_row) if last_sync_row else None

        # Overall dataset readiness classification
        dataset_readiness = classify_history_depth(distinct_dates_count)
        readiness_warning = (
            f"Dataset currently has {distinct_dates_count} distinct arrival date(s) ({earliest_date} to {latest_date}); "
            f"insufficient for time-series forecasting or ML prediction. "
            f"Historical depth is classified as '{dataset_readiness['label']}'. "
            f"Predictive time-series forecasting requires a minimum of 14-30 consecutive days of data. "
            f"Daily collection accumulation is active."
        )

        return {
            "total_records": total_records,
            "baseline_records": baseline_records,
            "live_records": live_records,
            "valid_records": valid_records_count,
            "suspicious_records": suspicious_count,
            "unique_series_count": total_unique_series,
            "unique_commodities_count": commodities_count,
            "unique_states_count": states_count,
            "unique_markets_count": markets_count,
            "distinct_dates_count": distinct_dates_count,
            "earliest_arrival_date": earliest_date,
            "latest_arrival_date": latest_date,
            "arrival_dates": arrival_dates,
            "dataset_readiness": dataset_readiness,
            "readiness_warning": readiness_warning,
            "tier_distribution": tier_counts,
            "last_sync": last_sync
        }
    finally:
        conn.close()


# =====================================================================
# 4. COMMODITY & VARIETY HISTORICAL COVERAGE
# =====================================================================

def get_commodity_history_summary() -> List[Dict[str, Any]]:
    """
    Summarizes historical depth, observations, and quality for each commodity and variety.
    Maintains strict separation between crop varieties (e.g. Onion vs Onion Green).
    """
    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT commodity, variety, unit,
                   COUNT(*) as total_observations,
                   COUNT(DISTINCT arrival_date) as distinct_dates_count,
                   COUNT(DISTINCT market) as markets_count,
                   COUNT(DISTINCT state) as states_count,
                   MIN(modal_price) as min_modal,
                   MAX(modal_price) as max_modal,
                   ROUND(AVG(modal_price), 2) as avg_modal
            FROM mandi_prices
            GROUP BY LOWER(commodity), LOWER(variety), LOWER(unit)
            ORDER BY total_observations DESC, commodity ASC
        """)
        groups = [dict(r) for r in cursor.fetchall()]

        # Compute valid vs suspicious observations for each commodity + variety
        cursor.execute("""
            SELECT commodity, variety, unit, modal_price, min_price, max_price
            FROM mandi_prices
        """)
        all_obs = cursor.fetchall()
        suspicious_map: Dict[Tuple[str, str, str], int] = {}
        for r in all_obs:
            eval_res = evaluate_price_quality(
                commodity=r["commodity"],
                modal_price=r["modal_price"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                unit=r["unit"]
            )
            key = (r["commodity"].strip().lower(), r["variety"].strip().lower(), r["unit"].strip().lower())
            if eval_res["is_suspicious"]:
                suspicious_map[key] = suspicious_map.get(key, 0) + 1

        # Fetch date ranges per commodity + variety
        cursor.execute("""
            SELECT commodity, variety, unit, arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date ASC
        """)
        date_records = cursor.fetchall()
        date_range_map: Dict[Tuple[str, str, str], Dict[str, str]] = {}
        for r in date_records:
            key = (r["commodity"].strip().lower(), r["variety"].strip().lower(), r["unit"].strip().lower())
            if key not in date_range_map:
                date_range_map[key] = {"earliest": r["arrival_date"], "latest": r["arrival_date"]}
            else:
                date_range_map[key]["latest"] = r["arrival_date"]

        results = []
        for g in groups:
            key = (g["commodity"].strip().lower(), g["variety"].strip().lower(), g["unit"].strip().lower())
            susp_count = suspicious_map.get(key, 0)
            valid_count = g["total_observations"] - susp_count
            dates_info = date_range_map.get(key, {"earliest": None, "latest": None})
            depth_class = classify_history_depth(g["distinct_dates_count"])

            results.append({
                "commodity": g["commodity"],
                "variety": g["variety"],
                "unit": g["unit"],
                "total_observations": g["total_observations"],
                "valid_observations": valid_count,
                "suspicious_observations": susp_count,
                "distinct_dates_count": g["distinct_dates_count"],
                "markets_count": g["markets_count"],
                "states_count": g["states_count"],
                "min_modal_price": g["min_modal"],
                "max_modal_price": g["max_modal"],
                "avg_modal_price": g["avg_modal"],
                "earliest_arrival_date": dates_info["earliest"],
                "latest_arrival_date": dates_info["latest"],
                "readiness_classification": depth_class
            })

        return results
    finally:
        conn.close()


# =====================================================================
# 5. MARKET-LEVEL HISTORICAL COVERAGE
# =====================================================================

def get_market_history_summary(
    state: Optional[str] = None,
    commodity: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Summarizes historical series coverage at the APMC market level.
    Tracks distinct crops, observations, date horizon, and staleness.
    """
    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        # Determine overall latest arrival date for staleness evaluation
        cursor.execute("""
            SELECT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date DESC
            LIMIT 1
        """)
        top_date_row = cursor.fetchone()
        overall_latest_date = top_date_row["arrival_date"] if top_date_row else None

        query = """
            SELECT market, state, district,
                   COUNT(*) as total_observations,
                   COUNT(DISTINCT commodity) as commodities_count,
                   COUNT(DISTINCT arrival_date) as distinct_dates_count,
                   MAX(SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) as latest_iso,
                   MIN(SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) as earliest_iso
            FROM mandi_prices
            WHERE 1=1
        """
        params: List[Any] = []

        if state and isinstance(state, str) and state.strip() and state.strip().lower() != "all":
            variants = get_state_query_variants(state)
            placeholders = ",".join(["?" for _ in variants])
            query += f" AND LOWER(state) IN ({','.join(['LOWER(?)' for _ in variants])})"
            params.extend(variants)

        if commodity and isinstance(commodity, str) and commodity.strip() and commodity.strip().lower() != "all":
            query += " AND LOWER(commodity) = LOWER(?)"
            params.append(commodity.strip())

        if search and isinstance(search, str) and search.strip():
            query += " AND (LOWER(market) LIKE LOWER(?) OR LOWER(district) LIKE LOWER(?))"
            params.extend([f"%{search.strip()}%", f"%{search.strip()}%"])

        query += " GROUP BY LOWER(market), LOWER(state), LOWER(district)"
        query += " ORDER BY total_observations DESC, market ASC"

        cursor.execute(query, params)
        all_rows = cursor.fetchall()
        total_markets = len(all_rows)

        # Pagination
        limit = max(1, min(limit, 200))
        page = max(1, page)
        total_pages = max(1, (total_markets + limit - 1) // limit)
        start_idx = (page - 1) * limit
        paginated_rows = all_rows[start_idx:start_idx + limit]

        markets_data = []
        for r in paginated_rows:
            # Convert ISO dates back to DD/MM/YYYY for presentation
            latest_d = None
            earliest_d = None
            if r["latest_iso"]:
                parts = r["latest_iso"].split("-")
                latest_d = f"{parts[2]}/{parts[1]}/{parts[0]}"
            if r["earliest_iso"]:
                parts = r["earliest_iso"].split("-")
                earliest_d = f"{parts[2]}/{parts[1]}/{parts[0]}"

            depth_class = classify_history_depth(r["distinct_dates_count"])
            is_stale = (latest_d != overall_latest_date) if overall_latest_date else False

            markets_data.append({
                "market": r["market"],
                "state": r["state"],
                "display_state": normalize_state_display(r["state"]),
                "district": r["district"],
                "total_observations": r["total_observations"],
                "commodities_count": r["commodities_count"],
                "distinct_dates_count": r["distinct_dates_count"],
                "earliest_arrival_date": earliest_d,
                "latest_arrival_date": latest_d,
                "is_stale": is_stale,
                "readiness_classification": depth_class
            })

        return {
            "total_markets": total_markets,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "overall_latest_arrival_date": overall_latest_date,
            "markets": markets_data
        }
    finally:
        conn.close()


# =====================================================================
# 6. TIME-SERIES HISTORICAL OBSERVATIONS RETRIEVAL
# =====================================================================

def get_series_history(
    commodity: str,
    market: Optional[str] = None,
    variety: Optional[str] = None,
    state: Optional[str] = None,
    unit: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    limit: int = 50
) -> Dict[str, Any]:
    """
    Retrieves chronological time-series observations for a specific series.
    Calculates calendar day gaps between consecutive observations, evaluates quality flags,
    and returns full audit metrics.
    """
    if not commodity or not isinstance(commodity, str):
        raise ValueError("Commodity parameter is required for historical series retrieval.")

    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        query = """
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label, last_updated,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            WHERE LOWER(commodity) = LOWER(?)
        """
        params: List[Any] = [commodity.strip()]

        if market and isinstance(market, str) and market.strip() and market.strip().lower() != "all":
            query += " AND LOWER(market) = LOWER(?)"
            params.append(market.strip())

        if variety and isinstance(variety, str) and variety.strip() and variety.strip().lower() != "all":
            query += " AND LOWER(variety) = LOWER(?)"
            params.append(variety.strip())

        if state and isinstance(state, str) and state.strip() and state.strip().lower() != "all":
            variants = get_state_query_variants(state)
            query += f" AND LOWER(state) IN ({','.join(['LOWER(?)' for _ in variants])})"
            params.extend(variants)

        if unit and isinstance(unit, str) and unit.strip() and unit.strip().lower() != "all":
            query += " AND LOWER(unit) = LOWER(?)"
            params.append(unit.strip())

        # Date range filtering (by ISO conversion)
        if start_date:
            parsed_start = parse_arrival_date(start_date)
            if parsed_start:
                query += " AND (SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) >= ?"
                params.append(parsed_start.strftime("%Y-%m-%d"))

        if end_date:
            parsed_end = parse_arrival_date(end_date)
            if parsed_end:
                query += " AND (SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) <= ?"
                params.append(parsed_end.strftime("%Y-%m-%d"))

        # Strict chronological order for time-series analysis
        query += " ORDER BY iso_date ASC, id ASC"

        cursor.execute(query, params)
        all_observations = [dict(r) for r in cursor.fetchall()]
        total_observations = len(all_observations)

        # Process observations: evaluate quality and calculate day gaps
        valid_obs_count = 0
        suspicious_obs_count = 0
        distinct_dates = set()
        valid_modal_prices = []

        processed_records = []
        previous_date = None

        for obs in all_observations:
            distinct_dates.add(obs["arrival_date"])
            eval_res = evaluate_price_quality(
                commodity=obs["commodity"],
                modal_price=obs["modal_price"],
                min_price=obs["min_price"],
                max_price=obs["max_price"],
                unit=obs["unit"]
            )
            obs["is_suspicious"] = eval_res["is_suspicious"]
            obs["suspicious_reason"] = eval_res["suspicious_reason"]
            obs["severity"] = eval_res["severity"]
            obs["display_state"] = normalize_state_display(obs["state"])

            if eval_res["is_suspicious"]:
                suspicious_obs_count += 1
            else:
                valid_obs_count += 1
                valid_modal_prices.append(obs["modal_price"])

            # Compute calendar days gap from preceding record
            if previous_date is not None:
                obs["days_gap_from_previous"] = calculate_days_gap(previous_date, obs["arrival_date"])
            else:
                obs["days_gap_from_previous"] = None
            previous_date = obs["arrival_date"]

            processed_records.append(obs)

        # Pagination
        limit = max(1, min(limit, 200))
        page = max(1, page)
        total_pages = max(1, (total_observations + limit - 1) // limit)
        start_idx = (page - 1) * limit
        paginated_observations = processed_records[start_idx:start_idx + limit]

        # Calculate statistics
        distinct_dates_count = len(distinct_dates)
        depth_classification = classify_history_depth(distinct_dates_count)

        earliest_date = processed_records[0]["arrival_date"] if processed_records else None
        latest_date = processed_records[-1]["arrival_date"] if processed_records else None

        avg_modal = round(sum(valid_modal_prices) / len(valid_modal_prices), 2) if valid_modal_prices else None
        min_modal = min(valid_modal_prices) if valid_modal_prices else None
        max_modal = max(valid_modal_prices) if valid_modal_prices else None

        readiness_warning = (
            f"This series has {distinct_dates_count} distinct arrival date(s). "
            f"Historical classification: '{depth_classification['label']}'. "
            f"Time-series models require at least 14-30 consecutive days of data."
        )

        return {
            "series_info": {
                "commodity": commodity,
                "variety": variety or "All",
                "market": market or "All",
                "state": state or "All",
                "unit": unit or "Rs/Quintal"
            },
            "summary": {
                "total_observations": total_observations,
                "valid_observations": valid_obs_count,
                "suspicious_observations": suspicious_obs_count,
                "distinct_dates_count": distinct_dates_count,
                "earliest_arrival_date": earliest_date,
                "latest_arrival_date": latest_date,
                "min_modal_price": min_modal,
                "max_modal_price": max_modal,
                "avg_modal_price": avg_modal,
                "readiness_classification": depth_classification,
                "readiness_warning": readiness_warning
            },
            "pagination": {
                "page": page,
                "limit": limit,
                "total_records": total_observations,
                "total_pages": total_pages
            },
            "observations": paginated_observations
        }
    finally:
        conn.close()


# =====================================================================
# 7. HISTORICAL DATA QUALITY & ANOMALIES AUDIT
# =====================================================================

def get_history_quality_audit() -> Dict[str, Any]:
    """
    Conducts a comprehensive quality audit of all historical mandi records:
    - Lists all suspicious records with crop economics explanation
    - Audits date continuity and reports calendar gaps
    - Detects stale markets lagging behind latest arrival dates
    """
    conn = db.get_db_connection()
    cursor = conn.cursor()
    try:
        # Determine latest arrival date overall
        cursor.execute("""
            SELECT arrival_date,
                   SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2) as iso_date
            FROM mandi_prices
            ORDER BY iso_date DESC
            LIMIT 1
        """)
        latest_row = cursor.fetchone()
        overall_latest_date = latest_row["arrival_date"] if latest_row else None

        # Fetch all records to evaluate price quality
        cursor.execute("""
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label
            FROM mandi_prices
            ORDER BY id ASC
        """)
        all_records = [dict(r) for r in cursor.fetchall()]

        suspicious_list = []
        for r in all_records:
            eval_res = evaluate_price_quality(
                commodity=r["commodity"],
                modal_price=r["modal_price"],
                min_price=r["min_price"],
                max_price=r["max_price"],
                unit=r["unit"]
            )
            if eval_res["is_suspicious"]:
                r["is_suspicious"] = True
                r["suspicious_reason"] = eval_res["suspicious_reason"]
                r["severity"] = eval_res["severity"]
                r["display_state"] = normalize_state_display(r["state"])
                suspicious_list.append(r)

        # Stale markets check (markets whose latest date is older than overall latest)
        cursor.execute("""
            SELECT market, state, district,
                   MAX(SUBSTR(arrival_date, 7, 4) || '-' || SUBSTR(arrival_date, 4, 2) || '-' || SUBSTR(arrival_date, 1, 2)) as latest_iso
            FROM mandi_prices
            GROUP BY LOWER(market), LOWER(state), LOWER(district)
        """)
        market_latest = cursor.fetchall()
        stale_markets = []
        for m in market_latest:
            parts = m["latest_iso"].split("-") if m["latest_iso"] else []
            latest_d = f"{parts[2]}/{parts[1]}/{parts[0]}" if len(parts) == 3 else None
            if latest_d and overall_latest_date and latest_d != overall_latest_date:
                stale_markets.append({
                    "market": m["market"],
                    "state": m["state"],
                    "display_state": normalize_state_display(m["state"]),
                    "district": m["district"],
                    "latest_arrival_date": latest_d,
                    "overall_latest_arrival_date": overall_latest_date,
                    "lag_days": calculate_days_gap(latest_d, overall_latest_date)
                })

        total_obs = len(all_records)
        suspicious_count = len(suspicious_list)
        valid_obs = total_obs - suspicious_count

        return {
            "total_observations_audited": total_obs,
            "valid_observations": valid_obs,
            "suspicious_observations_count": suspicious_count,
            "suspicious_percentage": round((suspicious_count / total_obs) * 100, 2) if total_obs else 0,
            "suspicious_records": suspicious_list,
            "stale_markets_count": len(stale_markets),
            "stale_markets": stale_markets[:50],  # Return up to 50 stale markets
            "overall_latest_arrival_date": overall_latest_date
        }
    finally:
        conn.close()
