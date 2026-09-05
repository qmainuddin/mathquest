import unittest
from app.schemas import AttemptSummary
from app.engine import RuleBasedScoringEngine


class TestScoringEngine(unittest.TestCase):
    """Test suite for deterministic scoring engine rule_v1.0.0."""

    def setUp(self):
        self.engine = RuleBasedScoringEngine()

    def test_insufficient_data_less_than_three_attempts(self):
        attempts = [
            AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=5000),
            AttemptSummary(question_id="q2", attempt_number=1, is_correct=False, duration_ms=6000),
        ]
        res = self.engine.calculate_score("child-1", "number_sense", attempts)
        self.assertFalse(res.is_sufficient_data)
        self.assertEqual(res.sample_count, 2)
        self.assertIn("INSUFFICIENT_DATA", res.reason_codes)
        self.assertIn("NEEDS_MORE_ATTEMPTS", res.reason_codes)

    def test_perfect_score_high_accuracy(self):
        attempts = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, used_hint=False, duration_ms=10000)
            for i in range(5)
        ]
        res = self.engine.calculate_score("child-1", "addition_subtraction", attempts)
        self.assertTrue(res.is_sufficient_data)
        self.assertEqual(res.score, 100.0)
        self.assertEqual(res.accuracy_rate, 1.0)
        self.assertEqual(res.attempt_efficiency, 1.0)
        self.assertEqual(res.pace_score, 1.0)
        self.assertIn("HIGH_ACCURACY", res.reason_codes)
        self.assertIn("FIRST_TRY_MASTERY", res.reason_codes)
        self.assertIn("CONFIDENT_PACING", res.reason_codes)

    def test_zero_correct_lowest_score(self):
        attempts = [
            AttemptSummary(question_id=f"q{i}", attempt_number=2, is_correct=False, used_hint=True, duration_ms=45000)
            for i in range(4)
        ]
        res = self.engine.calculate_score("child-1", "fractions", attempts)
        self.assertTrue(res.is_sufficient_data)
        self.assertEqual(res.accuracy_rate, 0.0)
        self.assertIn("ACCURACY_NEEDS_PRACTICE", res.reason_codes)
        self.assertIn("FREQUENT_HINT_OR_RETRY", res.reason_codes)
        self.assertLess(res.score, 30.0)

    def test_duration_clamping(self):
        # Durations < 3s are clamped to 3s and durations > 60s clamped to 60s
        attempts = [
            AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=500),    # extreme speed (<3s)
            AttemptSummary(question_id="q2", attempt_number=1, is_correct=True, duration_ms=120000), # extreme slow (>60s)
            AttemptSummary(question_id="q3", attempt_number=1, is_correct=True, duration_ms=15000),
        ]
        res = self.engine.calculate_score("child-1", "fractions", attempts)
        self.assertTrue(res.is_sufficient_data)
        self.assertTrue(0.0 <= res.score <= 100.0)
        self.assertGreater(res.pace_score, 0.0)

    def test_hint_and_retry_penalty(self):
        # Compare first try without hint vs repeated tries with hints
        clean_attempts = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, used_hint=False, duration_ms=12000)
            for i in range(3)
        ]
        hint_attempts = [
            AttemptSummary(question_id=f"q{i}", attempt_number=2, is_correct=True, used_hint=True, duration_ms=12000)
            for i in range(3)
        ]
        clean_res = self.engine.calculate_score("child-1", "multiplication_division", clean_attempts)
        hint_res = self.engine.calculate_score("child-1", "multiplication_division", hint_attempts)

        self.assertGreater(clean_res.score, hint_res.score)
        self.assertGreater(clean_res.attempt_efficiency, hint_res.attempt_efficiency)

    def test_recency_weighting(self):
        # Child starts with wrong answers, then masters the last 3 questions
        improving_attempts = [
            AttemptSummary(question_id="q1", attempt_number=1, is_correct=False, duration_ms=15000),
            AttemptSummary(question_id="q2", attempt_number=1, is_correct=False, duration_ms=15000),
            AttemptSummary(question_id="q3", attempt_number=1, is_correct=True, duration_ms=15000),
            AttemptSummary(question_id="q4", attempt_number=1, is_correct=True, duration_ms=15000),
            AttemptSummary(question_id="q5", attempt_number=1, is_correct=True, duration_ms=15000),
        ]
        # Child starts with correct answers, then misses the last 3 questions
        deteriorating_attempts = [
            AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=15000),
            AttemptSummary(question_id="q2", attempt_number=1, is_correct=True, duration_ms=15000),
            AttemptSummary(question_id="q3", attempt_number=1, is_correct=True, duration_ms=15000),
            AttemptSummary(question_id="q4", attempt_number=1, is_correct=False, duration_ms=15000),
            AttemptSummary(question_id="q5", attempt_number=1, is_correct=False, duration_ms=15000),
        ]
        improving_res = self.engine.calculate_score("c1", "ns", improving_attempts)
        deteriorating_res = self.engine.calculate_score("c2", "ns", deteriorating_attempts)

        self.assertGreater(improving_res.score, deteriorating_res.score)

    def test_sample_count_confidence_scaling(self):
        # Under 5 attempts -> confidence 0.50
        attempts_3 = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, duration_ms=12000)
            for i in range(3)
        ]
        res_3 = self.engine.calculate_score("c1", "ns", attempts_3)
        self.assertEqual(res_3.confidence, 0.50)

        # 5 to 9 attempts -> confidence 0.75
        attempts_6 = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, duration_ms=12000)
            for i in range(6)
        ]
        res_6 = self.engine.calculate_score("c1", "ns", attempts_6)
        self.assertEqual(res_6.confidence, 0.75)

        # 10 or more attempts -> confidence 1.00
        attempts_10 = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, duration_ms=12000)
            for i in range(10)
        ]
        res_10 = self.engine.calculate_score("c1", "ns", attempts_10)
        self.assertEqual(res_10.confidence, 1.00)

    def test_moderate_accuracy_reason_code(self):
        # 3 correct out of 4 attempts (~75% accuracy)
        attempts = [
            AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=10000),
            AttemptSummary(question_id="q2", attempt_number=1, is_correct=True, duration_ms=10000),
            AttemptSummary(question_id="q3", attempt_number=1, is_correct=False, duration_ms=10000),
            AttemptSummary(question_id="q4", attempt_number=1, is_correct=True, duration_ms=10000),
        ]
        res = self.engine.calculate_score("c1", "ns", attempts)
        self.assertIn("MODERATE_ACCURACY", res.reason_codes)

    def test_deliberate_pacing_reason_code(self):
        # Pacing > 45s should produce DELIBERATE_PACING
        attempts = [
            AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, duration_ms=55000)
            for i in range(3)
        ]
        res = self.engine.calculate_score("c1", "ns", attempts)
        self.assertIn("DELIBERATE_PACING", res.reason_codes)

    def test_score_stays_bounded_between_0_and_100(self):
        # Extreme test: various combinations always produce score in [0.0, 100.0]
        test_cases = [
            [(True, 1, False, 1000)] * 5,
            [(False, 5, True, 75000)] * 5,
            [(True, 3, True, 30000)] * 4,
            [(False, 1, False, 2000)] * 3,
        ]
        for combo in test_cases:
            attempts = [
                AttemptSummary(question_id=f"q{i}", attempt_number=a[1], is_correct=a[0], used_hint=a[2], duration_ms=a[3])
                for i, a in enumerate(combo)
            ]
            res = self.engine.calculate_score("c1", "ns", attempts)
            self.assertTrue(0.0 <= res.score <= 100.0, f"Score {res.score} out of bounds")


if __name__ == "__main__":
    unittest.main()
