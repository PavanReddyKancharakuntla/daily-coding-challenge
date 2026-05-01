import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { StatCard, Card, StatusBadge } from '../components/UI';
import { User, Submission } from '../types';
import { formatDate } from '../lib/utils';
import { api } from '../lib/api';

export function Profile({ user }: { user: User }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .mySubmissions()
      .then(setSubmissions)
      .catch((err) => setError(err?.message || 'Could not load submissions'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container-custom py-12 space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-white tracking-tight">Hi, {user.username}</h1>
        <p className="text-slate-500 font-medium">Tracking your path to mastery.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Score" value={user.total_score} trendColor="text-indigo-400" />
        <StatCard
          label="Current Streak"
          value={`${user.current_streak} 🔥`}
          trendColor="text-amber-500"
        />
        <StatCard
          label="Longest Streak"
          value={user.longest_streak}
          trendColor="text-emerald-400"
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">Recent Submissions</h2>
          <Link to="/today" className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
            Solve today's <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <Card className="p-0 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Challenge
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Tests
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Score
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    When
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-4 h-12 bg-slate-900/20" />
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-rose-400">
                      {error}
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No submissions yet — go solve today's challenge.
                      <div className="mt-4">
                        <Link to="/today" className="btn-primary py-2 px-4 text-sm mt-4">
                          Solve Today
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        #{sub.challenge_id} {sub.title}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={sub.status} />
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {sub.passed_count}/{sub.total_count}
                      </td>
                      <td
                        className={
                          sub.score_awarded > 0
                            ? 'px-6 py-4 text-sm font-bold text-emerald-400'
                            : 'px-6 py-4 text-sm font-bold text-slate-500'
                        }
                      >
                        {sub.score_awarded > 0 ? `+${sub.score_awarded}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {formatDate(sub.submitted_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
