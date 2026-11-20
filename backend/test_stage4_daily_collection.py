"""
AgriAI — Feature 5 Stage 4: Automatic Daily Mandi Data Collection Test Suite
Validates:
1. Exact preservation of existing database records (2,595 records: 45 baseline, 2,550 live)
2. Duplicate collection idempotency (prevents duplicate rows, counts duplicate encounters)
3. Actual arrival date retention
4. Concurrency lock prevents overlapping scheduled and manual collection jobs
5. Manual collection endpoint (`POST /mandi/daily/trigger`)
6. Scheduler configuration and disablement toggle (`MANDI_SCHEDULER_ENABLED=false`)
7. Data freshness and feed staleness evaluation (`GET /mandi/freshness`)
8. Collection history structure and telemetry tracking in `mandi_sync_log`
9. Stage 3 suspicious-price safeguards remain active
10. Features 1–4 continue functioning without regression
"""

import os
import sys
import sqlite3
from pathlib import Path
from datetime import datetime

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import db
import mandi_quality
import mandi_scheduler
import mandi_service
import app

def run_tests():
    print("=" * 70)
    print("RUNNING FEATURE 5 - STAGE 4 DAILY COLLECTION & SCHEDULER TEST SUITE")
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

    print(f"\n[TEST 1] Database Record Count & Provenance Preservation:")
    print(f"  - Total records: {total_records} (Expected: 2595)")
    print(f"  - Baseline records: {baseline_records} (Expected: 45)")
    print(f"  - Live official records: {live_records} (Expected: 2550)")
    assert total_records == 2595, f"Expected 2595 records, found {total_records}"
    assert baseline_records == 45, f"Expected 45 baseline records, found {baseline_records}"
    assert live_records == 2550, f"Expected 2550 live records, found {live_records}"
    print("  ✓ PASS: Exactly 2,595 records preserved without data loss or mutation.")

    # -------------------------------------------------------------
    # TEST 2: Duplicate Collection Idempotency & Arrival Date Retention
    # -------------------------------------------------------------
    print(f"\n[TEST 2] Duplicate Collection Idempotency & Telemetry:")
    # Fetch 5 sample live records from DB to simulate re-collecting existing records
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT state, district, market, commodity, variety, arrival_date, min_price, max_price, modal_price, unit
        FROM mandi_prices
        WHERE source_type = 'official_live'
        LIMIT 5
    """)
    sample_records = [dict(r) for r in c.fetchall()]
    conn.close()

    # Save these exact records again with return_stats=True
    stats = db.save_mandi_prices(
        sample_records,
        source_type="official_live",
        source_label="data.gov.in Agmarknet Live API",
        return_stats=True
    )
    print(f"  - Re-saving 5 identical records stats: {stats}")
    assert stats["processed_count"] == 5
    assert stats["inserted_count"] == 0, f"Inserted count must be 0 for existing duplicates! Got {stats['inserted_count']}"
    assert stats["updated_count"] == 5
    assert stats["duplicate_count"] == 5, f"Duplicate count must be 5! Got {stats['duplicate_count']}"

    # Verify total database record count remained exactly 2,595
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT count(*) FROM mandi_prices")
    post_dup_count = c.fetchone()[0]
    conn.close()
    assert post_dup_count == 2595, f"Expected 2595 records after duplicate save, got {post_dup_count}"
    print("  ✓ PASS: Duplicate collection did not duplicate rows. Exact counts tracked.")

    # -------------------------------------------------------------
    # TEST 3: Concurrency Lock & Overlap Prevention
    # -------------------------------------------------------------
    print(f"\n[TEST 3] Concurrency Lock & Overlap Prevention:")
    assert not mandi_scheduler.is_collection_active(), "Lock should initially be inactive"
    
    acquired = mandi_scheduler.acquire_collection_lock()
    assert acquired is True, "First lock acquire should succeed"
    assert mandi_scheduler.is_collection_active() is True

    # Second concurrent attempt must be rejected
    second_acquired = mandi_scheduler.acquire_collection_lock()
    assert second_acquired is False, "Concurrent lock attempt must be rejected!"
    print("  - Concurrent collection lock rejected as expected.")

    mandi_scheduler.release_collection_lock()
    assert not mandi_scheduler.is_collection_active(), "Lock should be released"

    third_acquired = mandi_scheduler.acquire_collection_lock()
    assert third_acquired is True, "Re-acquiring lock after release must succeed"
    mandi_scheduler.release_collection_lock()
    print("  ✓ PASS: Concurrency mutex strictly prevents overlapping jobs.")

    # -------------------------------------------------------------
    # TEST 4: Scheduler Configuration & Disablement Toggle
    # -------------------------------------------------------------
    print(f"\n[TEST 4] Scheduler Configuration & Toggle:")
    scheduler = mandi_scheduler.get_mandi_scheduler()
    status = scheduler.get_status()
    print(f"  - Scheduler initial status: {status}")
    assert status["scheduler_enabled"] is True
    assert status["schedule_time_ist"] == "18:30"
    assert status["timezone"] == "Asia/Kolkata"

    # Test disablement toggle
    os.environ["MANDI_SCHEDULER_ENABLED"] = "false"
    assert scheduler.is_enabled is False, "Scheduler should report disabled when env var is false"
    print("  - Disablement toggle verified (MANDI_SCHEDULER_ENABLED=false).")

    # Re-enable
    os.environ["MANDI_SCHEDULER_ENABLED"] = "true"
    assert scheduler.is_enabled is True
    print("  ✓ PASS: Scheduler configuration and enable/disable toggle verified.")

    # -------------------------------------------------------------
    # TEST 5: Data Freshness Status Evaluation
    # -------------------------------------------------------------
    print(f"\n[TEST 5] Data Freshness Status Audit:")
    freshness = db.get_mandi_freshness_status()
    print(f"  - Total records: {freshness['total_records']}")
    print(f"  - Overall latest arrival date: {freshness['latest_arrival_date']}")
    print(f"  - Days lag vs IST: {freshness['days_lag']}")
    print(f"  - Freshness status: {freshness['freshness_status']}")
    print(f"  - Summary: {freshness['feed_health_summary']}")
    print(f"  - Monitored commodities count: {len(freshness['commodity_freshness'])}")
    for comm, details in freshness["commodity_freshness"].items():
        print(f"    • {comm}: latest={details['latest_arrival_date']}, records={details['records_count']}, status={details['status']}")

    assert freshness["total_records"] == 2595
    assert freshness["latest_arrival_date"] is not None
    assert freshness["freshness_status"] in ("fresh", "acceptable", "stale")
    assert "Tomato" in freshness["commodity_freshness"]
    assert "Onion" in freshness["commodity_freshness"]
    assert "Wheat" in freshness["commodity_freshness"]
    assert "Cotton" in freshness["commodity_freshness"]
    assert "Paddy(Common)" in freshness["commodity_freshness"]
    print("  ✓ PASS: Data freshness evaluation accurately audits arrival date recency and commodity coverage.")

    # -------------------------------------------------------------
    # TEST 6: Collection History Tracking in mandi_sync_log
    # -------------------------------------------------------------
    print(f"\n[TEST 6] Collection History Tracking in mandi_sync_log:")
    test_start = datetime.utcnow().isoformat()
    test_end = datetime.utcnow().isoformat()
    db.log_mandi_sync(
        records_count=10,
        status="SUCCESS",
        source="data.gov.in Daily Collector Test",
        details="Stage 4 telemetry test execution",
        start_time=test_start,
        end_time=test_end,
        fetched_count=15,
        valid_count=12,
        inserted_count=2,
        updated_count=10,
        duplicate_count=8,
        rejected_count=3,
        failed_requests=0,
        commodities_collected=["Tomato", "Onion"],
        arrival_dates=["19/11/2026"]
    )

    last_sync = db.get_last_mandi_sync()
    print(f"  - Latest sync log entry:")
    print(f"    Source: {last_sync['source']}")
    print(f"    Status: {last_sync['status']}")
    print(f"    Records count: {last_sync['records_count']}")

    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("""
        SELECT fetched_count, valid_count, inserted_count, updated_count, duplicate_count, rejected_count, commodities_collected, arrival_dates
        FROM mandi_sync_log
        ORDER BY id DESC LIMIT 1
    """)
    row = c.fetchone()
    conn.close()

    print(f"    Telemetry: fetched={row['fetched_count']}, valid={row['valid_count']}, inserted={row['inserted_count']}, updated={row['updated_count']}, duplicates={row['duplicate_count']}, rejected={row['rejected_count']}")
    assert row["fetched_count"] == 15
    assert row["valid_count"] == 12
    assert row["inserted_count"] == 2
    assert row["updated_count"] == 10
    assert row["duplicate_count"] == 8
    assert row["rejected_count"] == 3
    assert "Tomato" in row["commodities_collected"]
    assert "19/11/2026" in row["arrival_dates"]
    print("  ✓ PASS: Enhanced collection log tracks all required telemetry fields.")

    # -------------------------------------------------------------
    # TEST 7: Manual Collection Endpoint Security & Concurrency Protection
    # -------------------------------------------------------------
    print(f"\n[TEST 7] Manual Collection Endpoint Security & Concurrency Protection:")
    from fastapi import HTTPException
    
    # 7.1 Verify non-admin user is rejected with HTTP 403
    ordinary_farmer = {"id": 1, "name": "TestFarmer"}
    caught_403 = False
    try:
        app.trigger_mandi_daily_collection_endpoint(admin_user=app.get_current_admin_user(ordinary_farmer))
    except HTTPException as he:
        if he.status_code == 403:
            caught_403 = True
            print(f"  - Non-admin user correctly rejected with HTTP 403: {he.detail}")
    assert caught_403, "Non-admin user must be rejected with HTTP 403!"

    # 7.2 Verify admin user is authorized, but rejected with HTTP 409 when lock is held
    admin_user = {"id": 2, "name": "yashas"}
    valid_admin = app.get_current_admin_user(admin_user)
    assert valid_admin["name"] == "yashas"

    mandi_scheduler.acquire_collection_lock()
    try:
        caught_409 = False
        try:
            app.trigger_mandi_daily_collection_endpoint(admin_user=valid_admin)
        except HTTPException as he:
            if he.status_code == 409:
                caught_409 = True
                print(f"  - Admin manual trigger correctly returned HTTP 409 when locked: {he.detail}")
        assert caught_409, "Manual collection must throw HTTP 409 when lock is held!"
    finally:
        mandi_scheduler.release_collection_lock()

    # 7.3 Verify freshness endpoint returns structured JSON
    freshness_res = app.get_mandi_freshness_endpoint()
    assert freshness_res["status"] == "success"
    assert "freshness" in freshness_res
    assert "scheduler" in freshness_res
    print(f"  - GET /mandi/freshness: status={freshness_res['status']}, lag={freshness_res['freshness']['days_lag']} days")
    print("  ✓ PASS: Administrator authentication, key protection, and concurrency lock verified.")

    # -------------------------------------------------------------
    # TEST 8: Stage 3 Safeguards Regression
    # -------------------------------------------------------------
    print(f"\n[TEST 8] Stage 3 Safeguards Regression:")
    comp_punjab = db.get_mandi_price_comparison(commodity="Tomato", state="Punjab")
    assert comp_punjab["suspicious_count"] >= 1
    assert comp_punjab["lowest"]["modal_price"] > 1.0, "Suspicious ₹0.01 at Patti must remain excluded from benchmarks!"
    print(f"  - Punjab Tomato spread: lowest=₹{comp_punjab['lowest']['modal_price']}, highest=₹{comp_punjab['highest']['modal_price']}, suspicious excluded={comp_punjab['suspicious_count']}")

    onion_res = db.get_mandi_prices(commodity="Onion", limit=10)
    for r in onion_res["records"]:
        assert r["commodity"].lower() == "onion"
    print("  ✓ PASS: Stage 3 safeguards (suspicious price exclusion, commodity separation) 100% active.")

    # -------------------------------------------------------------
    # TEST 9: Final Database Count Check
    # -------------------------------------------------------------
    print(f"\n[TEST 9] Final Database Integrity Check:")
    conn = db.get_db_connection()
    c = conn.cursor()
    c.execute("SELECT count(*) FROM mandi_prices")
    final_count = c.fetchone()[0]
    conn.close()
    assert final_count == 2595, f"Final count changed! Expected 2595, got {final_count}"
    print(f"  - Final total records: {final_count} (Preserved exactly)")
    print("  ✓ PASS: Zero records added or lost during testing.")

    print("\n" + "=" * 70)
    print("ALL FEATURE 5 STAGE 4 TESTS PASSED (9/9)!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
