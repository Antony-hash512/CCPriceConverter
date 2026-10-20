/**
 * CCPriceConverter - Модуль управления темой оформления (Theme Manager)
 * Режимы: 'light' (светлая), 'dark' (тёмная), 'system' (системная - по умолчанию)
 * Поддерживает URL-параметр ?theme=light / ?theme=dark / ?theme=system
 */

const STORAGE_THEME_KEY = 'cc_theme';
const VALID_THEMES = ['light', 'dark', 'system'];

const mediaQuery = (typeof window !== 'undefined' && window.matchMedia)
  ? window.matchMedia('(prefers-color-scheme: dark)')
  : null;

function resolveInitialTheme() {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTheme = (params.get('theme') || '').toLowerCase().trim();
      if (VALID_THEMES.includes(urlTheme)) {
        localStorage.setItem(STORAGE_THEME_KEY, urlTheme);
        return urlTheme;
      }
    } catch {}
  }
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_THEME_KEY) : null;
  if (saved && VALID_THEMES.includes(saved)) {
    return saved;
  }
  return 'system'; // системная по умолчанию
}

function syncUrlTheme(theme) {
  if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('theme', theme);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }
}

let currentThemeMode = resolveInitialTheme();

function resolveTheme(mode) {
  if (mode === 'system') {
    try {
      if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
        return mediaQuery.matches ? 'dark' : 'light';
      }
    } catch {}
    return 'dark'; // Безопасный дефолтный fallback
  }
  return mode;
}

export function getThemeMode() {
  return currentThemeMode;
}

export function applyTheme(mode, saveToStorage = true, updateUrl = true) {
  if (!VALID_THEMES.includes(mode)) return;
  currentThemeMode = mode;
  if (saveToStorage) {
    localStorage.setItem(STORAGE_THEME_KEY, mode);
  }
  if (updateUrl) {
    syncUrlTheme(mode);
  }

  const effectiveTheme = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Обновление состояния кнопок в UI
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme');
    if (btnTheme === mode) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

export function initTheme() {
  currentThemeMode = resolveInitialTheme();

  // Слушатель системной смены темы
  if (mediaQuery && mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', () => {
      if (currentThemeMode === 'system') {
        applyTheme('system', false, false);
      }
    });
  }

  applyTheme(currentThemeMode, false, false);
}
