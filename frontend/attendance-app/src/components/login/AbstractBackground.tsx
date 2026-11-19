import { FC } from 'react';

/**
 * AbstractBackground:
 * Renders subtle organic shapes, flowing curves, and soft gradients
 * in maroon (#800020), muted red (#DC2626), dusty rose (#C06C7A), and soft pink (#FCE7EB).
 * Opacities are kept strictly between 5% and 12% around page edges,
 * ensuring the central login card remains clean, distraction-free, and white-dominant.
 */
export const AbstractBackground: FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
    >
      {/* Top-Left Organic Flow: Maroon & Dusty Rose (opacity ~8-10%) */}
      <svg
        className="absolute -top-24 -left-24 w-[500px] h-[500px] sm:w-[680px] sm:h-[680px] opacity-[0.08] transition-opacity duration-700"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tlGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#800020" />
            <stop offset="60%" stopColor="#C06C7A" />
            <stop offset="100%" stopColor="#FCE7EB" />
          </linearGradient>
          <filter id="blurTL" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
        </defs>
        <path
          d="M72 124C156 42 278 78 358 138C438 198 476 282 452 384C428 486 342 546 248 562C154 578 52 550 16 462C-20 374 2 246 72 124Z"
          fill="url(#tlGrad1)"
          filter="url(#blurTL)"
        />
        {/* Secondary organic flowing line */}
        <path
          d="M30 60 C 180 120, 240 280, 420 320 C 520 340, 560 480, 580 560"
          stroke="#800020"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.3"
        />
      </svg>

      {/* Top-Right Soft Aura: Muted Red & Soft Pink (opacity ~7%) */}
      <svg
        className="absolute -top-32 -right-32 w-[460px] h-[460px] sm:w-[620px] sm:h-[620px] opacity-[0.07]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="trGrad" cx="60%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="50%" stopColor="#D47A88" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </radialGradient>
        </defs>
        <path
          d="M520 80C580 160 560 280 500 360C440 440 340 480 250 460C160 440 80 360 90 260C100 160 200 40 310 10C420 -20 460 0 520 80Z"
          fill="url(#trGrad)"
        />
      </svg>

      {/* Bottom-Right Organic Wave: Maroon & Dusty Rose (opacity ~9-11%) */}
      <svg
        className="absolute -bottom-28 -right-24 w-[520px] h-[520px] sm:w-[700px] sm:h-[700px] opacity-[0.09]"
        viewBox="0 0 700 700"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brGrad" x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#800020" />
            <stop offset="45%" stopColor="#B91C1C" />
            <stop offset="80%" stopColor="#D47A88" />
            <stop offset="100%" stopColor="#FFF1F2" />
          </linearGradient>
          <filter id="blurBR" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="35" />
          </filter>
        </defs>
        <path
          d="M600 320C680 410 650 540 570 610C490 680 360 690 260 640C160 590 90 480 120 380C150 280 280 190 390 180C500 170 520 230 600 320Z"
          fill="url(#brGrad)"
          filter="url(#blurBR)"
        />
        {/* Flowing curve contour */}
        <path
          d="M160 620 C 280 540, 360 420, 520 380 C 620 350, 660 260, 680 180"
          stroke="#C06C7A"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.35"
        />
      </svg>

      {/* Bottom-Left Soft Gradient Wave: Soft Pink & Muted Rose (opacity ~6%) */}
      <svg
        className="absolute -bottom-36 -left-32 w-[480px] h-[480px] sm:w-[600px] sm:h-[600px] opacity-[0.06]"
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="blGrad" cx="30%" cy="70%" r="70%">
            <stop offset="0%" stopColor="#C06C7A" />
            <stop offset="60%" stopColor="#FCE7EB" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </radialGradient>
        </defs>
        <path
          d="M100 520C30 440 20 320 80 230C140 140 270 80 370 120C470 160 540 300 510 400C480 500 350 580 240 590C130 600 170 600 100 520Z"
          fill="url(#blGrad)"
        />
      </svg>

      {/* Very subtle ambient gradient veil across the canvas, keeping center crisp white */}
      <div className="absolute inset-0 bg-radial from-transparent via-transparent to-[#800020]/[0.02]" />
    </div>
  );
};
