import { FC, useState } from 'react';
import { AuthUser } from '../../api';
import { LoginForm, MascotState } from './LoginForm';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const LoginPage: FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [errorShakeKey, setErrorShakeKey] = useState(0);

  const handleMascotChange = (next: MascotState) => {
    setMascotState(next);
    if (next === 'error') {
      setErrorShakeKey((k) => k + 1);
    }
  };

  const mascotSrc =
    mascotState === 'loading' || mascotState === 'flying'
      ? '/berhasil-dexo.png'
      : mascotState === 'error'
      ? '/gagal-dexo.png'
      : '/sapaan-dexo.png';

  const mascotAlt =
    mascotState === 'flying'
      ? 'DEXO terbang merayakan login berhasil'
      : mascotState === 'loading'
      ? 'DEXO mengepakkan sayap menunggu verifikasi'
      : mascotState === 'error'
      ? 'DEXO memeriksa kesalahan login'
      : 'DEXO menyapa pengguna';

  const mascotAnimationClass =
    mascotState === 'flying'
      ? 'animate-dexo-fly'
      : mascotState === 'loading'
      ? 'animate-dexo-flap'
      : mascotState === 'error'
      ? 'animate-dexo-shake'
      : mascotState === 'typing'
      ? '-translate-y-1 scale-[1.03]'
      : 'translate-y-0 scale-100';

  const shadowClass =
    mascotState === 'flying'
      ? 'opacity-0 scale-50'
      : mascotState === 'loading'
      ? 'opacity-40 scale-75'
      : 'opacity-100 scale-100';

  return (
    <main className="min-h-screen w-full bg-[#F7F4F5] text-[#2A040A] flex flex-col justify-between items-center px-4 sm:px-6 py-7 sm:py-10 overflow-x-hidden">
      {/* Top Minimal Brand Mark (Matches Floating Rail Badge) */}
      <header className="flex items-center gap-2.5 select-none">
        <div className="h-10 w-10 rounded-full bg-[#2A040A] flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
        <div className="leading-tight">
          <span className="text-lg font-extrabold tracking-tight text-[#2A040A]">
            DEX<span className="text-[#800020]">Async</span>
          </span>
        </div>
      </header>

      {/* Center Stage: Reactive DEXO Owl + Clean Tactile Card */}
      <div className="w-full max-w-[430px] flex flex-col items-center my-auto py-4">
        {/* Owl Mascot Stage */}
        <div className="relative z-20 flex flex-col items-center mb-[-22px] sm:mb-[-26px] pointer-events-none select-none">
          <img
            key={mascotState === 'error' ? `err-${errorShakeKey}` : mascotState}
            src={mascotSrc}
            alt={mascotAlt}
            className={`h-26 sm:h-30 w-auto object-contain transition-transform duration-200 ${mascotAnimationClass}`}
          />
          <div
            aria-hidden="true"
            className={`w-16 h-2.5 -mt-2 rounded-full bg-[#2A040A]/12 transition-all duration-300 ${shadowClass}`}
          />
        </div>

        {/* Clean White Login Card */}
        <div
          className={`relative z-10 w-full bg-white rounded-[32px] border border-[#ECE4E7] p-6 sm:p-8 pt-10 sm:pt-11 shadow-sm transition-opacity duration-300 ${
            mascotState === 'flying' ? 'opacity-90' : 'opacity-100'
          }`}
        >
          <LoginForm
            onLoginSuccess={onLoginSuccess}
            onMascotStateChange={handleMascotChange}
          />
        </div>
      </div>

      {/* Clean Accessible Footer */}
      <footer className="text-xs font-medium text-[#634E53] text-center pt-3">
        DEXAsync · Sistem Presensi WFH Karyawan
      </footer>
    </main>
  );
};
