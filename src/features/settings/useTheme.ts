import { useCallback, useEffect, useState } from 'react';

/**
 * Paper or night.
 *
 * The choice is the athlete's and it is remembered, so the app opens the way
 * they left it. It lives in `localStorage` rather than the profile because it
 * is a property of *this device* — the same person on a phone at 6am and a
 * laptop at 6pm wants different answers — and because it has to be readable
 * before React mounts, to set the first paint.
 */
export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

const KEY = 'coach:theme';

const systemPrefersDark = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

/** What the app should open as, before anyone has chosen. */
export const storedTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // Private windows and blocked storage both throw. Fall through.
  }
  return systemPrefersDark() ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset['theme'] = theme;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ThemeControl {
  theme: Theme;
  /** Pass the event so the reveal can start from the control that was used. */
  setTheme: (next: Theme, origin?: { clientX: number; clientY: number }) => void;
  toggle: (origin?: { clientX: number; clientY: number }) => void;
}

export const useTheme = (): ThemeControl => {
  const [theme, setState] = useState<Theme>(storedTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme, origin?: { clientX: number; clientY: number }) => {
      if (next === theme) return;

      const root = document.documentElement;
      if (origin) {
        root.style.setProperty('--vt-x', `${origin.clientX}px`);
        root.style.setProperty('--vt-y', `${origin.clientY}px`);
      }

      const swap = () => setState(next);

      // The circular reveal needs a point to grow from and someone who wants
      // to watch it. Without either, the change is just a change.
      if (origin && !prefersReducedMotion() && 'startViewTransition' in document) {
        document.startViewTransition(swap);
        return;
      }
      swap();
    },
    [theme],
  );

  const toggle = useCallback(
    (origin?: { clientX: number; clientY: number }) =>
      setTheme(theme === 'dark' ? 'light' : 'dark', origin),
    [setTheme, theme],
  );

  return { theme, setTheme, toggle };
};
