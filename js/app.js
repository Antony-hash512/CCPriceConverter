/**
 * CCPriceConverter - Основной управляющий модуль приложения (App Controller)
 */

import { SUPPORTED_COINS, PROVIDERS_CONFIG, fetchProviderRates } from './providers.js';
import { calculateExchange, formatUsd, formatPercent } from './calculator.js';
import { t, getLanguage, setLanguage, updateDomTranslations, onLanguageChange } from './i18n.js';
import { initTheme, applyTheme, getThemeMode } from './theme.js';

// Селекторы DOM
const providersCountBadgeEl = document.getElementById('providers-count-badge');

const selectCurrencySellEl = document.getElementById('select-currency-sell');
const inputAmountSellEl = document.getElementById('input-amount-sell');
const selectCurrencyBuyEl = document.getElementById('select-currency-buy');
const inputAmountBuyEl = document.getElementById('input-amount-buy');

const btnCalculateEl = document.getElementById('btn-calculate');
const btnCalculateTextEl = document.getElementById('btn-calculate-text');
const btnCooldownBarEl = document.getElementById('btn-cooldown-bar');

const outputCardsContainerEl = document.getElementById('output-cards-container');
const outputStatusBadgeEl = document.getElementById('output-status-badge');

// Кэш последнего выполненного расчета для мгновенного перерендеринга при смене языка
let lastCalculationData = null;

// Локальное состояние API-ключей и настройки сохранения
const STORAGE_KEYS_PREFIX = 'cc_api_key_';
const STORAGE_DONT_SAVE_KEY = 'cc_dont_save_keys';
const API_KEY_PROVIDERS = ['coinmarketcap', 'coingecko', 'coinpaprika'];

let isDontSaveEnabled = localStorage.getItem(STORAGE_DONT_SAVE_KEY) === 'true';

const apiKeysCache = {
  coinmarketcap: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinmarketcap`) || '',
  coingecko: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coingecko`) || '',
  coinpaprika: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinpaprika`) || ''
};

// Таймер для всплывающего уведомления (toast)
let toastTimeout = null;

function showToast(message) {
  const toastEl = document.getElementById('toast-notification');
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

/**
 * Обновление индикаторов сохранения ключа (дискета 💾 vs перечёркнутая дискета)
 */
function updateKeyStatusIndicators() {
  API_KEY_PROVIDERS.forEach(providerId => {
    const indicatorEl = document.getElementById(`key-status-${providerId}`);
    const inputEl = document.getElementById(`input-key-${providerId}`);
    if (!indicatorEl) return;

    const currentVal = inputEl ? inputEl.value.trim() : (apiKeysCache[providerId] || '');
    const hasSavedInStorage = Boolean(localStorage.getItem(`${STORAGE_KEYS_PREFIX}${providerId}`));

    if (isDontSaveEnabled) {
      // Превентивный режим: не сохранять в localStorage
      indicatorEl.classList.remove('is-hidden', 'saved');
      indicatorEl.classList.add('not-saved');
      indicatorEl.setAttribute('title', t('keyNotSavedTooltip'));
      indicatorEl.setAttribute('aria-label', t('keyNotSavedTooltip'));
      indicatorEl.style.opacity = currentVal ? '1' : '0.55';
    } else {
      // Обычный режим: сохранение разрешено
      indicatorEl.style.opacity = '1';
      if (hasSavedInStorage || currentVal) {
        indicatorEl.classList.remove('is-hidden', 'not-saved');
        indicatorEl.classList.add('saved');
        indicatorEl.setAttribute('title', t('keySavedDiskTooltip'));
        indicatorEl.setAttribute('aria-label', t('keySavedDiskTooltip'));
      } else {
        indicatorEl.classList.add('is-hidden');
        indicatorEl.classList.remove('saved', 'not-saved');
      }
    }
  });
}

function openClearKeysModal() {
  const modal = document.getElementById('modal-clear-keys');
  if (!modal) return;
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
}

function closeClearKeysModal() {
  const modal = document.getElementById('modal-clear-keys');
  if (!modal) return;
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
}

/**
 * Инициализация элементов управления приватностью ключей (чекбокс и кнопка стирания)
 */
function initStorageControls() {
  const checkboxDontSave = document.getElementById('checkbox-dont-save-keys');
  const btnClearKeys = document.getElementById('btn-clear-saved-keys');
  const modalEl = document.getElementById('modal-clear-keys');
  const modalBtnClear = document.getElementById('modal-btn-clear');
  const modalBtnKeep = document.getElementById('modal-btn-keep');
  const modalBtnClose = document.getElementById('modal-btn-close');

  if (checkboxDontSave) {
    checkboxDontSave.checked = isDontSaveEnabled;
    checkboxDontSave.addEventListener('change', () => {
      if (checkboxDontSave.checked) {
        // Включение режима: проверяем, сохранены ли уже ключи в localStorage
        const hasSavedKeys = API_KEY_PROVIDERS.some(p => Boolean(localStorage.getItem(`${STORAGE_KEYS_PREFIX}${p}`)));
        if (hasSavedKeys) {
          // Временно оставляем чекбокс неотмеченным, пока пользователь не сделает выбор
          checkboxDontSave.checked = false;
          openClearKeysModal();
        } else {
          // Ключей в localStorage нет — сразу включаем режим
          isDontSaveEnabled = true;
          localStorage.setItem(STORAGE_DONT_SAVE_KEY, 'true');
          updateKeyStatusIndicators();
        }
      } else {
        // Снятие чекбокса: отключаем режим "Не сохранять", разрешая сохранение
        isDontSaveEnabled = false;
        localStorage.setItem(STORAGE_DONT_SAVE_KEY, 'false');
        // Если пользователь уже ввёл ключи в этой сессии, теперь сохраняем их в localStorage
        API_KEY_PROVIDERS.forEach(p => {
          if (apiKeysCache[p]) {
            localStorage.setItem(`${STORAGE_KEYS_PREFIX}${p}`, apiKeysCache[p]);
          }
        });
        updateKeyStatusIndicators();
      }
    });
  }

  // Модальное окно: кнопка "Очистить"
  if (modalBtnClear) {
    modalBtnClear.addEventListener('click', () => {
      API_KEY_PROVIDERS.forEach(p => localStorage.removeItem(`${STORAGE_KEYS_PREFIX}${p}`));
      if (checkboxDontSave) checkboxDontSave.checked = true;
      isDontSaveEnabled = true;
      localStorage.setItem(STORAGE_DONT_SAVE_KEY, 'true');
      closeClearKeysModal();
      updateKeyStatusIndicators();
      showToast(t('keysClearedToast'));
    });
  }

  // Модальное окно: кнопка "Оставить"
  if (modalBtnKeep) {
    modalBtnKeep.addEventListener('click', () => {
      if (checkboxDontSave) checkboxDontSave.checked = true;
      isDontSaveEnabled = true;
      localStorage.setItem(STORAGE_DONT_SAVE_KEY, 'true');
      closeClearKeysModal();
      updateKeyStatusIndicators();
    });
  }

  // Модальное окно: закрытие / отмена (чекбокс остаётся выключенным)
  if (modalBtnClose) {
    modalBtnClose.addEventListener('click', () => {
      if (checkboxDontSave) checkboxDontSave.checked = false;
      closeClearKeysModal();
    });
  }

  if (modalEl) {
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) {
        if (checkboxDontSave) checkboxDontSave.checked = false;
        closeClearKeysModal();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl && modalEl.classList.contains('active')) {
      if (checkboxDontSave) checkboxDontSave.checked = false;
      closeClearKeysModal();
    }
  });

  // Кнопка в верхнем баре: "Стереть ключи"
  if (btnClearKeys) {
    btnClearKeys.addEventListener('click', () => {
      API_KEY_PROVIDERS.forEach(p => {
        localStorage.removeItem(`${STORAGE_KEYS_PREFIX}${p}`);
        apiKeysCache[p] = '';
        const inputEl = document.getElementById(`input-key-${p}`);
        if (inputEl) inputEl.value = '';
      });
      updateKeyStatusIndicators();
      showToast(t('keysClearedToast'));
    });
  }
}

/**
 * Инициализация кнопок верхнего бара (Язык и Тема)
 */
function initTopControls() {
  // 1. Тема
  initTheme();
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-theme');
      applyTheme(mode);
    });
  });

  // 2. Язык
  const currentLang = getLanguage();
  updateLangButtonsUI(currentLang);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      updateLangButtonsUI(lang);
      updateProvidersUI();
      updateKeyStatusIndicators();
      if (lastCalculationData) {
        rerenderLastCalculation();
      }
    });
  });

  // При смене языка пересчитываем динамические элементы
  onLanguageChange((newLang) => {
    updateLangButtonsUI(newLang);
    updateProvidersUI();
    updateKeyStatusIndicators();
  });
}

function updateLangButtonsUI(activeLang) {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isTarget = btn.getAttribute('data-lang') === activeLang;
    if (isTarget) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * Инициализация состояния чекбоксов провайдеров и полей ввода
 */
function initProviders() {
  // Восстановление сохраненных ключей в поля
  for (const [providerId, keyVal] of Object.entries(apiKeysCache)) {
    const inputEl = document.getElementById(`input-key-${providerId}`);
    if (inputEl) {
      inputEl.value = keyVal;
      inputEl.addEventListener('input', (e) => {
        const trimmed = e.target.value.trim();
        apiKeysCache[providerId] = trimmed;
        if (!isDontSaveEnabled) {
          if (trimmed) {
            localStorage.setItem(`${STORAGE_KEYS_PREFIX}${providerId}`, trimmed);
          } else {
            localStorage.removeItem(`${STORAGE_KEYS_PREFIX}${providerId}`);
          }
        }
        updateKeyStatusIndicators();
      });
    }
  }

  // Навешивание обработчиков на кнопки показа/скрытия пароля
  document.querySelectorAll('.key-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      const inputEl = document.getElementById(targetId);
      if (inputEl) {
        if (inputEl.type === 'password') {
          inputEl.type = 'text';
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        } else {
          inputEl.type = 'password';
          btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        }
      }
    });
  });

  // Навешивание обработчиков на чекбоксы
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-provider]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateProvidersUI();
    });
  });

  updateProvidersUI();
  updateKeyStatusIndicators();
}

/**
 * Обновление UI провайдеров:
 * - Правило не снимаемого чекбокса (если активен ровно 1)
 * - Видимость полей для ввода API-ключей
 */
function updateProvidersUI() {
  const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-provider]'));
  const activeCheckboxes = checkboxes.filter(cb => cb.checked);
  const activeCount = activeCheckboxes.length;

  providersCountBadgeEl.textContent = t('providersActiveBadge', {
    active: activeCount,
    total: checkboxes.length
  });

  // Правило ТЗ: "пользователь может активировать любое количество чебоксов от 1 до 4,
  // но если активен только 1 любой чекбокс, то он становится не снимаемым."
  checkboxes.forEach(cb => {
    if (activeCount === 1 && cb.checked) {
      cb.disabled = true;
      cb.closest('.provider-row').title = t('singleProviderTooltip');
    } else {
      cb.disabled = false;
      cb.closest('.provider-row').title = '';
    }

    const providerId = cb.getAttribute('data-provider');
    const rowEl = document.getElementById(`provider-row-${providerId}`);
    const keyBoxEl = document.getElementById(`api-key-box-${providerId}`);

    if (cb.checked) {
      rowEl?.classList.add('active');
      if (keyBoxEl) {
        keyBoxEl.classList.add('visible');
      }
    } else {
      rowEl?.classList.remove('active');
      if (keyBoxEl) {
        // Поле временно скрывается, но значение сохраняется в DOM и в кэше
        keyBoxEl.classList.remove('visible');
      }
    }
  });
}

/**
 * Получение списка активных ID провайдеров
 */
function getActiveProviders() {
  const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-provider]:checked'));
  return checkboxes.map(cb => cb.getAttribute('data-provider'));
}

/**
 * Рендеринг скелетона карточки провайдера при начале загрузки
 */
function renderProviderSkeleton(providerId) {
  const config = PROVIDERS_CONFIG.find(p => p.id === providerId) || { name: providerId };

  return `
    <div class="provider-card" id="card-${providerId}">
      <div class="provider-card-header">
        <div class="card-provider-title">
          <span class="provider-icon ${config.iconClass}">${config.iconText}</span>
          <span>${config.name}</span>
        </div>
        <span class="card-status-badge status-loading">
          <span class="pulse-dot"></span> ${t('statusLoading')}
        </span>
      </div>
      <div class="card-content-grid">
        <div class="metric-box">
          <div class="metric-box-title">${t('metricCurrentRate')} (1)</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">${t('metricCurrentRate')} (2)</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">${t('metricSellVolumeUsd')}</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">${t('metricBuyVolumeUsd')}</div>
          <div class="metric-box-value">...</div>
        </div>
      </div>
      <div class="difference-banner loss-low">
        <div>
          <div class="diff-header-text">${t('diffHeader')}</div>
          <div class="diff-value">${t('statusLoading')}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Отрисовка ошибки для конкретного провайдера
 */
function renderProviderError(providerId, errorMessage) {
  const config = PROVIDERS_CONFIG.find(p => p.id === providerId) || { name: providerId };

  let hint = '';
  if (providerId === 'coinmarketcap' && (errorMessage.includes('прокси') || errorMessage.includes('proxy'))) {
    hint = `<div style="font-size: 0.8rem; margin-top: 0.5rem; color: #94a3b8;">
      ${t('cmcProxyHint')}
    </div>`;
  }

  return `
    <div class="provider-card" id="card-${providerId}">
      <div class="provider-card-header">
        <div class="card-provider-title">
          <span class="provider-icon ${config.iconClass}">${config.iconText}</span>
          <span>${config.name}</span>
        </div>
        <span class="card-status-badge status-error">${t('statusError')}</span>
      </div>
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 1rem; color: #fca5a5; font-size: 0.88rem;">
        <strong>${t('failedToFetch')}</strong>
        <p style="margin-top: 0.3rem;">${errorMessage}</p>
        ${hint}
      </div>
    </div>
  `;
}

/**
 * Отрисовка готовой карточки провайдера с результатами расчета
 */
function renderProviderResult(providerId, sellSymbol, buySymbol, qSell, qBuy, rates) {
  const config = PROVIDERS_CONFIG.find(p => p.id === providerId) || { name: providerId };

  const pSell = rates[sellSymbol];
  const pBuy = rates[buySymbol];

  if (typeof pSell !== 'number' || typeof pBuy !== 'number') {
    return renderProviderError(providerId, t('missingRate', { sym: typeof pSell !== 'number' ? sellSymbol : buySymbol }));
  }

  const result = calculateExchange({
    sellAmount: qSell,
    sellPrice: pSell,
    buyAmount: qBuy,
    buyPrice: pBuy
  });

  // Локализованный статус
  let localizedStatusText = t('diffStatusLossLow');
  if (result.status === 'profit') {
    localizedStatusText = t('diffStatusProfit');
  } else if (result.status === 'loss-high') {
    localizedStatusText = t('diffStatusLossHigh');
  }

  // HTML для отображения разницы и индикации
  // Если профит: зеленый цвет + красная надпись "(WTF?)" в скобках
  let diffDisplay = '';
  if (result.isProfit) {
    diffDisplay = `
      <span class="diff-value">${formatUsd(result.differenceUsd)}</span>
      <span class="wtf-badge">(WTF?)</span>
    `;
  } else {
    // Потери отображаются со знаком минус
    const displayVal = result.differenceUsd <= 0 ? formatUsd(result.differenceUsd) : `-${formatUsd(result.lossUsd)}`;
    diffDisplay = `<span class="diff-value">${displayVal}</span>`;
  }

  return `
    <div class="provider-card" id="card-${providerId}">
      <div class="provider-card-header">
        <div class="card-provider-title">
          <span class="provider-icon ${config.iconClass}">${config.iconText}</span>
          <span>${config.name}</span>
        </div>
        <span class="card-status-badge status-success">
          <span class="pulse-dot"></span> ${t('statusSuccess')}
        </span>
      </div>

      <div class="card-content-grid">
        <!-- 1. Стоимость в USD 1 единицы каждой валюты -->
        <div class="metric-box">
          <div class="metric-box-title">${t('metricRateSell', { sym: sellSymbol })}</div>
          <div class="metric-box-value">${formatUsd(pSell)}</div>
          <div class="metric-box-sub">${t('metricCurrentRate')}</div>
        </div>
        
        <div class="metric-box">
          <div class="metric-box-title">${t('metricRateBuy', { sym: buySymbol })}</div>
          <div class="metric-box-value">${formatUsd(pBuy)}</div>
          <div class="metric-box-sub">${t('metricCurrentRate')}</div>
        </div>

        <!-- 2. Общие стоимости в USD всего объема -->
        <div class="metric-box">
          <div class="metric-box-title">${t('metricTotalSell', { amount: qSell, sym: sellSymbol })}</div>
          <div class="metric-box-value">${formatUsd(result.sellTotalUsd)}</div>
          <div class="metric-box-sub">${t('metricSellVolumeUsd')}</div>
        </div>

        <div class="metric-box">
          <div class="metric-box-title">${t('metricTotalBuy', { amount: qBuy, sym: buySymbol })}</div>
          <div class="metric-box-value">${formatUsd(result.buyTotalUsd)}</div>
          <div class="metric-box-sub">${t('metricBuyVolumeUsd')}</div>
        </div>
      </div>

      <!-- 3. Разница между рассчитанными покупаемым и продаваемым объемом -->
      <div class="difference-banner ${result.status}">
        <div>
          <div class="diff-header-text">${localizedStatusText}</div>
          <div class="diff-value-group">
            ${diffDisplay}
          </div>
        </div>

        <!-- 4. Потери (или профит) в процентах -->
        <div class="diff-percent-row">
          <span>${t('diffRelativeVolume')}</span>
          <strong>${formatPercent(result.percentDiff)}</strong>
        </div>
      </div>
    </div>
  `;
}

/**
 * Перерендеринг результатов предыдущего расчета при смене языка
 */
function rerenderLastCalculation() {
  if (!lastCalculationData) return;

  const { sellSymbol, buySymbol, qSell, qBuy, results, timeString } = lastCalculationData;
  let allHtml = '';
  for (const res of results) {
    if (res.success) {
      allHtml += renderProviderResult(res.providerId, sellSymbol, buySymbol, qSell, qBuy, res.rates);
    } else {
      allHtml += renderProviderError(res.providerId, res.error);
    }
  }

  outputCardsContainerEl.innerHTML = allHtml;
  outputStatusBadgeEl.textContent = t('outputUpdated', { time: timeString });
}

/**
 * Обработчик нажатия на кнопку "Посчитать" / "Calculate"
 */
async function handleCalculateClick() {
  const sellSymbol = selectCurrencySellEl.value;
  const buySymbol = selectCurrencyBuyEl.value;
  const qSell = parseFloat(inputAmountSellEl.value);
  const qBuy = parseFloat(inputAmountBuyEl.value);

  // Валидация входных данных
  if (isNaN(qSell) || qSell < 0) {
    alert(t('alertPositiveSell'));
    inputAmountSellEl.focus();
    return;
  }
  if (isNaN(qBuy) || qBuy < 0) {
    alert(t('alertPositiveBuy'));
    inputAmountBuyEl.focus();
    return;
  }

  const activeProviderIds = getActiveProviders();
  if (activeProviderIds.length === 0) {
    alert(t('alertSelectProvider'));
    return;
  }

  // Требование ТЗ:
  // "ниже кнопка "посчитать", запрос к каждому из отмеченных чекбосами провадеров отправляется
  // тогда и только тогда когда пользователь нажмёт эту кнопку, никаких других запросов по таймеру и т.д"
  // "Также после нажать кнопка становится неактивной на 3 секнды со сменой надписи на "отправлено",
  // после чего снова становится активной с надпись "посчитать"."
  btnCalculateEl.disabled = true;
  btnCalculateTextEl.textContent = t('btnSent');
  btnCalculateEl.classList.add('cooling');
  btnCooldownBarEl.style.width = '100%';

  // Таймер ровно на 3 секунды (3000 мс)
  setTimeout(() => {
    btnCalculateEl.disabled = false;
    btnCalculateTextEl.textContent = t('btnCalculate');
    btnCalculateEl.classList.remove('cooling');
    btnCooldownBarEl.style.width = '0%';
  }, 3000);

  // Подготовка контейнера вывода: отображаются ТОЛЬКО отмеченные чекбоксом провайдеры
  outputCardsContainerEl.innerHTML = activeProviderIds
    .map(pId => renderProviderSkeleton(pId))
    .join('');
  outputStatusBadgeEl.textContent = t('outputLoadingBadge', { count: activeProviderIds.length });

  const symbolsToFetch = Array.from(new Set([sellSymbol, buySymbol]));

  // Параллельный опрос всех активных провайдеров
  const requests = activeProviderIds.map(async (providerId) => {
    const key = apiKeysCache[providerId] || '';
    try {
      const rates = await fetchProviderRates(providerId, symbolsToFetch, key);
      return { providerId, success: true, rates };
    } catch (err) {
      return { providerId, success: false, error: err.message };
    }
  });

  const results = await Promise.all(requests);
  const now = new Date();
  const timeString = now.toLocaleTimeString();

  // Сохраняем в кэш для мгновенной перерисовки при переключении языка
  lastCalculationData = {
    sellSymbol,
    buySymbol,
    qSell,
    qBuy,
    results,
    timeString
  };

  rerenderLastCalculation();
}

// Сохранение состояния сворачивания подсказки CMC
const STORAGE_CMC_HINT_COLLAPSED = 'cc_cmc_hint_collapsed';

/**
 * Инициализация сворачивания/разворачивания подсказки CoinMarketCap
 * По умолчанию подсказка развёрнута
 */
function initCmcHintToggle() {
  const cmcRow = document.getElementById('provider-row-coinmarketcap');
  const btnToggleHint = document.getElementById('btn-toggle-cmc-hint');

  if (!cmcRow || !btnToggleHint) return;

  function applyHintState(collapsed) {
    if (collapsed) {
      cmcRow.classList.remove('hint-expanded');
      cmcRow.classList.add('hint-collapsed');
      btnToggleHint.classList.add('collapsed');
      btnToggleHint.setAttribute('aria-expanded', 'false');
      btnToggleHint.setAttribute('title', t('cmcExpandTooltip'));
    } else {
      cmcRow.classList.remove('hint-collapsed');
      cmcRow.classList.add('hint-expanded');
      btnToggleHint.classList.remove('collapsed');
      btnToggleHint.setAttribute('aria-expanded', 'true');
      btnToggleHint.setAttribute('title', t('cmcCollapseTooltip'));
    }
    localStorage.setItem(STORAGE_CMC_HINT_COLLAPSED, collapsed ? 'true' : 'false');
  }

  // По умолчанию подсказка развёрнута (collapsed = false)
  const savedState = localStorage.getItem(STORAGE_CMC_HINT_COLLAPSED);
  const isCollapsed = savedState === 'true';
  applyHintState(isCollapsed);

  btnToggleHint.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const currentlyCollapsed = cmcRow.classList.contains('hint-collapsed');
    applyHintState(!currentlyCollapsed);
  });

  onLanguageChange(() => {
    const currentlyCollapsed = cmcRow.classList.contains('hint-collapsed');
    const tooltipKey = currentlyCollapsed ? 'cmcExpandTooltip' : 'cmcCollapseTooltip';
    btnToggleHint.setAttribute('title', t(tooltipKey));
  });
}

// Инициализация при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
  initTopControls();
  initStorageControls();
  initProviders();
  initCmcHintToggle();
  updateDomTranslations();
  btnCalculateEl.addEventListener('click', handleCalculateClick);
});
