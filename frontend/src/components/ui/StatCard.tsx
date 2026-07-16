import type { LucideIcon } from 'lucide-react';
import { CountUp } from './CountUp';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: 'brand' | 'emerald' | 'amber' | 'rose' | 'sky';
  suffix?: string;
  delay?: number;
}

const accentMap = {
  brand: 'from-brand-500 to-brand-700 text-brand-600',
  emerald: 'from-emerald-400 to-emerald-600 text-emerald-600',
  amber: 'from-amber-400 to-amber-600 text-amber-600',
  rose: 'from-rose-400 to-rose-600 text-rose-600',
  sky: 'from-sky-400 to-sky-600 text-sky-600',
};

export function StatCard({ label, value, icon: Icon, accent = 'brand', suffix = '', delay = 0 }: StatCardProps) {
  return (
    <div
      className="glass-card animate-count-in p-5 transition-transform hover:-translate-y-1 hover:shadow-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            <CountUp value={value} />
            {suffix}
          </p>
        </div>
        <div className={`rounded-xl bg-gradient-to-br ${accentMap[accent]} bg-opacity-10 p-2.5`}>
          <Icon className={`h-5 w-5 ${accentMap[accent].split(' ').pop()}`} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
