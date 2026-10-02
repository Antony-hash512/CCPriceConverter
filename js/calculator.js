/**
 * CCPriceConverter - Модуль математических расчетов
 */

/**
 * Форматирование денежного значения в USD
 * @param {number} value 
 * @param {number} maxDecimals 
 * @returns {string}
 */
export function formatUsd(value, maxDecimals = 2) {
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
export function formatPercent(percent) {
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
export function calculateExchange({ sellAmount, sellPrice, buyAmount, buyPrice }) {
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
