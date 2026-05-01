import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bolt, LogOut, Code2 } from 'lucide-react';
import { User } from '../types';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Today', path: '/today' },
    { label: 'Leaderboard', path: '/leaderboard' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="container-custom h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
              <Bolt className="w-5 h-5 text-white fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">DailyCode</span>
          </Link>

          <nav className="flex items-center gap-1 md:gap-4 transition-all">
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                    location.pathname === item.path
                      ? "text-white bg-slate-900 border border-slate-800/50"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-4 border-l border-slate-800/50 ml-4 pl-4 md:ml-6 md:pl-6">
              {user ? (
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 shadow-sm">
                  <Link 
                    to="/profile" 
                    className={cn(
                      "text-[13px] font-semibold transition-colors",
                      location.pathname === '/profile' ? "text-indigo-400" : "text-slate-300 hover:text-white"
                    )}
                  >
                    {user.username}
                  </Link>
                  <div className="h-4 w-px bg-slate-800" />
                  <button
                    onClick={onLogout}
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="btn-ghost text-sm">Log in</Link>
                  <Link to="/signup" className="btn-primary text-sm">Sign up</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="py-12 border-t border-slate-900 bg-slate-950/50 mt-20">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Code2 className="w-4 h-4" />
            <span>Daily Coding Challenge · FastAPI + React</span>
          </div>
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} DailyCode. Engineered for precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
