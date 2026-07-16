import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const titleMap: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/recruiters': 'Recruiters',
  '/admin/resumes': 'Resumes',
  '/admin/reports': 'Reports',
  '/admin/logs': 'Sync & System Logs',
  '/admin/settings': 'Settings',
};

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = titleMap[location.pathname] ?? 'ATS Resume';

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="aurora-bg flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
