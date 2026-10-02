/**
 * CCPriceConverter - Модуль провайдеров котировок криптовалют
 */

export const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { symbol: 'BCH', name: 'Bitcoin Cash', icon: 'Ƀ' },
  { symbol: 'ZEC', name: 'Zcash', icon: 'ⓩ' },
  { symbol: 'XMR', name: 'Monero', icon: 'ɱ' },
  { symbol: 'XRP', name: 'Ripple', icon: '✕' }
];

export const PROVIDERS_CONFIG = [
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
export async function fetchDefiLlamaRates(symbols) {
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
export async function fetchCoinGeckoRates(symbols, apiKey = '', isKeyless = false) {
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
export async function fetchCoinPaprikaRates(symbols, apiKey = '', isKeyless = false) {
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
 * Получение котировок от CoinMarketCap (через локальный прокси server.js)
 */
export async function fetchCoinMarketCapRates(symbols, apiKey = '') {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('CoinMarketCap требует обязательный API-ключ. Пожалуйста, введите ключ в поле провайдера.');
  }

  const symList = symbols.join(',');
  const proxyUrl = `/api/cmc/v1/cryptocurrency/quotes/latest?symbol=${symList}`;

  let response;
  try {
    response = await fetch(proxyUrl, {
      headers: {
        'X-CMC_PRO_API_KEY': cleanKey
      }
    });
  } catch (err) {
    throw new Error('Не удалось связаться с локальным прокси для CoinMarketCap. Убедитесь, что сервер запущен: `npm start` или `node server.js`.');
  }

  if (!response.ok) {
    let errMessage = `CoinMarketCap HTTP error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.status && errJson.status.error_message) {
        errMessage = `CoinMarketCap: ${errJson.status.error_message}`;
      }
    } catch {
      // Игнорируем ошибку парсинга тела
    }
    throw new Error(errMessage);
  }

  const json = await response.json();
  const rates = {};
  if (json.data) {
    for (const sym of symbols) {
      if (json.data[sym] && json.data[sym].quote && json.data[sym].quote.USD) {
        rates[sym] = json.data[sym].quote.USD.price;
      }
    }
  }
  return rates;
}

/**
 * Единый диспетчер запросов по ID провайдера
 * @param {string} providerId
 * @param {string[]} symbols
 * @param {string} apiKey
 * @param {boolean} isKeyless
 */
export async function fetchProviderRates(providerId, symbols, apiKey = '', isKeyless = false) {
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
