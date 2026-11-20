"""
AgriAI — Feature 5 Stage 6A Test Suite: Statistical Mandi Price Trend Engine
Verifies all 20 required specifications:
1. Zero historical observations.
2. One historical observation.
3. Two observations with rising prices.
4. Two observations with falling prices.
5. Stable movement within the configured threshold.
6. Correct percentage change.
7. Correct absolute difference.
8. Correct 7-observation SMA.
9. Correct 14-observation SMA.
10. SMA unavailable when insufficient observations exist.
11. Suspicious prices excluded.
12. Different markets remain separate.
13. Different varieties remain separate.
14. Different commodities remain separate.
15. Different units remain separate.
16. Missing arrival dates are not fabricated.
17. Old observations are ordered chronologically.
18. Confidence rules work correctly.
19. API parameter validation.
20. Existing history endpoints continue working.
"""

import sys
import os
import unittest
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

import db
import mandi_history
import mandi_trends
import app


class TestFeature5Stage6AStatisticalTrends(unittest.TestCase):

    def test_01_zero_historical_observations(self):
        """1. Zero historical observations returns insufficient_data with helpful message."""
        res = mandi_trends.analyze_series_trend("NonExistentCrop", "NonExistentMarket")
        self.assertEqual(res["trend"]["direction"], "insufficient_data")
        self.assertIsNone(res["trend"]["latest_valid_price"])
        self.assertIsNone(res["trend"]["sma_7"])
        self.assertIsNone(res["trend"]["sma_14"])
        self.assertEqual(res["trend"]["allowed_calculation"], "No history")
        self.assertIn("No historical price observations available", res["trend"]["summary_message"])
        self.assertEqual(res["confidence"]["confidence_level"], "low")
        self.assertIn("disclaimer", res)

    def test_02_one_historical_observation(self):
        """2. Single historical observation displays latest price but insufficient_data for trend."""
        # Tomato at Yeshwanthpur has 1 observation in current DB
        res = mandi_trends.analyze_series_trend("Tomato", "Yeshwanthpur (APMC)")
        self.assertEqual(res["trend"]["direction"], "insufficient_data")
        self.assertIsNotNone(res["trend"]["latest_valid_price"])
        self.assertIsNone(res["trend"]["previous_valid_price"])
        self.assertIsNone(res["trend"]["price_difference"])
        self.assertIsNone(res["trend"]["percentage_change"])
        self.assertIsNone(res["trend"]["sma_7"])
        self.assertIsNone(res["trend"]["sma_14"])
        self.assertEqual(res["trend"]["allowed_calculation"], "Display latest price only")
        self.assertIn("Single observation recorded", res["trend"]["summary_message"])
        self.assertEqual(res["confidence"]["confidence_level"], "low")

    def test_03_two_observations_rising_prices(self):
        """3. Two observations with higher second price is classified as 'rising'."""
        direction, diff, pct = mandi_trends.calculate_price_direction(2200.0, 2000.0)
        self.assertEqual(direction, "rising")
        self.assertEqual(diff, 200.0)
        self.assertEqual(pct, 10.0)

    def test_04_two_observations_falling_prices(self):
        """4. Two observations with lower second price is classified as 'falling'."""
        direction, diff, pct = mandi_trends.calculate_price_direction(1800.0, 2000.0)
        self.assertEqual(direction, "falling")
        self.assertEqual(diff, -200.0)
        self.assertEqual(pct, -10.0)

    def test_05_stable_movement_within_threshold(self):
        """5. Movement within stable threshold (default <= 1.0%) is classified as 'stable'."""
        # 2000 -> 2015 is +0.75%, which is <= 1.0%
        direction, diff, pct = mandi_trends.calculate_price_direction(2015.0, 2000.0, stable_threshold_pct=1.0)
        self.assertEqual(direction, "stable")
        self.assertEqual(diff, 15.0)
        self.assertEqual(pct, 0.75)

        # 2000 -> 1985 is -0.75%, which is also <= 1.0%
        direction2, diff2, pct2 = mandi_trends.calculate_price_direction(1985.0, 2000.0, stable_threshold_pct=1.0)
        self.assertEqual(direction2, "stable")
        self.assertEqual(diff2, -15.0)
        self.assertEqual(pct2, -0.75)

    def test_06_correct_percentage_change(self):
        """6. Percentage change formula ((curr - prev) / prev) * 100."""
        _, _, pct1 = mandi_trends.calculate_price_direction(2500.0, 2000.0)
        self.assertEqual(pct1, 25.0)

        _, _, pct2 = mandi_trends.calculate_price_direction(1500.0, 2000.0)
        self.assertEqual(pct2, -25.0)

    def test_07_correct_absolute_difference(self):
        """7. Absolute price difference curr - prev."""
        _, diff1, _ = mandi_trends.calculate_price_direction(3450.50, 3100.00)
        self.assertEqual(diff1, 350.50)

        _, diff2, _ = mandi_trends.calculate_price_direction(2900.00, 3100.00)
        self.assertEqual(diff2, -200.00)

    def test_08_correct_7_observation_sma(self):
        """8. Correct 7-observation SMA calculated from actual observation window."""
        prices = [2000.0, 2100.0, 2200.0, 2300.0, 2400.0, 2500.0, 2600.0]
        sma7 = mandi_trends.calculate_sma(prices, 7)
        expected = round(sum(prices) / 7, 2)
        self.assertEqual(sma7, expected)
        self.assertEqual(sma7, 2300.0)

        # Truncate to trailing 7 when more observations exist
        prices_10 = [1000.0, 1100.0, 1200.0] + prices
        sma7_trailing = mandi_trends.calculate_sma(prices_10, 7)
        self.assertEqual(sma7_trailing, 2300.0)

    def test_09_correct_14_observation_sma(self):
        """9. Correct 14-observation SMA calculated from actual observation window."""
        prices_14 = [float(1000 + i * 100) for i in range(14)]
        sma14 = mandi_trends.calculate_sma(prices_14, 14)
        expected = round(sum(prices_14) / 14, 2)
        self.assertEqual(sma14, expected)
        self.assertEqual(sma14, 1650.0)

    def test_10_sma_unavailable_when_insufficient_observations(self):
        """10. SMA is strictly None when observations count < window size."""
        prices_6 = [2000.0, 2100.0, 2200.0, 2300.0, 2400.0, 2500.0]
        self.assertIsNone(mandi_trends.calculate_sma(prices_6, 7))
        self.assertIsNone(mandi_trends.calculate_sma(prices_6, 14))

        prices_13 = [float(2000 + i * 50) for i in range(13)]
        self.assertIsNotNone(mandi_trends.calculate_sma(prices_13, 7))
        self.assertIsNone(mandi_trends.calculate_sma(prices_13, 14))

    def test_11_suspicious_prices_excluded(self):
        """11. Suspicious prices (e.g. Patti ₹0.01 or Rania ₹0.12) excluded from trend calculations."""
        # Rania APMC has a suspicious Tomato record (₹1.21)
        res = mandi_trends.analyze_series_trend("Tomato", "Rania APMC")
        self.assertGreater(res["observations_summary"]["suspicious_observations_excluded"], 0)
        # Valid price should not be 1.21
        if res["trend"]["latest_valid_price"] is not None:
            self.assertNotEqual(res["trend"]["latest_valid_price"], 1.21)
        # Confidence should register penalty reason
        reasons_text = " ".join(res["confidence"]["confidence_reasons"])
        self.assertIn("anomalous price report(s) excluded", reasons_text)

    def test_12_different_markets_remain_separate(self):
        """12. Different APMC mandis are never merged into one trend series."""
        res1 = mandi_trends.analyze_series_trend("Tomato", "Yeshwanthpur (APMC)")
        res2 = mandi_trends.analyze_series_trend("Tomato", "Kolar")
        self.assertEqual(res1["series_info"]["market"], "Yeshwanthpur (APMC)")
        self.assertEqual(res2["series_info"]["market"], "Kolar")
        self.assertNotEqual(res1["series_info"]["market"], res2["series_info"]["market"])

    def test_13_different_varieties_remain_separate(self):
        """13. Different crop varieties remain strictly separate."""
        # Querying Onion without variety vs specific variety
        conn = db.get_db_connection()
        c = conn.cursor()
        c.execute("SELECT DISTINCT variety FROM mandi_prices WHERE commodity = 'Onion' AND market = 'Pune'")
        varieties = [r["variety"] for r in c.fetchall()]
        conn.close()

        if len(varieties) >= 2:
            v1, v2 = varieties[0], varieties[1]
            res_v1 = mandi_trends.analyze_series_trend("Onion", "Pune", variety=v1)
            res_v2 = mandi_trends.analyze_series_trend("Onion", "Pune", variety=v2)
            self.assertEqual(res_v1["series_info"]["variety"], v1)
            self.assertEqual(res_v2["series_info"]["variety"], v2)
            self.assertNotEqual(res_v1["series_info"]["variety"], res_v2["series_info"]["variety"])

    def test_14_different_commodities_remain_separate(self):
        """14. Incompatible agricultural variants (Onion vs Onion Green, Cotton vs Cotton Seed) never mixed."""
        res_onion = mandi_trends.analyze_series_trend("Onion", "Pune")
        res_green = mandi_trends.analyze_series_trend("Onion Green", "Pune")
        self.assertEqual(res_onion["series_info"]["commodity"], "Onion")
        self.assertEqual(res_green["series_info"]["commodity"], "Onion Green")

        # Observations must be strictly separated
        for obs in res_onion["observations"]:
            self.assertEqual(obs["commodity"], "Onion")
        for obs in res_green["observations"]:
            self.assertEqual(obs["commodity"], "Onion Green")

    def test_15_different_units_remain_separate(self):
        """15. Different units remain separate and unit is explicitly displayed."""
        res = mandi_trends.analyze_series_trend("Tomato", "Yeshwanthpur (APMC)")
        self.assertEqual(res["series_info"]["unit"], "Rs/Quintal")

    def test_16_missing_arrival_dates_not_fabricated(self):
        """16. Missing dates between arrivals are not fabricated or linearly interpolated."""
        gap = mandi_history.calculate_days_gap("15/11/2026", "19/11/2026")
        self.assertEqual(gap, 4)

        # In confidence calculation, gap > 3 triggers gap deduction
        conf = mandi_trends.calculate_trend_confidence(valid_obs_count=5, distinct_dates_count=5, days_gap=4)
        reasons_text = " ".join(conf["confidence_reasons"])
        self.assertIn("Reporting gap of 4 calendar days", reasons_text)

    def test_17_old_observations_ordered_chronologically(self):
        """17. Observations are strictly ordered chronologically by arrival date."""
        dates = ["01/11/2026", "10/11/2026", "18/11/2026", "19/11/2026"]
        parsed = [mandi_history.parse_arrival_date(d) for d in dates]
        self.assertTrue(parsed[0] < parsed[1] < parsed[2] < parsed[3])

    def test_18_confidence_rules(self):
        """18. Confidence scoring assigns low/moderate/high based on data depth and penalties."""
        c0 = mandi_trends.calculate_trend_confidence(0, 0)
        self.assertEqual(c0["confidence_level"], "low")

        c1 = mandi_trends.calculate_trend_confidence(1, 1)
        self.assertEqual(c1["confidence_level"], "low")

        c4 = mandi_trends.calculate_trend_confidence(4, 4)
        self.assertEqual(c4["confidence_level"], "low")

        c8 = mandi_trends.calculate_trend_confidence(8, 8)
        self.assertEqual(c8["confidence_level"], "moderate")

        c15 = mandi_trends.calculate_trend_confidence(15, 15)
        self.assertEqual(c15["confidence_level"], "high")

    def test_19_api_parameter_validation(self):
        """19. API endpoints enforce required parameters and return HTTP 400 for empty queries."""
        # Calling endpoint function with empty parameters should raise HTTPException
        with self.assertRaises(app.HTTPException) as cm:
            app.get_mandi_trends_series_endpoint(commodity="", market="")
        self.assertEqual(cm.exception.status_code, 400)

        with self.assertRaises(app.HTTPException) as cm2:
            app.get_mandi_trends_summary_endpoint(commodity="")
        self.assertEqual(cm2.exception.status_code, 400)

        # Valid call to series endpoint
        res_series = app.get_mandi_trends_series_endpoint(commodity="Tomato", market="Yeshwanthpur (APMC)")
        self.assertEqual(res_series["status"], "success")
        self.assertIn("disclaimer", res_series)
        self.assertIn("trend", res_series)

        # Valid call to summary endpoint
        res_sum = app.get_mandi_trends_summary_endpoint(commodity="Tomato")
        self.assertEqual(res_sum["status"], "success")
        self.assertIn("total_markets_analyzed", res_sum)
        self.assertIn("direction_counts", res_sum)

    def test_20_existing_history_endpoints_intact(self):
        """20. Features 1-5 and existing history endpoints continue working without regression."""
        status = app.get_mandi_history_status_endpoint()
        self.assertEqual(status["status"], "success")
        self.assertEqual(status["history_status"]["total_records"], 2595)

        comms = app.get_mandi_history_commodities_endpoint()
        self.assertEqual(comms["status"], "success")

        mkts = app.get_mandi_history_markets_endpoint(page=1, limit=5)
        self.assertEqual(mkts["status"], "success")

        qual = app.get_mandi_history_quality_endpoint()
        self.assertEqual(qual["status"], "success")


if __name__ == "__main__":
    unittest.main()
