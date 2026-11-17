import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  ClipboardCheck,
  Eye,
  EyeOff,
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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] px-4">
        <div className="flex items-center gap-3 text-[#6E4A3E] text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#D1510A]" />
          <span>Memeriksa sesi login...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3A0B07] via-[#7E2908] to-[#D1510A] flex items-stretch justify-center md:p-6">
        <div className="w-full max-w-6xl bg-gradient-to-br from-[#EC8C0E]/20 via-[#D2BBAE] to-[#EADCD3] md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl border border-[#EC8C0E]/30">
          {/* Top Banner on Mobile / Left Illustration Panel on Desktop */}
          <div className="w-full h-44 sm:h-56 md:h-auto md:w-[54%] relative bg-[#D2BBAE] flex items-center justify-center overflow-hidden shrink-0">
            <img
              src="/wfh-illustration.jpg"
              alt="Ilustrasi karyawan bekerja dari rumah"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Bottom Sheet on Mobile / Right White Card Panel on Desktop */}
          <div className="relative z-10 flex-1 w-full md:w-[46%] bg-white rounded-t-3xl -mt-5 md:mt-0 md:rounded-t-none md:rounded-l-3xl flex flex-col justify-center px-5 sm:px-10 md:px-12 py-7 sm:py-10 md:py-12">
            <div className="w-full max-w-sm mx-auto">
              {/* Brand */}
              <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                <span
                  aria-hidden="true"
                  className="inline-block w-3 h-3 rounded-xs bg-[#D1510A]"
                />
                <span className="text-base font-bold tracking-tight text-[#3A0B07]">
                  {COMPANY_NAME}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#3A0B07] tracking-tight">
                Masuk ke Akun
              </h1>
              <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-center text-[#6E4A3E]">
                Portal absensi WFH &amp; monitoring karyawan
              </p>

              {loginError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email Perusahaan
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email perusahaan"
                    className="w-full min-h-[48px] rounded-full border border-[#D2BBAE] bg-white px-5 py-2.5 text-sm text-[#3A0B07] placeholder:text-[#A68B7E] transition-colors duration-150 focus:border-[#D1510A] focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full min-h-[48px] rounded-full border border-[#D2BBAE] bg-white pl-5 pr-12 py-2.5 text-sm text-[#3A0B07] placeholder:text-[#A68B7E] transition-colors duration-150 focus:border-[#D1510A] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full text-[#6E4A3E] hover:text-[#3A0B07] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full min-h-[48px] rounded-full bg-gradient-to-r from-[#7E2908] via-[#9A3409] to-[#7E2908] hover:from-[#3A0B07] hover:to-[#7E2908] text-white disabled:opacity-60 text-sm font-bold shadow-sm transition-all duration-150 cursor-pointer"
                >
                  {loginLoading ? 'Memproses...' : 'Masuk'}
                </button>
              </form>

              <div className="mt-7 pt-5 border-t border-[#EADCD3]">
                <p className="text-xs font-medium text-center text-[#6E4A3E] mb-3">
                  Akun demo cepat (password: <span className="font-mono-tabular">Password123!</span>)
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('budi.santoso@company.local');
                      setPassword('Password123!');
                    }}
                    className="min-h-[44px] rounded-full border border-[#D2BBAE] bg-[#FAF6F3] hover:border-[#D1510A] px-3 py-2 text-xs font-semibold text-[#3A0B07] transition-colors cursor-pointer"
                  >
                    Karyawan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('hrd@company.local');
                      setPassword('Password123!');
                    }}
                    className="min-h-[44px] rounded-full border border-[#D2BBAE] bg-[#FAF6F3] hover:border-[#D1510A] px-3 py-2 text-xs font-semibold text-[#3A0B07] transition-colors cursor-pointer"
                  >
                    HRD Admin
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isHrdAdmin = user.role === 'HRD_ADMIN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF6F3] via-[#F5EAE2] to-[#EADCD3] text-[#3A0B07]">
      {/* Top Bar */}
      <header className="bg-white/95 border-b border-[#D2BBAE] shadow-xs">
        <div className="h-1.5 bg-gradient-to-r from-[#3A0B07] via-[#D1510A] to-[#EC8C0E]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-block w-3 h-3 rounded-xs bg-[#D1510A]"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-[#3A0B07] leading-tight">
                {COMPANY_NAME}
              </h1>
              <p className="text-xs text-[#6E4A3E]">
                {isHrdAdmin ? 'Monitoring Karyawan & Absensi WFH' : 'Absensi WFH Karyawan'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm font-semibold text-[#3A0B07]">
                  {user.employee?.fullName ?? user.email}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                    isHrdAdmin
                      ? 'bg-[#EC8C0E] text-[#3A0B07]'
                      : 'bg-[#EADCD3] text-[#3A0B07]'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
                </span>
              </div>
              <p className="text-xs text-[#6E4A3E]">
                <span className="font-mono-tabular">{user.employee?.employeeCode ?? '-'}</span>
                {user.employee ? ` · ${user.employee.department} · ${user.employee.position}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-sm font-medium text-[#3A0B07] transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-[#7E2908]" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* RBAC Navigation Tabs for HRD Admin */}
        {isHrdAdmin && (
          <nav
            aria-label="Menu utama HRD"
            className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap gap-2 border-t border-[#EADCD3]"
          >
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 text-sm font-semibold border-b-2 transition-colors duration-150 cursor-pointer ${
                activeTab === 'employees'
                  ? 'border-[#D1510A] text-[#7E2908]'
                  : 'border-transparent text-[#6E4A3E] hover:text-[#3A0B07]'
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
                  ? 'border-[#D1510A] text-[#7E2908]'
                  : 'border-transparent text-[#6E4A3E] hover:text-[#3A0B07]'
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
                  ? 'border-[#D1510A] text-[#7E2908]'
                  : 'border-transparent text-[#6E4A3E] hover:text-[#3A0B07]'
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
        <div className="sm:hidden bg-white border border-[#D2BBAE] rounded-lg p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#3A0B07]">
              {user.employee?.fullName ?? user.email}
            </p>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                isHrdAdmin ? 'bg-[#EC8C0E] text-[#3A0B07]' : 'bg-[#EADCD3] text-[#3A0B07]'
              }`}
            >
              {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
            </span>
          </div>
          <p className="text-xs text-[#6E4A3E] mt-0.5">
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
