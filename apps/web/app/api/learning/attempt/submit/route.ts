import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SOLUTIONS } from '@/lib/mock-data';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      childId,
      questionId,
      attemptNumber,
      submittedAnswer,
      usedHint,
      durationMs,
    } = body;

    if (!sessionId || !childId || !questionId || attemptNumber === undefined) {
      return NextResponse.json(
        { error: 'Missing required attempt fields' },
        { status: 400 }
      );
    }

    // Evaluate answer server-side against private solutions
    const solution = MOCK_SOLUTIONS[questionId];
    if (!solution) {
      return NextResponse.json(
        { error: 'Question not found or solution unavailable' },
        { status: 404 }
      );
    }

    let isCorrect = false;
    const submittedVal = String(submittedAnswer?.value || submittedAnswer?.choiceId || '').trim();
    const correctVal = String(solution.correct.value || solution.correct.choiceId || '').trim();

    if (submittedVal.toLowerCase() === correctVal.toLowerCase()) {
      isCorrect = true;
    }

    // In production with live Supabase:
    // await supabase.from('question_attempts').insert({ ... })

    return NextResponse.json({
      isCorrect,
      explanation: isCorrect
        ? 'Super job! That is correct!'
        : 'Nice try! Check the hint or give it another shot.',
      attemptNumber: Number(attemptNumber),
      questionId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
