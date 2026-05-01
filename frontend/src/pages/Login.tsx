import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Field, Card } from '../components/UI';
import { User } from '../types';
import { api, tokenStore } from '../lib/api';

export function Login({ setUser }: { setUser: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login({ email, password });
      tokenStore.set(data.access_token);
      setUser(data.user);
      navigate('/'); // Redirect to Hero
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-custom min-h-[80vh] flex items-center justify-center py-12">
      <Card className="w-full max-w-[440px] p-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome back</h1>
          <p className="text-slate-500 font-medium">Log in to keep your streak alive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Email Address" id="email">
            <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="name@company.com"
                    autoComplete="email"
                />
            </div>
          </Field>

          <Field label="Password" id="password">
            <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    autoComplete="current-password"
                />
            </div>
          </Field>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-xs text-rose-500 font-medium">
                {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Logging in...' : 'Log in'}
            {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-500 text-sm">
                No account? <Link to="/signup" className="text-indigo-400 hover:text-white transition-colors font-semibold">Sign up</Link>
            </p>
        </div>
      </Card>
    </div>
  );
}
