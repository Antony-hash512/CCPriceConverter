/**
 * CCPriceConverter - Управление языком и темой для страницы instructions.html
 */

import { initTheme, applyTheme } from './theme.js';

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

document.addEventListener('DOMContentLoaded', () => {
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
});
