import { useState } from 'react';
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from '@rive-app/react-webgl2';
import riveWasm from '@rive-app/webgl2/rive.wasm?url';
import planeWindow from '../../assets/window/plane-window.riv?url';
import s from './PlaneWindow.module.css';

// The runtime's WebAssembly comes from this build, not from the unpkg CDN.
RuntimeLoader.setWasmUrl(riveWasm);

/**
 * plane-window.riv, built from the Rive file «Travel Animation» with the Rive CLI (rive/README.md).
 * State machine «Plane window» lifts the shade once and keeps the clouds and the wing going.
 * The runtime pauses itself while the tab or webview is hidden.
 */
export default function RiveWindow() {
  const [ready, setReady] = useState(false);
  const { RiveComponent } = useRive({
    src: planeWindow,
    stateMachine: 'Plane window',
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoad: () => setReady(true),
  });

  // RiveComponent puts className on its own container and the rest on the canvas, so the
  // fade-in sits on a wrapper we own.
  return (
    <div className={s.art} data-ready={ready}>
      <RiveComponent className={s.rive} />
    </div>
  );
}
