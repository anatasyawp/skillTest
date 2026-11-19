import { ReactNode, useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck2,
  ClipboardCheck,
  LogOut,
  Plus,
  RefreshCw,
  Upload,
  User,
  Users,
} from 'lucide-react';
import { AuthUser, clearToken, fetchProfile, getToken } from './api';
import { AttendanceSection } from './components/AttendanceSection';
import { MonitoringSection } from './components/MonitoringSection';
import { PhotoPreviewModal } from './components/PhotoPreviewModal';
import { LoginPage } from './components/LoginPage';

type AppTab = 'employees' | 'attendances' | 'my-attendance';

interface RailTooltipProps {
  label: string;
  children: ReactNode;
  offsetClass?: string;
}

function RailTooltip({ label, children, offsetClass = 'left-full ml-3' }: RailTooltipProps) {
  return (
    <div className="relative group flex items-center justify-center">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none invisible group-hover:visible absolute ${offsetClass} top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-xl bg-[#2A040A] px-3 py-1.5 text-xs font-bold text-white shadow-lg opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150`}
      >
        <span
          aria-hidden="true"
          className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#2A040A]"
        />
        {label}
      </span>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const [activeTab, setActiveTab] = useState<AppTab>('my-attendance');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [pendingQuickAdd, setPendingQuickAdd] = useState(false);

  const applyDefaultTabForRole = (role: AuthUser['role']) => {
    setPendingQuickAdd(false);
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
    setPendingQuickAdd(false);
    setActiveTab('my-attendance');
  };

  const handleQuickAddEmployee = () => {
    setActiveTab('employees');
    setPendingQuickAdd(true);
  };

  const handleQuickAddConsumed = useCallback(() => {
    setPendingQuickAdd(false);
  }, []);

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="flex items-center gap-3 text-[#634E53] text-sm font-medium">
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
    <div className="min-h-screen bg-white text-[#2A040A] antialiased flex flex-col lg:flex-row">
      {/* DESKTOP LEFT FLOATING DARK PILL RAIL */}
      <aside
        aria-label="Navigasi Utama"
        className="hidden lg:flex flex-col items-center w-[84px] shrink-0 py-5 px-3 gap-4 sticky top-0 h-screen bg-white z-30"
      >
        {/* Top Circular Brand Badge */}
        <RailTooltip label="DEXAsync · Beranda">
          <button
            type="button"
            onClick={() => {
              setPendingQuickAdd(false);
              setActiveTab(isHrdAdmin ? 'employees' : 'my-attendance');
            }}
            aria-label="DEXAsync Beranda"
            className="h-12 w-12 rounded-full bg-[#2A040A] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#4A0712] transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6.5 9.5C6.5 8.11929 7.61929 7 9 7H14C16.2091 7 18 8.79086 18 11C18 12.1046 17.1046 13 16 13H9"
                stroke="#FBE8EC"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M17.5 14.5C17.5 15.8807 16.3807 17 15 17H10C7.79086 17 6 15.2091 6 13C6 11.8954 6.89543 11 8 11H15"
                stroke="#DC2626"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </RailTooltip>

        {/* Floating Dark Capsule Rail */}
        <div className="flex-1 w-[56px] bg-[#2A040A] rounded-full py-5 flex flex-col items-center justify-between">
          <nav className="flex flex-col items-center gap-3 w-full">
            {isHrdAdmin ? (
              <>
                <RailTooltip label="Data Karyawan">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingQuickAdd(false);
                      setActiveTab('employees');
                    }}
                    aria-label="Data Karyawan"
                    className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                      activeTab === 'employees'
                        ? 'bg-[#800020] text-white'
                        : 'text-[#E7D8DC] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Users className="w-[19px] h-[19px]" />
                  </button>
                </RailTooltip>

                {/* Signature Notched Quick-Add Button */}
                <div className="relative my-1 flex items-center justify-center w-full">
                  <RailTooltip label="Tambah Karyawan Baru" offsetClass="left-full ml-6">
                    <div className="bg-white p-1.5 rounded-full translate-x-3 shadow-xs">
                      <button
                        type="button"
                        onClick={handleQuickAddEmployee}
                        aria-label="Tambah Karyawan Baru"
                        className="h-10 w-10 rounded-full bg-[#FBE8EC] hover:bg-[#F5CFD8] text-[#800020] inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-5 h-5 stroke-[2.5]" />
                      </button>
                    </div>
                  </RailTooltip>
                </div>

                <RailTooltip label="Monitoring Absensi">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingQuickAdd(false);
                      setActiveTab('attendances');
                    }}
                    aria-label="Monitoring Absensi"
                    className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                      activeTab === 'attendances'
                        ? 'bg-[#800020] text-white'
                        : 'text-[#E7D8DC] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <CalendarCheck2 className="w-[19px] h-[19px]" />
                  </button>
                </RailTooltip>

                <RailTooltip label="Presensi Mandiri">
                  <button
                    type="button"
                    onClick={() => {
                      setPendingQuickAdd(false);
                      setActiveTab('my-attendance');
                    }}
                    aria-label="Presensi Mandiri"
                    className={`h-11 w-11 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                      activeTab === 'my-attendance'
                        ? 'bg-[#800020] text-white'
                        : 'text-[#E7D8DC] hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <ClipboardCheck className="w-[19px] h-[19px]" />
                  </button>
                </RailTooltip>
              </>
            ) : (
              <>
                <RailTooltip label="Presensi WFH">
                  <button
                    type="button"
                    onClick={() => setActiveTab('my-attendance')}
                    aria-label="Presensi WFH"
                    className="h-11 w-11 rounded-full bg-[#800020] text-white inline-flex items-center justify-center cursor-pointer"
                  >
                    <ClipboardCheck className="w-[19px] h-[19px]" />
                  </button>
                </RailTooltip>

                <div className="relative my-1 flex items-center justify-center w-full">
                  <RailTooltip label="Unggah Bukti WFH" offsetClass="left-full ml-6">
                    <div className="bg-white p-1.5 rounded-full translate-x-3 shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const target = document.getElementById('attendance-upload-zone');
                          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        aria-label="Unggah Bukti WFH"
                        className="h-10 w-10 rounded-full bg-[#FBE8EC] hover:bg-[#F5CFD8] text-[#800020] inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Upload className="w-4 h-4 stroke-[2.25]" />
                      </button>
                    </div>
                  </RailTooltip>
                </div>
              </>
            )}
          </nav>

          {/* Bottom User Avatar & Logout */}
          <div className="flex flex-col items-center gap-3">
            <RailTooltip label={`${displayName} · ${isHrdAdmin ? 'HRD Admin' : 'Karyawan'}`}>
              <div
                tabIndex={0}
                aria-label={`${displayName}, ${isHrdAdmin ? 'HRD Admin' : 'Karyawan'}`}
                className="h-9 w-9 rounded-full bg-[#FBE8EC] text-[#800020] flex items-center justify-center text-xs font-bold select-none cursor-default"
              >
                {initials || <User className="w-4 h-4" />}
              </div>
            </RailTooltip>

            <RailTooltip label="Keluar">
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Keluar dari akun"
                className="h-10 w-10 rounded-full text-[#E7D8DC] hover:bg-white/10 hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </RailTooltip>
          </div>
        </div>
      </aside>

      {/* MOBILE TOP HEADER */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#EFEAED] px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-full bg-[#2A040A] flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6.5 9.5C6.5 8.11929 7.61929 7 9 7H14C16.2091 7 18 8.79086 18 11C18 12.1046 17.1046 13 16 13H9"
                stroke="#FBE8EC"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <path
                d="M17.5 14.5C17.5 15.8807 16.3807 17 15 17H10C7.79086 17 6 15.2091 6 13C6 11.8954 6.89543 11 8 11H15"
                stroke="#DC2626"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#2A040A] leading-tight truncate">DEXAsync</p>
            <p className="text-[11px] text-[#634E53] truncate">
              {displayName} · {isHrdAdmin ? 'HRD Admin' : 'Karyawan'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          aria-label="Keluar dari sesi"
          className="min-h-[44px] px-3 rounded-full border border-[#E5DDE0] bg-white text-xs font-semibold text-[#2A040A] hover:bg-[#F7F4F5] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <LogOut className="w-3.5 h-3.5 text-[#800020]" />
          <span>Keluar</span>
        </button>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 min-w-0 lg:py-4 lg:pr-4 pb-24 lg:pb-4">
        {isHrdAdmin && (activeTab === 'employees' || activeTab === 'attendances') ? (
          <MonitoringSection
            user={user}
            mode={activeTab}
            onTabChange={(tab) => {
              setPendingQuickAdd(false);
              setActiveTab(tab);
            }}
            onPreviewPhoto={setPreviewPhotoUrl}
            openQuickAdd={pendingQuickAdd}
            onQuickAddConsumed={handleQuickAddConsumed}
          />
        ) : (
          <AttendanceSection user={user} onPreviewPhoto={setPreviewPhotoUrl} />
        )}
      </main>

      {/* MOBILE BOTTOM FLOATING DARK PILL DOCK (HRD ADMIN) */}
      {isHrdAdmin && (
        <nav
          aria-label="Navigasi Mobile HRD"
          className="lg:hidden fixed bottom-3 inset-x-4 z-40 bg-[#2A040A] rounded-full px-3 py-1.5 flex items-center justify-around shadow-xl"
        >
          <button
            type="button"
            onClick={() => {
              setPendingQuickAdd(false);
              setActiveTab('employees');
            }}
            aria-label="Data Karyawan"
            className={`min-h-[44px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'employees' ? 'bg-[#800020] text-white' : 'text-[#E7D8DC]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Karyawan</span>
          </button>

          <button
            type="button"
            onClick={handleQuickAddEmployee}
            aria-label="Tambah Karyawan Baru"
            className="h-11 w-11 rounded-full bg-[#FBE8EC] text-[#800020] inline-flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingQuickAdd(false);
              setActiveTab('attendances');
            }}
            aria-label="Monitoring Absensi"
            className={`min-h-[44px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'attendances' ? 'bg-[#800020] text-white' : 'text-[#E7D8DC]'
            }`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Absensi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPendingQuickAdd(false);
              setActiveTab('my-attendance');
            }}
            aria-label="Presensi Mandiri"
            className={`min-h-[44px] px-3.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'my-attendance' ? 'bg-[#800020] text-white' : 'text-[#E7D8DC]'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
          </button>
        </nav>
      )}

      {/* Photo Preview Modal */}
      <PhotoPreviewModal photoUrl={previewPhotoUrl} onClose={() => setPreviewPhotoUrl(null)} />
    </div>
  );
}
