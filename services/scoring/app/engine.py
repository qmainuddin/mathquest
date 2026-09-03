from abc import ABC, abstractmethod
from typing import List
from app.schemas import AttemptSummary, ScoreResponse
from app.config import settings

class BaseScoringEngine(ABC):
    """Abstract interface allowing drop-in replacement by machine learning models."""
    @abstractmethod
    def calculate_score(self, child_id: str, topic_id: str, attempts: List[AttemptSummary]) -> ScoreResponse:
        pass

class RuleBasedScoringEngine(BaseScoringEngine):
    """
    Deterministic rule-based scoring engine:
    - 70% Accuracy
    - 20% Attempt Efficiency (penalizes repeated wrong attempts and hint reliance)
    - 10% Pace (capped between 3,000ms and 60,000ms)
    - Recency weighting for newer attempts
    """
    VERSION = "rule_v1.0.0"
    MIN_DURATION_MS = 3000   # 3 seconds min cap
    MAX_DURATION_MS = 60000  # 60 seconds max cap
    IDEAL_DURATION_MS = 15000 # 15 seconds target pace

    def calculate_score(self, child_id: str, topic_id: str, attempts: List[AttemptSummary]) -> ScoreResponse:
        sample_count = len(attempts)

        # 1. Handle insufficient data (< 3 attempts)
        if sample_count < 3:
            accuracy = sum(1 for a in attempts if a.is_correct) / sample_count if sample_count > 0 else 0.0
            return ScoreResponse(
                score=round(accuracy * 70.0, 2),
                confidence=0.1 if sample_count > 0 else 0.0,
                accuracy_rate=round(accuracy, 2),
                attempt_efficiency=1.0,
                pace_score=0.5,
                sample_count=sample_count,
                is_sufficient_data=False,
                reason_codes=["INSUFFICIENT_DATA", "NEEDS_MORE_ATTEMPTS"],
                algorithm_version=self.VERSION,
            )

        # 2. Recency weighting: more recent attempts have higher weight
        # weight(i) = 1.0 + (i / total) * 0.5
        total_weight = 0.0
        weighted_accuracy_sum = 0.0
        weighted_efficiency_sum = 0.0
        weighted_pace_sum = 0.0

        for i, att in enumerate(attempts):
            recency_weight = 1.0 + (i / sample_count) * 0.5
            total_weight += recency_weight

            # A. Accuracy component (1 if correct, 0 if incorrect)
            if att.is_correct:
                weighted_accuracy_sum += 1.0 * recency_weight

            # B. Attempt efficiency component:
            # 1.0 for 1st attempt without hint
            # 0.75 for 1st attempt with hint
            # 0.5 for 2nd attempt
            # 0.25 for 3+ attempts
            if att.is_correct:
                if att.attempt_number == 1 and not att.used_hint:
                    eff = 1.0
                elif att.attempt_number == 1 and att.used_hint:
                    eff = 0.8
                elif att.attempt_number == 2:
                    eff = 0.5
                else:
                    eff = 0.25
            else:
                eff = 0.1
            weighted_efficiency_sum += eff * recency_weight

            # C. Pace component (speed is a weak signal):
            # Clamp duration between 3s and 60s
            clamped_duration = max(self.MIN_DURATION_MS, min(self.MAX_DURATION_MS, att.duration_ms))
            # Optimal around 10-20s. Score declines gracefully towards 60s.
            if clamped_duration <= 20000:
                pace = 1.0
            else:
                pace = max(0.2, 1.0 - ((clamped_duration - 20000) / 40000.0) * 0.8)
            weighted_pace_sum += pace * recency_weight

        acc_rate = weighted_accuracy_sum / total_weight
        eff_rate = weighted_efficiency_sum / total_weight
        pace_rate = weighted_pace_sum / total_weight

        # 3. Composite score (0-100)
        composite_score = (acc_rate * 70.0) + (eff_rate * 20.0) + (pace_rate * 10.0)
        composite_score = max(0.0, min(100.0, composite_score))

        # 4. Confidence rating
        if sample_count >= 10:
            confidence = 1.0
        elif sample_count >= 5:
            confidence = 0.75
        else:
            confidence = 0.50

        # 5. Explainable reason codes
        reason_codes = []
        if acc_rate >= 0.85:
            reason_codes.append("HIGH_ACCURACY")
        elif acc_rate >= 0.65:
            reason_codes.append("MODERATE_ACCURACY")
        else:
            reason_codes.append("ACCURACY_NEEDS_PRACTICE")

        if eff_rate >= 0.80:
            reason_codes.append("FIRST_TRY_MASTERY")
        elif eff_rate <= 0.40:
            reason_codes.append("FREQUENT_HINT_OR_RETRY")

        if pace_rate >= 0.85:
            reason_codes.append("CONFIDENT_PACING")
        elif pace_rate <= 0.40:
            reason_codes.append("DELIBERATE_PACING")

        return ScoreResponse(
            score=round(composite_score, 2),
            confidence=round(confidence, 2),
            accuracy_rate=round(acc_rate, 2),
            attempt_efficiency=round(eff_rate, 2),
            pace_score=round(pace_rate, 2),
            sample_count=sample_count,
            is_sufficient_data=True,
            reason_codes=reason_codes,
            algorithm_version=self.VERSION,
        )

scoring_engine = RuleBasedScoringEngine()
