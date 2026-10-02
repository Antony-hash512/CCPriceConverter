import { calculateExchange, formatUsd, formatPercent } from '../js/calculator.js';
import assert from 'node:assert/strict';

console.log('--- Testing CCPriceConverter Calculator Engine ---');

// Тест 1: Потери больше 20 USD -> красный цвет ('loss-high')
{
  const res = calculateExchange({
    sellAmount: 1,      // 1 BTC
    sellPrice: 85000,   // $85,000
    buyAmount: 30,     // 30 ETH
    buyPrice: 2800      // $84,000 total
  });
  // Sell = 85000, Buy = 84000 -> Loss = 1000 USD
  assert.equal(res.sellTotalUsd, 85000);
  assert.equal(res.buyTotalUsd, 84000);
  assert.equal(res.differenceUsd, -1000);
  assert.equal(res.lossUsd, 1000);
  assert.equal(res.status, 'loss-high', 'Loss > 20 USD should be loss-high (red)');
  assert.equal(res.isProfit, false);
  
  // Среднее = (85000 + 84000) / 2 = 84500
  // Процент = 100 * (-1000) / 84500 = -1.1834%
  const expectedPercent = (100 * -1000) / 84500;
  assert.ok(Math.abs(res.percentDiff - expectedPercent) < 0.001);
  console.log('✓ Test 1 Passed: Loss > $20 classified as loss-high');
}

// Тест 2: Потери от 0 до 20 USD -> желтый цвет ('loss-low')
{
  const res = calculateExchange({
    sellAmount: 1,      // 1 BTC
    sellPrice: 85000,
    buyAmount: 34,
    buyPrice: 2499.7    // Buy total = 84989.8 (loss = 10.2 USD)
  });
  assert.ok(res.lossUsd > 0 && res.lossUsd <= 20);
  assert.equal(res.status, 'loss-low', 'Loss <= 20 USD should be loss-low (yellow)');
  assert.equal(res.isProfit, false);
  console.log('✓ Test 2 Passed: Loss $0-$20 classified as loss-low');
}

// Тест 3: Профит -> зеленый цвет ('profit') с флагом isProfit
{
  const res = calculateExchange({
    sellAmount: 1,
    sellPrice: 80000,
    buyAmount: 30,
    buyPrice: 3000      // Buy total = 90000 (profit = 10000 USD)
  });
  assert.equal(res.differenceUsd, 10000);
  assert.equal(res.status, 'profit', 'Profit should be classified as profit (green with WTF)');
  assert.equal(res.isProfit, true);
  
  // Среднее = (80000 + 90000) / 2 = 85000
  // Процент = 100 * 10000 / 85000 = 11.76%
  const expectedPercent = (100 * 10000) / 85000;
  assert.ok(Math.abs(res.percentDiff - expectedPercent) < 0.001);
  console.log('✓ Test 3 Passed: Profit classified as profit with isProfit=true');
}

// Тест 4: Форматирование USD и процентов
{
  assert.equal(formatUsd(85000), '$85,000.00');
  assert.equal(formatUsd(1.4982), '$1.4982');
  assert.equal(formatPercent(5.234), '+5.23%');
  assert.equal(formatPercent(-3.456), '-3.46%');
  console.log('✓ Test 4 Passed: Formatting functions work accurately');
}

console.log('--- All Calculator Engine Tests Passed Successfully! ---');
