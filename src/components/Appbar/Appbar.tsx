import type { ReactNode } from 'react';
import s from './Appbar.module.css';

type Props = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
};

/**
 * DS «Appbar», search variant. The status bar belongs to the native app, so the webview only
 * reserves the safe area above the 64 px nav bar.
 */
export function Appbar({ left, center, right }: Props) {
  return (
    <header className={s.appbar}>
      <div className={s.nav}>
        <div className={s.left}>{left}</div>
        <div className={s.center}>{center}</div>
        <div className={s.right}>{right}</div>
      </div>
    </header>
  );
}
