"""
AgriAI — Stage 3 Safeguards Verification Test Suite
Tests:
1. Exact Database Record Count Preservation (2,595 records: 45 baseline, 2,550 live)
2. Suspicious Price Detection & Flagging without deletion (Patti ₹0.01, Rania ₹0.12, Patti ₹0.01)
3. Commodity Separation (Onion != Onion Green, Cotton != Cotton Seed, Wheat != Wheat Atta, Paddy != Rice)
4. State Name Normalization (Keralam -> Kerala, Chattisgarh -> Chhattisgarh, Pondicherry -> Puducherry)
5. Comparison & Advisory Benchmark Safety (Exclusion of outliers from spread & best market calculations)
"""

import sys
import os
import sqlite3
from pathlib import Path

# Ensure backend directory is in path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import db
import mandi_quality

def run_tests():
    print("=" * 70)
    print("RUNNING FEATURE 5 - STAGE 3 DATA QUALITY SAFEGUARDS TEST SUITE")
    print("=" * 70)

    # -------------------------------------------------------------
    # TEST 1: Database Record Count & Provenance Preservation
    # -------------------------------------------------------------
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT count(*) FROM mandi_prices")
    total_records = c.fetchone()[0]

    c.execute("SELECT count(*) FROM mandi_prices WHERE source_type = 'official_agmarknet_baseline'")
    baseline_records = c.fetchone()[0]

    c.execute("SELECT count(*) FROM mandi_prices WHERE source_type = 'official_live'")
    live_records = c.fetchone()[0]
    conn.close()

    print(f"\n[TEST 1] Database Preservation:")
    print(f"  - Total records: {total_records} (Expected: 2595)")
    print(f"  - Baseline records: {baseline_records} (Expected: 45)")
    print(f"  - Live official records: {live_records} (Expected: 2550)")
    assert total_records == 2595, f"Expected 2595 records, found {total_records}"
    assert baseline_records == 45, f"Expected 45 baseline records, found {baseline_records}"
    assert live_records == 2550, f"Expected 2550 live records, found {live_records}"
    print("  ✓ PASS: Exactly 2,595 records preserved without data loss or mutation.")

    # -------------------------------------------------------------
    # TEST 2: Suspicious Price Detection
    # -------------------------------------------------------------
    print(f"\n[TEST 2] Suspicious Price Detection & Outlier Flagging:")
    # Check known target records
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, commodity, state, market, modal_price FROM mandi_prices WHERE id IN (215, 914, 1023, 117)")
    target_rows = c.fetchall()
    conn.close()

    for row in target_rows:
        rid, comm, st, mkt, modal_p = row
        eval_res = mandi_quality.evaluate_price_quality(comm, modal_p)
        print(f"  - ID {rid} ({comm} at {mkt}, {st} - ₹{modal_p}): suspicious={eval_res['is_suspicious']}, reason={eval_res['suspicious_reason']}")
        assert eval_res["is_suspicious"] is True, f"Record {rid} should be flagged as suspicious!"
        assert eval_res["suspicious_reason"] is not None

    # Verify normal record is not flagged
    normal_eval = mandi_quality.evaluate_price_quality("Tomato", 2100.0)
    assert normal_eval["is_suspicious"] is False
    print(f"  - Normal Tomato (₹2100): suspicious={normal_eval['is_suspicious']}")
    print("  ✓ PASS: Known suspicious records correctly flagged without deletion.")

    # -------------------------------------------------------------
    # TEST 3: Commodity Separation
    # -------------------------------------------------------------
    print(f"\n[TEST 3] Strict Commodity Separation:")
    
    # Test Onion vs Onion Green
    onion_res = db.get_mandi_prices(commodity="Onion", limit=100)
    for r in onion_res["records"]:
        assert r["commodity"].lower() == "onion", f"Unexpected commodity '{r['commodity']}' in Onion query!"
    print(f"  - Onion query: {onion_res['total']} records (All strictly 'Onion', 0 'Onion Green')")

    onion_green_res = db.get_mandi_prices(commodity="Onion Green", limit=100)
    for r in onion_green_res["records"]:
        assert r["commodity"].lower() == "onion green", f"Unexpected commodity '{r['commodity']}' in Onion Green query!"
    print(f"  - Onion Green query: {onion_green_res['total']} records (All strictly 'Onion Green', 0 'Onion')")

    # Test Cotton vs Cotton Seed
    cotton_res = db.get_mandi_prices(commodity="Cotton", limit=100)
    for r in cotton_res["records"]:
        assert r["commodity"].lower() == "cotton", f"Unexpected commodity '{r['commodity']}' in Cotton query!"
    print(f"  - Cotton query: {cotton_res['total']} records (All strictly 'Cotton', 0 'Cotton Seed')")

    cotton_seed_res = db.get_mandi_prices(commodity="Cotton Seed", limit=100)
    for r in cotton_seed_res["records"]:
        assert r["commodity"].lower() == "cotton seed", f"Unexpected commodity '{r['commodity']}' in Cotton Seed query!"
    print(f"  - Cotton Seed query: {cotton_seed_res['total']} records (All strictly 'Cotton Seed', 0 'Cotton')")

    # Test Wheat vs Wheat Atta
    wheat_res = db.get_mandi_prices(commodity="Wheat", limit=100)
    for r in wheat_res["records"]:
        assert r["commodity"].lower() == "wheat", f"Unexpected commodity '{r['commodity']}' in Wheat query!"
    print(f"  - Wheat query: {wheat_res['total']} records (All strictly 'Wheat', 0 'Wheat Atta')")

    # Test Paddy vs Rice
    paddy_res = db.get_mandi_prices(commodity="Paddy(Common)", limit=100)
    for r in paddy_res["records"]:
        assert r["commodity"].lower() == "paddy(common)", f"Unexpected commodity '{r['commodity']}' in Paddy query!"
    print(f"  - Paddy(Common) query: {paddy_res['total']} records (All strictly 'Paddy(Common)', 0 'Rice')")

    # Compatibility matrix check
    comp_onion, _ = mandi_quality.are_commodities_comparable("Onion", "Onion Green")
    assert comp_onion is False
    comp_cotton, _ = mandi_quality.are_commodities_comparable("Cotton", "Cotton Seed")
    assert comp_cotton is False
    comp_wheat, _ = mandi_quality.are_commodities_comparable("Wheat", "Wheat Atta")
    assert comp_wheat is False
    comp_paddy, _ = mandi_quality.are_commodities_comparable("Paddy(Common)", "Rice")
    assert comp_paddy is False
    print("  ✓ PASS: Strict commodity separation enforced across all queries and comparison checks.")

    # -------------------------------------------------------------
    # TEST 4: State Name Normalization
    # -------------------------------------------------------------
    print(f"\n[TEST 4] State Name Normalization & Query Expansion:")
    # Check raw DB states are preserved
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT DISTINCT state FROM mandi_prices WHERE state IN ('Keralam', 'Chattisgarh', 'Pondicherry') ORDER BY state")
    preserved_raw_states = [r[0] for r in c.fetchall()]
    conn.close()
    print(f"  - Preserved raw database states: {preserved_raw_states}")
    assert "Keralam" in preserved_raw_states
    assert "Chattisgarh" in preserved_raw_states
    assert "Pondicherry" in preserved_raw_states

    # Check query expansion for Kerala
    kerala_query = db.get_mandi_prices(state="Kerala", limit=100)
    print(f"  - Filtering by state='Kerala' returned {kerala_query['total']} records (All with display_state='Kerala')")
    assert kerala_query["total"] >= 55, f"Expected at least 55 records for Kerala, got {kerala_query['total']}"
    for r in kerala_query["records"]:
        assert r["display_state"] == "Kerala"

    # Check query expansion for Chhattisgarh
    chhattisgarh_query = db.get_mandi_prices(state="Chhattisgarh", limit=100)
    print(f"  - Filtering by state='Chhattisgarh' returned {chhattisgarh_query['total']} records (All with display_state='Chhattisgarh')")
    assert chhattisgarh_query["total"] >= 45, f"Expected at least 45 records for Chhattisgarh, got {chhattisgarh_query['total']}"
    for r in chhattisgarh_query["records"]:
        assert r["display_state"] == "Chhattisgarh"

    # Check filter options deduplication
    filters = db.get_mandi_filter_options()
    assert "Kerala" in filters["states"]
    assert "Keralam" not in filters["states"], "Raw 'Keralam' should be normalized to 'Kerala' in presentation filters!"
    assert "Chhattisgarh" in filters["states"]
    assert "Chattisgarh" not in filters["states"], "Raw 'Chattisgarh' should be normalized to 'Chhattisgarh'!"
    assert "Puducherry" in filters["states"]
    assert "Pondicherry" not in filters["states"], "Raw 'Pondicherry' should be normalized to 'Puducherry'!"
    print(f"  - Filter options total unique normalized states: {len(filters['states'])}")
    print("  ✓ PASS: State normalization and query expansion verified.")

    # -------------------------------------------------------------
    # TEST 5: Comparison & Advisory Benchmark Safety
    # -------------------------------------------------------------
    print(f"\n[TEST 5] Comparison & Selling Advice Benchmark Safety:")
    
    # Punjab Tomato comparison (where Patti ₹0.01 exists)
    comp_punjab = db.get_mandi_price_comparison(commodity="Tomato", state="Punjab")
    print(f"  - Punjab Tomato Comparison:")
    print(f"    Markets analyzed (valid): {comp_punjab['markets_count']}")
    print(f"    Total markets: {comp_punjab['total_markets_count']}")
    print(f"    Suspicious records count: {comp_punjab['suspicious_count']}")
    print(f"    Highest modal price: ₹{comp_punjab['highest']['modal_price']} ({comp_punjab['highest']['market']})")
    print(f"    Lowest modal price: ₹{comp_punjab['lowest']['modal_price']} ({comp_punjab['lowest']['market']})")
    print(f"    Price difference: ₹{comp_punjab['price_difference']}")
    print(f"    Quality note: {comp_punjab['quality_note']}")

    assert comp_punjab["suspicious_count"] >= 1, "Patti APMC (₹0.01) must be counted in suspicious_count"
    assert comp_punjab["lowest"]["modal_price"] > 1.0, f"Lowest benchmark price should NOT be ₹0.01! Got {comp_punjab['lowest']['modal_price']}"
    assert comp_punjab["lowest"]["market"] != "Patti APMC", "Patti APMC must not be selected as lowest benchmark market!"

    # Best Market Recommendation for Punjab Tomato
    best_punjab = db.get_best_market_suggestion(commodity="Tomato", state="Punjab")
    print(f"  - Best Market Recommendation for Punjab Tomato:")
    print(f"    Recommended: {best_punjab['recommended_market']['market']} (₹{best_punjab['recommended_market']['modal_price']})")
    print(f"    Advantage: ₹{best_punjab['metrics']['advantage_amount']}")
    print(f"    Explanation: {best_punjab['explanation']}")
    assert best_punjab["recommended_market"]["modal_price"] > 1.0
    assert best_punjab["suspicious_count"] >= 1

    # Selling advice for Punjab Tomato when Patti APMC is explicitly selected
    advice_patti = db.get_basic_selling_advice(commodity="Tomato", state="Punjab", selected_market="Patti APMC")
    print(f"  - Selling Advice for Patti APMC (Anomalous market):")
    print(f"    Category: {advice_patti['advice_category']}")
    print(f"    Message: {advice_patti['advice_message']}")
    assert advice_patti["advice_category"] == "suspicious_market_data"

    # Selling advice for Punjab Tomato when a normal market is selected
    advice_normal = db.get_basic_selling_advice(commodity="Tomato", state="Punjab")
    print(f"  - Selling Advice for Default Punjab Market:")
    print(f"    Category: {advice_normal['advice_category']}")
    print(f"    Message: {advice_normal['advice_message']}")
    assert advice_normal["advice_category"] in ("competitive_price", "better_mandi_available", "limited_data")

    # Market Summary
    summary = db.get_mandi_market_summary()
    print(f"  - Market Summary:")
    print(f"    Total records: {summary['total_records']}")
    print(f"    Total states: {summary['total_states']}")
    print(f"    Overall avg modal price: ₹{summary['overall_avg_price']}")
    assert summary["overall_avg_price"] > 500, f"Average price should not be corrupted by ₹0.01 outliers! Got {summary['overall_avg_price']}"

    print("  ✓ PASS: Comparison, best market, and selling advice safeguards fully operational.")
    print("\n" + "=" * 70)
    print("ALL STAGE 3 DATA QUALITY SAFEGUARDS TESTS PASSED (5/5)!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
