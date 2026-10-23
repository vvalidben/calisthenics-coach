import type { ThemeControl } from './useTheme';

const Moon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
);

const Sun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2m-7.07-17.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

/**
 * The mode switch that sits beside the date.
 *
 * It passes the click's coordinates on, so the new mode spreads out from the
 * button rather than appearing all at once.
 */
export const ThemeToggle = ({ control }: { control: ThemeControl }) => (
  <button
    type="button"
    className="mode-toggle"
    aria-pressed={control.theme === 'dark'}
    aria-label={control.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    onClick={(event) => control.toggle({ clientX: event.clientX, clientY: event.clientY })}
  >
    {control.theme === 'dark' ? <Sun /> : <Moon />}
  </button>
);
