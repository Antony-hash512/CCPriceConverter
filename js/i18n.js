/**
 * CCPriceConverter - Модуль локализации (i18n)
 * Поддерживаемые языки: Английский (en - по умолчанию), Русский (ru)
 */

export const TRANSLATIONS = {
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
    cmcProxyHint: "💡 To use CoinMarketCap, start the local server: `npm start` or `python3 server.py`",
    cmcKeyRequired: "CoinMarketCap requires an API key. Please enter your key in the provider field.",
    cmcProxyUnreachable: "Cannot reach the local proxy for CoinMarketCap. Make sure server is running (`npm start` or `node server.js`).",
    coingeckoRateLimit: "CoinGecko: Rate Limit (429) reached. Please try again later or use an API key.",

    // Alerts
    alertPositiveSell: "Please enter a valid positive quantity for the currency to sell.",
    alertPositiveBuy: "Please enter a valid positive quantity for the currency to buy.",
    alertSelectProvider: "At least one quote provider must be selected.",

    // CMC permanent proxy notice
    cmcProxyNoticeHtml: 'Run local proxy for CoinMarketCap: <code>npm start</code> or <code>python3 server.py</code> | See <a href="instructions.html" class="hint-link">Instructions</a>',
    cmcHintCollapsedPreview: "Local proxy setup (click to expand)",
    cmcCollapseTooltip: "Collapse hint",
    cmcExpandTooltip: "Expand hint",

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
    cmcProxyHint: "💡 Для работы CoinMarketCap запустите локальный сервер: `npm start` или `python3 server.py`",
    cmcKeyRequired: "CoinMarketCap требует обязательный API-ключ. Пожалуйста, введите ключ в поле провайдера.",
    cmcProxyUnreachable: "Не удалось связаться с локальным прокси для CoinMarketCap. Убедитесь, что сервер запущен: `npm start` или `node server.js`.",
    coingeckoRateLimit: "CoinGecko: превышен лимит запросов (Rate Limit 429). Попробуйте позже или используйте API-ключ.",

    // Alerts
    alertPositiveSell: "Пожалуйста, введите корректное положительное количество продаваемой валюты.",
    alertPositiveBuy: "Пожалуйста, введите корректное положительное количество покупаемой валюты.",
    alertSelectProvider: "Необходимо выбрать хотя бы одного провайдера котировок.",

    // CMC permanent proxy notice
    cmcProxyNoticeHtml: 'Запуск локального прокси для CoinMarketCap: <code>npm start</code> или <code>python3 server.py</code> | См. <a href="instructions.html" class="hint-link">Инструкция</a>',
    cmcHintCollapsedPreview: "Настройка локального прокси (нажмите, чтобы развернуть)",
    cmcCollapseTooltip: "Свернуть подсказку",
    cmcExpandTooltip: "Развернуть подсказку",

    // Footer
    footerTitle: "CCPriceConverter • Браузерный калькулятор курсов криптовалют"
  }
};

const STORAGE_LANG_KEY = 'cc_lang';
let currentLang = localStorage.getItem(STORAGE_LANG_KEY) || 'en'; // English по умолчанию

const langChangeListeners = [];

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (lang !== 'en' && lang !== 'ru') return;
  currentLang = lang;
  localStorage.setItem(STORAGE_LANG_KEY, lang);
  document.documentElement.lang = lang;
  updateDomTranslations();
  langChangeListeners.forEach(fn => fn(lang));
}

export function onLanguageChange(fn) {
  langChangeListeners.push(fn);
}

/**
 * Получить перевод по ключу с интерполяцией параметров
 */
export function t(key, params = {}) {
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
export function updateDomTranslations() {
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
