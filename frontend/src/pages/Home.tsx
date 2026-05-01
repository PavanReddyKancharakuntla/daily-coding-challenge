import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pin, Zap, Trophy, ArrowRight } from 'lucide-react';
import { FeatureCard, Pill } from '../components/UI';
import { ChallengeResponse, User, Difficulty } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

export function Home({ user }: { user: User | null }) {
  const [challenges, setChallenges] = useState<ChallengeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    Promise.all(difficulties.map((d) => api.todaysChallenge(d).catch(() => null)))
      .then((results) => setChallenges(results.filter(Boolean) as ChallengeResponse[]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-24 container-custom text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full mb-8 shadow-inner"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            New challenge every day at 00:00 UTC
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-6xl md:text-[5.5rem] font-black tracking-tight text-white mb-6 leading-[0.95]"
        >
          Sharpen your code, <br />
          <span className="text-indigo-500">one problem a day.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-xl mb-12 font-medium leading-relaxed"
        >
          Three difficulties. Real test cases. Streaks that reward consistency. Level up your skills
          without the grind.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          <Link to="/today" className="btn-primary text-base px-10 py-3.5 flex items-center gap-2">
            Start today's challenge
            <ArrowRight className="w-4 h-4" />
          </Link>
          {user ? (
            <Link to="/profile" className="btn-ghost text-base px-10 py-3.5">
              View your profile
            </Link>
          ) : (
            <Link to="/signup" className="btn-ghost text-base px-10 py-3.5">
              Create free account
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-sm font-medium text-slate-500"
        >
          {user ? (
            <div className="flex items-center gap-2">
              Welcome back, {user.username} 👋 — current streak:{' '}
              <span className="text-indigo-400 font-bold">{user.current_streak} 🔥</span>
            </div>
          ) : (
            'No credit card. Just code.'
          )}
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="py-24 space-y-24">
        <div className="container-custom grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Pin}
            title="Daily, pinned"
            description="Everyone gets the same problem each day. Solve it before the streak resets at midnight."
          />
          <FeatureCard
            icon={Zap}
            title="Run real tests"
            description="Submissions execute against hidden test cases. No vibes-based grading."
          />
          <FeatureCard
            icon={Trophy}
            title="Build a streak"
            description="Solve consecutive days to climb the leaderboard. Skip a day, lose your run."
          />
        </div>

        {/* Live Preview Strip */}
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Today's Challenges</h2>
            <div className="text-sm font-mono text-slate-500">
              {new Date().toISOString().split('T')[0]}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="card-border h-48 animate-pulse bg-slate-900/50" />
              ))
            ) : challenges.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-slate-500">
                Today's challenges drop soon.
              </div>
            ) : (
              challenges.map((resp) => (
                <Link
                  key={resp.challenge.id}
                  to={`/today?difficulty=${resp.challenge.difficulty}`}
                  className="card-border p-6 group hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Pill
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          resp.challenge.difficulty === 'easy' &&
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                          resp.challenge.difficulty === 'medium' &&
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                          resp.challenge.difficulty === 'hard' &&
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                        )}
                      >
                        {resp.challenge.difficulty}
                      </Pill>
                      <span className="text-[10px] font-mono text-slate-600">
                        #{resp.challenge.id}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 mb-2 truncate group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                      {resp.challenge.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mask-linear-gradient opacity-60">
                      {resp.challenge.prompt}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Solve <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Final CTA */}
        <div className="container-custom">
          <div className="relative rounded-2xl overflow-hidden p-12 text-center border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-950/20">
            <h2 className="text-3xl font-bold text-white mb-6">Your future self will thank you.</h2>
            <Link to="/today" className="btn-primary px-12 py-4">
              Start today's challenge
            </Link>
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 blur-[80px] rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
