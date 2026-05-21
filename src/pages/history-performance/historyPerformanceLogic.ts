import { computed, onMounted, ref } from 'vue';
import { mockMonthlyPerformance, mockSummaryByPeriod } from './mockHistoryPerformance';
import type {
  DisplayMetric,
  DisplayMonthlyPerformance,
  DisplaySummary,
  PeriodType,
  RawMonthlyPerformance,
  RawSummary,
  RawTrend,
  TrendTone,
} from './types';

const PERIOD_LABELS: Record<PeriodType, string> = {
  annual: '本年度',
  total: '历史汇总',
};

const HISTORY_LOAD_TIMEOUT_MS = 3000;

function floorToFixed(value: number, digits: number) {
  const scale = 10 ** digits;
  return (Math.floor(value * scale) / scale).toFixed(digits);
}

export function formatSmartMoney(value: number) {
  if (!Number.isFinite(value)) return '--';
  if (value >= 100000000) return `¥${floorToFixed(value / 100000000, 1)}亿`;
  if (value >= 100) return `¥${floorToFixed(value / 10000, 1)}万`;
  return `¥${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}元`;
}

export function formatYuanMoney(value: number) {
  if (!Number.isFinite(value)) return '--';
  return `¥${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}`;
}

export function trendTone(trend: RawTrend): TrendTone {
  if (!trend.hasPrevious || !Number.isFinite(trend.value)) return 'neutral';
  if (trend.value === null || Object.is(trend.value, -0) || trend.value === 0) return 'neutral';
  return trend.value > 0 ? 'positive' : 'negative';
}

export function formatTrend(trend: RawTrend) {
  if (!trend.hasPrevious || trend.value === null || !Number.isFinite(trend.value)) {
    return { text: '无上期数据', tone: 'neutral' as TrendTone };
  }
  if (Object.is(trend.value, -0) || trend.value === 0) {
    return { text: '+0%', tone: 'neutral' as TrendTone };
  }
  return {
    text: `${trend.value > 0 ? '+' : ''}${trend.value}%`,
    tone: trend.value > 0 ? 'positive' as TrendTone : 'negative' as TrendTone,
  };
}

export function formatDelta(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '';
  if (Object.is(value, -0) || value === 0) return '0';
  return value > 0 ? `+${value}` : `${value}`;
}

export function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `更新于 ${month}-${day} ${hours}:${minutes}`;
}

function countMetric(label: string, value: number, trend: RawTrend): DisplayMetric {
  const formattedTrend = formatTrend(trend);
  return {
    label,
    value: `${value}户`,
    trendText: formattedTrend.text,
    trendTone: formattedTrend.tone,
  };
}

function summaryMoneyMetric(label: string, value: number, trend: RawTrend): DisplayMetric {
  const formattedTrend = formatTrend(trend);
  return {
    label,
    value: formatSmartMoney(value),
    trendText: formattedTrend.text,
    trendTone: formattedTrend.tone,
  };
}

export function buildSummary(raw: RawSummary): DisplaySummary {
  const aumTrend = formatTrend(raw.aumTotal.trend);
  return {
    periodType: raw.periodType,
    updatedAtText: formatUpdatedAt(raw.updatedAt),
    metrics: [
      countMetric('入网', raw.entryCount.value, raw.entryCount.trend),
      countMetric('达标', raw.qualifiedCount.value, raw.qualifiedCount.trend),
      countMetric('有效', raw.activeCount.value, raw.activeCount.trend),
      summaryMoneyMetric('收入', raw.income.value, raw.income.trend),
    ],
    aum: {
      label: '资产总计',
      value: formatSmartMoney(raw.aumTotal.value),
      trendText: aumTrend.text,
      trendTone: aumTrend.tone,
      priority: raw.priority,
    },
  };
}

function monthlyCountMetric(label: string, value: number, delta: number | null, growth: RawTrend): DisplayMetric {
  const formattedTrend = formatTrend(growth);
  const deltaText = formatDelta(delta);
  const prefix = deltaText ? `较上月${deltaText} / ` : '较上月';
  return {
    label,
    value: `${value}`,
    trendText: `${prefix}${formattedTrend.text}`,
    trendTone: formattedTrend.tone,
  };
}

function monthlyIncomeMetric(value: number, growth: RawTrend): DisplayMetric {
  const formattedTrend = formatTrend(growth);
  return {
    label: '收入',
    value: formatYuanMoney(value),
    trendText: formattedTrend.text,
    trendTone: formattedTrend.tone,
  };
}

function parseStatMonth(value: string) {
  const matched = value.match(/^(\d{4})年(\d{1,2})月$/);
  if (!matched) return Number.NEGATIVE_INFINITY;
  const year = Number(matched[1]);
  const month = Number(matched[2]);
  return year * 100 + month;
}

export function buildMonthlyPerformanceList(rawList: RawMonthlyPerformance[]): DisplayMonthlyPerformance[] {
  return [...rawList]
    .sort((left, right) => parseStatMonth(right.statMonth) - parseStatMonth(left.statMonth))
    .map(buildMonthlyPerformance);
}

export function buildMonthlyPerformance(raw: RawMonthlyPerformance): DisplayMonthlyPerformance {
  return {
    statMonth: raw.statMonth,
    current: raw.current,
    metrics: [
      monthlyCountMetric('入网商户', raw.merchantCount, raw.merchantCountDelta, raw.merchantCountGrowth),
      monthlyCountMetric('达标商户', raw.qualifiedCount, raw.qualifiedCountDelta, raw.qualifiedCountGrowth),
      monthlyCountMetric('有效商户', raw.activeCount, raw.activeCountDelta, raw.activeCountGrowth),
      monthlyIncomeMetric(raw.income, raw.incomeGrowth),
    ],
  };
}

function timeoutPromise(ms: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('history_performance_timeout')), ms);
  });
}

async function fetchMockHistoryPerformance() {
  return {
    summaryByPeriod: mockSummaryByPeriod,
    monthlyPerformance: mockMonthlyPerformance,
  };
}

export function useHistoryPerformance() {
  const selectedPeriod = ref<PeriodType>('annual');
  const loading = ref(false);
  const loadError = ref(false);
  const loadFailure = ref<{ reason: string; at: number } | null>(null);
  const summaryByPeriod = ref(mockSummaryByPeriod);
  const monthlyPerformance = ref(mockMonthlyPerformance);

  const periodTabs = computed(() => ([
    { id: 'annual' as PeriodType, label: PERIOD_LABELS.annual },
    { id: 'total' as PeriodType, label: PERIOD_LABELS.total },
  ]));
  const currentSummary = computed(() => buildSummary(summaryByPeriod.value[selectedPeriod.value]));
  const monthlyList = computed(() => buildMonthlyPerformanceList(monthlyPerformance.value));

  function selectPeriod(period: PeriodType) {
    selectedPeriod.value = period;
  }

  function notifyLoadFailure(reason: string) {
    loadFailure.value = { reason, at: Date.now() };
    window.dispatchEvent(new CustomEvent('hzy:history-performance-load-failed', { detail: loadFailure.value }));
  }

  async function loadHistoryPerformance() {
    if (loading.value) return;
    loading.value = true;
    loadError.value = false;
    loadFailure.value = null;
    try {
      const response = await Promise.race([
        fetchMockHistoryPerformance(),
        timeoutPromise(HISTORY_LOAD_TIMEOUT_MS),
      ]);
      summaryByPeriod.value = response.summaryByPeriod;
      monthlyPerformance.value = response.monthlyPerformance;
    } catch (error) {
      loadError.value = true;
      notifyLoadFailure(error instanceof Error ? error.message : 'history_performance_mock_loader_error');
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    void loadHistoryPerformance();
  });

  return {
    currentSummary,
    loadError,
    loadFailure,
    loading,
    loadHistoryPerformance,
    monthlyList,
    periodTabs,
    selectPeriod,
    selectedPeriod,
  };
}
