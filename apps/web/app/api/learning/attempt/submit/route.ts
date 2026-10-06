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

    const subChoiceId = submittedAnswer?.choiceId
      ? String(submittedAnswer.choiceId).trim().toLowerCase()
      : null;
    const subValue =
      submittedAnswer?.value !== undefined && submittedAnswer?.value !== null
        ? String(submittedAnswer.value).trim().toLowerCase()
        : null;

    const solChoiceId = solution.correct?.choiceId
      ? String(solution.correct.choiceId).trim().toLowerCase()
      : null;
    const solValue =
      solution.correct?.value !== undefined && solution.correct?.value !== null
        ? String(solution.correct.value).trim().toLowerCase()
        : null;

    // 1. Exact match on choice identifier (e.g. 'a' === 'a')
    if (subChoiceId && solChoiceId && subChoiceId === solChoiceId) {
      isCorrect = true;
    }
    // 2. Exact match on textual answer value (e.g. '47' === '47' or '1/4' === '1/4')
    else if (subValue && solValue && subValue === solValue) {
      isCorrect = true;
    }
    // 3. Numeric normalization match (e.g. '047' === '47' or 47 === 47)
    else if (
      subValue !== null &&
      solValue !== null &&
      !isNaN(Number(subValue)) &&
      !isNaN(Number(solValue)) &&
      Number(subValue) === Number(solValue)
    ) {
      isCorrect = true;
    }
    // 4. Cross-match: client sent value as choiceId or choiceId as value
    else if (subChoiceId && solValue && subChoiceId === solValue) {
      isCorrect = true;
    } else if (subValue && solChoiceId && subValue === solChoiceId) {
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
