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
 */
export async function fetchCoinGeckoRates(symbols, apiKey = '') {
  const ids = symbols.map(s => COINGECKO_IDS[s]).filter(Boolean);
  if (ids.length === 0) return {};

  const cleanKey = apiKey.trim();
  let url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`;
  const headers = {};

  if (cleanKey) {
    headers['x-cg-demo-api-key'] = cleanKey;
  }

  const response = await fetch(url, { headers });
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('CoinGecko: превышен лимит запросов (Rate Limit 429). Попробуйте позже или используйте API-ключ.');
    }
    throw new Error(`CoinGecko HTTP error: ${response.status}`);
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
 */
export async function fetchCoinPaprikaRates(symbols, apiKey = '') {
  const cleanKey = apiKey.trim();
  const headers = {};
  if (cleanKey) {
    headers['Authorization'] = cleanKey.startsWith('Bearer ') ? cleanKey : `Bearer ${cleanKey}`;
  }

  const rates = {};
  const promises = symbols.map(async (sym) => {
    const paprikaId = COINPAPRIKA_IDS[sym];
    if (!paprikaId) return;

    const url = `https://api.coinpaprika.com/v1/tickers/${paprikaId}`;
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`CoinPaprika: ошибка загрузки ${sym} (HTTP ${response.status})`);
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
 */
export async function fetchProviderRates(providerId, symbols, apiKey = '') {
  switch (providerId) {
    case 'defillama':
      return await fetchDefiLlamaRates(symbols);
    case 'coingecko':
      return await fetchCoinGeckoRates(symbols, apiKey);
    case 'coinpaprika':
      return await fetchCoinPaprikaRates(symbols, apiKey);
    case 'coinmarketcap':
      return await fetchCoinMarketCapRates(symbols, apiKey);
    default:
      throw new Error(`Неизвестный провайдер: ${providerId}`);
  }
}
