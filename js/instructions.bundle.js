/**
 * CCPriceConverter - Instructions standalone bundle
 * Generated automatically by scripts/build.js
 */
(() => {
  'use strict';

// ==========================================================================
// Module: theme.js
// ==========================================================================
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

function getThemeMode() {
  return currentThemeMode;
}

function applyTheme(mode) {
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

function initTheme() {
  // Слушатель системной смены темы
  mediaQuery.addEventListener('change', () => {
    if (currentThemeMode === 'system') {
      applyTheme('system');
    }
  });

  applyTheme(currentThemeMode);
}

// ==========================================================================
// Module: instructions.js
// ==========================================================================
/**
 * CCPriceConverter - Управление языком и темой для страницы instructions.html
 */



const STORAGE_LANG_KEY = 'cc_lang';
let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || 'en';

function setInstructionsLang(lang) {
  currentLang = lang;
  localStorage.setItem(STORAGE_LANG_KEY, lang);
  document.documentElement.lang = lang;

  // Показываем нужный языковой блок и скрываем другой
  document.querySelectorAll('.lang-content').forEach(el => {
    if (el.getAttribute('data-content-lang') === lang) {
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });

  // Обновляем состояние кнопок языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-lang') === lang;
    btn.classList.toggle('active', isTarget);
    btn.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
  });

  // Обновляем заголовок вкладки
  document.title = lang === 'ru' 
    ? 'Инструкция по запуску и использованию | CCPriceConverter'
    : 'User Guide & Documentation | CCPriceConverter';
}

function initInstructions() {
  // 1. Инициализация темы
  initTheme();
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.getAttribute('data-theme'));
    });
  });

  // 2. Инициализация языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setInstructionsLang(btn.getAttribute('data-lang'));
    });
  });

  setInstructionsLang(currentLang);
}

if (document.getElementById('top-controls-bar')) {
  initInstructions();
} else {
  document.addEventListener('DOMContentLoaded', initInstructions);
}

})();
