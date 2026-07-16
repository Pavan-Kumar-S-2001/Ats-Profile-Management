import { FileSpreadsheet, FileText } from 'lucide-react';
import { reportUrl } from '../services/endpoints';

const reports = [
  { key: 'all', label: 'Recruiter Report (All-Time)', desc: 'Upload activity per recruiter, all-time' },
  { key: 'weekly', label: 'Weekly Report', desc: 'Uploads for the current week' },
  { key: 'monthly', label: 'Monthly Report', desc: 'Uploads for the current month' },
  { key: 'yearly', label: 'Yearly Report', desc: 'Uploads for the current year' },
];

export default function ReportsPage() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {reports.map((r) => (
        <div key={r.key} className="glass-panel p-5">
          <h3 className="text-sm font-semibold">{r.label}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
          <div className="mt-4 flex gap-2">
            <a
              href={reportUrl('excel', { period: r.key })}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </a>
            <a
              href={reportUrl('pdf', { period: r.key })}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
