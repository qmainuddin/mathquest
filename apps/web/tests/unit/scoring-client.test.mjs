import test from 'node:test';
import assert from 'node:assert/strict';

// Fallback scoring algorithm test (mirrors lib/scoring-client.ts)
function calculateFallbackScore(attempts) {
  const total = attempts.length;
  const correct = attempts.filter((a) => a.is_correct).length;
  const accuracy = total > 0 ? correct / total : 0;
  const score = Math.round(accuracy * 70.0 + (total > 0 ? 20.0 : 0.0) + 10.0);

  return {
    score,
    confidence: total >= 5 ? 0.75 : 0.5,
    accuracy_rate: Math.round(accuracy * 100) / 100,
    attempt_efficiency: 0.8,
    pace_score: 1.0,
    sample_count: total,
    is_sufficient_data: total >= 3,
    reason_codes: ['FALLBACK_CALCULATION', accuracy >= 0.7 ? 'SATISFACTORY' : 'NEEDS_PRACTICE'],
    algorithm_version: 'fallback_v1.0.0',
  };
}

function calculateFallbackRecommendation(childId) {
  return {
    recommended_topic_id: 'number_sense',
    recommended_lesson_id: 'ns_place_value_100',
    priority: 1,
    explanation: 'Let us build strong foundations with Number Sense puzzles!',
    reason_code: 'FALLBACK_RECOMMENDATION',
    algorithm_version: 'fallback_v1.0.0',
  };
}

test('Scoring Fallback: Computes bounded score under 100% accuracy', () => {
  const attempts = [
    { question_id: 'q1', is_correct: true },
    { question_id: 'q2', is_correct: true },
    { question_id: 'q3', is_correct: true },
  ];

  const result = calculateFallbackScore(attempts);
  assert.equal(result.score, 100);
  assert.equal(result.accuracy_rate, 1.0);
  assert.equal(result.is_sufficient_data, true);
  assert.ok(result.reason_codes.includes('SATISFACTORY'));
});

test('Scoring Fallback: Flags insufficient data on < 3 attempts', () => {
  const attempts = [{ question_id: 'q1', is_correct: true }];

  const result = calculateFallbackScore(attempts);
  assert.equal(result.is_sufficient_data, false);
  assert.equal(result.sample_count, 1);
});

test('Scoring Fallback: Partial accuracy calculation (66% correct)', () => {
  const attempts = [
    { question_id: 'q1', is_correct: true },
    { question_id: 'q2', is_correct: true },
    { question_id: 'q3', is_correct: false },
  ];

  const result = calculateFallbackScore(attempts);
  assert.equal(result.sample_count, 3);
  assert.equal(result.is_sufficient_data, true);
  assert.equal(result.accuracy_rate, 0.67);
  assert.ok(result.reason_codes.includes('NEEDS_PRACTICE'));
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('Scoring Fallback: Zero attempts returns base score and empty sample', () => {
  const attempts = [];

  const result = calculateFallbackScore(attempts);
  assert.equal(result.sample_count, 0);
  assert.equal(result.accuracy_rate, 0);
  assert.equal(result.is_sufficient_data, false);
  assert.equal(result.confidence, 0.5);
});

test('Scoring Fallback: Confidence scales with 5 or more samples', () => {
  const attempts = [
    { question_id: 'q1', is_correct: true },
    { question_id: 'q2', is_correct: true },
    { question_id: 'q3', is_correct: true },
    { question_id: 'q4', is_correct: true },
    { question_id: 'q5', is_correct: true },
  ];

  const result = calculateFallbackScore(attempts);
  assert.equal(result.confidence, 0.75);
  assert.equal(result.sample_count, 5);
  assert.equal(result.is_sufficient_data, true);
});

test('Scoring Fallback: Recommendation returns structured object with valid fields', () => {
  const rec = calculateFallbackRecommendation('child-xyz');
  assert.equal(rec.recommended_topic_id, 'number_sense');
  assert.equal(rec.recommended_lesson_id, 'ns_place_value_100');
  assert.equal(rec.priority, 1);
  assert.equal(rec.reason_code, 'FALLBACK_RECOMMENDATION');
  assert.equal(rec.algorithm_version, 'fallback_v1.0.0');
  assert.ok(rec.explanation.length > 10);
});
