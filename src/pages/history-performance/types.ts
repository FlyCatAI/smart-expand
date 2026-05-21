export type PeriodType = 'annual' | 'total';
export type TrendTone = 'positive' | 'negative' | 'neutral';

export interface RawTrend {
  value: number | null;
  hasPrevious: boolean;
}

export interface RawSummaryMetric {
  value: number;
  trend: RawTrend;
}

export interface RawSummary {
  periodType: PeriodType;
  updatedAt: string;
  entryCount: RawSummaryMetric;
  qualifiedCount: RawSummaryMetric;
  activeCount: RawSummaryMetric;
  income: RawSummaryMetric;
  aumTotal: RawSummaryMetric;
  priority: 'P2';
}

export interface DisplayMetric {
  label: string;
  value: string;
  trendText: string;
  trendTone: TrendTone;
}

export interface DisplaySummary {
  periodType: PeriodType;
  updatedAtText: string;
  metrics: DisplayMetric[];
  aum: DisplayMetric & { priority: 'P2' };
}

export interface RawMonthlyPerformance {
  statMonth: string;
  current: boolean;
  merchantCount: number;
  merchantCountDelta: number | null;
  merchantCountGrowth: RawTrend;
  qualifiedCount: number;
  qualifiedCountDelta: number | null;
  qualifiedCountGrowth: RawTrend;
  activeCount: number;
  activeCountDelta: number | null;
  activeCountGrowth: RawTrend;
  income: number;
  incomeGrowth: RawTrend;
}

export interface DisplayMonthlyPerformance {
  statMonth: string;
  current: boolean;
  metrics: DisplayMetric[];
}
