# ADR 0005: Rule-Based Deterministic Scoring Before Machine Learning

## Status
Accepted

## Context
Educational systems for primary school children must provide explainable, auditable, and reliable feedback. Non-deterministic generative AI models cannot be trusted to grade arithmetic answers or calculate educational mastery reliably.

## Decision
1. Initial scoring engine (`services/scoring/app/engine.py`) implements deterministic rule-based algorithms:
   - 70% Accuracy
   - 20% Attempt efficiency
   - 10% Pace / speed (speed is a weak signal, bounded between 3s and 60s)
2. All outputs include human-readable reason codes (e.g. `HIGH_ACCURACY_CONSISTENT`, `PACING_COMFORTABLE`, `NEEDS_PRACTICE_ON_SUBTRACTION`).
3. Contract interfaces (`ScoreRequest`, `ScoreResponse`) are abstract and versioned (`rule_v1.0.0`) so ML models can implement the exact same contract later.

## Consequences
- 100% reproducible and verifiable grading.
- Zero risk of hallucinations or grading errors for young learners.
- Easy to test and verify mathematically.
