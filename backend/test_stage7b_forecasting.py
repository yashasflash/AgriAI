"""
AgriAI — Stage 7B Forecasting Infrastructure & Readiness Gate Test Suite
Tests:
1. Time-series identity isolation (commodity + variety + market + state + unit)
2. Chronological sorting
3. Suspicious price exclusion using Stage 3 safeguards
4. Provenance handling (baseline vs live)
5. Readiness tier classification (all 5 tiers)
6. Chronological train/test split
7. No future data leakage verification
8. Naive baseline walk-forward calculations
9. MAE, RMSE, and MAPE exact numerical calculations
10. Insufficient data handling
11. API endpoints contract validation
12. Production database record preservation (2,595 records untouched)

STRICT RULE: Isolated in-memory/mock structures used for unit testing.
Zero synthetic records inserted into the production database.
"""

import unittest
import sqlite3
import os
import sys
from datetime import datetime

# Ensure backend directory is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

import db
import mandi_forecasting
from app import (
    get_mandi_forecast_readiness_endpoint,
    get_mandi_forecast_series_endpoint,
    get_mandi_forecast_baseline_endpoint
)


class TestStage7BForecastingInfrastructure(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Record production database counts before test execution."""
        conn = db.get_db_connection()
        c = conn.cursor()
        cls.initial_total = c.execute("SELECT COUNT(*) FROM mandi_prices").fetchone()[0]
        cls.initial_baseline = c.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_agmarknet_baseline'").fetchone()[0]
        cls.initial_live = c.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_live'").fetchone()[0]
        conn.close()

    # -------------------------------------------------------------
    # 1. TIME-SERIES IDENTITY ISOLATION
    # -------------------------------------------------------------
    def test_01_time_series_identity_isolation(self):
        """Verify strict time-series identity: commodity + variety + market + state + unit."""
        ds = mandi_forecasting.prepare_forecasting_dataset(
            commodity="Tomato",
            market="Kolar (APMC)",
            state="Karnataka",
            variety="Special Local Red",
            unit="Rs/Quintal"
        )
        self.assertEqual(ds["status"], "ready")
        ident = ds["time_series_identity"]
        self.assertEqual(ident["commodity"], "Tomato")
        self.assertEqual(ident["market"], "Kolar (APMC)")
        self.assertEqual(ident["state"], "Karnataka")
        self.assertEqual(ident["variety"], "Special Local Red")
        self.assertEqual(ident["unit"], "Rs/Quintal")

    # -------------------------------------------------------------
    # 2. CHRONOLOGICAL SORTING
    # -------------------------------------------------------------
    def test_02_chronological_sorting(self):
        """Verify observations are sorted strictly chronologically by parsed date."""
        mock_raw = [
            {"id": 1, "arrival_date": "20/11/2026", "modal_price": 2200.0, "min_price": 2000.0, "max_price": 2300.0, "source_type": "official_live", "source_label": "Live"},
            {"id": 2, "arrival_date": "15/11/2026", "modal_price": 2100.0, "min_price": 1900.0, "max_price": 2200.0, "source_type": "official_live", "source_label": "Live"},
            {"id": 3, "arrival_date": "18/11/2026", "modal_price": 2150.0, "min_price": 1950.0, "max_price": 2250.0, "source_type": "official_live", "source_label": "Live"},
            {"id": 4, "arrival_date": "10/11/2026", "modal_price": 2050.0, "min_price": 1850.0, "max_price": 2150.0, "source_type": "official_live", "source_label": "Live"},
        ]
        
        # Test split and ordering logic
        sorted_obs = sorted(mock_raw, key=lambda x: mandi_forecasting.parse_arrival_date(x["arrival_date"]))
        self.assertEqual(sorted_obs[0]["arrival_date"], "10/11/2026")
        self.assertEqual(sorted_obs[1]["arrival_date"], "15/11/2026")
        self.assertEqual(sorted_obs[2]["arrival_date"], "18/11/2026")
        self.assertEqual(sorted_obs[3]["arrival_date"], "20/11/2026")

    # -------------------------------------------------------------
    # 3. SUSPICIOUS PRICE EXCLUSION USING STAGE 3 SAFEGUARDS
    # -------------------------------------------------------------
    def test_03_suspicious_price_exclusion(self):
        """Verify anomalous prices (e.g. Patti APMC ₹0.01) are quarantined into excluded_observations."""
        ds = mandi_forecasting.prepare_forecasting_dataset(
            commodity="Tomato",
            market="Patti APMC",
            state="Punjab"
        )
        self.assertEqual(ds["valid_observations_count"], 0)
        self.assertEqual(ds["excluded_observations_count"], 1)
        self.assertEqual(len(ds["excluded_observations"]), 1)
        excluded = ds["excluded_observations"][0]
        self.assertEqual(excluded["modal_price"], 0.01)
        self.assertIn("below the viable wholesale threshold", excluded["exclusion_reason"])

    # -------------------------------------------------------------
    # 4. PROVENANCE HANDLING
    # -------------------------------------------------------------
    def test_04_provenance_handling(self):
        """Verify official_live vs official_agmarknet_baseline provenance tracking."""
        # Query a baseline market
        ds_baseline = mandi_forecasting.prepare_forecasting_dataset(
            commodity="Tomato",
            market="Yeshwanthpur (APMC)",
            state="Karnataka"
        )
        self.assertEqual(ds_baseline["provenance"]["official_baseline_records"], 1)
        self.assertEqual(ds_baseline["provenance"]["official_live_records"], 0)
        self.assertTrue(ds_baseline["valid_observations"][0]["is_baseline"])

        # Query a live market
        ds_live = mandi_forecasting.prepare_forecasting_dataset(
            commodity="Tomato",
            market="Baripada APMC",
            state="Odisha"
        )
        self.assertEqual(ds_live["provenance"]["official_live_records"], 1)
        self.assertEqual(ds_live["provenance"]["official_baseline_records"], 0)
        self.assertFalse(ds_live["valid_observations"][0]["is_baseline"])

    # -------------------------------------------------------------
    # 5. READINESS TIER CLASSIFICATION
    # -------------------------------------------------------------
    def test_05_readiness_classification_tiers(self):
        """Verify proper classification into all 5 engineering tiers."""
        t1 = mandi_forecasting.classify_forecasting_readiness(0, 0)
        self.assertEqual(t1["tier"], "not_ready")
        self.assertFalse(t1["is_evaluation_allowed"])
        self.assertFalse(t1["is_ml_training_allowed"])

        t2 = mandi_forecasting.classify_forecasting_readiness(6, 6)
        self.assertEqual(t2["tier"], "not_ready")

        t3 = mandi_forecasting.classify_forecasting_readiness(7, 7)
        self.assertEqual(t3["tier"], "very_limited")
        self.assertFalse(t3["is_evaluation_allowed"])

        t4 = mandi_forecasting.classify_forecasting_readiness(14, 14)
        self.assertEqual(t4["tier"], "developing")
        self.assertTrue(t4["is_evaluation_allowed"])

        t5 = mandi_forecasting.classify_forecasting_readiness(30, 30)
        self.assertEqual(t5["tier"], "candidate_for_evaluation")
        self.assertTrue(t5["is_evaluation_allowed"])

        t6 = mandi_forecasting.classify_forecasting_readiness(60, 60)
        self.assertEqual(t6["tier"], "stronger_candidate")
        self.assertTrue(t6["is_evaluation_allowed"])

    # -------------------------------------------------------------
    # 6. CHRONOLOGICAL TRAIN/TEST SPLIT
    # -------------------------------------------------------------
    def test_06_chronological_train_test_split(self):
        """Verify chronological splitting puts earlier observations into train and later into test."""
        # 20 chronological observations
        mock_series = [
            {"arrival_date": f"{day:02d}/11/2026", "modal_price": 2000.0 + day * 10}
            for day in range(1, 21)
        ]
        split_result = mandi_forecasting.chronological_train_test_split(
            observations=mock_series,
            test_ratio=0.2,
            min_train_size=14
        )
        self.assertEqual(split_result["status"], "success")
        self.assertEqual(split_result["total_observations"], 20)
        self.assertEqual(split_result["train_count"], 16)
        self.assertEqual(split_result["test_count"], 4)
        
        # Train earliest and latest
        self.assertEqual(split_result["train_earliest_date"], "01/11/2026")
        self.assertEqual(split_result["train_latest_date"], "16/11/2026")
        
        # Test earliest and latest
        self.assertEqual(split_result["test_earliest_date"], "17/11/2026")
        self.assertEqual(split_result["test_latest_date"], "20/11/2026")

    # -------------------------------------------------------------
    # 7. NO FUTURE DATA LEAKAGE VERIFICATION
    # -------------------------------------------------------------
    def test_07_no_future_data_leakage(self):
        """Verify that max(date_train) strictly precedes min(date_test)."""
        mock_series = [
            {"arrival_date": f"{day:02d}/11/2026", "modal_price": 2000.0 + day * 10}
            for day in range(1, 16)
        ]
        split_result = mandi_forecasting.chronological_train_test_split(
            observations=mock_series,
            test_ratio=0.2,
            min_train_size=12
        )
        self.assertTrue(split_result["leakage_check_passed"])
        train_max = mandi_forecasting.parse_arrival_date(split_result["train_latest_date"])
        test_min = mandi_forecasting.parse_arrival_date(split_result["test_earliest_date"])
        self.assertLess(train_max, test_min)

    # -------------------------------------------------------------
    # 8. NAIVE BASELINE CALCULATIONS
    # -------------------------------------------------------------
    def test_08_naive_baseline_walk_forward(self):
        """Verify naive baseline definition y_hat_{t} = y_{t-1} across walk-forward steps."""
        mock_series = [
            {"arrival_date": "01/11/2026", "modal_price": 2000.0},
            {"arrival_date": "02/11/2026", "modal_price": 2100.0},
            {"arrival_date": "03/11/2026", "modal_price": 2050.0},
            {"arrival_date": "04/11/2026", "modal_price": 2200.0},
        ]
        eval_result = mandi_forecasting.evaluate_naive_baseline(mock_series)
        self.assertEqual(eval_result["status"], "evaluated")
        self.assertEqual(eval_result["evaluated_predictions_count"], 3)
        preds = eval_result["predictions"]
        
        # Step 1: pred = 2000, actual = 2100
        self.assertEqual(preds[0]["predicted_price"], 2000.0)
        self.assertEqual(preds[0]["actual_price"], 2100.0)
        self.assertEqual(preds[0]["residual"], 100.0)
        
        # Step 2: pred = 2100, actual = 2050
        self.assertEqual(preds[1]["predicted_price"], 2100.0)
        self.assertEqual(preds[1]["actual_price"], 2050.0)
        self.assertEqual(preds[1]["residual"], -50.0)
        
        # Step 3: pred = 2050, actual = 2200
        self.assertEqual(preds[2]["predicted_price"], 2050.0)
        self.assertEqual(preds[2]["actual_price"], 2200.0)
        self.assertEqual(preds[2]["residual"], 150.0)

    # -------------------------------------------------------------
    # 9. MAE, RMSE, AND MAPE EXACT NUMERICAL CALCULATIONS
    # -------------------------------------------------------------
    def test_09_mae_rmse_mape_calculations(self):
        """Verify mathematical precision of MAE, RMSE, and MAPE."""
        # Errors: |100|, |-50|, |150| -> MAE = (100 + 50 + 150) / 3 = 100.0
        # Squared errors: 10000 + 2500 + 22500 = 35000 / 3 = 11666.67 -> RMSE = 108.01
        # Percent errors: (100/2100=4.76%) + (50/2050=2.44%) + (150/2200=6.82%) -> MAPE = (4.76+2.44+6.82)/3 = 4.67%
        mock_series = [
            {"arrival_date": "01/11/2026", "modal_price": 2000.0},
            {"arrival_date": "02/11/2026", "modal_price": 2100.0},
            {"arrival_date": "03/11/2026", "modal_price": 2050.0},
            {"arrival_date": "04/11/2026", "modal_price": 2200.0},
        ]
        eval_result = mandi_forecasting.evaluate_naive_baseline(mock_series)
        metrics = eval_result["metrics"]
        self.assertEqual(metrics["mae"], 100.0)
        self.assertEqual(metrics["rmse"], 108.01)
        self.assertEqual(metrics["mape"], 4.67)

    # -------------------------------------------------------------
    # 10. INSUFFICIENT DATA HANDLING
    # -------------------------------------------------------------
    def test_10_insufficient_data_handling(self):
        """Verify insufficient data status when observations < 2 for naive or < 15 for split."""
        # 1 observation cannot evaluate naive baseline
        single_obs = [{"arrival_date": "19/11/2026", "modal_price": 2100.0}]
        res_baseline = mandi_forecasting.evaluate_naive_baseline(single_obs)
        self.assertEqual(res_baseline["status"], "insufficient_data")
        self.assertIsNone(res_baseline["metrics"])
        self.assertIn("requires at least 2 consecutive chronological observations", res_baseline["message"])

        # Split on 5 observations fails minimum training requirements
        few_obs = [{"arrival_date": f"{d:02d}/11/2026", "modal_price": 2000.0} for d in range(1, 6)]
        res_split = mandi_forecasting.chronological_train_test_split(few_obs, min_train_size=14)
        self.assertEqual(res_split["status"], "insufficient_data")
        self.assertIn("minimum of 15 observations", res_split["message"])

    # -------------------------------------------------------------
    # 11. API ENDPOINTS CONTRACT VALIDATION
    # -------------------------------------------------------------
    def test_11_api_endpoints_contracts(self):
        """Verify responses from all three new FastAPI endpoints."""
        # 1. Readiness endpoint
        r1 = get_mandi_forecast_readiness_endpoint()
        self.assertEqual(r1["status"], "success")
        self.assertIn("forecast_readiness", r1)
        fr = r1["forecast_readiness"]
        self.assertEqual(fr["total_eligible_time_series"], 2595)
        self.assertEqual(fr["readiness_distribution"]["not_ready"]["count"], 2595)
        self.assertFalse(fr["is_ml_training_permitted"])
        self.assertEqual(len(fr["priority_benchmark_mandis"]), 10)

        # 2. Series endpoint
        r2 = get_mandi_forecast_series_endpoint(commodity="Tomato", market="Kolar (APMC)")
        self.assertEqual(r2["status"], "success")
        self.assertIn("forecast_series", r2)
        fs = r2["forecast_series"]
        self.assertEqual(fs["valid_observations_count"], 1)
        self.assertEqual(fs["readiness"]["tier"], "not_ready")

        # 3. Baseline endpoint
        r3 = get_mandi_forecast_baseline_endpoint(commodity="Tomato", market="Kolar (APMC)")
        self.assertEqual(r3["status"], "success")
        self.assertIn("naive_baseline", r3)
        self.assertEqual(r3["naive_baseline"]["status"], "insufficient_data")

    # -------------------------------------------------------------
    # 12. DATABASE RECORD PRESERVATION
    # -------------------------------------------------------------
    def test_12_database_record_preservation(self):
        """Verify production database records are 100% preserved before and after testing."""
        conn = db.get_db_connection()
        c = conn.cursor()
        final_total = c.execute("SELECT COUNT(*) FROM mandi_prices").fetchone()[0]
        final_baseline = c.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_agmarknet_baseline'").fetchone()[0]
        final_live = c.execute("SELECT COUNT(*) FROM mandi_prices WHERE source_type = 'official_live'").fetchone()[0]
        conn.close()

        self.assertEqual(final_total, self.initial_total)
        self.assertEqual(final_total, 2595)
        self.assertEqual(final_baseline, 45)
        self.assertEqual(final_live, 2550)


if __name__ == "__main__":
    unittest.main()
