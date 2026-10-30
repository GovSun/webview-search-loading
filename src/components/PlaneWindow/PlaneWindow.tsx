import { useEffect, useRef } from 'react';
import frame from '../../assets/window/frame.svg';
import rim from '../../assets/window/rim.svg';
import { CloudSky } from './cloudSky';
import { Wing } from './Wing';
import s from './PlaneWindow.module.css';

/**
 * Figma «Иллюминатор» (903:120940), 109.856 × 148, without «Шторка». Frame, rim and glass mask
 * keep the Figma layers and sizes, with rounder contours (scripts/round-window.py).
 * Layers bottom to top: «Стекло» (daytime sky with drifting clouds on a canvas, the wing over it,
 * all masked by the opening), «Ободок», «Рама».
 * The glass has the sky gradient as its background, so it is never empty before the first frame
 * or without canvas; with reduced motion the canvas shows one still frame.
 */
export function PlaneWindow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;

    const sky = new CloudSky(canvas);
    sky.setPixelRatio(window.devicePixelRatio || 1);
    canvas.dataset.ready = 'true';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let inView = true;
    const sync = () => {
      if (reduced.matches || document.hidden || !inView) sky.stop();
      else sky.start();
    };

    // Paused off-screen and in a hidden tab or a backgrounded webview.
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    });
    io.observe(canvas);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);

    // Moving the webview to a screen with another pixel ratio rebuilds the sprites.
    let dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    const onDpr = () => {
      sky.setPixelRatio(window.devicePixelRatio || 1);
      dprQuery.removeEventListener('change', onDpr);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener('change', onDpr);
    };
    dprQuery.addEventListener('change', onDpr);

    sync();
    return () => {
      sky.stop();
      io.disconnect();
      document.removeEventListener('visibilitychange', sync);
      reduced.removeEventListener('change', sync);
      dprQuery.removeEventListener('change', onDpr);
    };
  }, []);

  return (
    <div className={s.window} aria-hidden="true">
      <div className={s.glass}>
        <canvas ref={canvasRef} className={s.canvas} />
        <Wing />
      </div>
      <img className={s.rim} src={rim} width={84.1197} height={111.908} alt="" draggable={false} />
      <img className={s.frame} src={frame} width={108.547} height={144.529} alt="" draggable={false} />
    </div>
  );
}
