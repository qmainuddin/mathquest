'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgeBand } from '@mathquest/contracts';

export default function NewChildPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [ageBand, setAgeBand] = useState<AgeBand>('age_8_9');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname) return;

    setLoading(true);
    // In production with live Supabase:
    // await supabase.from('children').insert({ nickname, age_band: ageBand, ... })
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 w-full">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Child Profile</h1>
          <p className="text-sm text-slate-600">
            Keep your child’s identity private. A nickname is all we need!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nickname" className="block text-sm font-medium text-slate-700 mb-1">
              Child Nickname (e.g. Leo, Sam, Maya)
            </label>
            <input
              id="nickname"
              type="text"
              required
              maxLength={50}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="ageBand" className="block text-sm font-medium text-slate-700 mb-1">
              Age / School Band
            </label>
            <select
              id="ageBand"
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value as AgeBand)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="age_7_8">Ages 7–8 (Year 3)</option>
              <option value="age_8_9">Ages 8–9 (Year 4)</option>
              <option value="age_9_10">Ages 9–10 (Year 5)</option>
              <option value="age_10_11">Ages 10–11 (Year 6)</option>
            </select>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-600 border border-slate-200">
            🔒 <strong>Privacy note:</strong> We do not collect full birth dates, addresses, school names, or real full names.
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg shadow transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Creating...' : 'Create Profile ✨'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
