import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  HardDrive,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { getAdminSummary, syncAll } from '../services/endpoints';
import { StatCard } from '../components/ui/StatCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import toast from '../lib/toast';

const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

function bytesToSize(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-summary'], queryFn: getAdminSummary });

  const syncMutation = useMutation({
    mutationFn: syncAll,
    onSuccess: () => {
      toast.success('Sync started for all recruiters');
      qc.invalidateQueries({ queryKey: ['admin-summary'] });
    },
    onError: () => toast.error('Failed to trigger sync'),
  });

  if (isLoading || !data) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Overview of recruiter uploads and processing status
        </p>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing…' : 'Sync All Recruiters'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Recruiters" value={data.totalRecruiters} icon={Users} accent="brand" />
        <StatCard label="Total Uploaded PDFs" value={data.totalUploadedPdfs} icon={FileText} accent="sky" />
        <StatCard label="Processed" value={data.totalProcessed} icon={CheckCircle2} accent="emerald" />
        <StatCard label="Pending" value={data.pending} icon={Clock} accent="amber" />
        <div className="glass-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Storage Used
          </p>
          <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
            <HardDrive className="h-5 w-5 text-brand-500" />
            {bytesToSize(data.storageUsedBytes)}
          </p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Success Rate
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{data.successRate}%</p>
        </div>
        <div className="glass-card p-5">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top Recruiter
          </p>
          <p className="mt-2 text-lg font-bold">{data.topRecruiter?.name ?? '—'}</p>
          <p className="text-xs text-slate-500">{data.topRecruiter?.uploads ?? 0} uploads</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Average Uploads
          </p>
          <p className="mt-2 text-2xl font-bold">{data.averageUploads}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-panel col-span-2 p-5">
          <h3 className="mb-4 text-sm font-semibold">Monthly Upload Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.charts.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-5">
          <h3 className="mb-4 text-sm font-semibold">Processing Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.charts.processingStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {data.charts.processingStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={30} iconSize={8} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-5">
        <h3 className="mb-4 text-sm font-semibold">Recruiter Upload Comparison</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.charts.recruiterComparison}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="uploads" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-panel p-5">
        <h3 className="mb-4 text-sm font-semibold">Latest Uploads</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/60 text-xs uppercase text-slate-500 dark:border-white/10">
                <th className="pb-2">Candidate</th>
                <th className="pb-2">Recruiter</th>
                <th className="pb-2">Uploaded</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
              {data.latestUploads.map((r) => (
                <tr key={r.id}>
                  <td className="py-2.5">{r.candidateName || r.fileName}</td>
                  <td className="py-2.5 text-slate-500">{r.recruiter?.name}</td>
                  <td className="py-2.5 text-slate-500">
                    {formatDistanceToNow(new Date(r.uploadDate), { addSuffix: true })}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={r.processingStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Processed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    Processing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
