import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  CalendarDays,
  CalendarRange,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { getPublicSummary } from '../services/endpoints';
import { StatCard } from '../components/ui/StatCard';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function LandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['public-summary'],
    queryFn: getPublicSummary,
    refetchInterval: 60_000,
  });

  return (
    <div className="aurora-bg min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold shadow-md">
            A
          </div>
          <span className="font-semibold">ATS Resume System</span>
        </div>
        <Link
          to="/login"
          className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-slate-800 dark:bg-white dark:text-slate-900"
        >
          Admin Login <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section className="px-6 pb-4 pt-6 text-center sm:px-10">
        <div className="mx-auto mb-3 flex w-fit items-center gap-1.5 rounded-full bg-brand-100/70 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-400">
          <Sparkles className="h-3.5 w-3.5" /> Live sync from Microsoft OneDrive
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Recruiter Resume Intake, at a glance
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
          Real-time visibility into every recruiter's weekly resume uploads — synced automatically,
          zero manual tracking.
        </p>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-8">
        {isLoading || !data ? (
          <LoadingGrid />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              <StatCard label="Total Recruiters" value={data.totalRecruiters} icon={Users} accent="brand" delay={0} />
              <StatCard label="Total Resumes" value={data.totalResumes} icon={FileText} accent="sky" delay={50} />
              <StatCard label="Processed" value={data.totalProcessed} icon={CheckCircle2} accent="emerald" delay={100} />
              <StatCard label="Pending" value={data.pendingProcessing} icon={Clock} accent="amber" delay={150} />
              <StatCard label="Today's Uploads" value={data.todayUploads} icon={CalendarDays} accent="rose" delay={200} />
              <StatCard label="This Week" value={data.weekUploads} icon={CalendarRange} accent="brand" delay={250} />
              <StatCard label="This Month" value={data.monthUploads} icon={TrendingUp} accent="sky" delay={300} />
              <div className="glass-card animate-count-in flex flex-col justify-center p-5" style={{ animationDelay: '350ms' }}>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Last Sync
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {data.lastSyncTime ? formatDistanceToNow(new Date(data.lastSyncTime), { addSuffix: true }) : 'Never synced yet'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="glass-panel col-span-2 p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Recently Active Recruiters
                </h3>
                {data.recentRecruiters.length === 0 ? (
                  <p className="text-sm text-slate-500">No uploads yet.</p>
                ) : (
                  <ul className="divide-y divide-slate-200/60 dark:divide-white/10">
                    {data.recentRecruiters.map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium">{r.name}</p>
                          <p className="text-xs text-slate-500">{r.department || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-brand-600">{r.uploadCount} resumes</p>
                          <p className="text-xs text-slate-500">
                            {r.lastUpload ? formatDistanceToNow(new Date(r.lastUpload), { addSuffix: true }) : '—'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="glass-panel p-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Upload Volume by Recruiter
                </h3>
                {data.recentRecruiters.length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing to chart yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.recentRecruiters.map((r) => ({ name: r.name, uploads: r.uploadCount }))}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="uploads" radius={[6, 6, 0, 0]} fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass-card h-24 animate-pulse p-5">
          <div className="h-3 w-20 rounded bg-slate-300/60 dark:bg-slate-700" />
          <div className="mt-3 h-6 w-14 rounded bg-slate-300/60 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}
