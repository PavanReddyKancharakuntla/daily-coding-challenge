import React, { useState, useEffect } from 'react';
import { Award, TrendingUp, Trophy, User as UserIcon } from 'lucide-react';
import { Card, Pill } from '../components/UI';
import { LeaderboardEntry, User } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Leaderboard({ user }: { user: User | null }) {
  const [filter, setFilter] = useState<'score' | 'streak'>('score');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    api
      .leaderboard(filter, 50)
      .then(setEntries)
      .catch((err) => setError(err?.message || 'Could not load leaderboard'))
      .finally(() => setIsLoading(false));
  }, [filter]);

  return (
    <div className="container-custom py-12 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black text-white tracking-tight">Leaderboard</h1>
          <p className="text-slate-500 font-medium">Rankings refresh every hour.</p>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilter('score')}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              filter === 'score'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            By score
          </button>
          <button
            onClick={() => setFilter('streak')}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-semibold transition-all',
              filter === 'streak'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300',
            )}
          >
            By streak
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-0 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-16">
                    #
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Score
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Streak
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Best
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
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
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No entries yet.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => {
                    // Coerce both sides to Number so this works even if one side
                    // is a string (e.g., serialization quirks).
                    const isCurrentUser =
                      user != null && Number(entry.user_id) === Number(user.id);
                    return (
                      <tr
                        key={entry.user_id}
                        className={cn(
                          'hover:bg-slate-900/30 transition-colors',
                          isCurrentUser && 'bg-indigo-500/5 hover:bg-indigo-500/10',
                        )}
                      >
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                              <UserIcon className="w-4 h-4" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">
                                {entry.username}
                              </span>
                              {isCurrentUser && (
                                <Pill className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 lowercase text-[9px] py-0 px-1.5">
                                  you
                                </Pill>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-white text-sm">
                            <Award className="w-4 h-4 text-indigo-500" />
                            {entry.total_score}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={cn(
                              'flex items-center gap-1.5 font-bold text-sm',
                              entry.current_streak > 0 ? 'text-amber-500' : 'text-slate-500',
                            )}
                          >
                            <TrendingUp className="w-4 h-4" />
                            {entry.current_streak} {entry.current_streak > 0 ? '🔥' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-400 text-sm">
                            <Trophy className="w-4 h-4" />
                            {entry.longest_streak}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
