import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Save, PlugZap, CheckCircle2, XCircle } from 'lucide-react';
import { getSettings, saveSettings, testConnection } from '../services/endpoints';
import type { AppSettings } from '../types';
import toast from '../lib/toast';

const empty: AppSettings = {
  MS_TENANT_ID: '',
  MS_CLIENT_ID: '',
  MS_CLIENT_SECRET: '',
  MS_DRIVE_ID: '',
  MS_PARENT_FOLDER: 'Recruiters',
  SYNC_INTERVAL_MINUTES: '15',
};

export default function SettingsPage() {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [form, setForm] = useState<AppSettings>(empty);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (data) setForm({ ...empty, ...data });
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () => saveSettings(form),
    onSuccess: () => toast.success('Settings saved'),
    onError: () => toast.error('Failed to save settings'),
  });

  const testMut = useMutation({
    mutationFn: testConnection,
    onSuccess: (res: any) => {
      setTestResult(res);
      res.ok ? toast.success(`Connected to drive "${res.driveName}"`) : toast.error(res.error || 'Connection failed');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Connection failed';
      setTestResult({ ok: false, error: msg });
      toast.error(msg);
    },
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="glass-panel p-6">
        <h3 className="mb-1 text-base font-semibold">Microsoft Graph Credentials</h3>
        <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
          From your Azure App Registration. See the README for step-by-step setup.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMut.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Field label="Tenant ID">
            <input className="input" value={form.MS_TENANT_ID} onChange={(e) => setForm({ ...form, MS_TENANT_ID: e.target.value })} />
          </Field>
          <Field label="Client ID">
            <input className="input" value={form.MS_CLIENT_ID} onChange={(e) => setForm({ ...form, MS_CLIENT_ID: e.target.value })} />
          </Field>
          <Field label="Client Secret">
            <input
              className="input"
              type="password"
              value={form.MS_CLIENT_SECRET}
              onChange={(e) => setForm({ ...form, MS_CLIENT_SECRET: e.target.value })}
              placeholder="••••••••••••"
            />
          </Field>
          <Field label="Drive ID">
            <input className="input" value={form.MS_DRIVE_ID} onChange={(e) => setForm({ ...form, MS_DRIVE_ID: e.target.value })} />
          </Field>
          <Field label="Parent Folder">
            <input className="input" value={form.MS_PARENT_FOLDER} onChange={(e) => setForm({ ...form, MS_PARENT_FOLDER: e.target.value })} />
          </Field>
          <Field label="Sync Interval (minutes)">
            <input
              className="input"
              type="number"
              min={5}
              value={form.SYNC_INTERVAL_MINUTES}
              onChange={(e) => setForm({ ...form, SYNC_INTERVAL_MINUTES: e.target.value })}
            />
          </Field>

          {testResult && (
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                testResult.ok
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              {testResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {testResult.ok ? `Connected successfully` : testResult.error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saveMut.isPending}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              <Save className="h-4 w-4" /> Save Settings
            </button>
            <button
              type="button"
              onClick={() => testMut.mutate()}
              disabled={testMut.isPending}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 disabled:opacity-60 dark:border-white/10 dark:hover:bg-slate-800"
            >
              <PlugZap className="h-4 w-4" /> {testMut.isPending ? 'Testing…' : 'Test Connection'}
            </button>
          </div>
        </form>
      </div>
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
