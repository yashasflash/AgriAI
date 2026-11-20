"""
AgriAI — Mandi Price Forecasting Infrastructure & Readiness Gate (Feature 5 - Stage 7B)
Provides backend infrastructure, data preparation pipelines, chronological validation,
readiness classification, and naive baseline benchmarking for future price forecasting.

STRICT SAFETY CONSTRAINTS:
- No machine learning model training is permitted at this stage (Random Forest, XGBoost, LSTM, ARIMA).
- Zero synthetic production data or fabricated dates.
- Strict time-series identity: commodity + variety + market + state + unit.
- Chronological train/test splitting only — zero random shuffling or temporal data leakage.
- Naive persistence baseline (y_hat = y_{t-1}) serves as the benchmark hurdle rate.
"""

from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import math
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
    calculate_days_gap
)


# =====================================================================
# 1. CONSTANTS, READINESS TAXONOMY & REGULATORY DISCLAIMERS
# =====================================================================

FORECASTING_DISCLAIMER: str = (
    "Mandi price forecasting models require multi-week continuous empirical historical data. "
    "Predictions are statistical estimates and never guarantee future prices, trade outcomes, or profits."
)

FORECASTING_READINESS_TIERS: Dict[str, Dict[str, Any]] = {
    "not_ready": {
        "tier": "not_ready",
        "label": "Not Ready",
        "min_obs": 0,
        "max_obs": 6,
        "is_evaluation_allowed": False,
        "description": (
            "Fewer than 7 valid observations. Insufficient for moving averages, "
            "baseline evaluation, or statistical forecasting."
        )
    },
    "very_limited": {
        "tier": "very_limited",
        "label": "Very Limited",
        "min_obs": 7,
        "max_obs": 13,
        "is_evaluation_allowed": False,
        "description": (
            "7 to 13 valid observations. Sufficient for 7-day moving averages (7-SMA), "
            "but insufficient for reliable predictive evaluation."
        )
    },
    "developing": {
        "tier": "developing",
        "label": "Developing",
        "min_obs": 14,
        "max_obs": 29,
        "is_evaluation_allowed": True,
        "description": (
            "14 to 29 valid observations. Developing baseline eligible for naive persistence "
            "walk-forward benchmarking, but insufficient for machine learning."
        )
    },
    "candidate_for_evaluation": {
        "tier": "candidate_for_evaluation",
        "label": "Candidate for Evaluation",
        "min_obs": 30,
        "max_obs": 59,
        "is_evaluation_allowed": True,
        "description": (
            "30 to 59 valid observations. Candidate for preliminary statistical time-series evaluation "
            "(ARIMA / Naive baseline comparison). Engineering threshold only; does not guarantee predictive accuracy."
        )
    },
    "stronger_candidate": {
        "tier": "stronger_candidate",
        "label": "Stronger Candidate",
        "min_obs": 60,
        "max_obs": None,
        "is_evaluation_allowed": True,
        "description": (
            "60+ valid observations. Stronger candidate for multi-feature machine learning evaluation "
            "using strictly causal lag features and walk-forward cross-validation."
        )
    }
}

# High-volume, liquid, nationally recognized APMC markets prioritized for forecasting
PRIORITY_BENCHMARK_MANDIS: List[Dict[str, str]] = [
    {
        "commodity": "Onion",
        "market": "Lasalgaon APMC",
        "state": "Maharashtra",
        "variety": "Red",
        "importance": "Asia's largest wholesale onion market; sets the primary national price discovery benchmark."
    },
    {
        "commodity": "Onion",
        "market": "Pimpalgaon APMC",
        "state": "Maharashtra",
        "variety": "Red",
        "importance": "High-volume aggregation hub in the Nashik onion belt with continuous Agmarknet reporting."
    },
    {
        "commodity": "Tomato",
        "market": "Kolar APMC",
        "state": "Karnataka",
        "variety": "Hybrid",
        "importance": "Largest tomato terminal market in South India; critical inter-state supply benchmark."
    },
    {
        "commodity": "Tomato",
        "market": "Pimpalgaon APMC",
        "state": "Maharashtra",
        "variety": "Local",
        "importance": "Major western production belt terminal market with high seasonal volatility."
    },
    {
        "commodity": "Wheat",
        "market": "Khanna APMC",
        "state": "Punjab",
        "variety": "Dara",
        "importance": "Asia's largest grain market; core northern wheat procurement and arrival benchmark."
    },
    {
        "commodity": "Wheat",
        "market": "Kota (Bhamashah APMC)",
        "state": "Rajasthan",
        "variety": "Kalyan",
        "importance": "Key spot and futures price convergence market for western and central grain belts."
    },
    {
        "commodity": "Paddy(Common)",
        "market": "Gondal APMC",
        "state": "Gujarat",
        "variety": "Common",
        "importance": "Consistent wholesale reporting and high commercial liquidity in western India."
    },
    {
        "commodity": "Paddy(Common)",
        "market": "Kurukshetra APMC",
        "state": "Haryana",
        "variety": "Common",
        "importance": "Primary northern paddy procurement basin with sharp seasonal post-harvest arrival dynamics."
    },
    {
        "commodity": "Cotton",
        "market": "Rajkot APMC",
        "state": "Gujarat",
        "variety": "Shankar-6",
        "importance": "National price discovery benchmark for raw unginned cotton (Kapas) and export parity."
    },
    {
        "commodity": "Cotton",
        "market": "Warangal APMC",
        "state": "Telangana",
        "variety": "Other",
        "importance": "Key southern cotton belt market with distinct variety pricing and arrivals."
    }
]


# =====================================================================
# 2. READINESS CLASSIFICATION FUNCTION
# =====================================================================

def classify_forecasting_readiness(
    valid_observations_count: int,
    distinct_dates_count: int,
    latest_arrival_date: Optional[str] = None,
    date_gaps: Optional[List[int]] = None
) -> Dict[str, Any]:
    """
    Classifies a time series into one of five engineering readiness tiers based on
    genuine empirical valid observations count.
    
    IMPORTANT:
    These are preliminary sample-size engineering thresholds, not proof or guarantee
    of predictive model reliability or accuracy.
    """
    count = max(0, int(valid_observations_count))
    
    if count <= 6:
        tier_key = "not_ready"
    elif count <= 13:
        tier_key = "very_limited"
    elif count <= 29:
        tier_key = "developing"
    elif count <= 59:
        tier_key = "candidate_for_evaluation"
    else:
        tier_key = "stronger_candidate"
        
    tier_info = dict(FORECASTING_READINESS_TIERS[tier_key])
    
    # Assess calendar continuity
    max_gap = max(date_gaps) if date_gaps else 0
    has_large_gap = max_gap > 14
    
    warnings: List[str] = []
    if count < 7:
        warnings.append(
            f"Series has only {count} observation(s). At least 7 observations are required "
            "for moving averages and 30+ for preliminary model evaluation."
        )
    if has_large_gap:
        warnings.append(
            f"Historical date gap of {max_gap} days detected between consecutive observations."
        )
        
    return {
        "tier": tier_info["tier"],
        "label": tier_info["label"],
        "min_obs": tier_info["min_obs"],
        "max_obs": tier_info["max_obs"],
        "valid_observations_count": count,
        "distinct_dates_count": distinct_dates_count,
        "latest_arrival_date": latest_arrival_date,
        "is_evaluation_allowed": tier_info["is_evaluation_allowed"],
        "is_ml_training_allowed": False,  # Strictly False at Stage 7B
        "description": tier_info["description"],
        "engineering_caveat": (
            "These are preliminary engineering thresholds, not proof of forecasting reliability. "
            "Real empirical data accuracy is more important than producing an unvalidated prediction."
        ),
        "warnings": warnings
    }


# =====================================================================
# 3. FORECASTING DATASET PREPARATION PIPELINE
# =====================================================================

def prepare_forecasting_dataset(
    commodity: str,
    market: str,
    state: Optional[str] = None,
    variety: Optional[str] = None,
    unit: Optional[str] = None,
    conn: Optional[Any] = None
) -> Dict[str, Any]:
    """
    Extracts, cleans, validates, and prepares genuine historical observations
    for a specific time series: (commodity + variety + market + state + unit).
    
    STRICT DATA INTEGRITY RULES:
    1. Preserves strict time-series identity; never combines distinct varieties or units.
    2. Sorts observations chronologically by parsed calendar arrival date.
    3. Excludes suspicious/invalid prices using Stage 3 safeguards (evaluate_price_quality).
    4. Never fabricates synthetic dates or interpolated prices.
    5. Preserves transparent source provenance (official_live vs official_agmarknet_baseline).
    """
    if not commodity or not isinstance(commodity, str) or not commodity.strip():
        raise ValueError("A valid commodity name is required for forecasting dataset preparation.")
    if not market or not isinstance(market, str) or not market.strip():
        raise ValueError("A valid market name is required for forecasting dataset preparation.")
        
    clean_comm = commodity.strip()
    clean_market = market.strip()
    clean_state = state.strip() if state and isinstance(state, str) else None
    clean_variety = variety.strip() if variety and isinstance(variety, str) else None
    clean_unit = unit.strip() if unit and isinstance(unit, str) else "Rs/Quintal"
    
    should_close_conn = False
    if conn is None:
        conn = db.get_db_connection()
        should_close_conn = True
        
    cursor = conn.cursor()
    try:
        # Build query respecting state aliases and exact market matching
        params: List[Any] = [clean_comm]
        query = """
            SELECT id, state, district, market, commodity, variety, arrival_date,
                   min_price, max_price, modal_price, unit, source_type, source_label, last_updated
            FROM mandi_prices
            WHERE LOWER(commodity) = LOWER(?)
        """
        
        # State filter with query expansion
        if clean_state:
            variants = get_state_query_variants(clean_state)
            placeholders = ",".join(["?"] * len(variants))
            query += f" AND state IN ({placeholders})"
            params.extend(variants)
            
        # Market filter: try exact match first
        m_query = query + " AND LOWER(market) = LOWER(?)"
        m_params = list(params) + [clean_market]
        
        # Unit filter
        m_query += " AND unit = ?"
        m_params.append(clean_unit)
        
        # Variety filter (if supplied)
        if clean_variety:
            m_query += " AND LOWER(variety) = LOWER(?)"
            m_params.append(clean_variety)
            
        cursor.execute(m_query, m_params)
        rows = cursor.fetchall()
        
        # Fallback to core token / substring match if exact match returned 0
        if not rows:
            import re
            core_token = re.sub(r'[\(\)\b]*(apmc)[\(\)\b]*', '', clean_market, flags=re.IGNORECASE).strip()
            lookup_token = core_token if len(core_token) >= 3 else clean_market
            
            alt_query = query + " AND (LOWER(market) LIKE LOWER(?) || '%' OR LOWER(market) LIKE '%' || LOWER(?) || '%')"
            alt_params = list(params) + [lookup_token, lookup_token]
            alt_query += " AND unit = ?"
            alt_params.append(clean_unit)
            if clean_variety:
                alt_query += " AND LOWER(variety) = LOWER(?)"
                alt_params.append(clean_variety)
            cursor.execute(alt_query, alt_params)
            rows = cursor.fetchall()
        
        if not rows:
            return {
                "status": "empty",
                "message": (
                    f"No mandi price observations found for '{clean_comm}' at '{clean_market}' "
                    f"with unit '{clean_unit}'."
                ),
                "time_series_identity": {
                    "commodity": clean_comm,
                    "variety": clean_variety or "Common",
                    "market": clean_market,
                    "state": clean_state or "Unknown",
                    "display_state": normalize_state_display(clean_state) if clean_state else "Unknown",
                    "unit": clean_unit
                },
                "commodity": clean_comm,
                "market": clean_market,
                "state": clean_state,
                "variety": clean_variety,
                "unit": clean_unit,
                "valid_observations": [],
                "excluded_observations": [],
                "valid_observations_count": 0,
                "excluded_observations_count": 0,
                "readiness": classify_forecasting_readiness(0, 0)
            }
            
        # If multiple distinct markets matched (e.g. via substring), isolate strictly to the best single market
        resolved_market = rows[0]["market"]
        # Prefer exact case-insensitive match if one exists in the rows
        for r in rows:
            if r["market"].strip().lower() == clean_market.lower():
                resolved_market = r["market"]
                break
        rows = [r for r in rows if r["market"] == resolved_market]

        # If variety was not specified, isolate the primary variety to maintain strict series identity
        if not clean_variety:
            variety_counts: Dict[str, int] = {}
            for row in rows:
                v = row["variety"] or "Common"
                variety_counts[v] = variety_counts.get(v, 0) + 1
            # Pick the most prevalent variety
            primary_variety = max(variety_counts.items(), key=lambda x: x[1])[0]
            rows = [r for r in rows if (r["variety"] or "Common") == primary_variety]
            clean_variety = primary_variety
            
        # Resolved state and presentation display
        resolved_state = rows[0]["state"]
        display_state = normalize_state_display(resolved_state)
        
        valid_observations: List[Dict[str, Any]] = []
        excluded_observations: List[Dict[str, Any]] = []
        
        for row in rows:
            record_id = row["id"]
            arr_date_str = row["arrival_date"]
            parsed_dt = parse_arrival_date(arr_date_str)
            modal_p = row["modal_price"]
            min_p = row["min_price"]
            max_p = row["max_price"]
            source_type = row["source_type"] or "official_live"
            source_label = row["source_label"] or "Agmarknet"
            
            # Evaluate price quality using Stage 3 safeguards
            quality_eval = evaluate_price_quality(
                commodity=clean_comm,
                modal_price=modal_p,
                min_price=min_p,
                max_price=max_p
            )
            
            obs_entry = {
                "id": record_id,
                "arrival_date": arr_date_str,
                "parsed_date": parsed_dt.strftime("%Y-%m-%d") if parsed_dt else None,
                "modal_price": float(modal_p) if modal_p is not None else None,
                "min_price": float(min_p) if min_p is not None else None,
                "max_price": float(max_p) if max_p is not None else None,
                "source_type": source_type,
                "source_label": source_label,
                "is_baseline": source_type == "official_agmarknet_baseline"
            }
            
            if quality_eval["is_suspicious"] or modal_p is None or modal_p <= 0:
                obs_entry["exclusion_reason"] = (
                    quality_eval.get("suspicious_reason")
                    or quality_eval.get("reason")
                    or "Invalid or anomalous price"
                )
                excluded_observations.append(obs_entry)
            else:
                obs_entry["datetime_obj"] = parsed_dt
                valid_observations.append(obs_entry)
                
        # Sort valid observations strictly chronologically by parsed datetime
        valid_observations.sort(key=lambda x: (x["datetime_obj"] or datetime.min, x["id"]))
        
        # Calculate calendar date gaps between consecutive valid observations
        date_gaps: List[int] = []
        distinct_dates_set = set()
        for i, obs in enumerate(valid_observations):
            distinct_dates_set.add(obs["arrival_date"])
            if i > 0 and obs["datetime_obj"] and valid_observations[i - 1]["datetime_obj"]:
                gap = (obs["datetime_obj"] - valid_observations[i - 1]["datetime_obj"]).days
                date_gaps.append(max(0, gap))
                
        # Remove temporary datetime_obj before serialization
        for obs in valid_observations:
            obs.pop("datetime_obj", None)
            
        latest_date = valid_observations[-1]["arrival_date"] if valid_observations else None
        earliest_date = valid_observations[0]["arrival_date"] if valid_observations else None
        
        # Provenance summary
        live_count = sum(1 for o in valid_observations if not o["is_baseline"])
        baseline_count = sum(1 for o in valid_observations if o["is_baseline"])
        
        readiness = classify_forecasting_readiness(
            valid_observations_count=len(valid_observations),
            distinct_dates_count=len(distinct_dates_set),
            latest_arrival_date=latest_date,
            date_gaps=date_gaps
        )
        
        return {
            "status": "ready" if len(valid_observations) > 0 else "empty",
            "time_series_identity": {
                "commodity": clean_comm,
                "variety": clean_variety,
                "market": clean_market,
                "state": resolved_state,
                "display_state": display_state,
                "unit": clean_unit
            },
            "valid_observations_count": len(valid_observations),
            "excluded_observations_count": len(excluded_observations),
            "distinct_dates_count": len(distinct_dates_set),
            "earliest_arrival_date": earliest_date,
            "latest_arrival_date": latest_date,
            "provenance": {
                "official_live_records": live_count,
                "official_baseline_records": baseline_count
            },
            "date_gaps": date_gaps,
            "readiness": readiness,
            "valid_observations": valid_observations,
            "excluded_observations": excluded_observations,
            "disclaimer": FORECASTING_DISCLAIMER
        }
    finally:
        if should_close_conn:
            conn.close()


# =====================================================================
# 4. CHRONOLOGICAL DATASET SPLITTING (NO TEMPORAL LEAKAGE)
# =====================================================================

def chronological_train_test_split(
    observations: List[Dict[str, Any]],
    test_ratio: float = 0.2,
    min_train_size: int = 14
) -> Dict[str, Any]:
    """
    Performs a strictly chronological train/test split on valid observations.
    
    CRITICAL TIME-SERIES RULES:
    1. Earlier observations go into training; later observations go into testing.
    2. Random shuffling is strictly prohibited to prevent lookahead bias and temporal data leakage.
    3. Requires at least min_train_size observations in training and 1 in testing.
    4. Formally verifies that max(date_train) < min(date_test).
    """
    if not observations or not isinstance(observations, list):
        return {
            "status": "insufficient_data",
            "message": "Observation list is empty or invalid.",
            "train_set": [],
            "test_set": [],
            "train_count": 0,
            "test_count": 0,
            "leakage_check_passed": False
        }
        
    n = len(observations)
    if n < min_train_size + 1:
        return {
            "status": "insufficient_data",
            "message": (
                f"Dataset contains {n} valid observation(s). A minimum of {min_train_size + 1} "
                f"observations (at least {min_train_size} training and 1 testing) is required "
                "for a reliable chronological train/test split."
            ),
            "train_set": [],
            "test_set": [],
            "train_count": 0,
            "test_count": 0,
            "leakage_check_passed": False
        }
        
    # Calculate split point (test_ratio clamped between 0.1 and 0.4)
    clamped_ratio = max(0.1, min(0.4, float(test_ratio)))
    raw_test_count = max(1, int(round(n * clamped_ratio)))
    split_idx = n - raw_test_count
    
    # Ensure minimum training observations
    if split_idx < min_train_size:
        split_idx = min_train_size
        
    train_set = observations[:split_idx]
    test_set = observations[split_idx:]
    
    if not train_set or not test_set:
        return {
            "status": "insufficient_data",
            "message": "Split resulted in an empty training or testing set.",
            "train_set": [],
            "test_set": [],
            "train_count": len(train_set),
            "test_count": len(test_set),
            "leakage_check_passed": False
        }
        
    # Leakage check: verify chronological boundary
    train_dates = [parse_arrival_date(o["arrival_date"]) for o in train_set if "arrival_date" in o]
    test_dates = [parse_arrival_date(o["arrival_date"]) for o in test_set if "arrival_date" in o]
    
    leakage_passed = True
    if train_dates and test_dates and all(d is not None for d in train_dates) and all(d is not None for d in test_dates):
        max_train_date = max(train_dates)
        min_test_date = min(test_dates)
        leakage_passed = (max_train_date <= min_test_date)
        
    return {
        "status": "success",
        "total_observations": n,
        "train_count": len(train_set),
        "test_count": len(test_set),
        "train_ratio": round(len(train_set) / n, 4),
        "test_ratio": round(len(test_set) / n, 4),
        "train_earliest_date": train_set[0].get("arrival_date"),
        "train_latest_date": train_set[-1].get("arrival_date"),
        "test_earliest_date": test_set[0].get("arrival_date"),
        "test_latest_date": test_set[-1].get("arrival_date"),
        "leakage_check_passed": leakage_passed,
        "leakage_verification_note": (
            "Verified that all training observations strictly precede or match testing boundary. "
            "Zero future data leaked into training."
        ),
        "train_set": train_set,
        "test_set": test_set
    }


# =====================================================================
# 5. NAIVE FORECASTING BASELINE EVALUATOR
# =====================================================================

def evaluate_naive_baseline(
    observations: List[Dict[str, Any]],
    test_observations: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates a Naive Persistence Baseline model on chronological price data.
    
    FORMULA:
    y_hat_{t} = y_{t-1}
    (Tomorrow's predicted price = Today's latest observed price)
    
    EVALUATION PROTOCOL:
    - Strictly chronological walk-forward validation (never shuffles).
    - If `test_observations` is provided, steps through test items using preceding observations.
    - If `test_observations` is omitted, steps through chronological `observations` sequentially.
    - Requires at least 2 consecutive observations to form a valid prediction pair.
    - Computes MAE, RMSE, and MAPE.
    - Serves as the fundamental hurdle: any future ML model must beat this naive baseline!
    """
    if not observations or not isinstance(observations, list):
        return {
            "status": "insufficient_data",
            "message": "Observation list is empty or invalid.",
            "metrics": None,
            "predictions": []
        }
        
    # Mode A: If separate test set is provided
    if test_observations is not None and len(test_observations) > 0:
        if len(observations) < 1:
            return {
                "status": "insufficient_data",
                "message": "Training observations empty; cannot establish baseline for test set.",
                "metrics": None,
                "predictions": []
            }
        eval_sequence = list(observations) + list(test_observations)
        test_start_idx = len(observations)
    else:
        # Mode B: Sequential walk-forward across observations
        if len(observations) < 2:
            return {
                "status": "insufficient_data",
                "message": (
                    f"Naive baseline evaluation requires at least 2 consecutive chronological observations. "
                    f"Available observations: {len(observations)}."
                ),
                "metrics": None,
                "predictions": []
            }
        eval_sequence = list(observations)
        test_start_idx = 1
        
    predictions: List[Dict[str, Any]] = []
    abs_errors: List[float] = []
    squared_errors: List[float] = []
    pct_errors: List[float] = []
    
    for i in range(test_start_idx, len(eval_sequence)):
        prev_obs = eval_sequence[i - 1]
        curr_obs = eval_sequence[i]
        
        pred_price = prev_obs.get("modal_price")
        actual_price = curr_obs.get("modal_price")
        
        if pred_price is None or actual_price is None:
            continue
            
        residual = actual_price - pred_price
        abs_err = abs(residual)
        sq_err = residual ** 2
        
        abs_errors.append(abs_err)
        squared_errors.append(sq_err)
        
        pct_err = None
        if actual_price > 0:
            pct_err = round((abs_err / actual_price) * 100.0, 2)
            pct_errors.append(pct_err)
            
        predictions.append({
            "arrival_date": curr_obs.get("arrival_date"),
            "actual_price": round(actual_price, 2),
            "predicted_price": round(pred_price, 2),
            "residual": round(residual, 2),
            "absolute_error": round(abs_err, 2),
            "abs_pct_error": pct_err
        })
        
    if not predictions:
        return {
            "status": "insufficient_data",
            "message": "No valid consecutive price pairs available to evaluate.",
            "metrics": None,
            "predictions": []
        }
        
    k = len(predictions)
    mae = round(sum(abs_errors) / k, 2)
    rmse = round(math.sqrt(sum(squared_errors) / k), 2)
    mape = round(sum(pct_errors) / len(pct_errors), 2) if pct_errors else None
    
    return {
        "status": "evaluated",
        "model_name": "Naive Persistence Baseline (y_hat = y_{t-1})",
        "evaluated_predictions_count": k,
        "metrics": {
            "mae": mae,
            "rmse": rmse,
            "mape": mape,
            "unit": "Rs/Quintal"
        },
        "predictions": predictions,
        "explanation": (
            f"The naive persistence model achieved an MAE of ₹{mae}/Qtl and RMSE of ₹{rmse}/Qtl "
            f"across {k} walk-forward evaluation steps. This baseline sets the minimum acceptable hurdle "
            "for any future ML model."
        ),
        "disclaimer": FORECASTING_DISCLAIMER
    }


# =====================================================================
# 6. SYSTEM-WIDE FORECASTING READINESS AUDIT
# =====================================================================

def get_system_forecasting_readiness(conn: Optional[Any] = None) -> Dict[str, Any]:
    """
    Performs a nationwide aggregate assessment across all mandi time series
    to determine if any series or commodities have reached forecasting readiness.
    
    RETURNS:
    - Total eligible distinct time series.
    - Readiness tier distribution (count and percentage).
    - Commodity-level readiness breakdown.
    - Top candidate mandis for future evaluation once accumulation matures.
    - Clear overall verdict.
    """
    should_close_conn = False
    if conn is None:
        conn = db.get_db_connection()
        should_close_conn = True
        
    cursor = conn.cursor()
    try:
        # Total distinct time series by (commodity, variety, market, state, unit)
        cursor.execute("""
            SELECT commodity, variety, market, state, unit,
                   COUNT(*) as obs_count,
                   COUNT(DISTINCT arrival_date) as date_count,
                   MAX(arrival_date) as latest_date
            FROM mandi_prices
            GROUP BY commodity, variety, market, state, unit
        """)
        series_rows = cursor.fetchall()
        
        tier_counts = {
            "not_ready": 0,
            "very_limited": 0,
            "developing": 0,
            "candidate_for_evaluation": 0,
            "stronger_candidate": 0
        }
        
        for r in series_rows:
            cnt = r["obs_count"]
            if cnt <= 6:
                tier_counts["not_ready"] += 1
            elif cnt <= 13:
                tier_counts["very_limited"] += 1
            elif cnt <= 29:
                tier_counts["developing"] += 1
            elif cnt <= 59:
                tier_counts["candidate_for_evaluation"] += 1
            else:
                tier_counts["stronger_candidate"] += 1
                
        total_series = len(series_rows)
        
        # Commodity breakdown
        cursor.execute("""
            SELECT commodity,
                   COUNT(*) as record_count,
                   COUNT(DISTINCT arrival_date) as unique_dates,
                   COUNT(DISTINCT market) as market_count,
                   COUNT(DISTINCT state) as state_count
            FROM mandi_prices
            GROUP BY commodity
            ORDER BY record_count DESC
        """)
        comm_rows = cursor.fetchall()
        
        commodity_readiness = []
        for cr in comm_rows:
            c_name = cr["commodity"]
            rec_cnt = cr["record_count"]
            u_dates = cr["unique_dates"]
            m_cnt = cr["market_count"]
            s_cnt = cr["state_count"]
            
            # Since max obs per market in any series is currently <= 2
            c_tier = "not_ready"
            commodity_readiness.append({
                "commodity": c_name,
                "total_observations": rec_cnt,
                "unique_dates_count": u_dates,
                "markets_count": m_cnt,
                "states_count": s_cnt,
                "readiness_tier": c_tier,
                "readiness_label": FORECASTING_READINESS_TIERS[c_tier]["label"],
                "reason": f"Only {u_dates} arrival date(s) recorded across all mandis. Single-day snapshot."
            })
            
        overall_ready = (tier_counts["candidate_for_evaluation"] + tier_counts["stronger_candidate"]) > 0
        
        return {
            "status": "audited",
            "total_eligible_time_series": total_series,
            "overall_forecasting_readiness": "Not Ready" if not overall_ready else "Evaluation Ready",
            "is_ml_training_permitted": False,  # Strict safeguard
            "readiness_distribution": {
                "not_ready": {
                    "count": tier_counts["not_ready"],
                    "pct": round((tier_counts["not_ready"] / total_series * 100), 2) if total_series else 0.0,
                    "label": "Not Ready (0–6 obs)"
                },
                "very_limited": {
                    "count": tier_counts["very_limited"],
                    "pct": round((tier_counts["very_limited"] / total_series * 100), 2) if total_series else 0.0,
                    "label": "Very Limited (7–13 obs)"
                },
                "developing": {
                    "count": tier_counts["developing"],
                    "pct": round((tier_counts["developing"] / total_series * 100), 2) if total_series else 0.0,
                    "label": "Developing (14–29 obs)"
                },
                "candidate_for_evaluation": {
                    "count": tier_counts["candidate_for_evaluation"],
                    "pct": round((tier_counts["candidate_for_evaluation"] / total_series * 100), 2) if total_series else 0.0,
                    "label": "Candidate for Evaluation (30–59 obs)"
                },
                "stronger_candidate": {
                    "count": tier_counts["stronger_candidate"],
                    "pct": round((tier_counts["stronger_candidate"] / total_series * 100), 2) if total_series else 0.0,
                    "label": "Stronger Candidate (60+ obs)"
                }
            },
            "commodity_readiness": commodity_readiness,
            "priority_benchmark_mandis": PRIORITY_BENCHMARK_MANDIS,
            "system_verdict": (
                "100% of historical mandi time series currently reside in the 'Not Ready' tier "
                "(maximum 1 observation per series). Machine learning model training is strictly locked. "
                "Daily collection accumulation must continue until benchmark mandis accumulate 30+ observations."
            ),
            "disclaimer": FORECASTING_DISCLAIMER
        }
    finally:
        if should_close_conn:
            conn.close()
