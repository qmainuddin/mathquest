import type {
  ScoreRequest,
  ScoreResponse,
  RecommendRequest,
  RecommendResponse,
} from '@mathquest/contracts';

const SCORING_URL = process.env.SCORING_SERVICE_URL || 'http://127.0.0.1:8005';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_TOKEN || 'test-internal-token-secret';

export async function requestMasteryScore(
  payload: ScoreRequest,
  correlationId?: string
): Promise<ScoreResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_SECRET,
  };

  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s bounded timeout

    const res = await fetch(`${SCORING_URL}/v1/score`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Scoring service returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(
      `[ScoringClient] Microservice request failed (${(error as Error).message}). Using deterministic fallback.`
    );
    // Graceful fallback: Calculate deterministic rule locally if service is unreachable
    const total = payload.attempts.length;
    const correct = payload.attempts.filter((a) => a.is_correct).length;
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
}

export async function requestRecommendation(
  payload: RecommendRequest,
  correlationId?: string
): Promise<RecommendResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_SECRET,
  };

  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${SCORING_URL}/v1/recommend`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Scoring service returned HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.warn(
      `[ScoringClient] Recommendation request failed (${(error as Error).message}). Using fallback.`
    );
    return {
      recommended_topic_id: 'number_sense',
      recommended_lesson_id: 'ns_place_value_100',
      priority: 1,
      explanation: 'Let us build strong foundations with Number Sense puzzles!',
      reason_code: 'FALLBACK_RECOMMENDATION',
      algorithm_version: 'fallback_v1.0.0',
    };
  }
}
