import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_QUESTIONS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { childId, lessonId } = body;

    if (!childId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing childId or lessonId' },
        { status: 400 }
      );
    }

    // Generate unique session and idempotency key
    const sessionId = crypto.randomUUID();
    const idempotencyKey = `session_${childId}_${lessonId}_${Date.now()}`;

    // Fetch browser-safe questions (stripping answers)
    const rawQuestions = INITIAL_QUESTIONS[lessonId] || [];
    const safeQuestions = rawQuestions.map((q) => ({
      id: q.id,
      lessonId: q.lessonId,
      prompt: q.prompt,
      questionType: q.questionType,
      options: q.options,
      hint: q.hint,
      orderIndex: q.orderIndex,
    }));

    return NextResponse.json({
      sessionId,
      idempotencyKey,
      lessonId,
      childId,
      totalQuestions: safeQuestions.length,
      questions: safeQuestions,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
