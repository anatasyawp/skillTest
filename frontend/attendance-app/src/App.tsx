import { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck2,
  ClipboardCheck,
  LogOut,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import {
  AuthUser,
  clearToken,
  fetchProfile,
  getToken,
} from './api';
import { AttendanceSection } from './components/AttendanceSection';
import { MonitoringSection } from './components/MonitoringSection';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { LoginPage } from './components/LoginPage';
import { DexLogo } from './components/common/DexLogo';

type AppTab = 'employees' | 'attendances' | 'my-attendance';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

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

  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    applyDefaultTabForRole(authUser.role);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
    setActiveTab('my-attendance');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#800020]" />
          <span>Memverifikasi sesi DEXAsync...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isHrdAdmin = user.role === 'HRD_ADMIN';
  const displayName = user.employee?.fullName ?? user.email.split('@')[0];
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased flex flex-col">
      {/* Top Navigation Bar: Enterprise Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40">
        {/* Subtle Brand Color Accent Stripe */}
        <div className="h-[2px] bg-gradient-to-r from-[#800020] via-[#DC2626] to-[#800020]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-15 gap-4">
            {/* Left: Brand Identity & Desktop Navigation */}
            <div className="flex items-center gap-6">
              <DexLogo variant="light" size={30} />

              {/* Navigation Tabs (Desktop) */}
              {isHrdAdmin && (
                <nav aria-label="Menu navigasi HRD" className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab('employees')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'employees'
                        ? 'bg-slate-100 text-[#800020]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Data Karyawan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('attendances')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'attendances'
                        ? 'bg-slate-100 text-[#800020]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>Monitoring Absensi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('my-attendance')}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      activeTab === 'my-attendance'
                        ? 'bg-slate-100 text-[#800020]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>Presensi Mandiri</span>
                  </button>
                </nav>
              )}
            </div>

            {/* Right: Admin Profile & Actions */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 text-right pl-3">
                <div className="flex flex-col items-end leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 max-w-[160px] truncate">
                      {displayName}
                    </span>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        isHrdAdmin
                          ? 'bg-[#800020]/10 text-[#800020] border border-[#800020]/20'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {user.employee?.employeeCode ?? user.email}
                  </span>
                </div>

                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200/90 flex items-center justify-center text-xs font-bold text-slate-700">
                  {initials || <User className="w-4 h-4 text-slate-500" />}
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar dari sesi"
                className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-xs font-medium text-slate-600 transition-colors cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Sub-bar */}
        {isHrdAdmin && (
          <div className="md:hidden border-t border-slate-200/80 bg-slate-50/50 px-4 py-1.5 flex items-center justify-around">
            <button
              type="button"
              onClick={() => setActiveTab('employees')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'employees'
                  ? 'bg-white text-[#800020] shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Karyawan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('attendances')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'attendances'
                  ? 'bg-white text-[#800020] shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Monitoring
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-attendance')}
              className={`flex-1 py-1.5 text-center text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'my-attendance'
                  ? 'bg-white text-[#800020] shadow-2xs'
                  : 'text-slate-600'
              }`}
            >
              Presensi
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isHrdAdmin && (activeTab === 'employees' || activeTab === 'attendances') ? (
          <MonitoringSection
            user={user}
            mode={activeTab}
            onTabChange={setActiveTab}
            onPreviewPhoto={setPreviewPhotoUrl}
          />
        ) : (
          <AttendanceSection user={user} onPreviewPhoto={setPreviewPhotoUrl} />
        )}
      </main>

      {/* Photo Preview Modal */}
      <PhotoPreviewModal photoUrl={previewPhotoUrl} onClose={() => setPreviewPhotoUrl(null)} />
    </div>
  );
}
