'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { CompleteSessionResponse } from '@mathquest/contracts';

export default function LessonResultsPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params.topicId as string;
  const lessonId = params.lessonId as string;

  const [results, setResults] = useState<CompleteSessionResponse | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem('last_lesson_results');
    if (raw) {
      try {
        setResults(JSON.parse(raw));
      } catch (e) {
        console.error('Failed to parse results:', e);
      }
    }
  }, []);

  const mastery = results?.masteryScore || {
    score: 85,
    confidence: 0.75,
    accuracy_rate: 1.0,
    attempt_efficiency: 0.9,
    pace_score: 1.0,
    sample_count: 2,
    is_sufficient_data: true,
    reason_codes: ['HIGH_ACCURACY', 'CONFIDENT_PACING'],
    algorithm_version: 'rule_v1.0.0',
  };

  const rec = results?.recommendation || {
    recommended_topic_id: topicId,
    recommended_lesson_id: lessonId,
    priority: 1,
    explanation: 'Awesome progress! Keep going with your next math adventure.',
    reason_code: 'CONTINUE_STREAK',
    algorithm_version: 'recommender_v1.0.0',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 w-full space-y-8">
      {/* Celebration Header */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
        <div className="text-5xl">🏆</div>
        <h1 className="text-3xl font-extrabold text-slate-900">Quest Complete!</h1>
        <p className="text-slate-600 text-sm max-w-md mx-auto">
          Fantastic effort! You powered through the lesson puzzles with great focus.
        </p>

        {/* Score Ring Display */}
        <div className="py-4 flex justify-center">
          <div className="w-36 h-36 rounded-full border-8 border-indigo-500 bg-indigo-50 flex flex-col items-center justify-center shadow-inner">
            <span className="text-4xl font-extrabold text-indigo-700">{mastery.score}</span>
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Mastery</span>
          </div>
        </div>

        {/* Explainable Reason Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {mastery.reason_codes.map((code) => (
            <span
              key={code}
              className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200"
            >
              ✓ {code.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-6 rounded-3xl shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h3 className="font-bold text-lg">Practise Next Recommendation</h3>
        </div>
        <p className="text-sm text-indigo-100 leading-relaxed">{rec.explanation}</p>
        <div className="pt-2">
          <a
            href={`/learn/${rec.recommended_topic_id}/${rec.recommended_lesson_id}`}
            className="inline-block bg-white text-indigo-700 font-extrabold text-sm py-3 px-6 rounded-xl shadow hover:bg-indigo-50 transition-colors"
          >
            Start Next Challenge →
          </a>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-center gap-4">
        <a
          href="/dashboard"
          className="text-sm font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 py-2.5 px-5 rounded-xl transition-colors"
        >
          Guardian Dashboard
        </a>
        <a
          href={`/learn/${topicId}`}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 py-2.5 px-5 rounded-xl transition-colors"
        >
          More Lessons in Topic
        </a>
      </div>
    </div>
  );
}
