import battery from '../assets/statusbar/battery.svg';
import location from '../assets/statusbar/location.svg';
import signal from '../assets/statusbar/signal.svg';
import wifi from '../assets/statusbar/wifi.svg';
import s from './Preview.module.css';

/** iOS status bar from the Figma frame. Preview only: in the app it is native. */
export function StatusBar() {
  return (
    <div className={s.statusBar} aria-hidden="true">
      <div className={s.statusContent}>
        <span className={s.time}>12:22</span>
        <img className={s.location} src={location} width={14} height={14} alt="" />
        <img className={s.signal} src={signal} width={21} height={14} alt="" />
        <img className={s.wifi} src={wifi} width={15} height={14} alt="" />
        <span className={s.battery}>
          <img src={battery} width={26.5} height={11.5} alt="" />
        </span>
      </div>
    </div>
  );
}
