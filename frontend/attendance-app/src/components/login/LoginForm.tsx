import { FC, FormEvent, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { AuthUser, login, setToken } from '../../api';

export type MascotState = 'idle' | 'typing' | 'loading' | 'flying' | 'error';

interface LoginFormProps {
  onLoginSuccess: (user: AuthUser) => void;
  onMascotStateChange?: (state: MascotState) => void;
}

const REMEMBER_ME_KEY = 'dexasync_remembered_identifier';

export const LoginForm: FC<LoginFormProps> = ({ onLoginSuccess, onMascotStateChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [flyingOut, setFlyingOut] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const flightTimerRef = useRef<number | null>(null);

  useEffect(() => {
    try {
      const savedIdentifier = localStorage.getItem(REMEMBER_ME_KEY);
      if (savedIdentifier) {
        setEmail(savedIdentifier);
        setRememberMe(true);
      }
    } catch {
      // Ignore storage access errors
    }
    return () => {
      if (flightTimerRef.current !== null) {
        window.clearTimeout(flightTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!forgotPasswordModalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setForgotPasswordModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [forgotPasswordModalOpen]);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    const trimmed = email.trim();

    if (!trimmed) {
      errors.email = 'Email wajib diisi.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors.email = 'Format email tidak valid.';
    }

    if (!password) {
      errors.password = 'Password wajib diisi.';
    } else if (password.length < 6) {
      errors.password = 'Password minimal 6 karakter.';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      onMascotStateChange?.('error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || flyingOut) return;
    if (!validate()) return;

    setLoading(true);
    setServerError(null);
    onMascotStateChange?.('loading');

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await login(normalizedEmail, password);

      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, normalizedEmail);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
      } catch {
        // Ignore storage error
      }

      setToken(response.accessToken);
      setLoading(false);
      setFlyingOut(true);
      onMascotStateChange?.('flying');

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion) {
        onLoginSuccess(response.user);
      } else {
        flightTimerRef.current = window.setTimeout(() => {
          onLoginSuccess(response.user);
        }, 720);
      }
    } catch (err) {
      let message = 'Login gagal. Periksa kembali email dan password Anda.';
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          message = 'Server API (port 3000) tidak merespons. Pastikan backend sedang berjalan.';
        } else {
          message = err.message;
        }
      }
      setServerError(message);
      setLoading(false);
      onMascotStateChange?.('error');
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password');
    setFieldErrors({});
    setServerError(null);
    onMascotStateChange?.('typing');
  };

  const isBusy = loading || flyingOut;

  return (
    <>
      <div className="w-full">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#2A040A]">
            Masuk ke Akun
          </h1>
          <p className="mt-1.5 text-sm text-[#634E53]">
            Catat kehadiran WFH atau kelola data karyawan.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-[#2A040A] mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#634E53]">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                disabled={isBusy}
                value={email}
                onFocus={() => {
                  if (!isBusy && !serverError) onMascotStateChange?.('typing');
                }}
                onBlur={() => {
                  if (!isBusy && !serverError) onMascotStateChange?.('idle');
                }}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  if (serverError) setServerError(null);
                }}
                placeholder="nama@company.local"
                aria-invalid={Boolean(fieldErrors.email)}
                className={`w-full min-h-[46px] rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-[#2A040A] placeholder:text-[#8B757A] transition-colors focus:ring-2 focus:outline-none ${
                  fieldErrors.email
                    ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                    : 'border-[#DDD3D6] hover:border-[#800020]/50 focus:border-[#800020] focus:ring-[#800020]/15'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-[#2A040A] mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#634E53]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                disabled={isBusy}
                value={password}
                onFocus={() => {
                  if (!isBusy && !serverError) onMascotStateChange?.('typing');
                }}
                onBlur={() => {
                  if (!isBusy && !serverError) onMascotStateChange?.('idle');
                }}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                  if (serverError) setServerError(null);
                }}
                placeholder="Masukkan password"
                aria-invalid={Boolean(fieldErrors.password)}
                className={`w-full min-h-[46px] rounded-xl border bg-white pl-10 pr-12 py-2.5 text-sm text-[#2A040A] placeholder:text-[#8B757A] transition-colors focus:ring-2 focus:outline-none ${
                  fieldErrors.password
                    ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                    : 'border-[#DDD3D6] hover:border-[#800020]/50 focus:border-[#800020] focus:ring-[#800020]/15'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-0 flex min-w-[44px] items-center justify-center rounded-r-xl text-[#634E53] hover:text-[#2A040A] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="inline-flex items-center gap-2 min-h-[44px] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-[#800020] peer-focus-visible:outline-offset-2 ${
                  rememberMe
                    ? 'border-[#800020] bg-[#800020] text-white'
                    : 'border-[#C9BFC2] bg-white hover:border-[#800020]'
                }`}
              >
                {rememberMe && <Check className="h-3 w-3 stroke-[3]" />}
              </span>
              <span className="text-[#2A040A] font-semibold">Ingat email</span>
            </label>

            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(true)}
              className="min-h-[44px] px-1 font-bold text-[#800020] hover:text-[#640019] transition-colors cursor-pointer"
            >
              Lupa password?
            </button>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={isBusy}
            className="w-full min-h-[48px] rounded-full bg-[#800020] hover:bg-[#640019] disabled:opacity-75 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {flyingOut ? (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>Berhasil masuk...</span>
              </>
            ) : loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Memeriksa akun...</span>
              </>
            ) : (
              <span>Masuk</span>
            )}
          </button>
        </form>

        {/* Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-[#F2ECEE]">
          <p className="text-xs font-semibold text-[#634E53] mb-2.5 text-center">
            Isi cepat akun demo
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fillDemoAccount('kuronami@gmail.com')}
              className="min-h-[44px] px-3 rounded-full border border-[#ECE4E7] bg-[#F7F4F5] hover:bg-[#FBE8EC] hover:border-[#F2C8D2] hover:text-[#800020] text-xs font-bold text-[#2A040A] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5 text-[#800020] shrink-0" />
              <span>Karyawan</span>
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fillDemoAccount('hrd@gmail.com')}
              className="min-h-[44px] px-3 rounded-full border border-[#ECE4E7] bg-[#F7F4F5] hover:bg-[#FBE8EC] hover:border-[#F2C8D2] hover:text-[#800020] text-xs font-bold text-[#2A040A] inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#800020] shrink-0" />
              <span>HRD Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotPasswordModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-pw-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2A040A]/50 p-4"
          onClick={() => setForgotPasswordModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-3xl border border-[#ECE4E7] p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setForgotPasswordModalOpen(false)}
              aria-label="Tutup bantuan lupa password"
              className="absolute top-4 right-4 h-10 w-10 rounded-full hover:bg-[#F7F4F5] text-[#634E53] hover:text-[#2A040A] inline-flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mx-auto mb-3 flex items-center justify-center">
              <img
                src="/pemberitahuan-dexo.png"
                alt="DEXO Pemberitahuan"
                className="h-24 w-24 object-contain"
              />
            </div>

            <h2 id="forgot-pw-title" className="text-lg font-extrabold text-[#2A040A]">
              Lupa Kata Sandi?
            </h2>
            <p className="mt-1.5 text-sm text-[#634E53] leading-relaxed">
              Reset kata sandi dikelola langsung oleh tim HRD agar keamanan data presensi tetap terjaga.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-[#F7F4F5] border border-[#ECE4E7] text-left">
              <p className="text-xs font-bold text-[#2A040A] flex items-center gap-1.5 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-[#800020]" />
                <span>Cara Pengajuan Reset</span>
              </p>
              <p className="text-xs text-[#634E53] leading-relaxed">
                Hubungi admin HRD dengan melampirkan NIK dan nama lengkap ke:
                <strong className="text-[#800020] font-bold block mt-1">hrd@gmail.com</strong>
              </p>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="w-full min-h-[44px] rounded-full bg-[#800020] hover:bg-[#640019] text-white text-sm font-bold transition-colors cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
