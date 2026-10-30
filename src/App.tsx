import { useEffect, useState } from 'react';
import { StatusBar } from './preview/StatusBar';
import { SearchLoadingScreen } from './screens/SearchLoadingScreen';
import s from './preview/Preview.module.css';

const PHONE = '(max-width: 480px)';

function useIsPhone() {
  const [phone, setPhone] = useState(() => window.matchMedia(PHONE).matches);
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}

/**
 * On a phone (the webview) the screen fills the viewport and the native status bar sits above it.
 * On a desktop browser it is shown in a 360 × 800 frame with the status bar from Figma for review.
 */
export default function App() {
  const phone = useIsPhone();
  const screen = <SearchLoadingScreen onBack={() => history.back()} />;

  if (phone) return <div className={s.full}>{screen}</div>;
  return (
    <div className={s.stage}>
      <div className={s.device}>
        <StatusBar />
        {screen}
      </div>
    </div>
  );
}
