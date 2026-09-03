import { INITIAL_TOPICS } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-indigo-50 to-white py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-800 text-sm font-semibold px-4 py-1.5 rounded-full">
            <span>🎉</span>
            <span>Welcome to MathQuest Adventures</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight">
            Math That Feels Like an <span className="text-indigo-600">Adventure</span>!
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Delightful mathematical puzzles designed for primary-school learners (ages 7–11).
            Build true number confidence with friendly visuals, progressive hints, and zero pressure.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center bg-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:bg-indigo-700 hover:shadow-indigo-200 transition-all"
            >
              Start Learning Free 🚀
            </a>
            <a
              href="#topics"
              className="inline-flex items-center justify-center bg-white text-slate-700 font-semibold text-lg px-8 py-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Explore Topics
            </a>
          </div>
        </div>
      </section>

      {/* Core Topics Section */}
      <section id="topics" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-3xl font-bold text-slate-900">Foundational Math Topics</h2>
          <p className="text-slate-600">
            Each topic contains short, bite-sized lessons with hands-on interactive puzzles.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {INITIAL_TOPICS.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">
                  {topic.id === 'number_sense' && '🧭'}
                  {topic.id === 'addition_subtraction' && '➕'}
                  {topic.id === 'multiplication_division' && '✖️'}
                  {topic.id === 'fractions' && '🍕'}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{topic.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{topic.description}</p>
              </div>
              <a
                href={`/learn/${topic.id}`}
                className="mt-6 inline-flex items-center justify-center text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-2.5 px-4 rounded-lg transition-colors"
              >
                Start Topic →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Guardian Privacy & Safety Pledge */}
      <section className="bg-slate-100 py-16 px-4 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Built with Child Safety & Privacy at Core
            </h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              We strictly adhere to COPPA and GDPR-K guidelines. Kids learn in a protected space.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <span className="text-2xl">🛡️</span>
              <h4 className="font-bold text-slate-900">No Child Emails or PII</h4>
              <p className="text-sm text-slate-600">
                Children use simple nicknames. Full birthdates, school names, and locations are never asked.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <span className="text-2xl">🚫</span>
              <h4 className="font-bold text-slate-900">Zero Ads & Dark Patterns</h4>
              <p className="text-sm text-slate-600">
                No ads, no public leaderboards, and no manipulative daily streaks that cause anxiety.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
              <span className="text-2xl">🧠</span>
              <h4 className="font-bold text-slate-900">Explainable Mastery</h4>
              <p className="text-sm text-slate-600">
                Deterministic mathematical scoring. AI never guesses whether a child is right or wrong.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
