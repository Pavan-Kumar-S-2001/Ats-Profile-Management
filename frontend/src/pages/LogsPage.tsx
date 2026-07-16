import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listLogs } from '../services/endpoints';
import { ScrollText } from 'lucide-react';

const typeColors: Record<string, string> = {
  Sync: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  Error: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  Auth: 'bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
  Download: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  Duplicate: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
};

export default function LogsPage() {
  const [type, setType] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['logs', type],
    queryFn: () => listLogs({ pageSize: 50, type: type || undefined }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Synchronization, errors, authentication, downloads, and duplicate-detection events
        </p>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/60"
        >
          <option value="">All Types</option>
          <option value="Sync">Sync</option>
          <option value="Error">Error</option>
          <option value="Auth">Auth</option>
          <option value="Download">Download</option>
          <option value="Duplicate">Duplicate</option>
        </select>
      </div>

      <div className="glass-panel divide-y divide-slate-200/50 p-2 dark:divide-white/10">
        {isLoading ? (
          <p className="p-6 text-center text-sm text-slate-500">Loading…</p>
        ) : data?.items.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-500">No log entries yet.</p>
        ) : (
          data?.items.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-3 py-3">
              <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[log.type] || 'bg-slate-200 text-slate-600'}`}>
                    {log.type}
                  </span>
                  <span className="text-[11px] text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-1 text-sm">{log.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
