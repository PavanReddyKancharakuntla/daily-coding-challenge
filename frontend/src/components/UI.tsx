import React from 'react';
import { cn } from '../lib/utils';

export function Pill({ children, className, key }: { children: React.ReactNode; className?: string; key?: React.Key }) {
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider", className)}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    accepted: { label: 'Accepted', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    wrong_answer: { label: 'Wrong Answer', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
    error: { label: 'Error', className: 'bg-rose-500/10 text-rose-400 border border-rose-500/20' },
    runtime_error: { label: 'Runtime Error', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    compile_error: { label: 'Compile Error', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    tle: { label: 'TLE', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    pending: { label: 'Pending', className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20' },
  };

  const { label, className } = config[status] || config.pending;

  return <Pill className={className}>{label}</Pill>;
}

export function StatCard({ label, value, trend, trendColor }: { label: string; value: string | number; trend?: string; trendColor?: string }) {
  return (
    <div className="card-border p-6 flex flex-col gap-2 relative group transition-all hover:bg-slate-900/80">
      <span className="text-slate-500 text-xs font-medium uppercase tracking-wider font-display">{label}</span>
      <div className="flex items-baseline gap-3">
        <span className={cn("text-4xl font-bold tracking-tight text-white", trendColor)}>{value}</span>
        {trend && <span className="text-slate-500 text-sm">{trend}</span>}
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-indigo-500 to-transparent w-24 h-24 rounded-bl-full pointer-events-none" />
    </div>
  );
}

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="flex flex-col gap-1.5 flex-grow">
      {label && <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider px-1">{label}</span>}
      <pre className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-x-auto text-sm font-mono text-slate-300 min-h-[3rem]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function TagChip({ children, key }: { children: React.ReactNode, key?: React.Key }) {
  return (
    <span className="px-2 py-1 bg-slate-900/50 border border-slate-800 rounded text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-default">
      {children}
    </span>
  );
}

export function Field({ label, id, error, children }: { label: string; id: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">{label}</label>
      {children}
      {error && <span className="text-xs text-rose-500 pl-1">{error}</span>}
    </div>
  );
}

export function Card({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <div className={cn("bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden transition-all", className)}>
      {title && <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/40 font-semibold text-white uppercase text-[11px] tracking-widest">{title}</div>}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900/50 transition-all group flex flex-col items-start gap-4">
      <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all opacity-80">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
