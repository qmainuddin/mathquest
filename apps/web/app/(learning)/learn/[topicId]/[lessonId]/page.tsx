'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Question } from '@mathquest/contracts';
import { INITIAL_QUESTIONS } from '@/lib/mock-data';

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const lessonId = params.lessonId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string>('');
  const [numericValue, setNumericValue] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [attemptsLog, setAttemptsLog] = useState<any[]>([]);

  const questionStartTimeRef = useRef<number>(Date.now());
  const attemptCountRef = useRef<number>(1);
  const hintUsedRef = useRef<boolean>(false);

  useEffect(() => {
    // Load safe questions (answers are absent)
    const list = INITIAL_QUESTIONS[lessonId] || [];
    setQuestions(list);
    questionStartTimeRef.current = Date.now();
    attemptCountRef.current = 1;
    hintUsedRef.current = false;
  }, [lessonId]);

  const currentQuestion = questions[currentIndex];

  const handleOpenHint = () => {
    setShowHint(true);
    hintUsedRef.current = true;
  };

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;

    const answerPayload =
      currentQuestion.questionType === 'numeric_input'
        ? { value: numericValue }
        : { choiceId: selectedChoice };

    if (!answerPayload.value && !answerPayload.choiceId) {
      alert('Please choose or enter an answer first!');
      return;
    }

    const durationMs = Date.now() - questionStartTimeRef.current;
    setSubmitting(true);

    try {
      const res = await fetch('/api/learning/attempt/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'client-active-session',
          childId: 'active-child',
          questionId: currentQuestion.id,
          attemptNumber: attemptCountRef.current,
          submittedAnswer: answerPayload,
          usedHint: hintUsedRef.current,
          durationMs,
        }),
      });

      const data = await res.json();
      setFeedback({
        isCorrect: data.isCorrect,
        message: data.explanation,
      });

      // Record in session attempts log
      setAttemptsLog((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          attemptNumber: attemptCountRef.current,
          isCorrect: data.isCorrect,
          usedHint: hintUsedRef.current,
          durationMs,
        },
      ]);

      if (data.isCorrect) {
        // Correct answer! Advance after a short pleasant pause
        setTimeout(() => {
          if (currentIndex + 1 < questions.length) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedChoice('');
            setNumericValue('');
            setShowHint(false);
            setFeedback(null);
            questionStartTimeRef.current = Date.now();
            attemptCountRef.current = 1;
            hintUsedRef.current = false;
          } else {
            // Completed all questions in the lesson
            completeLesson();
          }
        }, 1200);
      } else {
        // Incorrect: allow retry
        attemptCountRef.current += 1;
      }
    } catch (err) {
      alert(`Submission error: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const completeLesson = async () => {
    try {
      const res = await fetch('/api/learning/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'client-active-session',
          childId: 'active-child',
          topicId,
          lessonId,
          attempts: attemptsLog,
        }),
      });
      const results = await res.json();
      // Store result in sessionStorage for display
      sessionStorage.setItem('last_lesson_results', JSON.stringify(results));
      router.push(`/learn/${topicId}/${lessonId}/results`);
    } catch {
      router.push(`/learn/${topicId}/${lessonId}/results`);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-slate-500 font-medium">Loading puzzle quest...</p>
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 w-full space-y-6">
      {/* Lesson Progress Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push(`/learn/${topicId}`)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          ✕ Exit Lesson
        </button>

        <div className="flex-1 max-w-xs space-y-1">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md space-y-6">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Puzzle Challenge
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {currentQuestion.prompt}
          </h2>
        </div>

        {/* Visual Representations (e.g. Grids or Fraction Bars) */}
        {currentQuestion.options?.gridRows && currentQuestion.options?.gridCols && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Array Visualizer</span>
            <div
              className="grid gap-3 p-4 bg-white rounded-xl shadow-inner border border-slate-200"
              style={{
                gridTemplateColumns: `repeat(${currentQuestion.options.gridCols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({
                length: currentQuestion.options.gridRows * currentQuestion.options.gridCols,
              }).map((_, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-lg"
                >
                  🍎
                </div>
              ))}
            </div>
          </div>
        )}

        {currentQuestion.options?.totalBars && (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Fraction Bar</span>
            <div className="flex h-12 w-full rounded-xl overflow-hidden border-2 border-indigo-500">
              {Array.from({ length: currentQuestion.options.totalBars }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 flex items-center justify-center border-r border-indigo-300 font-bold text-sm ${
                    i < (currentQuestion.options?.filledBars || 0)
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-slate-400'
                  }`}
                >
                  1/{currentQuestion.options?.totalBars}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Question Input Formats */}
        {currentQuestion.questionType === 'numeric_input' ? (
          <div className="space-y-3">
            <label htmlFor="num-input" className="block text-sm font-semibold text-slate-700">
              Your Answer:
            </label>
            <input
              id="num-input"
              type="number"
              value={numericValue}
              onChange={(e) => setNumericValue(e.target.value)}
              placeholder={currentQuestion.options?.placeholder || 'Type your number here'}
              className="w-full text-2xl font-bold text-center px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-indigo-600 focus:ring-0"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options?.choices?.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => setSelectedChoice(choice.id)}
                className={`p-5 rounded-2xl border-2 font-bold text-lg text-left transition-all ${
                  selectedChoice === choice.id
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-800'
                }`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 ${
              feedback.isCorrect
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            <span className="text-xl">{feedback.isCorrect ? '🎉' : '💡'}</span>
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Hint Box */}
        {showHint ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl text-sm flex items-start gap-3">
            <span className="text-xl">🔍</span>
            <div>
              <strong className="block font-bold mb-0.5">Helpful Clue:</strong>
              <p>{currentQuestion.hint}</p>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenHint}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1.5"
          >
            <span>💡 Need a hint?</span>
          </button>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleSubmitAnswer}
          disabled={submitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-lg py-4 px-6 rounded-2xl shadow-md transition-all disabled:opacity-50"
        >
          {submitting ? 'Checking...' : 'Check Answer ✨'}
        </button>
      </div>
    </div>
  );
}
