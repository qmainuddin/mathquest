'use client';

import { useState, useEffect } from 'react';
import type { ChildProfile } from '@mathquest/contracts';
import { INITIAL_TOPICS } from '@/lib/mock-data';
import { formatAgeBand } from '@/lib/utils';

export default function DashboardPage() {
  const [children, setChildren] = useState<ChildProfile[]>([
    {
      id: 'demo-child-1',
      guardianId: 'demo-guardian-1',
      nickname: 'Alex',
      ageBand: 'age_8_9',
      avatarColor: 'indigo',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [selectedChildId, setSelectedChildId] = useState<string>('demo-child-1');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const activeChild = children.find((c) => c.id === selectedChildId);

  const handleDeleteChild = async (childId: string) => {
    if (!confirm(`Are you sure you want to permanently delete all learning data for ${activeChild?.nickname}? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await fetch(`/api/children/${childId}/delete`, { method: 'DELETE' });
      setChildren((prev) => prev.filter((c) => c.id !== childId));
      if (selectedChildId === childId) {
        setSelectedChildId(children[0]?.id || '');
      }
    } catch (err) {
      alert(`Deletion failed: ${(err as Error).message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
      {/* Header & Child Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Guardian Dashboard</h1>
          <p className="text-sm text-slate-600">Manage learner profiles and review progress.</p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 0 ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 pl-2">Active Learner:</span>
              <select
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-indigo-700"
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.nickname} ({formatAgeBand(child.ageBand)})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <a
            href="/children/new"
            className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition-colors"
          >
            + Add Child
          </a>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-4">
          <div className="text-4xl">🌱</div>
          <h2 className="text-xl font-bold text-slate-800">No Child Profiles Added Yet</h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Create a profile for your young learner to start personalized math adventures.
          </p>
          <a
            href="/children/new"
            className="inline-block bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow hover:bg-indigo-700 transition-colors"
          >
            Create First Profile
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Recommendation Banner */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-block bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Recommended Next Step
              </div>
              <h3 className="text-xl font-extrabold">Number Sense & Place Value</h3>
              <p className="text-indigo-100 text-sm">
                Ready to explore: <strong>Tens and Ones</strong>. Perfect for building place-value intuition!
              </p>
            </div>
            <a
              href="/learn/number_sense/ns_place_value_100"
              className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl shadow hover:bg-indigo-50 transition-colors text-sm whitespace-nowrap"
            >
              Start Lesson 🚀
            </a>
          </div>

          {/* Topic Progress Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Curriculum Mastery</h2>
              <span className="text-xs text-slate-500 font-medium">Deterministic Rule Engine v1.0.0</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INITIAL_TOPICS.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{topic.title}</h4>
                      <p className="text-xs text-slate-500">{topic.description}</p>
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      Ready
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Mastery Score</span>
                      <span>Ready to Practise</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-2.5 rounded-full w-1/4"></div>
                    </div>
                  </div>

                  <a
                    href={`/learn/${topic.id}`}
                    className="text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-lg transition-colors"
                  >
                    Open Topic Lessons →
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Child Data Management & Privacy Actions */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900">Privacy & Profile Settings</h3>
            <p className="text-sm text-slate-600">
              Under our privacy policy, you can delete your child’s records at any time. All attempts,
              sessions, and mastery scores will be permanently purged from the database.
            </p>
            {activeChild && (
              <button
                type="button"
                onClick={() => handleDeleteChild(activeChild.id)}
                disabled={isDeleting}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : `Delete All Data for ${activeChild.nickname}`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
