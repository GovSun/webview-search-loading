import { useId } from 'react';
import s from './PlaneWindow.module.css';

/**
 * The wing seen through the window: swept wing coming in from the right, winglet at the tip,
 * slat and flap lines, two flap-track fairings underneath. Drawn for this window after the
 * composition of the illustration the user sent, in daylight silver instead of its dusk lavender.
 * Coordinates are glass units (70.086 × 91.571), the same space as the cloud canvas.
 */
export function Wing() {
  const id = useId().replace(/:/g, '');
  const top = `${id}-top`;
  const winglet = `${id}-winglet`;
  const pod = `${id}-pod`;

  return (
    <svg className={s.wing} viewBox="0 0 70.0864 91.5712" width={70.0864} height={91.5712} aria-hidden="true">
      <defs>
        {/* Across the chord: lit leading edge, darker trailing edge; the wide root goes darkest. */}
        <linearGradient id={top} x1="46" y1="48.4" x2="41.5" y2="62" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#EEF2F8" />
          <stop offset="0.3" stopColor="#D3DBE7" />
          <stop offset="0.7" stopColor="#A9B5C9" />
          <stop offset="1" stopColor="#8592AB" />
        </linearGradient>
        <linearGradient id={winglet} x1="6" y1="26" x2="15" y2="45" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E2E8F1" />
          <stop offset="1" stopColor="#97A3BA" />
        </linearGradient>
        <linearGradient id={pod} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BCC5D4" />
          <stop offset="1" stopColor="#6E7B95" />
        </linearGradient>
      </defs>

      {/* Flap-track fairings hang under the trailing edge, so they go first. */}
      <path
        d="M20.8 60.9 C25.2 59.6 31.6 57.8 37.6 56.7 L40.4 58.2 C40.2 59.7 39.3 60.9 37.8 61.3 C31.6 62.1 25.4 62 20.8 60.9 Z"
        fill={`url(#${pod})`}
      />
      <path
        d="M36.2 71 C41.6 69.3 48.6 67.1 54.6 65.6 L57.8 67.3 C57.5 69.1 56.4 70.4 54.8 70.8 C48 71.8 41.6 71.9 36.2 71 Z"
        fill={`url(#${pod})`}
      />

      {/* Winglet */}
      <path
        d="M4.4 25.9 C4.7 25.2 7.3 24.9 8.1 25.2 L16.4 40.9 C17.4 42.6 18.8 43.6 21.2 43.8 L13.2 45.1 C12.3 44.6 11.7 43.9 11.3 43.1 Z"
        fill={`url(#${winglet})`}
        stroke="rgba(60, 74, 100, 0.4)"
        strokeWidth="0.18"
        strokeLinejoin="round"
      />

      {/* Upper surface */}
      <path
        d="M13.2 45.1 L21.2 43.8 C35.5 46.3 53 49.6 72.5 53.5 L72.5 75 C54 65.6 34.5 55.4 18.4 47 C16.6 46.1 14.8 45.6 13.2 45.1 Z"
        fill={`url(#${top})`}
        stroke="rgba(60, 74, 100, 0.4)"
        strokeWidth="0.18"
        strokeLinejoin="round"
      />

      {/* Leading-edge glint */}
      <path d="M22 44.1 C36 46.6 53.5 50 72.5 53.8" fill="none" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="0.4" strokeLinecap="round" />

      {/* Slat line, flap hinge line and the cuts between flap sections */}
      <g fill="none" stroke="rgba(84, 100, 128, 0.36)" strokeWidth="0.2" strokeLinecap="round">
        <path d="M23.4 45.6 C37.5 48.3 54.5 51.6 72.5 55.4" />
        <path d="M27 49.4 C41 54.6 56.5 60.5 72.5 66.6" />
        <path d="M36 52.8 L35.7 56.6" />
        <path d="M49 57.7 L48.7 63.3" />
        <path d="M62 62.7 L61.8 70" />
      </g>
    </svg>
  );
}
