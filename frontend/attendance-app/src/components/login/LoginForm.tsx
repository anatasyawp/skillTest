import { FC, FormEvent, useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AuthUser, login, setToken } from '../../api';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const REMEMBER_ME_KEY = 'dexasync_remembered_identifier';

export const LoginForm: FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  // Load remembered identifier on initial mount
  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedIdentifier) {
        setEmailOrUsername(savedIdentifier);
        setRememberMe(true);
      }
    } catch {
      // LocalStorage access guard
    }
  }, []);

  const validate = (): boolean => {
    const errors: { identifier?: string; password?: string } = {};

    const trimmed = emailOrUsername.trim();
    if (!trimmed) {
      errors.identifier = 'Email atau username wajib diisi.';
    } else if (trimmed.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.identifier = 'Format email tidak valid (contoh: nama@company.local).';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const executeLogin = async (rawIdentifier: string, rawPassword: string) => {
    setLoading(true);
    setServerError(null);

    try {
      const trimmed = rawIdentifier.trim();
      // Auto-normalize username prefix to company email domain if '@' is omitted
      let normalizedEmail = trimmed.toLowerCase();
      if (!normalizedEmail.includes('@')) {
        normalizedEmail = `${normalizedEmail}@company.local`;
      }

      const response = await login(normalizedEmail, rawPassword);

      // Persist Remember Me preference
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, trimmed);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      } catch {
        // Ignore localStorage error
      }

      setToken(response.accessToken);
      onLoginSuccess(response.user);
    } catch (err) {
      let message = 'Gagal melakukan login. Periksa kembali email dan password Anda.';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          message = 'Tidak dapat menghubungi server API (port 3000). Pastikan backend sedang aktif.';
        } else {
          message = err.message;
        }
      }
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    await executeLogin(emailOrUsername, password);
  };

  // Helper to autofill demo credentials for testing
  const fillDemoAccount = (identifier: string) => {
    setEmailOrUsername(identifier);
    setPassword('Password123!');
    setFieldErrors({});
    setServerError(null);
  };

  return (
    <>
      {/* Floating Login Card Body */}
      <div className="w-full">
        {/* Card Header: Heading & Subtitle */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Selamat Datang!
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-sm mx-auto">
            Masuk dengan akun perusahaan Anda untuk mengakses workspace DEXAsync.
          </p>
        </div>

        {/* Server Error Alert with Inspecting Mascot Avatar */}
        {serverError && (
          <div
            role="alert"
            className="mt-5 flex items-center sm:items-start gap-3.5 sm:gap-4 rounded-2xl border border-red-200 bg-red-50/95 p-3.5 sm:p-4 text-xs text-red-800 shadow-xs animate-in fade-in duration-200 text-left"
          >
            <div className="shrink-0 flex items-center justify-center p-1.5 bg-white rounded-2xl border border-red-200/80 shadow-2xs">
              <img
                src="/gagal-dexo.png"
                alt="DEXO Peringatan"
                className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-sm transition-transform duration-200 hover:scale-105"
              />
            </div>
            <div className="flex-1 leading-relaxed">
              <p className="text-sm font-bold text-red-900">Autentikasi Tidak Berhasil</p>
              <p className="mt-1 text-xs sm:text-[13px] text-red-700 leading-relaxed">{serverError}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* Email / Username Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-identifier"
                className="text-xs font-semibold text-[#0F172A]"
              >
                Email Perusahaan / Username
              </label>
              {fieldErrors.identifier && (
                <span className="text-[11px] font-medium text-red-600">
                  {fieldErrors.identifier}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-identifier"
                type="text"
                autoComplete="username"
                disabled={loading}
                value={emailOrUsername}
                onChange={(e) => {
                  setEmailOrUsername(e.target.value);
                  if (fieldErrors.identifier) {
                    setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
                  }
                }}
                placeholder="nama@company.local atau username"
                aria-invalid={!!fieldErrors.identifier}
                className={`w-full min-h-[46px] rounded-xl border bg-white pl-10 pr-4 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] shadow-2xs transition-all duration-150 focus:outline-none ${
                  fieldErrors.identifier
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-[#E2E8F0] hover:border-[#800020]/40 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10'
                }`}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-[#0F172A]"
              >
                Password
              </label>
              {fieldErrors.password && (
                <span className="text-[11px] font-medium text-red-600">
                  {fieldErrors.password}
                </span>
              )}
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#94A3B8]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="Masukkan kata sandi"
                aria-invalid={!!fieldErrors.password}
                className={`w-full min-h-[46px] rounded-xl border bg-white pl-10 pr-11 py-2.5 text-base sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] shadow-2xs transition-all duration-150 focus:outline-none ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                    : 'border-[#E2E8F0] hover:border-[#800020]/40 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                className="absolute inset-y-0 right-0 flex min-w-[42px] items-center justify-center rounded-r-xl text-[#94A3B8] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  rememberMe
                    ? 'border-[#800020] bg-[#800020] text-white'
                    : 'border-[#CBD5E1] bg-white hover:border-[#800020]'
                }`}
              >
                {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <span className="text-[#334155] font-medium">Ingat saya</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(true)}
              className="inline-flex items-center gap-1 font-semibold text-[#800020] hover:text-[#DC2626] transition-colors cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Lupa password?</span>
            </button>
          </div>

          {/* Primary Action Button: "Sign In to Workspace" */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#800020] hover:bg-[#68001A] active:scale-[0.99] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#800020]/20 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Mengautentikasi...</span>
              </>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        {/* Subtle Testing Helper: Demo Accounts */}
        <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#94A3B8]">
              Cepat Masuk (Demo):
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('budi.santoso@company.local')}
              className="flex items-center justify-center gap-1.5 min-h-[38px] rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] hover:border-[#800020]/40 hover:bg-[#FFF5F7] px-2.5 py-1.5 text-xs font-semibold text-[#334155] transition-all cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#800020] shrink-0" />
              <span className="truncate">Karyawan (Budi)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('hrd@company.local')}
              className="flex items-center justify-center gap-1.5 min-h-[38px] rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] hover:border-[#DC2626]/40 hover:bg-[#FFF5F7] px-2.5 py-1.5 text-xs font-semibold text-[#334155] transition-all cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#DC2626] shrink-0" />
              <span className="truncate">HRD Admin (Rina)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal with DEXO Guide */}
      {forgotPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bantuan Lupa Kata Sandi"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#160305]/60 backdrop-blur-xs p-4"
          onClick={() => setForgotPasswordModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-2xl text-center animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mascot Image in Modal */}
            <div className="mx-auto mb-3 flex items-center justify-center">
              <img
                src="/pemberitahuan-dexo.png"
                alt="DEXO Pemberitahuan"
                className="h-24 w-24 object-contain drop-shadow-sm"
              />
            </div>

            <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A]">
              Lupa Kata Sandi Akun?
            </h3>
            <p className="mt-2 text-xs text-[#64748B] leading-relaxed">
              Untuk menjaga integritas dan keamanan data presensi, reset kata sandi dikelola langsung oleh tim HRD DEXA.
            </p>

            <div className="mt-4 p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left">
              <p className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#800020]" />
                <span>Pengajuan Reset Kata Sandi:</span>
              </p>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Silakan hubungi administrator HRD dengan melampirkan NIK dan nama lengkap Anda ke:
                <strong className="text-[#800020] font-mono font-bold block mt-1">
                  hrd@company.local
                </strong>
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-[#800020] hover:bg-[#68001A] text-white text-xs font-bold shadow-md shadow-[#800020]/20 transition-all cursor-pointer"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
