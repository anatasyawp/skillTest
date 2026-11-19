import { FC } from 'react';
import { AuthUser } from '../../api';
import { DexLogo } from '../common/DexLogo';
import { AbstractBackground } from './AbstractBackground';
import { LoginForm } from './LoginForm';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

/**
 * Modern, Minimalist & Premium Single-Page Login for DEXAsync.
 * - Single-page, white-dominant layout with no split-screen.
 * - Abstract background artwork positioned along page edges (maroon, muted red, dusty rose, soft pink).
 * - Floating login card centered on the page with rounded corners and subtle shadows.
 * - DEXAsync logo at the top and DEXO mascot illustration positioned right above the login card.
 */
export const LoginPage: FC<LoginPageProps> = ({ onLoginSuccess }) => {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between items-center bg-white px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden selection:bg-[#800020]/10 selection:text-[#800020]">
      {/* Abstract Organic Background Artwork (5-12% opacity around edges) */}
      <AbstractBackground />

      {/* Top Header: DEXAsync Brand Logo */}
      <header className="relative z-10 flex flex-col items-center">
        <DexLogo size={36} variant="light" />
      </header>

      {/* Central Area: DEXO Mascot & Centered Floating Login Card */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center my-auto py-4 sm:py-6">
        {/* DEXO Mascot Illustration directly above the Login Card */}
        <div className="relative z-20 mb-[-22px] sm:mb-[-26px] pointer-events-none select-none">
          <img
            src="/sapaan-dexo.png"
            alt="DEXO Mascot"
            className="h-24 sm:h-28 w-auto object-contain drop-shadow-[0_12px_24px_rgba(128,0,32,0.12)]"
          />
        </div>

        {/* Floating Card Container */}
        <div className="relative z-10 w-full bg-white/95 backdrop-blur-xs rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(128,0,32,0.08),0_2px_6px_rgba(0,0,0,0.03)] p-6 sm:p-8 pt-9 sm:pt-10">
          <LoginForm onLoginSuccess={onLoginSuccess} />
        </div>
      </div>

      {/* Clean Distraction-Free Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[11px] text-[#94A3B8] font-mono select-none pt-4">
        <span>DEXAsync • SMART EMPLOYEE ATTENDANCE SYSTEM</span>
        <span className="hidden sm:inline text-slate-300">•</span>
        <span>CONFIDENTIAL &amp; PROPRIETARY</span>
      </footer>
    </main>
  );
};
