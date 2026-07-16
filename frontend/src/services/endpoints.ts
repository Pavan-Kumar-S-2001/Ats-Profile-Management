import { api, setTokens, clearTokens } from './api';
import type {
  Recruiter,
  Resume,
  PublicSummary,
  AdminSummary,
  LogEntry,
  AppSettings,
} from '../types';

// ---- Auth ----
export async function login(username: string, password: string) {
  const { data } = await api.post('/auth/login', { username, password });
  setTokens(data.accessToken, data.refreshToken);
  return data.admin as { id: string; username: string };
}

export async function logout() {
  const refreshToken = localStorage.getItem('ats_refresh_token');
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    clearTokens();
  }
}

// ---- Dashboard ----
export async function getPublicSummary() {
  const { data } = await api.get<PublicSummary>('/dashboard/public');
  return data;
}

export async function getAdminSummary() {
  const { data } = await api.get<AdminSummary>('/dashboard/admin');
  return data;
}

// ---- Recruiters ----
export interface RecruiterQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listRecruiters(query: RecruiterQuery = {}) {
  const { data } = await api.get<{ items: Recruiter[]; total: number; page: number; pageSize: number }>(
    '/recruiters',
    { params: query }
  );
  return data;
}

export async function getRecruiter(id: string) {
  const { data } = await api.get(`/recruiters/${id}`);
  return data;
}

export async function createRecruiter(payload: Partial<Recruiter>) {
  const { data } = await api.post('/recruiters', payload);
  return data as Recruiter;
}

export async function updateRecruiter(id: string, payload: Partial<Recruiter>) {
  const { data } = await api.put(`/recruiters/${id}`, payload);
  return data as Recruiter;
}

export async function deleteRecruiter(id: string) {
  await api.delete(`/recruiters/${id}`);
}

// ---- Resumes ----
export interface ResumeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  recruiterId?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export async function listResumes(query: ResumeQuery = {}) {
  const { data } = await api.get<{ items: Resume[]; total: number; page: number; pageSize: number }>(
    '/resumes',
    { params: query }
  );
  return data;
}

export function resumeExportUrl(format: 'csv' | 'excel', query: ResumeQuery = {}) {
  const params = new URLSearchParams(query as Record<string, string>).toString();
  return `/api/resumes/export/${format}${params ? `?${params}` : ''}`;
}

// ---- Sync ----
export async function syncAll() {
  const { data } = await api.post('/sync/all');
  return data;
}

export async function syncOne(id: string) {
  const { data } = await api.post(`/sync/${id}`);
  return data;
}

export async function getSyncStatus() {
  const { data } = await api.get('/sync/status');
  return data;
}

// ---- Settings ----
export async function getSettings() {
  const { data } = await api.get<AppSettings>('/settings');
  return data;
}

export async function saveSettings(payload: AppSettings) {
  const { data } = await api.put('/settings', payload);
  return data;
}

export async function testConnection() {
  const { data } = await api.post('/settings/test-connection');
  return data as { ok: boolean; driveName?: string; driveType?: string; error?: string };
}

// ---- Logs ----
export async function listLogs(params: { page?: number; pageSize?: number; type?: string } = {}) {
  const { data } = await api.get<{ items: LogEntry[]; total: number }>('/logs', { params });
  return data;
}

// ---- Reports ----
export function reportUrl(format: 'excel' | 'pdf', params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return `/api/reports/${format}${qs ? `?${qs}` : ''}`;
}
