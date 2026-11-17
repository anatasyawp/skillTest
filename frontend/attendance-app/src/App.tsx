import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  ClipboardCheck,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  AuthUser,
  clearToken,
  COMPANY_NAME,
  fetchProfile,
  getToken,
  login,
  setToken,
} from './api';
import { AttendanceSection } from './components/AttendanceSection';
import { MonitoringSection } from './components/MonitoringSection';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';

type AppTab = 'employees' | 'attendances' | 'my-attendance';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>('my-attendance');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  const applyDefaultTabForRole = (role: AuthUser['role']) => {
    setActiveTab(role === 'HRD_ADMIN' ? 'employees' : 'my-attendance');
  };

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }
    try {
      const profile = await fetchProfile();
      setUser(profile);
      applyDefaultTabForRole(profile.role);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setAuthChecking(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      setUser(res.user);
      applyDefaultTabForRole(res.user.role);
      setPassword('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login gagal.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setActiveTab('my-attendance');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="flex items-center gap-3 text-[#475569] text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0F766E]" />
          <span>Memeriksa sesi login...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-8">
        <div className="w-full max-w-md bg-white border border-[#CBD5E1] rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              {COMPANY_NAME}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#0F172A]">
              Portal Absensi &amp; Monitoring WFH
            </h1>
            <p className="mt-1.5 text-sm text-[#475569]">
              Masuk dengan akun perusahaan Anda. Tampilan dan akses menu otomatis disesuaikan
              berdasarkan role (RBAC).
            </p>
          </div>

          {loginError && (
            <div
              role="alert"
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-sm text-[#B91C1C]"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Email Perusahaan
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@company.local"
                className="w-full min-h-[44px] rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors duration-150 focus:border-[#0F766E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#0F172A] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[44px] rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2 text-sm text-[#0F172A] placeholder:text-[#94A3B8] transition-colors duration-150 focus:border-[#0F766E] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full min-h-[44px] rounded-lg bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-60 text-white text-sm font-semibold transition-colors duration-150 cursor-pointer"
            >
              {loginLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#475569] space-y-2">
            <p className="font-semibold text-[#0F172A]">Akun Demo (Klik untuk isi otomatis):</p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('budi.santoso@company.local');
                  setPassword('Password123!');
                }}
                className="text-left rounded-md border border-[#E2E8F0] bg-white hover:border-[#0F766E] px-2.5 py-2 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#0F172A]">Karyawan (EMPLOYEE):</span>{' '}
                <span className="font-mono-tabular">budi.santoso@company.local</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('hrd@company.local');
                  setPassword('Password123!');
                }}
                className="text-left rounded-md border border-[#E2E8F0] bg-white hover:border-[#0F766E] px-2.5 py-2 transition-colors cursor-pointer"
              >
                <span className="font-semibold text-[#0F172A]">HRD Admin (HRD_ADMIN):</span>{' '}
                <span className="font-mono-tabular">hrd@company.local</span>
              </button>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Password default: <span className="font-mono-tabular">Password123!</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isHrdAdmin = user.role === 'HRD_ADMIN';

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0F766E]">
              {COMPANY_NAME}
            </p>
            <h1 className="text-lg font-bold text-[#0F172A]">
              {isHrdAdmin ? 'Portal HRD & Absensi WFH' : 'Absensi WFH Karyawan'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-semibold text-[#0F172A]">
                  {user.employee?.fullName ?? user.email}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isHrdAdmin
                      ? 'bg-[#CCFBF1] text-[#0F766E]'
                      : 'bg-[#F1F5F9] text-[#334155]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
                </span>
              </div>
              <p className="text-xs text-[#475569]">
                <span className="font-mono-tabular">{user.employee?.employeeCode ?? '-'}</span>
                {user.employee ? ` · ${user.employee.department} · ${user.employee.position}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-lg border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-sm font-medium text-[#0F172A] transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#475569]" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* RBAC Navigation Tabs for HRD Admin */}
        {isHrdAdmin && (
          <nav
            aria-label="Menu utama HRD"
            className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-2 border-t border-[#E2E8F0]"
          >
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                activeTab === 'employees'
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Data Karyawan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendances')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                activeTab === 'attendances'
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Monitoring Absensi WFH</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('my-attendance')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                activeTab === 'my-attendance'
                  ? 'border-[#0F766E] text-[#0F766E]'
                  : 'border-transparent text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Absensi Saya</span>
            </button>
          </nav>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mobile user summary */}
        <div className="sm:hidden bg-white border border-[#E2E8F0] rounded-xl p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#0F172A]">
              {user.employee?.fullName ?? user.email}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                isHrdAdmin ? 'bg-[#CCFBF1] text-[#0F766E]' : 'bg-[#F1F5F9] text-[#334155]'
              }`}
            >
              {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-0.5">
            <span className="font-mono-tabular">{user.employee?.employeeCode ?? '-'}</span>
            {user.employee ? ` · ${user.employee.department} · ${user.employee.position}` : ''}
          </p>
        </div>

        {isHrdAdmin && (activeTab === 'employees' || activeTab === 'attendances') ? (
          <MonitoringSection mode={activeTab} onPreviewPhoto={setPreviewPhotoUrl} />
        ) : (
          <AttendanceSection onPreviewPhoto={setPreviewPhotoUrl} />
        )}
      </main>

      <PhotoPreviewModal photoUrl={previewPhotoUrl} onClose={() => setPreviewPhotoUrl(null)} />
    </div>
  );
}
