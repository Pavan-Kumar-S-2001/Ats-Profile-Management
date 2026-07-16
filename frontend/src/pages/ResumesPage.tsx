import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Download, ExternalLink, FileDown, FileSpreadsheet } from 'lucide-react';
import { listResumes, resumeExportUrl } from '../services/endpoints';
import { StatusBadge } from './DashboardPage';

function bytesToSize(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function ResumesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['resumes', page, search, status],
    queryFn: () => listResumes({ page, pageSize: 10, search, status: status || undefined }),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const exportParams = { search, status: status || undefined };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="flex max-w-xs flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-slate-900/60">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search candidate or file…"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-900/60"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Processed">Processed</option>
            <option value="Failed">Failed</option>
          </select>
        </div>
        <div className="flex gap-2">
          <a
            href={resumeExportUrl('csv', exportParams as any)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800"
          >
            <FileDown className="h-4 w-4" /> CSV
          </a>
          <a
            href={resumeExportUrl('excel', exportParams as any)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/60 dark:hover:bg-slate-800"
          >
            <FileSpreadsheet className="h-4 w-4" /> Excel
          </a>
        </div>
      </div>

      <div className="glass-panel overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 text-xs uppercase text-slate-500 dark:border-white/10">
              <th className="px-3 py-3">Candidate</th>
              <th className="px-3 py-3">Recruiter</th>
              <th className="px-3 py-3">Uploaded</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Size</th>
              <th className="px-3 py-3">Pages</th>
              <th className="px-3 py-3 text-right">Links</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No resumes found.
                </td>
              </tr>
            ) : (
              data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="px-3 py-3 font-medium">
                    {r.candidateName || r.fileName}
                    {r.isDuplicate && (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        Duplicate
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-slate-500">{r.recruiter?.name}</td>
                  <td className="px-3 py-3 text-slate-500">{new Date(r.uploadDate).toLocaleDateString()}</td>
                  <td className="px-3 py-3">
                    <StatusBadge status={r.processingStatus} />
                  </td>
                  <td className="px-3 py-3 text-slate-500">{bytesToSize(r.fileSizeBytes)}</td>
                  <td className="px-3 py-3 text-slate-500">{r.pageCount ?? '—'}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.oneDriveWebUrl && (
                        <a
                          href={r.oneDriveWebUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open in OneDrive"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {r.downloadUrl && (
                        <a
                          href={r.downloadUrl}
                          title="Download"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {page} of {totalPages} · {data.total} resumes
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
