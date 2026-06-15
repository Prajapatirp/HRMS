import { THEME_STORAGE_KEY } from '@/lib/theme';

export function ThemeScript() {
  const script = `
    (function () {
      try {
        var theme = localStorage.getItem('${THEME_STORAGE_KEY}');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {}
    })();
  `;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
