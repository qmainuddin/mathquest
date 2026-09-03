import { NextRequest, NextResponse } from 'next/server';
import { requestMasteryScore, requestRecommendation } from '@/lib/scoring-client';
import type { AttemptSummary } from '@mathquest/contracts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, childId, topicId, attempts, idempotencyKey } = body;

    if (!sessionId || !childId || !topicId) {
      return NextResponse.json(
        { error: 'Missing required completion parameters' },
        { status: 400 }
      );
    }

    const safeAttempts: AttemptSummary[] = (attempts || []).map((a: any) => ({
      question_id: a.questionId,
      attempt_number: a.attemptNumber || 1,
      is_correct: Boolean(a.isCorrect),
      used_hint: Boolean(a.usedHint),
      duration_ms: Number(a.durationMs) || 10000,
    }));

    // 1. Call Python scoring microservice
    const correlationId = `sess_${sessionId}_${Date.now()}`;
    const scoreResult = await requestMasteryScore(
      {
        child_id: childId,
        topic_id: topicId,
        attempts: safeAttempts,
      },
      correlationId
    );

    // 2. Call Python recommendation engine
    const recResult = await requestRecommendation(
      {
        child_id: childId,
        mastery_snapshots: [
          {
            topic_id: topicId,
            score: scoreResult.score,
            confidence: scoreResult.confidence,
            sample_count: scoreResult.sample_count,
          },
        ],
        completed_lesson_ids: [],
      },
      correlationId
    );

    return NextResponse.json({
      sessionId,
      status: 'completed',
      totalQuestions: safeAttempts.length,
      correctCount: safeAttempts.filter((a) => a.is_correct).length,
      accuracyRate: scoreResult.accuracy_rate,
      masteryScore: scoreResult,
      recommendation: recResult,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
