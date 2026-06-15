export const THEME_STORAGE_KEY = 'hrms-theme';

export type Theme = 'light' | 'dark';

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : null;
}

export function getInitialTheme(): Theme {
  return getStoredTheme() ?? 'light';
}
