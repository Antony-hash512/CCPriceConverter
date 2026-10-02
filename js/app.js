/**
 * CCPriceConverter - Основной управляющий модуль приложения (App Controller)
 */

import { SUPPORTED_COINS, PROVIDERS_CONFIG, fetchProviderRates } from './providers.js';
import { calculateExchange, formatUsd, formatPercent } from './calculator.js';

// Селекторы DOM
const providersListEl = document.getElementById('providers-list');
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

// Локальное состояние API-ключей
const STORAGE_KEYS_PREFIX = 'cc_api_key_';
const apiKeysCache = {
  coinmarketcap: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinmarketcap`) || '',
  coingecko: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coingecko`) || '',
  coinpaprika: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinpaprika`) || ''
};

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
        apiKeysCache[providerId] = e.target.value.trim();
        localStorage.setItem(`${STORAGE_KEYS_PREFIX}${providerId}`, apiKeysCache[providerId]);
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

  providersCountBadgeEl.textContent = `${activeCount} из ${checkboxes.length} активно`;

  // Правило ТЗ: "пользователь может активировать любое количество чебоксов от 1 до 4,
  // но если активен только 1 любой чекбокс, то он становится не снимаемым."
  checkboxes.forEach(cb => {
    if (activeCount === 1 && cb.checked) {
      cb.disabled = true;
      cb.closest('.provider-row').title = 'Нельзя отключить единственный активный провайдер';
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
          <span class="pulse-dot"></span> Загрузка котировок...
        </span>
      </div>
      <div class="card-content-grid">
        <div class="metric-box">
          <div class="metric-box-title">Курс 1 ед. продажи</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">Курс 1 ед. покупки</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">Стоимость продажи (USD)</div>
          <div class="metric-box-value">...</div>
        </div>
        <div class="metric-box">
          <div class="metric-box-title">Стоимость покупки (USD)</div>
          <div class="metric-box-value">...</div>
        </div>
      </div>
      <div class="difference-banner loss-low">
        <div>
          <div class="diff-header-text">Расчёт разницы</div>
          <div class="diff-value">Ожидание ответа API...</div>
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
  if (providerId === 'coinmarketcap' && errorMessage.includes('прокси')) {
    hint = `<div style="font-size: 0.8rem; margin-top: 0.5rem; color: #94a3b8;">
      💡 Для работы CoinMarketCap запустите локальный сервер: <code>npm start</code> или <code>python3 server.py</code>
    </div>`;
  }

  return `
    <div class="provider-card" id="card-${providerId}">
      <div class="provider-card-header">
        <div class="card-provider-title">
          <span class="provider-icon ${config.iconClass}">${config.iconText}</span>
          <span>${config.name}</span>
        </div>
        <span class="card-status-badge status-error">Ошибка запроса</span>
      </div>
      <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 1rem; color: #fca5a5; font-size: 0.88rem;">
        <strong>Не удалось получить котировки:</strong>
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
    return renderProviderError(providerId, `Провайдер не вернул котировку для одной из выбранных валют (${sellSymbol} или ${buySymbol}).`);
  }

  const result = calculateExchange({
    sellAmount: qSell,
    sellPrice: pSell,
    buyAmount: qBuy,
    buyPrice: pBuy
  });

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
          <span class="pulse-dot"></span> Котировки получены
        </span>
      </div>

      <div class="card-content-grid">
        <!-- 1. Стоимость в USD 1 единицы каждой валюты -->
        <div class="metric-box">
          <div class="metric-box-title">1 ${sellSymbol} (Продажа)</div>
          <div class="metric-box-value">${formatUsd(pSell)}</div>
          <div class="metric-box-sub">Текущий курс API</div>
        </div>
        
        <div class="metric-box">
          <div class="metric-box-title">1 ${buySymbol} (Покупка)</div>
          <div class="metric-box-value">${formatUsd(pBuy)}</div>
          <div class="metric-box-sub">Текущий курс API</div>
        </div>

        <!-- 2. Общие стоимости в USD всего объема -->
        <div class="metric-box">
          <div class="metric-box-title">Всего отдаем (${qSell} ${sellSymbol})</div>
          <div class="metric-box-value">${formatUsd(result.sellTotalUsd)}</div>
          <div class="metric-box-sub">Объем продажи в USD</div>
        </div>

        <div class="metric-box">
          <div class="metric-box-title">Всего получаем (${qBuy} ${buySymbol})</div>
          <div class="metric-box-value">${formatUsd(result.buyTotalUsd)}</div>
          <div class="metric-box-sub">Объем покупки в USD</div>
        </div>
      </div>

      <!-- 3. Разница между рассчитанными покупаемым и продаваемым объемом -->
      <div class="difference-banner ${result.status}">
        <div>
          <div class="diff-header-text">${result.statusText}</div>
          <div class="diff-value-group">
            ${diffDisplay}
          </div>
        </div>

        <!-- 4. Потери (или профит) в процентах: 100% * разницу / (среднее арифметическое суммарных объемов) -->
        <div class="diff-percent-row">
          <span>Относительно объема:</span>
          <strong>${formatPercent(result.percentDiff)}</strong>
        </div>
      </div>
    </div>
  `;
}

/**
 * Обработчик нажатия на кнопку "Посчитать"
 */
async function handleCalculateClick() {
  const sellSymbol = selectCurrencySellEl.value;
  const buySymbol = selectCurrencyBuyEl.value;
  const qSell = parseFloat(inputAmountSellEl.value);
  const qBuy = parseFloat(inputAmountBuyEl.value);

  // Валидация входных данных
  if (isNaN(qSell) || qSell < 0) {
    alert('Пожалуйста, введите корректное положительное количество продаваемой валюты.');
    inputAmountSellEl.focus();
    return;
  }
  if (isNaN(qBuy) || qBuy < 0) {
    alert('Пожалуйста, введите корректное положительное количество покупаемой валюты.');
    inputAmountBuyEl.focus();
    return;
  }

  const activeProviderIds = getActiveProviders();
  if (activeProviderIds.length === 0) {
    alert('Необходимо выбрать хотя бы одного провайдера котировок.');
    return;
  }

  // Требование ТЗ:
  // "ниже кнопка "посчитать", запрос к каждому из отмеченных чекбосами провадеров отправляется
  // тогда и только тогда когда пользователь нажмёт эту кнопку, никаких других запросов по таймеру и т.д"
  // "Также после нажать кнопка становится неактивной на 3 секнды со сменой надписи на "отправлено",
  // после чего снова становится активной с надпись "посчитать"."
  btnCalculateEl.disabled = true;
  btnCalculateTextEl.textContent = 'Отправлено';
  btnCalculateEl.classList.add('cooling');
  btnCooldownBarEl.style.width = '100%';

  // Таймер ровно на 3 секунды (3000 мс)
  setTimeout(() => {
    btnCalculateEl.disabled = false;
    btnCalculateTextEl.textContent = 'Посчитать';
    btnCalculateEl.classList.remove('cooling');
    btnCooldownBarEl.style.width = '0%';
  }, 3000);

  // Подготовка контейнера вывода: отображаются ТОЛЬКО отмеченные чекбоксом провайдеры
  outputCardsContainerEl.innerHTML = activeProviderIds
    .map(pId => renderProviderSkeleton(pId))
    .join('');
  outputStatusBadgeEl.textContent = `Запрос к ${activeProviderIds.length} провайдер(ам)...`;

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

  // Отрисовка финальных карточек
  let allHtml = '';
  for (const res of results) {
    if (res.success) {
      allHtml += renderProviderResult(res.providerId, sellSymbol, buySymbol, qSell, qBuy, res.rates);
    } else {
      allHtml += renderProviderError(res.providerId, res.error);
    }
  }

  outputCardsContainerEl.innerHTML = allHtml;
  const now = new Date();
  outputStatusBadgeEl.textContent = `Обновлено в ${now.toLocaleTimeString()}`;
}

// Инициализация при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
  initProviders();
  btnCalculateEl.addEventListener('click', handleCalculateClick);
});
