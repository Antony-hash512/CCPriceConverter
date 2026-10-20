/**
 * CCPriceConverter - Модуль управления темой оформления (Theme Manager)
 * Режимы: 'light' (светлая), 'dark' (тёмная), 'system' (системная - по умолчанию)
 */

const STORAGE_THEME_KEY = 'cc_theme';
let currentThemeMode = localStorage.getItem(STORAGE_THEME_KEY) || 'system'; // системная по умолчанию

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function resolveTheme(mode) {
  if (mode === 'system') {
    return mediaQuery.matches ? 'dark' : 'light';
  }
  return mode;
}

export function getThemeMode() {
  return currentThemeMode;
}

export function applyTheme(mode, saveToStorage = true) {
  currentThemeMode = mode;
  if (saveToStorage) {
    localStorage.setItem(STORAGE_THEME_KEY, mode);
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
  const savedMode = localStorage.getItem(STORAGE_THEME_KEY);
  currentThemeMode = savedMode || 'system';

  // Слушатель системной смены темы
  mediaQuery.addEventListener('change', () => {
    if (currentThemeMode === 'system') {
      applyTheme('system', false);
    }
  });

  applyTheme(currentThemeMode, Boolean(savedMode));
}
