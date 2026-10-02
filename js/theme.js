/**
 * CCPriceConverter - Модуль управления темой оформления (Theme Manager)
 * Режимы: 'light' (светлая), 'dark' (тёмная - по умолчанию), 'system' (системная)
 */

const STORAGE_THEME_KEY = 'cc_theme';
let currentThemeMode = localStorage.getItem(STORAGE_THEME_KEY) || 'dark'; // тёмная по умолчанию

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

export function applyTheme(mode) {
  currentThemeMode = mode;
  localStorage.setItem(STORAGE_THEME_KEY, mode);

  const effectiveTheme = resolveTheme(mode);
  document.documentElement.setAttribute('data-theme', effectiveTheme);

  // Обновление состояния кнопок в UI
  document.querySelectorAll('.theme-btn').forEach(btn => {
    const btnTheme = btn.getAttribute('data-theme');
    if (btnTheme === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

export function initTheme() {
  // Слушатель системной смены темы
  mediaQuery.addEventListener('change', () => {
    if (currentThemeMode === 'system') {
      applyTheme('system');
    }
  });

  applyTheme(currentThemeMode);
}
