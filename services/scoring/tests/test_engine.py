import pytest
from app.schemas import AttemptSummary
from app.engine import RuleBasedScoringEngine

@pytest.fixture
def engine():
    return RuleBasedScoringEngine()

def test_insufficient_data_less_than_three_attempts(engine):
    attempts = [
        AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=5000),
        AttemptSummary(question_id="q2", attempt_number=1, is_correct=False, duration_ms=6000),
    ]
    res = engine.calculate_score("child-1", "number_sense", attempts)
    assert res.is_sufficient_data is False
    assert res.sample_count == 2
    assert "INSUFFICIENT_DATA" in res.reason_codes

def test_perfect_score_high_accuracy(engine):
    attempts = [
        AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, used_hint=False, duration_ms=10000)
        for i in range(5)
    ]
    res = engine.calculate_score("child-1", "addition_subtraction", attempts)
    assert res.is_sufficient_data is True
    assert res.score == 100.0
    assert res.accuracy_rate == 1.0
    assert res.attempt_efficiency == 1.0
    assert res.pace_score == 1.0
    assert "HIGH_ACCURACY" in res.reason_codes
    assert "FIRST_TRY_MASTERY" in res.reason_codes

def test_duration_clamping(engine):
    # Tests that durations < 3s are clamped to 3s and durations > 60s clamped to 60s
    attempts = [
        AttemptSummary(question_id="q1", attempt_number=1, is_correct=True, duration_ms=500), # extreme speed (<3s)
        AttemptSummary(question_id="q2", attempt_number=1, is_correct=True, duration_ms=120000), # extreme slow (>60s)
        AttemptSummary(question_id="q3", attempt_number=1, is_correct=True, duration_ms=15000),
    ]
    res = engine.calculate_score("child-1", "fractions", attempts)
    assert res.is_sufficient_data is True
    assert 0.0 <= res.score <= 100.0
    assert res.pace_score > 0.0

def test_hint_and_retry_penalty(engine):
    # Compare first try without hint vs repeated tries with hints
    clean_attempts = [
        AttemptSummary(question_id=f"q{i}", attempt_number=1, is_correct=True, used_hint=False, duration_ms=12000)
        for i in range(3)
    ]
    hint_attempts = [
        AttemptSummary(question_id=f"q{i}", attempt_number=2, is_correct=True, used_hint=True, duration_ms=12000)
        for i in range(3)
    ]
    clean_res = engine.calculate_score("child-1", "multiplication_division", clean_attempts)
    hint_res = engine.calculate_score("child-1", "multiplication_division", hint_attempts)

    assert clean_res.score > hint_res.score
    assert clean_res.attempt_efficiency > hint_res.attempt_efficiency

def test_recency_weighting(engine):
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
    improving_res = engine.calculate_score("c1", "ns", improving_attempts)
    deteriorating_res = engine.calculate_score("c2", "ns", deteriorating_attempts)

    # Improving child has higher recent weight, so score must be higher than deteriorating child
    assert improving_res.score > deteriorating_res.score
