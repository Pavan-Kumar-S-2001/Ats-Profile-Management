import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, RefreshCw, Pencil, Trash2, X } from 'lucide-react';
import {
  listRecruiters,
  createRecruiter,
  updateRecruiter,
  deleteRecruiter,
  syncOne,
} from '../services/endpoints';
import type { Recruiter } from '../types';
import toast from '../lib/toast';

const emptyForm = {
  name: '',
  email: '',
  department: '',
  oneDriveFolderName: '',
  folderPath: '',
  status: 'Active' as 'Active' | 'Inactive',
};

export default function RecruitersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Recruiter | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['recruiters', page, search, status],
    queryFn: () => listRecruiters({ page, pageSize: 10, search, status: status || undefined }),
  });

  const createMut = useMutation({
    mutationFn: createRecruiter,
    onSuccess: () => {
      toast.success('Recruiter created');
      qc.invalidateQueries({ queryKey: ['recruiters'] });
      closeModal();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || 'Failed to create recruiter'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Recruiter> }) => updateRecruiter(id, payload),
    onSuccess: () => {
      toast.success('Recruiter updated');
      qc.invalidateQueries({ queryKey: ['recruiters'] });
      closeModal();
    },
    onError: () => toast.error('Failed to update recruiter'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteRecruiter,
    onSuccess: () => {
      toast.success('Recruiter deleted');
      qc.invalidateQueries({ queryKey: ['recruiters'] });
    },
    onError: () => toast.error('Failed to delete recruiter'),
  });

  const syncMut = useMutation({
    mutationFn: syncOne,
    onSuccess: () => {
      toast.success('Sync started');
      qc.invalidateQueries({ queryKey: ['recruiters'] });
    },
    onError: () => toast.error('Failed to start sync'),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(r: Recruiter) {
    setEditing(r);
    setForm({
      name: r.name,
      email: r.email,
      department: r.department || '',
      oneDriveFolderName: r.oneDriveFolderName,
      folderPath: r.folderPath,
      status: r.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      updateMut.mutate({ id: editing.id, payload: form });
    } else {
      createMut.mutate(form);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

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
              placeholder="Search recruiters…"
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30"
        >
          <Plus className="h-4 w-4" /> Add Recruiter
        </button>
      </div>

      <div className="glass-panel overflow-x-auto p-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200/60 text-xs uppercase text-slate-500 dark:border-white/10">
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Email</th>
              <th className="px-3 py-3">Department</th>
              <th className="px-3 py-3">Folder</th>
              <th className="px-3 py-3">Uploads</th>
              <th className="px-3 py-3">Sync Status</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No recruiters found.
                </td>
              </tr>
            ) : (
              data?.items.map((r) => (
                <tr key={r.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="px-3 py-3 font-medium">{r.name}</td>
                  <td className="px-3 py-3 text-slate-500">{r.email}</td>
                  <td className="px-3 py-3 text-slate-500">{r.department || '—'}</td>
                  <td className="px-3 py-3 text-slate-500">{r.oneDriveFolderName}</td>
                  <td className="px-3 py-3">{r.uploadCount}</td>
                  <td className="px-3 py-3">
                    <SyncBadge status={r.syncStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        r.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        title="Sync now"
                        onClick={() => syncMut.mutate(r.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => openEdit(r)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete recruiter "${r.name}"?`)) deleteMut.mutate(r.id);
                        }}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-100/60 dark:hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
            Page {page} of {totalPages} · {data.total} recruiters
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold">{editing ? 'Edit Recruiter' : 'Add Recruiter'}</h3>
              <button onClick={closeModal} className="rounded-lg p-1 hover:bg-slate-200/60 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Field label="Name">
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </Field>
              <Field label="Email">
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
              </Field>
              <Field label="Department">
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" />
              </Field>
              <Field label="OneDrive Folder Name">
                <input required value={form.oneDriveFolderName} onChange={(e) => setForm({ ...form, oneDriveFolderName: e.target.value })} className="input" />
              </Field>
              <Field label="Folder Path">
                <input required value={form.folderPath} onChange={(e) => setForm({ ...form, folderPath: e.target.value })} className="input" placeholder="/Recruiters/Ajay" />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="input">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </Field>
              <button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="mt-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
              >
                {editing ? 'Save Changes' : 'Create Recruiter'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
      {label}
      {children}
    </label>
  );
}

function SyncBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Synced: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    Syncing: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
    Failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
    'Never Synced': 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  };
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${map[status] || ''}`}>{status}</span>;
}
