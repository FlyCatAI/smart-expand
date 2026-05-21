import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMonthlyPerformance,
  buildMonthlyPerformanceList,
  buildSummary,
  formatDelta,
  formatSmartMoney,
  formatTrend,
  formatYuanMoney,
  trendTone,
} from '../src/pages/history-performance/historyPerformanceLogic';
import type { RawMonthlyPerformance, RawSummary } from '../src/pages/history-performance/types';

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
  assert.deepEqual(formatTrend({ value: -0, hasPrevious: true }), { text: '+0%', tone: 'neutral' });
  assert.equal(trendTone({ value: -0, hasPrevious: true }), 'neutral');
});

test('formatYuanMoney keeps monthly income in yuan display scale', () => {
  assert.equal(formatYuanMoney(125), '¥125');
  assert.equal(formatYuanMoney(99.9), '¥99.90');
  assert.equal(formatYuanMoney(Number.NaN), '--');
});

test('formatDelta handles missing, neutral, positive, and negative values', () => {
  assert.equal(formatDelta(null), '');
  assert.equal(formatDelta(0), '0');
  assert.equal(formatDelta(-0), '0');
  assert.equal(formatDelta(5), '+5');
  assert.equal(formatDelta(-3), '-3');
  assert.equal(formatDelta(Number.NaN), '');
});

test('buildSummary formats summary income and AUM with smart money units', () => {
  const raw: RawSummary = {
    periodType: 'annual',
    updatedAt: '2026-05-15T10:30:00+08:00',
    entryCount: { value: 128, trend: { value: 12, hasPrevious: true } },
    qualifiedCount: { value: 96, trend: { value: 8, hasPrevious: true } },
    activeCount: { value: 82, trend: { value: 0, hasPrevious: true } },
    income: { value: 285600, trend: { value: 15, hasPrevious: true } },
    aumTotal: { value: 100000000, trend: { value: null, hasPrevious: false } },
    priority: 'P2',
  };

  const summary = buildSummary(raw);

  assert.equal(summary.periodType, 'annual');
  assert.equal(summary.updatedAtText, '更新于 05-15 10:30');
  assert.deepEqual(summary.metrics.map((metric) => metric.value), ['128户', '96户', '82户', '¥28.5万']);
  assert.equal(summary.metrics[2].trendText, '+0%');
  assert.equal(summary.metrics[2].trendTone, 'neutral');
  assert.deepEqual(summary.aum, {
    label: '资产总计',
    value: '¥1.0亿',
    trendText: '无上期数据',
    trendTone: 'neutral',
    priority: 'P2',
  });
});

test('buildMonthlyPerformance formats income 125 as yuan amount', () => {
  const raw: RawMonthlyPerformance = {
    statMonth: '2026年3月',
    current: true,
    merchantCount: 42,
    merchantCountDelta: 5,
    merchantCountGrowth: { value: 15, hasPrevious: true },
    qualifiedCount: 33,
    qualifiedCountDelta: -3,
    qualifiedCountGrowth: { value: -9, hasPrevious: true },
    activeCount: 41,
    activeCountDelta: 0,
    activeCountGrowth: { value: 0, hasPrevious: true },
    income: 125,
    incomeGrowth: { value: 12, hasPrevious: true },
  };

  const month = buildMonthlyPerformance(raw);

  assert.equal(month.statMonth, '2026年3月');
  assert.equal(month.current, true);
  assert.equal(month.metrics[0].trendText, '较上月+5 / +15%');
  assert.equal(month.metrics[1].trendText, '较上月-3 / -9%');
  assert.equal(month.metrics[2].trendText, '较上月0 / +0%');
  assert.deepEqual(month.metrics[3], {
    label: '收入',
    value: '¥125',
    trendText: '+12%',
    trendTone: 'positive',
  });
});

test('buildMonthlyPerformanceList sorts near 12 month display model in descending month order', () => {
  const base: RawMonthlyPerformance = {
    statMonth: '2026年1月',
    current: false,
    merchantCount: 1,
    merchantCountDelta: null,
    merchantCountGrowth: { value: null, hasPrevious: false },
    qualifiedCount: 1,
    qualifiedCountDelta: null,
    qualifiedCountGrowth: { value: null, hasPrevious: false },
    activeCount: 1,
    activeCountDelta: null,
    activeCountGrowth: { value: null, hasPrevious: false },
    income: 1,
    incomeGrowth: { value: null, hasPrevious: false },
  };

  const list = buildMonthlyPerformanceList([
    { ...base, statMonth: '2025年12月' },
    { ...base, statMonth: '2026年3月' },
    { ...base, statMonth: '2026年1月' },
  ]);

  assert.deepEqual(list.map((month) => month.statMonth), ['2026年3月', '2026年1月', '2025年12月']);
});
