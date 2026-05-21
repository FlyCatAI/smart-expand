import assert from 'node:assert/strict';
import test from 'node:test';
import { formatSmartMoney, formatTrend } from '../src/pages/history-performance/historyPerformanceLogic';

test('formatSmartMoney switches units at required boundaries', () => {
  assert.equal(formatSmartMoney(99.99), '¥99.99元');
  assert.equal(formatSmartMoney(100), '¥0.0万');
  assert.equal(formatSmartMoney(99999900), '¥9999.9万');
  assert.equal(formatSmartMoney(100000000), '¥1.0亿');
});

test('formatTrend handles neutral, negative floor, and missing previous data', () => {
  assert.deepEqual(formatTrend({ value: 0, hasPrevious: true }), { text: '+0%', tone: 'neutral' });
  assert.deepEqual(formatTrend({ value: -100, hasPrevious: true }), { text: '-100%', tone: 'negative' });
  assert.deepEqual(formatTrend({ value: null, hasPrevious: false }), { text: '无上期数据', tone: 'neutral' });
});
