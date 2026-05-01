import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';
import { CodeBlock, TagChip, Card } from '../components/UI';
import { ChallengeResponse, User, Submission, Difficulty } from '../types';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface Props {
  user: User | null;
  setUser: (user: User) => void;
}

export function Today({ user, setUser }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const difficulty = (searchParams.get('difficulty') as Difficulty) || 'medium';

  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch challenge whenever difficulty changes.
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setSubmissionResult(null);
    setSubmitError(null);
    setCode('');
    api
      .todaysChallenge(difficulty)
      .then((d) => {
        setData(d);
        // Sync the language picker with the challenge's preferred language.
        if (d.challenge.language) setLanguage(d.challenge.language);
      })
      .catch((err) => setError(err?.message || 'Could not load challenge'))
      .finally(() => setIsLoading(false));
  }, [difficulty]);

  const loadStarter = () => {
    if (data?.challenge.starter_code) setCode(data.challenge.starter_code);
  };

  const handleSubmit = async () => {
    if (!user || !data) return;
    if (!code.trim()) {
      setSubmitError('Write some code before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmissionResult(null);
    setSubmitError(null);
    try {
      const result = await api.submit({
        challenge_id: data.challenge.id,
        language,
        code,
      });
      setSubmissionResult(result);

      // If accepted, refresh /me so the streak/score in the result panel + nav are current.
      if (result.status === 'accepted') {
        try {
          const fresh = await api.me();
          setUser(fresh);
        } catch {
          // non-fatal — leaderboard/profile will refresh on next visit
        }
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6 animate-pulse">
            <div className="h-10 w-48 bg-slate-900 rounded-lg" />
            <div className="h-[400px] bg-slate-900 rounded-xl" />
          </div>
          <div className="h-[500px] animate-pulse bg-slate-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-custom py-24 text-center">
        <div className="mb-4 text-slate-500">
          {error || "Today's challenges drop soon."}
        </div>
        <Link to="/" className="text-indigo-400 hover:underline">
          Back to safety
        </Link>
      </div>
    );
  }

  const { challenge } = data;
  const tagList = (challenge.tags || '').split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div className="container-custom py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Challenge Details */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl w-fit border border-slate-800">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setSearchParams({ difficulty: d })}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all',
                  difficulty === d
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300',
                )}
              >
                {d}
              </button>
            ))}
          </div>

          <Card className="p-8">
            <div className="flex flex-col gap-4">
              <div className="text-xs font-mono text-slate-500 uppercase tracking-widest flex items-center gap-3">
                <span>{data.challenge_date}</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="text-slate-400 font-bold">{difficulty}</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3" /> {challenge.source}
                </span>
              </div>

              <h1 className="text-3xl font-black text-white tracking-tight">{challenge.title}</h1>

              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {challenge.prompt}
              </div>

              <div className="pt-6 border-t border-slate-800 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">
                  Sample Test Cases
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {challenge.sample_test_cases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-slate-900/50 px-2 py-0.5 rounded">
                          Ex {idx + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CodeBlock label="stdin" code={tc.stdin} />
                        <CodeBlock label="expected stdout" code={tc.expected_stdout} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4">
                  {tagList.map((tag) => (
                    <TagChip key={tag}>{tag}</TagChip>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Code Editor */}
        <div className="flex flex-col gap-6 sticky top-28">
          <div className="card-border bg-slate-900 flex flex-col">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-300 outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="cpp">C++</option>
                  <option value="java">Java</option>
                  <option value="go">Go</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadStarter}
                  disabled={!challenge.starter_code}
                  className="text-xs font-semibold text-slate-500 hover:text-indigo-400 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Load starter code
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !user}
                  className={cn(
                    'btn-primary py-1.5 px-4 text-xs flex items-center gap-2',
                    (!user || isSubmitting) && 'opacity-50 cursor-not-allowed grayscale',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      {user ? 'Submit' : 'Log in to submit'}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              {!code && (
                <div className="absolute inset-0 flex items-center justify-center p-8 text-center pointer-events-none">
                  <div className="max-w-[280px] space-y-2 opacity-30">
                    <Code2 className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-sm">Click "Load starter code" to begin your challenge.</p>
                  </div>
                </div>
              )}
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-[480px] bg-slate-950 font-mono text-sm p-6 outline-none text-indigo-100 placeholder:text-slate-800 resize-none"
                placeholder="Write your code here..."
                spellCheck={false}
              />
            </div>
          </div>

          {/* Submit error banner (network / server error, before any test ran) */}
          {submitError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
              {submitError}
            </div>
          )}

          {/* Results Panel */}
          <AnimatePresence>
            {submissionResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'rounded-xl border p-6 flex flex-col gap-4',
                  submissionResult.status === 'accepted'
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : submissionResult.status === 'wrong_answer'
                    ? 'bg-rose-500/10 border-rose-500/20'
                    : 'bg-amber-500/10 border-amber-500/20',
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {submissionResult.status === 'accepted' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : (
                      <AlertCircle
                        className={cn(
                          'w-6 h-6',
                          submissionResult.status === 'wrong_answer'
                            ? 'text-rose-500'
                            : 'text-amber-500',
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        'text-lg font-bold capitalize',
                        submissionResult.status === 'accepted'
                          ? 'text-emerald-500'
                          : submissionResult.status === 'wrong_answer'
                          ? 'text-rose-500'
                          : 'text-amber-500',
                      )}
                    >
                      {submissionResult.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm font-mono opacity-80">
                    {submissionResult.passed_count} / {submissionResult.total_count} passed
                    {submissionResult.runtime_ms != null &&
                      ` · ${submissionResult.runtime_ms.toFixed(1)} ms`}
                  </div>
                </div>

                {submissionResult.status === 'accepted' && submissionResult.score_awarded > 0 && (
                  <div className="flex items-center gap-4 py-2 border-y border-emerald-500/10 text-emerald-400 font-bold text-sm">
                    <span>+{submissionResult.score_awarded} points</span>
                    <span className="w-1 h-1 rounded-full bg-emerald-500/30" />
                    <span>streak: {user?.current_streak ?? 0} 🔥</span>
                  </div>
                )}

                {submissionResult.status === 'accepted' && submissionResult.score_awarded === 0 && (
                  <div className="text-xs text-emerald-400/80 italic">
                    Already counted today — no new points, but nice consistency.
                  </div>
                )}

                {submissionResult.stderr && (
                  <pre className="bg-black/20 p-4 rounded-lg text-xs font-mono text-slate-400 overflow-x-auto max-h-48">
                    {submissionResult.stderr}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Code2({ className }: { className?: string }) {
  return (
    <svg fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
    </svg>
  );
}
