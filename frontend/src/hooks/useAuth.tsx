import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import * as api from '../services/endpoints';

interface AdminUser {
  id: string;
  username: string;
}

interface AuthContextValue {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('ats_admin');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (username: string, password: string) => {
    const admin = await api.login(username, password);
    localStorage.setItem('ats_admin', JSON.stringify(admin));
    setAdmin(admin);
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    localStorage.removeItem('ats_admin');
    setAdmin(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin, isAuthenticated: !!admin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
