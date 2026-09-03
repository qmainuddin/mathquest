import { INITIAL_TOPICS, INITIAL_LESSONS } from '@/lib/mock-data';
import { notFound } from 'next/navigation';

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = INITIAL_TOPICS.find((t) => t.id === topicId);

  if (!topic) {
    notFound();
  }

  const lessons = INITIAL_LESSONS.filter((l) => l.topicId === topicId);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 w-full space-y-8">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <a href="/dashboard" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          ← Back to Dashboard
        </a>
        <h1 className="text-3xl font-extrabold text-slate-900">{topic.title}</h1>
        <p className="text-slate-600 text-sm leading-relaxed">{topic.description}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Available Lessons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lessons.map((lesson, idx) => (
            <div
              key={lesson.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                    Lesson {idx + 1}
                  </span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                    {lesson.difficulty}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{lesson.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{lesson.description}</p>
              </div>

              <a
                href={`/learn/${topicId}/${lesson.id}`}
                className="w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-sm"
              >
                Play Lesson 🚀
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
