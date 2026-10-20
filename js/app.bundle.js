/**
 * CCPriceConverter - All-in-one standalone bundle
 * Generated automatically by scripts/build.js
 * Supports pure client-side execution (file://, static localhost, or proxy server)
 */
(() => {
  'use strict';

// ==========================================================================
// Module: calculator.js
// ==========================================================================
/**
 * CCPriceConverter - Модуль математических расчетов
 */

/**
 * Форматирование денежного значения в USD
 * @param {number} value 
 * @param {number} maxDecimals 
 * @returns {string}
 */
function formatUsd(value, maxDecimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  
  // Для значений меньше 10 USD (например XRP ~$1.4982) отображаем до 4 знаков
  const needsMoreDecimals = Math.abs(value) < 10 && (value % 1 !== 0);
  const decimals = needsMoreDecimals ? Math.max(4, maxDecimals) : maxDecimals;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Форматирование процента
 * @param {number} percent 
 * @returns {string}
 */
function formatPercent(percent) {
  if (isNaN(percent)) return '0.00%';
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
}

/**
 * Расчет сделки и анализ разницы (потери / профит) по требованиям TASK.md
 * 
 * @param {Object} params
 * @param {number} params.sellAmount - Количество продаваемой валюты
 * @param {number} params.sellPrice - Цена в USD за 1 единицу продаваемой валюты
 * @param {number} params.buyAmount - Количество покупаемой валюты
 * @param {number} params.buyPrice - Цена в USD за 1 единицу покупаемой валюты
 * @returns {Object} Результаты расчета
 */
function calculateExchange({ sellAmount, sellPrice, buyAmount, buyPrice }) {
  const qSell = Math.max(0, Number(sellAmount) || 0);
  const pSell = Math.max(0, Number(sellPrice) || 0);
  const qBuy = Math.max(0, Number(buyAmount) || 0);
  const pBuy = Math.max(0, Number(buyPrice) || 0);

  // Общие стоимости в USD всего продаваемого и покупаемого объема
  const sellTotalUsd = qSell * pSell;
  const buyTotalUsd = qBuy * pBuy;

  // Разница между рассчитанными покупаемым и продаваемым объемом: V_buy - V_sell
  const differenceUsd = buyTotalUsd - sellTotalUsd;

  // Потери (если мы отдали больше, чем получили)
  const lossUsd = sellTotalUsd - buyTotalUsd;

  // Среднее арифметическое суммарных объемов
  const averageVolumeUsd = (sellTotalUsd + buyTotalUsd) / 2;

  // Процент: 100% * разницу / (среднее арифметическое суммарных объемов)
  let percentDiff = 0;
  if (averageVolumeUsd > 0) {
    percentDiff = (100 * differenceUsd) / averageVolumeUsd;
  }

  // Определение цветового статуса согласно TASK.md:
  // 1. если внезапно будет профит (buyTotalUsd > sellTotalUsd) -> зеленый с красной надписью "WTF?" в скобках
  // 2. если потери больше 20 USD -> красный
  // 3. если потери от 0 - 20 USD -> желтый
  let status = 'loss-low'; // по умолчанию 0-20 USD (желтый)
  let statusText = 'Потери';
  let isProfit = false;

  if (differenceUsd > 0.0001) {
    // Профит
    status = 'profit';
    statusText = 'Профит';
    isProfit = true;
  } else if (lossUsd > 20) {
    // Потери > 20 USD
    status = 'loss-high';
    statusText = 'Потери (> $20)';
  } else {
    // Потери от 0 до 20 USD
    status = 'loss-low';
    statusText = 'Потери (до $20)';
  }

  return {
    sellPrice,
    buyPrice,
    sellTotalUsd,
    buyTotalUsd,
    differenceUsd,
    lossUsd,
    averageVolumeUsd,
    percentDiff,
    status,        // 'loss-high' | 'loss-low' | 'profit'
    statusText,
    isProfit
  };
}

// ==========================================================================
// Module: theme.js
// ==========================================================================
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

function getThemeMode() {
  return currentThemeMode;
}

function applyTheme(mode, saveToStorage = true, updateUrl = true) {
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

function initTheme() {
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

// ==========================================================================
// Module: i18n.js
// ==========================================================================
/**
 * CCPriceConverter - Модуль локализации (i18n)
 * Поддерживаемые языки: Английский (en - по умолчанию), Русский (ru)
 */

const TRANSLATIONS = {
  en: {
    pageTitle: "Cryptocurrency Rate Calculator | CCPriceConverter",
    pageDesc: "Browser cryptocurrency rate and volume calculator from DefiLlama, CoinMarketCap, CoinGecko, and CoinPaprika",
    brandBadge: "Multi-Provider Exchange Rates",
    appTitle: "Crypto Rate Calculator",
    appSubtitle: "Compare live quotes and evaluate exchange efficiency via APIs from leading providers",
    
    // Top bar themes
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",

    // Section 1: Providers
    providersTitle: "Quote Providers",
    providersActiveBadge: "{active} of {total} active",
    noKeyRequired: "No Key Required",
    apiKeyTag: "API Key",
    demoProKeyTag: "Demo / Pro Key",
    proKeyTag: "Pro Key",
    cmcPlaceholder: "Enter CMC API key (X-CMC_PRO_API_KEY)",
    geckoPlaceholder: "Demo/Pro API key (optional)",
    paprikaPlaceholder: "Pro API key (optional)",
    keyToggleTitle: "Show/hide key",
    singleProviderTooltip: "Cannot uncheck the only active provider",
    keylessCheckbox: "Without key",
    keylessTooltip: "Send requests without API key (public free tier)",
    keylessDisabledInputTooltip: "Keyless mode is active. Uncheck «Without key» to enter API key.",
    modeKeylessBadge: "Keyless",
    modeWithKeyBadge: "With Key",

    // Section 2: Input
    inputTitle: "Exchange Parameters (Input)",
    inputBadge: "Trade",
    sellColumnTitle: "Sell",
    sellBadge: "You Pay",
    sellCurrencyLabel: "Cryptocurrency to Sell",
    sellAmountLabel: "Quantity",
    buyColumnTitle: "Buy",
    buyBadge: "You Receive",
    buyCurrencyLabel: "Cryptocurrency to Buy",
    buyAmountLabel: "Quantity",

    btnCalculate: "Calculate",
    btnSent: "Sent",

    // Section 3: Output
    outputTitle: "Calculation Results (Output)",
    outputIdleBadge: "Awaiting calculation",
    outputLoadingBadge: "Querying {count} provider(s)...",
    outputUpdated: "Updated at {time}",
    emptyStateText: "Select providers, enter trade amounts, and click «Calculate»",

    // Metrics inside cards
    metricRateSell: "1 {sym} (Sell)",
    metricRateBuy: "1 {sym} (Buy)",
    metricCurrentRate: "Current API Rate",
    metricTotalSell: "Total Given ({amount} {sym})",
    metricSellVolumeUsd: "Sell volume in USD",
    metricTotalBuy: "Total Received ({amount} {sym})",
    metricBuyVolumeUsd: "Buy volume in USD",
    
    diffHeader: "Difference Calculation",
    diffStatusLossHigh: "Loss (> $20)",
    diffStatusLossLow: "Loss (≤ $20)",
    diffStatusProfit: "Profit",
    diffRelativeVolume: "Relative to volume:",
    statusSuccess: "Rates received",
    statusLoading: "Loading rates...",
    statusError: "Request error",
    failedToFetch: "Failed to fetch rates:",
    missingRate: "Provider did not return a rate for {sym}.",
    cmcProxyHint: "💡 DefiLlama, CoinGecko, and CoinPaprika work 100% serverless. For CoinMarketCap, start `npm start` or use a CORS proxy.",
    cmcKeyRequired: "CoinMarketCap requires an API key. Please enter your key in the provider field.",
    cmcProxyUnreachable: "Cannot reach proxy for CoinMarketCap. DefiLlama, CoinGecko, and CoinPaprika work directly without a server.",
    coingeckoRateLimit: "CoinGecko: Rate Limit (429) reached. Please try again later or use an API key.",

    // Alerts
    alertPositiveSell: "Please enter a valid positive quantity for the currency to sell.",
    alertPositiveBuy: "Please enter a valid positive quantity for the currency to buy.",
    alertSelectProvider: "At least one quote provider must be selected.",

    // CMC permanent proxy notice
    cmcProxyNoticeHtml: 'CoinMarketCap proxy: <code>npm start</code> or <code>python3 server.py</code> | DefiLlama, CoinGecko & CoinPaprika work without a server',
    cmcHintCollapsedPreview: "CoinMarketCap proxy notes (click to expand)",
    cmcCollapseTooltip: "Collapse hint",
    cmcExpandTooltip: "Expand hint",

    // API Key Storage & Security Controls
    dontSaveKeys: "Do not save keys",
    dontSaveKeysTooltip: "Prevent saving API keys to browser localStorage",
    clearSavedKeys: "Clear keys",
    clearKeysTooltip: "Delete saved API keys from browser localStorage",
    keysClearedToast: "Saved API keys cleared from localStorage",
    keySavedDiskTooltip: "API key is saved in localStorage",
    keyNotSavedTooltip: "API key is not saved to localStorage (preventive mode active)",
    modalConfirmTitle: "Saved Keys in Storage",
    modalConfirmText: "API keys are already saved in localStorage. Would you like to clear them now or keep them?",
    modalActionClear: "Clear",
    modalActionKeep: "Keep",

    // Footer
    footerTitle: "CCPriceConverter • Browser Cryptocurrency Rate Calculator"
  },

  ru: {
    pageTitle: "Калькулятор курсов криптовалют | CCPriceConverter",
    pageDesc: "Браузерный калькулятор курсов и объемов криптовалют от DefiLlama, CoinMarketCap, CoinGecko и CoinPaprika",
    brandBadge: "Мультипровайдерный обменный курс",
    appTitle: "Калькулятор курсов криптовалют",
    appSubtitle: "Сравнение котировок и оценка эффективности обмена по API от ведущих провайдеров",
    
    // Top bar themes
    themeLight: "Светлая",
    themeDark: "Тёмная",
    themeSystem: "Системная",

    // Section 1: Providers
    providersTitle: "Провайдеры котировок",
    providersActiveBadge: "{active} из {total} активно",
    noKeyRequired: "Без ключа",
    apiKeyTag: "API ключ",
    demoProKeyTag: "Demo / Pro ключ",
    proKeyTag: "Pro ключ",
    cmcPlaceholder: "Вставьте CMC API ключ (X-CMC_PRO_API_KEY)",
    geckoPlaceholder: "Demo/Pro API ключ (опционально)",
    paprikaPlaceholder: "Pro API ключ (опционально)",
    keyToggleTitle: "Показать/скрыть ключ",
    singleProviderTooltip: "Нельзя отключить единственный активный провайдер",
    keylessCheckbox: "Без ключа",
    keylessTooltip: "Запрос без API-ключа (публичный бесплатный тариф)",
    keylessDisabledInputTooltip: "Включен режим без ключа. Снимите отметку «Без ключа» для ввода API-ключа.",
    modeKeylessBadge: "Без ключа",
    modeWithKeyBadge: "С ключом",

    // Section 2: Input
    inputTitle: "Параметры обмена (Input)",
    inputBadge: "Сделка",
    sellColumnTitle: "Продажа",
    sellBadge: "Отдаём",
    sellCurrencyLabel: "Криптовалюта для продажи",
    sellAmountLabel: "Количество",
    buyColumnTitle: "Покупка",
    buyBadge: "Получаем",
    buyCurrencyLabel: "Криптовалюта для покупки",
    buyAmountLabel: "Количество",

    btnCalculate: "Посчитать",
    btnSent: "Отправлено",

    // Section 3: Output
    outputTitle: "Результаты расчёта (Output)",
    outputIdleBadge: "Ожидание запуска",
    outputLoadingBadge: "Запрос к {count} провайдер(ам)...",
    outputUpdated: "Обновлено в {time}",
    emptyStateText: "Выберите нужных провайдеров, укажите объёмы и нажмите кнопку «Посчитать»",

    // Metrics inside cards
    metricRateSell: "1 {sym} (Продажа)",
    metricRateBuy: "1 {sym} (Покупка)",
    metricCurrentRate: "Текущий курс API",
    metricTotalSell: "Всего отдаем ({amount} {sym})",
    metricSellVolumeUsd: "Объем продажи в USD",
    metricTotalBuy: "Всего получаем ({amount} {sym})",
    metricBuyVolumeUsd: "Объем покупки в USD",
    
    diffHeader: "Расчёт разницы",
    diffStatusLossHigh: "Потери (> $20)",
    diffStatusLossLow: "Потери (до $20)",
    diffStatusProfit: "Профит",
    diffRelativeVolume: "Относительно объема:",
    statusSuccess: "Котировки получены",
    statusLoading: "Загрузка котировок...",
    statusError: "Ошибка запроса",
    failedToFetch: "Не удалось получить котировки:",
    missingRate: "Провайдер не вернул котировку для {sym}.",
    cmcProxyHint: "💡 Провайдеры DefiLlama, CoinGecko и CoinPaprika работают без сервера. Для CoinMarketCap запустите `npm start` или используйте CORS-прокси.",
    cmcKeyRequired: "CoinMarketCap требует обязательный API-ключ. Пожалуйста, введите ключ в поле провайдера.",
    cmcProxyUnreachable: "Не удалось связаться с прокси для CoinMarketCap. Провайдеры DefiLlama, CoinGecko и CoinPaprika работают напрямую без сервера.",
    coingeckoRateLimit: "CoinGecko: превышен лимит запросов (Rate Limit 429). Попробуйте позже или используйте API-ключ.",

    // Alerts
    alertPositiveSell: "Пожалуйста, введите корректное положительное количество продаваемой валюты.",
    alertPositiveBuy: "Пожалуйста, введите корректное положительное количество покупаемой валюты.",
    alertSelectProvider: "Необходимо выбрать хотя бы одного провайдера котировок.",

    // CMC permanent proxy notice
    cmcProxyNoticeHtml: 'Прокси для CoinMarketCap: <code>npm start</code> или <code>python3 server.py</code> | DefiLlama, CoinGecko и CoinPaprika работают без сервера',
    cmcHintCollapsedPreview: "Настройка прокси для CoinMarketCap (нажмите, чтобы развернуть)",
    cmcCollapseTooltip: "Свернуть подсказку",
    cmcExpandTooltip: "Развернуть подсказку",

    // API Key Storage & Security Controls
    dontSaveKeys: "Не сохранять ключи",
    dontSaveKeysTooltip: "Превентивно не сохранять API-ключи в localStorage браузера",
    clearSavedKeys: "Стереть ключи",
    clearKeysTooltip: "Удалить сохранённые API-ключи из localStorage браузера",
    keysClearedToast: "Сохранённые API-ключи удалены из localStorage",
    keySavedDiskTooltip: "API-ключ сохранён в localStorage",
    keyNotSavedTooltip: "API-ключ не сохраняется в localStorage (включен превентивный режим)",
    modalConfirmTitle: "Сохранённые API-ключи",
    modalConfirmText: "В localStorage браузера уже сохранены API-ключи. Очистить их или оставить сохранёнными?",
    modalActionClear: "Очистить",
    modalActionKeep: "Оставить",

    // Footer
    footerTitle: "CCPriceConverter • Браузерный калькулятор курсов криптовалют"
  }
};

function resolveInitialLanguage() {
  if (typeof window !== 'undefined' && window.location && window.location.search) {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = (params.get('lang') || '').toLowerCase().trim();
      if (urlLang === 'ru' || urlLang === 'en') {
        localStorage.setItem(STORAGE_LANG_KEY, urlLang);
        return urlLang;
      }
    } catch {}
  }
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_LANG_KEY) : null;
  if (saved === 'ru' || saved === 'en') {
    return saved;
  }
  return 'en'; // English по умолчанию
}

function syncUrlLang(lang) {
  if (typeof window !== 'undefined' && window.location && window.history && window.history.replaceState) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.replaceState(null, '', url.toString());
    } catch {}
  }
}

const STORAGE_LANG_KEY = 'cc_lang';
let currentLang = resolveInitialLanguage();

const langChangeListeners = [];

function getLanguage() {
  return currentLang;
}

function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'ru') return;
  currentLang = lang;
  localStorage.setItem(STORAGE_LANG_KEY, lang);
  document.documentElement.lang = lang;
  syncUrlLang(lang);
  updateDomTranslations();
  langChangeListeners.forEach(fn => fn(lang));
}

function onLanguageChange(fn) {
  langChangeListeners.push(fn);
}

/**
 * Получить перевод по ключу с интерполяцией параметров
 */
function t(key, params = {}) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
  let str = dict[key] || TRANSLATIONS.en[key] || key;
  for (const [pKey, pVal] of Object.entries(params)) {
    str = str.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
  }
  return str;
}

/**
 * Обновить все статические элементы с атрибутом [data-i18n]
 */
function updateDomTranslations() {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.lang = currentLang;
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key));
  });

  // Обновление заголовка страницы
  document.title = t('pageTitle');
}

// ==========================================================================
// Module: providers.js
// ==========================================================================
/**
 * CCPriceConverter - Модуль провайдеров котировок криптовалют
 */

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BCH', name: 'Bitcoin Cash', icon: 'Ƀ' },
  { symbol: 'ZEC', name: 'Zcash', icon: 'ⓩ' },
  { symbol: 'XMR', name: 'Monero', icon: 'ɱ' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' }
];

const PROVIDERS_CONFIG = [
  {
    id: 'defillama',
    name: 'DefiLlama',
    iconClass: 'icon-llama',
    iconText: '🦙',
    requiresKey: false,
    defaultChecked: true,
    description: 'Публичный DeFi-агрегатор, не требует API-ключа'
  },
  {
    id: 'coinmarketcap',
    name: 'CoinMarketCap',
    iconClass: 'icon-cmc',
    iconText: 'M',
    requiresKey: true,
    defaultChecked: false,
    keyPlaceholder: 'Введите CMC API ключ (X-CMC_PRO_API_KEY)',
    description: 'Ведущий криптовалютный агрегатор (через локальный прокси)'
  },
  {
    id: 'coingecko',
    name: 'CoinGecko',
    iconClass: 'icon-gecko',
    iconText: '🦎',
    requiresKey: true,
    defaultChecked: false,
    keyPlaceholder: 'Demo/Pro API ключ (опционально для бесплатного тарифа)',
    description: 'Крупнейший независимый каталог криптоактивов'
  },
  {
    id: 'coinpaprika',
    name: 'CoinPaprika',
    iconClass: 'icon-paprika',
    iconText: '🌶️',
    requiresKey: true,
    defaultChecked: false,
    keyPlaceholder: 'Pro API ключ (опционально для бесплатного тарифа)',
    description: 'Аналитическая платформа котировок с открытым API'
  }
];

// Маппинг идентификаторов для DefiLlama
const DEFILLAMA_IDS = {
  BTC: 'coingecko:bitcoin',
  ETH: 'coingecko:ethereum',
  BCH: 'coingecko:bitcoin-cash',
  ZEC: 'coingecko:zcash',
  XMR: 'coingecko:monero',
  XRP: 'coingecko:ripple'
};

// Маппинг идентификаторов для CoinGecko
const COINGECKO_IDS = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BCH: 'bitcoin-cash',
  ZEC: 'zcash',
  XMR: 'monero',
  XRP: 'ripple'
};

// Маппинг идентификаторов для CoinPaprika
const COINPAPRIKA_IDS = {
  BTC: 'btc-bitcoin',
  ETH: 'eth-ethereum',
  BCH: 'bch-bitcoin-cash',
  ZEC: 'zec-zcash',
  XMR: 'xmr-monero',
  XRP: 'xrp-xrp'
};

/**
 * Получение котировок от DefiLlama
 */
async function fetchDefiLlamaRates(symbols) {
  const ids = symbols.map(s => DEFILLAMA_IDS[s]).filter(Boolean);
  if (ids.length === 0) return {};

  const url = `https://coins.llama.fi/prices/current/${ids.join(',')}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`DefiLlama HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const rates = {};
  for (const sym of symbols) {
    const id = DEFILLAMA_IDS[sym];
    if (data.coins && data.coins[id] && typeof data.coins[id].price === 'number') {
      rates[sym] = data.coins[id].price;
    }
  }
  return rates;
}

/**
 * Получение котировок от CoinGecko
 * @param {string[]} symbols - массив символов валют (BTC, ETH и т.д.)
 * @param {string} apiKey - опциональный Demo или Pro API-ключ
 * @param {boolean} isKeyless - флаг работы без ключа (публичный бесплатный тариф)
 */
async function fetchCoinGeckoRates(symbols, apiKey = '', isKeyless = false) {
  const ids = symbols.map(s => COINGECKO_IDS[s]).filter(Boolean);
  if (ids.length === 0) return {};

  const cleanKey = apiKey.trim();

  // 1. Отдельная логика для режима БЕЗ КЛЮЧА
  if (isKeyless) {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('CoinGecko: превышен лимит публичных запросов (Rate Limit 429). Попробуйте позже или снимите отметку «Без ключа» и укажите API-ключ.');
      }
      throw new Error(`CoinGecko (без ключа) HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const rates = {};
    for (const sym of symbols) {
      const id = COINGECKO_IDS[sym];
      if (data[id] && typeof data[id].usd === 'number') {
        rates[sym] = data[id].usd;
      }
    }
    return rates;
  }

  // 2. Отдельная логика для режима С КЛЮЧОМ
  if (!cleanKey) {
    throw new Error('CoinGecko: отключен режим «Без ключа», но API-ключ не указан. Введите Demo/Pro ключ или отметьте «Без ключа».');
  }

  // Сначала пробуем стандартный эндпоинт с x-cg-demo-api-key
  let url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
  let headers = {
    'x-cg-demo-api-key': cleanKey
  };

  let response = await fetch(url, { headers });

  // Если возвращается 401/403, возможно у пользователя Pro-ключ (требует pro-api.coingecko.com и x-cg-pro-api-key)
  if (response.status === 401 || response.status === 403) {
    const proUrl = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
    const proHeaders = {
      'x-cg-pro-api-key': cleanKey
    };
    try {
      const proResponse = await fetch(proUrl, { headers: proHeaders });
      if (proResponse.ok) {
        response = proResponse;
      }
    } catch {
      // Оставляем исходный ответ
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('CoinGecko: превышен лимит запросов по вашему API-ключу (Rate Limit 429).');
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('CoinGecko: неверный API-ключ (HTTP 401/403). Проверьте ключ или включите «Без ключа».');
    }
    throw new Error(`CoinGecko (с ключом) HTTP error: ${response.status}`);
  }

  const data = await response.json();
  const rates = {};
  for (const sym of symbols) {
    const id = COINGECKO_IDS[sym];
    if (data[id] && typeof data[id].usd === 'number') {
      rates[sym] = data[id].usd;
    }
  }
  return rates;
}

/**
 * Получение котировок от CoinPaprika
 * @param {string[]} symbols - массив символов валют
 * @param {string} apiKey - Pro API-ключ
 * @param {boolean} isKeyless - флаг работы без ключа (публичный бесплатный тариф)
 */
async function fetchCoinPaprikaRates(symbols, apiKey = '', isKeyless = false) {
  const cleanKey = apiKey.trim();

  // 1. Отдельная логика для режима БЕЗ КЛЮЧА
  if (isKeyless) {
    const rates = {};
    const promises = symbols.map(async (sym) => {
      const paprikaId = COINPAPRIKA_IDS[sym];
      if (!paprikaId) return;

      const url = `https://api.coinpaprika.com/v1/tickers/${paprikaId}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('CoinPaprika: превышен лимит публичных запросов (Rate Limit 429). Попробуйте позже или используйте Pro API-ключ.');
        }
        throw new Error(`CoinPaprika (без ключа): ошибка загрузки ${sym} (HTTP ${response.status})`);
      }
      const data = await response.json();
      if (data.quotes && data.quotes.USD && typeof data.quotes.USD.price === 'number') {
        rates[sym] = data.quotes.USD.price;
      }
    });

    await Promise.all(promises);
    return rates;
  }

  // 2. Отдельная логика для режима С КЛЮЧОМ
  if (!cleanKey) {
    throw new Error('CoinPaprika: отключен режим «Без ключа», но Pro API-ключ не указан. Введите ключ или отметьте «Без ключа».');
  }

  const rawKey = cleanKey.replace(/^Bearer\s+/i, '');
  const headers = {
    'Authorization': rawKey
  };

  const rates = {};
  const promises = symbols.map(async (sym) => {
    const paprikaId = COINPAPRIKA_IDS[sym];
    if (!paprikaId) return;

    // Для платного Pro-тарифа CoinPaprika использует эндпоинт api-pro.coinpaprika.com
    let url = `https://api-pro.coinpaprika.com/v1/tickers/${paprikaId}`;
    let response;
    try {
      response = await fetch(url, { headers });
    } catch {
      url = `https://api.coinpaprika.com/v1/tickers/${paprikaId}`;
      response = await fetch(url, { headers });
    }

    if (!response.ok && response.status === 404) {
      const fallbackUrl = `https://api.coinpaprika.com/v1/tickers/${paprikaId}`;
      response = await fetch(fallbackUrl, { headers });
    }

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('CoinPaprika: ошибка авторизации API-ключа (HTTP 401/403). Проверьте ключ или включите «Без ключа».');
      }
      throw new Error(`CoinPaprika (с ключом): ошибка загрузки ${sym} (HTTP ${response.status})`);
    }

    const data = await response.json();
    if (data.quotes && data.quotes.USD && typeof data.quotes.USD.price === 'number') {
      rates[sym] = data.quotes.USD.price;
    }
  });

  await Promise.all(promises);
  return rates;
}

/**
 * Получение котировок от CoinMarketCap (с поддержкой локального сервера, прямого запроса и CORS-прокси)
 */
async function fetchCoinMarketCapRates(symbols, apiKey = '') {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('CoinMarketCap требует обязательный API-ключ. Пожалуйста, введите ключ в поле провайдера.');
  }

  const symList = symbols.join(',');
  const queryParamStr = `symbol=${encodeURIComponent(symList)}&CMC_PRO_API_KEY=${encodeURIComponent(cleanKey)}`;
  const directApiUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?${queryParamStr}`;

  // Стратегии запроса котировок (от локального прокси к публичным CORS-прокси и прямому запросу)
  const candidateRequests = [];

  // 1. Относительный путь к локальному серверу (если открыто через сервер CCPriceConverter по http/https)
  if (typeof window !== 'undefined' && window.location && window.location.protocol.startsWith('http')) {
    candidateRequests.push(async () => {
      return await fetch(`/api/cmc/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symList)}`, {
        headers: { 'X-CMC_PRO_API_KEY': cleanKey }
      });
    });
  }

  // 2. Локальный сервер по умолчанию на порту 3000 (если открыто через file:// или другой порт локалхоста)
  candidateRequests.push(async () => {
    return await fetch(`http://localhost:3000/api/cmc/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(symList)}`, {
      headers: { 'X-CMC_PRO_API_KEY': cleanKey }
    });
  });

  // 3. Прямой запрос к CMC (на случай наличия браузерного расширения CORS или режима разработки)
  candidateRequests.push(async () => {
    return await fetch(directApiUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': cleanKey,
        'Accept': 'application/json'
      }
    });
  });

  // 4. Публичный CORS-прокси corsproxy.io
  candidateRequests.push(async () => {
    return await fetch(`https://corsproxy.io/?url=${encodeURIComponent(directApiUrl)}`, {
      headers: { 'Accept': 'application/json' }
    });
  });

  // 5. Публичный CORS-прокси allorigins.win
  candidateRequests.push(async () => {
    return await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(directApiUrl)}`, {
      headers: { 'Accept': 'application/json' }
    });
  });

  let lastError = null;

  for (const sendRequest of candidateRequests) {
    try {
      const response = await sendRequest();
      if (!response || !response.ok) {
        if (response) {
          try {
            const errJson = await response.json();
            if (errJson.status && errJson.status.error_message) {
              // Если CMC ответил с конкретным сообщением об ошибке (например, неверный ключ), сразу выбрасываем её
              throw new Error(`CoinMarketCap: ${errJson.status.error_message}`);
            }
          } catch (e) {
            if (e.message.startsWith('CoinMarketCap:')) throw e;
          }
        }
        continue;
      }

      const json = await response.json();
      if (json.status && json.status.error_code && json.status.error_code !== 0) {
        throw new Error(`CoinMarketCap: ${json.status.error_message || 'API error'}`);
      }

      const rates = {};
      if (json.data) {
        for (const sym of symbols) {
          if (json.data[sym] && json.data[sym].quote && json.data[sym].quote.USD) {
            rates[sym] = json.data[sym].quote.USD.price;
          }
        }
        if (Object.keys(rates).length > 0) {
          return rates;
        }
      }
    } catch (err) {
      if (err.message.startsWith('CoinMarketCap:')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw new Error('CoinMarketCap API блокирует запросы из браузера по политике CORS. Для работы с CMC запустите локальный сервер (`npm start` или `python3 server.py`) либо используйте провайдеры DefiLlama, CoinGecko и CoinPaprika, которые работают напрямую без сервера.');
}

/**
 * Единый диспетчер запросов по ID провайдера
 * @param {string} providerId
 * @param {string[]} symbols
 * @param {string} apiKey
 * @param {boolean} isKeyless
 */
async function fetchProviderRates(providerId, symbols, apiKey = '', isKeyless = false) {
  switch (providerId) {
    case 'defillama':
      return await fetchDefiLlamaRates(symbols);
    case 'coingecko':
      return await fetchCoinGeckoRates(symbols, apiKey, isKeyless);
    case 'coinpaprika':
      return await fetchCoinPaprikaRates(symbols, apiKey, isKeyless);
    case 'coinmarketcap':
      return await fetchCoinMarketCapRates(symbols, apiKey);
    default:
      throw new Error(`Неизвестный провайдер: ${providerId}`);
  }
}

// ==========================================================================
// Module: app.js
// ==========================================================================
/**
 * CCPriceConverter - Основной управляющий модуль приложения (App Controller)
 */






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
const STORAGE_KEYLESS_PREFIX = 'cc_keyless_';
const API_KEY_PROVIDERS = ['coinmarketcap', 'coingecko', 'coinpaprika'];
const KEYLESS_PROVIDERS = ['coingecko', 'coinpaprika'];

let isDontSaveEnabled = localStorage.getItem(STORAGE_DONT_SAVE_KEY) === 'true';

const apiKeysCache = {
  coinmarketcap: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinmarketcap`) || '',
  coingecko: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coingecko`) || '',
  coinpaprika: localStorage.getItem(`${STORAGE_KEYS_PREFIX}coinpaprika`) || ''
};

function isProviderKeyless(providerId) {
  if (!KEYLESS_PROVIDERS.includes(providerId)) {
    return providerId === 'defillama';
  }
  const saved = localStorage.getItem(`${STORAGE_KEYLESS_PREFIX}${providerId}`);
  if (saved !== null) {
    return saved === 'true';
  }
  return true; // по умолчанию включены
}

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

    // Если для провайдера активен режим "Без ключа", дискета скрывается
    if (KEYLESS_PROVIDERS.includes(providerId) && isProviderKeyless(providerId)) {
      indicatorEl.classList.add('is-hidden');
      indicatorEl.classList.remove('saved', 'not-saved');
      return;
    }

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

  // Навешивание обработчиков на чекбоксы провайдеров
  const checkboxes = document.querySelectorAll('input[type="checkbox"][data-provider]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      updateProvidersUI();
    });
  });

  // Инициализация независимых чекбоксов "Без ключа" для CoinGecko и CoinPaprika
  KEYLESS_PROVIDERS.forEach(providerId => {
    const cbKeyless = document.getElementById(`checkbox-keyless-${providerId}`);
    const wrapperEl = document.getElementById(`api-key-wrapper-${providerId}`);
    const inputEl = document.getElementById(`input-key-${providerId}`);

    if (cbKeyless) {
      // Восстанавливаем сохраненное состояние (по умолчанию true)
      const savedKeyless = isProviderKeyless(providerId);
      cbKeyless.checked = savedKeyless;

      const updateKeylessState = (isKeyless) => {
        if (wrapperEl) {
          if (isKeyless) {
            wrapperEl.classList.add('keyless-mode');
            if (inputEl) {
              inputEl.disabled = true;
              inputEl.title = t('keylessDisabledInputTooltip');
            }
          } else {
            wrapperEl.classList.remove('keyless-mode');
            if (inputEl) {
              inputEl.disabled = false;
              inputEl.title = '';
            }
          }
        }
        updateKeyStatusIndicators();
      };

      updateKeylessState(cbKeyless.checked);

      cbKeyless.addEventListener('change', () => {
        localStorage.setItem(`${STORAGE_KEYLESS_PREFIX}${providerId}`, cbKeyless.checked ? 'true' : 'false');
        updateKeylessState(cbKeyless.checked);
        if (!cbKeyless.checked && inputEl) {
          inputEl.focus();
        }
      });

      // При клике на затемнённый инпут в режиме "без ключа" - автоматически переключаем на ввод ключа
      if (wrapperEl) {
        wrapperEl.addEventListener('click', (e) => {
          if (cbKeyless.checked) {
            cbKeyless.checked = false;
            localStorage.setItem(`${STORAGE_KEYLESS_PREFIX}${providerId}`, 'false');
            updateKeylessState(false);
            if (inputEl) {
              inputEl.focus();
            }
          }
        });
      }
    }
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
  const isKeyless = isProviderKeyless(providerId);
  const modeBadge = KEYLESS_PROVIDERS.includes(providerId)
    ? `<span class="card-provider-mode-tag">${isKeyless ? t('modeKeylessBadge') : t('modeWithKeyBadge')}</span>`
    : '';

  return `
    <div class="provider-card" id="card-${providerId}">
      <div class="provider-card-header">
        <div class="card-provider-title">
          <span class="provider-icon ${config.iconClass}">${config.iconText}</span>
          <span>${config.name}</span>
          ${modeBadge}
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
function renderProviderError(providerId, errorMessage, isKeyless = false) {
  const config = PROVIDERS_CONFIG.find(p => p.id === providerId) || { name: providerId };
  const modeBadge = KEYLESS_PROVIDERS.includes(providerId)
    ? `<span class="card-provider-mode-tag">${isKeyless ? t('modeKeylessBadge') : t('modeWithKeyBadge')}</span>`
    : '';

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
          ${modeBadge}
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
function renderProviderResult(providerId, sellSymbol, buySymbol, qSell, qBuy, rates, isKeyless = false) {
  const config = PROVIDERS_CONFIG.find(p => p.id === providerId) || { name: providerId };
  const modeBadge = KEYLESS_PROVIDERS.includes(providerId)
    ? `<span class="card-provider-mode-tag">${isKeyless ? t('modeKeylessBadge') : t('modeWithKeyBadge')}</span>`
    : '';

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
          ${modeBadge}
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
      allHtml += renderProviderResult(res.providerId, sellSymbol, buySymbol, qSell, qBuy, res.rates, res.isKeyless);
    } else {
      allHtml += renderProviderError(res.providerId, res.error, res.isKeyless);
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

  // Параллельный опрос всех активных провайдеров с учетом флага isKeyless
  const requests = activeProviderIds.map(async (providerId) => {
    const key = apiKeysCache[providerId] || '';
    const isKeyless = isProviderKeyless(providerId);
    try {
      const rates = await fetchProviderRates(providerId, symbolsToFetch, key, isKeyless);
      return { providerId, success: true, rates, isKeyless };
    } catch (err) {
      return { providerId, success: false, error: err.message, isKeyless };
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

// Инициализация приложения
function initApp() {
  initTopControls();
  initStorageControls();
  initProviders();
  initCmcHintToggle();
  updateDomTranslations();
  const btn = document.getElementById('btn-calculate');
  if (btn) {
    btn.addEventListener('click', handleCalculateClick);
  }
}

if (document.getElementById('btn-calculate')) {
  initApp();
} else {
  document.addEventListener('DOMContentLoaded', initApp);
}

})();
