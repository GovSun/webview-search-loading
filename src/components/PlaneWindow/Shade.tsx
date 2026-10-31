import { useId } from 'react';
import s from './PlaneWindow.module.css';

/*
 * Coordinates are rim.svg units (84.12 × 111.91), so the shade shares the rim's box.
 * RIM is «Край ободка» from rim.svg: the opening the shade slides in, as «Маска проёма» in Figma.
 * INSET is the same shape 1.11 px inside it, where mikes.cv draws its inset shadow.
 */
const RIM =
  'M42.0598 0.2861C65.1308 0.2861 83.8336 17.1186 83.8336 37.8825L83.8336 74.0256C83.8336 94.7895 65.1308 111.622 42.0598 111.622C18.9888 111.622 0.2861 94.7895 0.2861 74.0256L0.2861 37.8825C0.2861 17.1186 18.9888 0.2861 42.0598 0.2861Z';
const INSET =
  'M42.06 1.406C64.517 1.406 82.723 17.791 82.723 38.003L82.723 73.905C82.723 94.117 64.517 110.502 42.06 110.502C19.603 110.502 1.397 94.117 1.397 73.905L1.397 38.003C1.397 17.791 19.603 1.406 42.06 1.406Z';
const OUTSIDE = 'M-25 -25H110V140H-25Z';

// The panel's bottom edge is the shallow arc of the site's shutter; its middle sits 15.7 below the rim top.
// It reaches up to −100 so that, lowered by the full travel, it still covers the whole opening.
const PANEL = 'M-1.7 -100H85.82V7.63Q42.06 24.33 -1.7 7.63Z';
const EDGE = 'M-1.7 7.63Q42.06 24.33 85.82 7.63';
const LIP = 'M-1.7 6.53Q42.06 19.23 85.82 6.53V7.63Q42.06 24.33 -1.7 7.63Z';
const HANDLE = 'M21.2 8L62.9 8Q64.3 8 63.9 8.9Q42.06 13.6 20.2 8.9Q19.8 8 21.2 8Z';
const HANDLE_LIP = 'M20.9 9.05Q42.06 13.35 63.2 9.05';

/**
 * «Шторка», as on mikes.cv: it starts closed and goes up once to its resting position, where only
 * the bottom of the shade shows at the top of the opening, with the lip along its edge and the
 * recessed handle. Shape and colours follow the site's shutter layer at translateY(−57%), mapped
 * into the rim's box; the inset shadow where it meets the rim is the site's box-shadow (11 px at
 * .42 and 3 px at .3) as blurred fills. The site's drag is left out.
 */
export function Shade() {
  const id = useId().replace(/:/g, '');
  const rimClip = `${id}-rim`;
  const panelClip = `${id}-panel`;
  const lip = `${id}-lip`;
  const handle = `${id}-handle`;
  const soft = `${id}-soft`;
  const tight = `${id}-tight`;

  return (
    <svg className={s.shade} viewBox="0 0 84.1197 111.908" width={84.1197} height={111.908} aria-hidden="true">
      <defs>
        <clipPath id={rimClip}>
          <path d={RIM} />
        </clipPath>
        <clipPath id={panelClip}>
          <path d={PANEL} />
        </clipPath>
        <linearGradient id={lip} x1="0" y1="12.4" x2="0" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#B9AD9F" />
          <stop offset="0.5" stopColor="#C2B9AF" />
          <stop offset="1" stopColor="#C1BAB1" />
        </linearGradient>
        {/* Down the recess: lit top edge, dark groove, light wall, bright lower lip. */}
        <linearGradient id={handle} x1="0" y1="8" x2="0" y2="11.3" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A39889" />
          <stop offset="0.2" stopColor="#938A7F" />
          <stop offset="0.5" stopColor="#A59E96" />
          <stop offset="0.65" stopColor="#C0B8B4" />
          <stop offset="0.75" stopColor="#B6ADAA" />
          <stop offset="1" stopColor="#C7BEB1" />
        </linearGradient>
        <filter id={soft} x="-25" y="-25" width="135" height="165" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.06" />
        </filter>
        <filter id={tight} x="-25" y="-25" width="135" height="165" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="0.83" />
        </filter>
      </defs>

      <g clipPath={`url(#${rimClip})`}>
        {/* The panel and its clip slide; the rim's inset shadow is moved back so it stays put. */}
        <g className={s.shadeRise}>
          <g clipPath={`url(#${panelClip})`}>
            <path d={PANEL} fill="#AFA397" />
            <path d={LIP} fill={`url(#${lip})`} />
            <path d={HANDLE} fill={`url(#${handle})`} />
            <path d={HANDLE_LIP} fill="none" stroke="#ECE2DA" strokeWidth="0.4" strokeLinecap="round" />
            <path d={EDGE} fill="none" stroke="#E2DBD4" strokeWidth="0.7" />
            <g className={s.shadeHold}>
              <path d={OUTSIDE + INSET} fillRule="evenodd" fill="rgba(28, 25, 22, 0.42)" filter={`url(#${soft})`} />
              <path d={OUTSIDE + INSET} fillRule="evenodd" fill="rgba(28, 25, 22, 0.3)" filter={`url(#${tight})`} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
