import { lazy, Suspense } from 'react';
import still from '../../assets/window/plane-window-still.webp';
import s from './PlaneWindow.module.css';

// The Rive runtime is a separate chunk: the screen renders without waiting for it.
const RiveWindow = lazy(() => import('./RiveWindow'));

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The airplane window, animated in Rive. With reduced motion it is a still of the same scene
 * after the shade has gone up (plane-window-still.webp, 3×), and the runtime is never loaded.
 */
export function PlaneWindow() {
  return (
    <div className={s.window} aria-hidden="true">
      {reducedMotion ? (
        <img className={s.art} src={still} width={151} height={197} alt="" draggable={false} />
      ) : (
        <Suspense fallback={null}>
          <RiveWindow />
        </Suspense>
      )}
    </div>
  );
}
