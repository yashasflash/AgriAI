"""
AgriAI — Feature 5 Stage 5 Test Suite: Historical Data Accumulation & Monitoring
Verifies:
1. Database integrity & preservation of 2,595 existing records.
2. Time-series identification and separation by (commodity, variety, market, state, unit).
3. Date retention & idempotency logic.
4. Anomaly detection, suspicious price isolation, and economic validation.
5. Calendar gap calculation between observations.
6. Readiness depth classification (no_history, very_limited, developing, initial_trend_candidate, better_trend_candidate).
7. All 5 read-only history API endpoint handlers.
"""

import sys
import os
import unittest
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import db
import mandi_history
from mandi_quality import evaluate_price_quality
import app


class TestFeature5Stage5HistoricalSystem(unittest.TestCase):

    def test_01_database_records_preserved(self):
        """Verify exactly 2,595 records remain in the database (45 baseline, 2,550 live)."""
        conn = db.get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM mandi_prices")
            total = cursor.fetchone()[0]
            self.assertEqual(total, 2595, f"Expected 2,595 records, found {total}")

            cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_agmarknet_baseline'")
            baseline = cursor.fetchone()[0]
            self.assertEqual(baseline, 45, f"Expected 45 baseline records, found {baseline}")

            cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_live'")
            live = cursor.fetchone()[0]
            self.assertEqual(live, 2550, f"Expected 2,550 live records, found {live}")
        finally:
            conn.close()

    def test_02_readiness_classification_logic(self):
        """Verify readiness classification accurately maps distinct arrival dates to tiers."""
        self.assertEqual(mandi_history.classify_history_depth(0)["tier"], "no_history")
        self.assertFalse(mandi_history.classify_history_depth(0)["is_trend_ready"])
        self.assertFalse(mandi_history.classify_history_depth(0)["is_ml_ready"])

        for d in [1, 2, 3, 5, 6]:
            res = mandi_history.classify_history_depth(d)
            self.assertEqual(res["tier"], "very_limited")
            self.assertFalse(res["is_trend_ready"])
            self.assertFalse(res["is_ml_ready"])

        for d in [7, 10, 13]:
            res = mandi_history.classify_history_depth(d)
            self.assertEqual(res["tier"], "developing")
            self.assertFalse(res["is_trend_ready"])
            self.assertFalse(res["is_ml_ready"])

        for d in [14, 20, 29]:
            res = mandi_history.classify_history_depth(d)
            self.assertEqual(res["tier"], "initial_trend_candidate")
            self.assertTrue(res["is_trend_ready"])
            self.assertFalse(res["is_ml_ready"])

        for d in [30, 60, 180]:
            res = mandi_history.classify_history_depth(d)
            self.assertEqual(res["tier"], "better_trend_candidate")
            self.assertTrue(res["is_trend_ready"])
            self.assertFalse(res["is_ml_ready"])

    def test_03_calendar_days_gap_calculation(self):
        """Verify calculate_days_gap correctly computes calendar days between dates."""
        gap = mandi_history.calculate_days_gap("18/11/2026", "19/11/2026")
        self.assertEqual(gap, 1)

        gap_same = mandi_history.calculate_days_gap("19/11/2026", "19/11/2026")
        self.assertEqual(gap_same, 0)

        gap_multi = mandi_history.calculate_days_gap("01/11/2026", "19/11/2026")
        self.assertEqual(gap_multi, 18)

        gap_iso = mandi_history.calculate_days_gap("2026-11-01", "2026-11-19")
        self.assertEqual(gap_iso, 18)

    def test_04_date_retention_and_idempotency(self):
        """
        Verify that:
        - Re-saving an identical record for the same arrival date updates or ignores (no new row).
        - A distinct arrival date creates a new historical observation even with identical price.
        """
        conn = db.get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM mandi_prices")
            init_count = cursor.fetchone()[0]

            # Upsert mock observation for date 1
            test_rec_d1 = [{
                "state": "TestState",
                "district": "TestDistrict",
                "market": "TestMandi",
                "commodity": "TestCropX",
                "variety": "Common",
                "arrival_date": "01/12/2026",
                "min_price": 2000,
                "max_price": 2200,
                "modal_price": 2100,
                "unit": "Rs/Quintal"
            }]
            db.save_mandi_prices(test_rec_d1, source_type="official_live")

            cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE commodity = 'TestCropX'")
            self.assertEqual(cursor.fetchone()[0], 1)

            # Re-saving same date with same price should NOT add a new row (idempotent upsert)
            db.save_mandi_prices(test_rec_d1, source_type="official_live")
            cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE commodity = 'TestCropX'")
            self.assertEqual(cursor.fetchone()[0], 1)

            # Saving same crop/market/variety with DIFFERENT arrival date MUST create second observation
            test_rec_d2 = [{
                "state": "TestState",
                "district": "TestDistrict",
                "market": "TestMandi",
                "commodity": "TestCropX",
                "variety": "Common",
                "arrival_date": "02/12/2026",
                "min_price": 2000,
                "max_price": 2200,
                "modal_price": 2100,
                "unit": "Rs/Quintal"
            }]
            db.save_mandi_prices(test_rec_d2, source_type="official_live")
            cursor.execute("SELECT COUNT(*) FROM mandi_prices WHERE commodity = 'TestCropX'")
            self.assertEqual(cursor.fetchone()[0], 2)

            # Clean up the test records
            cursor.execute("DELETE FROM mandi_prices WHERE commodity = 'TestCropX'")
            conn.commit()

            cursor.execute("SELECT COUNT(*) FROM mandi_prices")
            final_count = cursor.fetchone()[0]
            self.assertEqual(final_count, init_count)
        finally:
            conn.close()

    def test_05_overall_history_status(self):
        """Verify mandi_history.get_overall_history_status() returns accurate statistics."""
        status = mandi_history.get_overall_history_status()
        self.assertEqual(status["total_records"], 2595)
        self.assertEqual(status["baseline_records"], 45)
        self.assertEqual(status["live_records"], 2550)
        self.assertEqual(status["distinct_dates_count"], 2)
        self.assertIn("18/11/2026", status["arrival_dates"])
        self.assertIn("19/11/2026", status["arrival_dates"])
        self.assertEqual(status["dataset_readiness"]["tier"], "very_limited")
        self.assertIn("insufficient for time-series forecasting", status["readiness_warning"].lower())
        self.assertEqual(status["suspicious_records"], 8)
        self.assertEqual(status["valid_records"], 2587)
        self.assertGreater(status["unique_series_count"], 1000)

    def test_06_commodity_coverage_summary(self):
        """Verify mandi_history.get_commodity_history_summary() groups properly and isolates varieties."""
        commodities = mandi_history.get_commodity_history_summary()
        self.assertGreater(len(commodities), 10)

        # Check Tomato
        tomato_groups = [c for c in commodities if c["commodity"].lower() == "tomato"]
        self.assertTrue(len(tomato_groups) > 0)
        total_tomato_obs = sum(c["total_observations"] for c in tomato_groups)
        self.assertEqual(total_tomato_obs, 539)

        # Verify Onion and Onion Green are strictly separate
        onion_groups = [c for c in commodities if c["commodity"].lower() == "onion"]
        onion_green_groups = [c for c in commodities if c["commodity"].lower() == "onion green"]
        self.assertTrue(len(onion_groups) > 0)
        self.assertTrue(len(onion_green_groups) > 0)
        self.assertNotEqual(onion_groups[0]["commodity"], onion_green_groups[0]["commodity"])

    def test_07_market_coverage_summary(self):
        """Verify mandi_history.get_market_history_summary() pagination, search, and staleness."""
        res = mandi_history.get_market_history_summary(page=1, limit=10)
        self.assertIn("total_markets", res)
        self.assertGreater(res["total_markets"], 1000)
        self.assertEqual(len(res["markets"]), 10)
        self.assertEqual(res["page"], 1)

        # Search test
        search_res = mandi_history.get_market_history_summary(search="Rania")
        self.assertGreater(search_res["total_markets"], 0)
        self.assertTrue(any("rania" in m["market"].lower() for m in search_res["markets"]))

    def test_08_series_history_retrieval(self):
        """Verify mandi_history.get_series_history() retrieves chronological observations with gaps."""
        # Query Wheat series across all markets
        series = mandi_history.get_series_history("Wheat", page=1, limit=50)
        self.assertIn("series_info", series)
        self.assertIn("summary", series)
        self.assertIn("observations", series)
        self.assertEqual(series["summary"]["total_observations"], 456)
        self.assertEqual(series["summary"]["distinct_dates_count"], 2)
        self.assertEqual(series["summary"]["readiness_classification"]["tier"], "very_limited")

        # Check date filtering
        filtered = mandi_history.get_series_history("Wheat", start_date="19/11/2026", end_date="19/11/2026")
        self.assertEqual(filtered["summary"]["distinct_dates_count"], 1)
        for obs in filtered["observations"]:
            self.assertEqual(obs["arrival_date"], "19/11/2026")

    def test_09_quality_audit(self):
        """Verify get_history_quality_audit detects known anomalous records and explains them."""
        audit = mandi_history.get_history_quality_audit()
        self.assertEqual(audit["total_observations_audited"], 2595)
        self.assertEqual(audit["suspicious_observations_count"], 8)
        self.assertEqual(audit["valid_observations"], 2587)

        # Verify Patti and Rania anomalies are flagged
        flagged_markets = [r["market"].lower() for r in audit["suspicious_records"]]
        self.assertTrue(any("patti" in m for m in flagged_markets))
        self.assertTrue(any("rania" in m for m in flagged_markets))

        # Verify all flagged records have explanations
        for r in audit["suspicious_records"]:
            self.assertTrue(r["is_suspicious"])
            self.assertIsNotNone(r["suspicious_reason"])
            self.assertIn(r["severity"], ("high", "critical", "low"))

    def test_10_api_endpoint_mandi_history_status(self):
        """Verify GET /mandi/history/status endpoint function."""
        resp = app.get_mandi_history_status_endpoint()
        self.assertEqual(resp["status"], "success")
        self.assertIn("history_status", resp)
        status = resp["history_status"]
        self.assertEqual(status["total_records"], 2595)
        self.assertEqual(status["dataset_readiness"]["tier"], "very_limited")
        self.assertIn("tier_distribution", status)
        self.assertIn("readiness_warning", status)

    def test_11_api_endpoint_mandi_history_commodities(self):
        """Verify GET /mandi/history/commodities endpoint function."""
        resp = app.get_mandi_history_commodities_endpoint()
        self.assertEqual(resp["status"], "success")
        self.assertIn("commodities", resp)
        self.assertGreater(resp["count"], 0)

    def test_12_api_endpoint_mandi_history_markets(self):
        """Verify GET /mandi/history/markets endpoint function."""
        resp = app.get_mandi_history_markets_endpoint(page=1, limit=10)
        self.assertEqual(resp["status"], "success")
        self.assertIn("markets", resp)
        self.assertEqual(len(resp["markets"]), 10)

    def test_13_api_endpoint_mandi_history_series(self):
        """Verify GET /mandi/history/series endpoint function."""
        resp = app.get_mandi_history_series_endpoint(commodity="Tomato", page=1, limit=10)
        self.assertEqual(resp["status"], "success")
        self.assertIn("summary", resp)
        self.assertIn("observations", resp)
        self.assertEqual(len(resp["observations"]), 10)

    def test_14_api_endpoint_mandi_history_quality(self):
        """Verify GET /mandi/history/quality endpoint function."""
        resp = app.get_mandi_history_quality_endpoint()
        self.assertEqual(resp["status"], "success")
        self.assertIn("suspicious_records", resp)
        self.assertEqual(resp["suspicious_observations_count"], 8)
        self.assertEqual(resp["total_observations_audited"], 2595)


if __name__ == "__main__":
    unittest.main()
