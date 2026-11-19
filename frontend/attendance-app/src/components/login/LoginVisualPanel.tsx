import { FC } from 'react';
import {
  Camera,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { DexLogo } from '../common/DexLogo';

export const LoginVisualPanel: FC = () => {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 xl:w-[52%] 2xl:w-[55%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1A0306] via-[#2A050B] to-[#140204] border-r border-[#3D0A13] p-8 xl:p-12 2xl:p-16 text-white select-none min-h-screen">
      {/* Background Radial Glow & Soft Ambient Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full bg-[#800020]/30 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-[480px] w-[480px] rounded-full bg-[#DC2626]/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[380px] w-[380px] rounded-full bg-[#800020]/15 blur-[100px]"
      />

      {/* Decorative Subtle Dot Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(#800020_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-[0.14]"
      />

      {/* Top Header: DEXAsync Brand Identity & Mascot Pill */}
      <header className="relative z-10 flex items-center justify-between">
        <DexLogo size={36} variant="dark" />

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-[#E2E8F0] backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#DC2626]" />
          <span>Meet DEXO, Your WFH Buddy</span>
        </div>
      </header>

      {/* Center Section: DEXO Mascot as the Main Visual Highlight */}
      <div className="relative z-10 my-auto py-6 xl:py-10 flex flex-col items-center text-center">
        {/* Category Label */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DC2626]/40 bg-[#DC2626]/10 px-3.5 py-1 text-[11px] font-bold tracking-[0.18em] uppercase text-[#DC2626] font-mono mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626] animate-pulse" />
          <span>Smart Employee Attendance System</span>
        </div>

        {/* Mascot Centerpiece with Creative Layered Composition */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Concentric Subtle Glow Rings */}
          <div
            aria-hidden="true"
            className="absolute h-80 w-80 sm:h-96 sm:w-96 rounded-full border border-[#800020]/30 bg-gradient-to-tr from-[#800020]/20 via-[#DC2626]/10 to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute h-64 w-64 sm:h-76 sm:w-76 rounded-full border border-[#DC2626]/20 bg-white/[0.02]"
          />

          {/* Floating Feature Chip: Selfie Presensi */}
          <div className="absolute -top-3 -left-4 xl:-left-8 z-20 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#2A050B]/90 px-3.5 py-2 text-xs shadow-xl backdrop-blur-md">
            <div className="h-7 w-7 rounded-lg bg-[#800020]/30 border border-[#800020]/50 flex items-center justify-center text-[#DC2626]">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-[11px]">Selfie Check-In</p>
              <p className="text-[10px] text-[#E2E8F0]/70 font-mono">1x Presensi Harian</p>
            </div>
          </div>

          {/* Floating Feature Chip: Geotag & Anti-Fraud */}
          <div className="absolute -bottom-2 -right-4 xl:-right-8 z-20 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#2A050B]/90 px-3.5 py-2 text-xs shadow-xl backdrop-blur-md">
            <div className="h-7 w-7 rounded-lg bg-[#DC2626]/20 border border-[#DC2626]/40 flex items-center justify-center text-[#DC2626]">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-white text-[11px]">Geotag Verified</p>
              <p className="text-[10px] text-[#E2E8F0]/70 font-mono">Lokasi &amp; Jam Presisi</p>
            </div>
          </div>

          {/* DEXO Mascot Hero Image */}
          <div className="relative z-10 p-2">
            <img
              src="/sapaan-dexo.png"
              alt="DEXO Mascot — Maskot Resmi Presensi DEXAsync"
              className="h-64 sm:h-72 xl:h-84 w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>

        {/* Mascot Speech Bubble & Welcoming Message */}
        <div className="relative z-10 mt-3 max-w-md rounded-2xl border border-white/15 bg-white/[0.05] p-4 text-center shadow-lg backdrop-blur-md">
          <p className="text-sm sm:text-base font-bold text-white">
            &ldquo;Halo Rekan DEXA! Yuk absen selfie dulu sebelum mulai aktivitas.&rdquo;
          </p>
          <p className="mt-1 text-xs text-[#E2E8F0]/75">
            Presensi kerja dari rumah atau di mana saja jadi lebih ringkas, aman, dan terverifikasi otomatis.
          </p>
        </div>

        {/* Main Headline */}
        <div className="mt-6 max-w-lg">
          <h1 className="text-2xl xl:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Synchronize Your Work,{' '}
            <span className="bg-gradient-to-r from-white via-[#FFE4E6] to-[#DC2626] bg-clip-text text-transparent">
              Simplify Your Day.
            </span>
          </h1>
        </div>
      </div>

      {/* Bottom Features Strip */}
      <footer className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-xs text-[#E2E8F0]/80">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-[#DC2626] shrink-0" />
          <span className="text-[11px] font-medium">One-Tap Selfie</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#DC2626] shrink-0" />
          <span className="text-[11px] font-medium">Role-Based RBAC</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#DC2626] shrink-0" />
          <span className="text-[11px] font-medium">Instant Verification</span>
        </div>
      </footer>
    </div>
  );
};
