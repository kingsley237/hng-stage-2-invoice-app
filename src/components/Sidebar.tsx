import { useInvoices } from '../context/InvoiceContext';
import logo from '../assets/logo.svg';
import avatar from '../assets/avatar.png';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { state, dispatch } = useInvoices();
  const isDark = state.theme === 'dark';

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={styles.sidebar} aria-label="Main navigation">
        <div className={styles.logoWrap}>
          <div className={styles.logo} aria-label="Invoice app logo">
            <img src={logo} alt="Invoice app logo" className={styles.logoImg} />
          </div>
        </div>

        <div className={styles.bottom}>
          <button
            className={styles.themeBtn}
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className={styles.divider} aria-hidden="true" />

          <div className={styles.avatar}>
            <img src={avatar} alt="User avatar" className={styles.avatarImg} />
          </div>
        </div>
      </aside>

      {/* Tablet / Mobile top bar */}
      <header className={styles.topbar} aria-label="Main navigation">
        <div className={styles.topbarLogo} aria-label="Invoice app logo">
          <img src={logo} alt="Invoice app logo" className={styles.logoImg} />
        </div>

        <div className={styles.topbarRight}>
          <button
            className={styles.themeBtn}
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className={styles.topbarDivider} aria-hidden="true" />

          <div className={styles.avatar}>
            <img src={avatar} alt="User avatar" className={styles.avatarImg} />
          </div>
        </div>
      </header>
    </>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M19 9.5A8.5 8.5 0 1 1 10.5 1 6.5 6.5 0 0 0 19 9.5z" fill="#858BB2"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="3.5" fill="#858BB2"/>
      <path d="M10 1v2M10 17v2M1 10h2M17 10h2M3.22 3.22l1.41 1.41M15.36 15.36l1.42 1.42M3.22 16.78l1.41-1.41M15.36 4.64l1.42-1.42"
        stroke="#858BB2" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}