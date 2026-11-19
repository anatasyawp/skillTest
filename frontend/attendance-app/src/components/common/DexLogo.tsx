import { FC } from 'react';

interface DexLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  variant?: 'dark' | 'light';
}

export const DexLogo: FC<DexLogoProps> = ({
  size = 32,
  className = '',
  showWordmark = true,
  wordmarkClassName = '',
  variant = 'dark',
}) => {
  const isLight = variant === 'light';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Precision Geometric SVG Logomark (Maroon & Crimson Red Theme) */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect
          width="36"
          height="36"
          rx="10"
          fill={isLight ? '#FFFFFF' : '#240408'}
          stroke={isLight ? '#E2E8F0' : '#4A0712'}
          strokeWidth="1.5"
        />
        {/* Maroon Upper Sync Arc */}
        <path
          d="M10 13C10 11.3431 11.3431 10 13 10H20C23.3137 10 26 12.6863 26 16C26 17.6569 24.6569 19 23 19H13"
          stroke="#800020"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Vibrant Red Lower Sync Arc */}
        <path
          d="M26 23C26 24.6569 24.6569 26 23 26H16C12.6863 26 10 23.3137 10 20C10 18.3431 11.3431 17 13 17H23"
          stroke="#DC2626"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Micro sync indicators */}
        <circle cx="21" cy="19" r="1.75" fill="#800020" />
        <circle cx="15" cy="17" r="1.75" fill="#DC2626" />
      </svg>

      {showWordmark && (
        <div className={`flex flex-col leading-none ${wordmarkClassName}`}>
          <span
            className={`text-lg font-bold tracking-tight font-sans ${
              isLight ? 'text-[#0F172A]' : 'text-white'
            }`}
          >
            DEX<span className={isLight ? 'text-[#800020]' : 'text-[#DC2626]'}>Async</span>
          </span>
          <span
            className={`text-[9px] font-semibold tracking-[0.16em] uppercase mt-0.5 ${
              isLight ? 'text-[#64748B]' : 'text-[#E2E8F0]/70'
            }`}
          >
            Attendance System
          </span>
        </div>
      )}
    </div>
  );
};
