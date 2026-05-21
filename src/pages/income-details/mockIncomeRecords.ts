import type { IncomeRecord, IncomeType } from './types';

const DEFAULT_RECORD_COUNT = 61;
const ALLOWED_RECORD_COUNTS = new Set([0, 1, 61, 120]);

function formatDate(offset: number) {
  const date = new Date(Date.UTC(2025, 0, 15 - offset));
  return date.toISOString().slice(0, 10);
}

function resolveMockIncomeCount() {
  const params = new URLSearchParams(window.location.search);
  const rawValue = params.get('mockIncomeCount') ?? window.sessionStorage.getItem('hzy:income-details:mock-count') ?? String(DEFAULT_RECORD_COUNT);
  const count = Number(rawValue);
  return ALLOWED_RECORD_COUNTS.has(count) ? count : DEFAULT_RECORD_COUNT;
}

function resolveMockIncomeDelay() {
  const params = new URLSearchParams(window.location.search);
  const rawValue = params.get('mockIncomeDelay') ?? window.sessionStorage.getItem('hzy:income-details:mock-delay') ?? '120';
  const delay = Number(rawValue);
  return Number.isFinite(delay) && delay >= 0 ? delay : 120;
}

function resolveIncomeType(index: number, total: number): IncomeType {
  if (total === DEFAULT_RECORD_COUNT) return index < 31 ? '有效' : '达标';
  return index % 2 === 0 ? '有效' : '达标';
}

function resolveIncomeAmount(type: IncomeType) {
  // 待业务确认；不构成费率承诺。当前仅按 PRD mock 样例展示：达标 25、有效 125。
  return type === '有效' ? 125 : 25;
}

export function buildMockIncomeRecords(count: number): IncomeRecord[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const incomeType = resolveIncomeType(index, count);

    return {
      recordId: `MOCK-INCOME-${String(number).padStart(4, '0')}`,
      recordDate: formatDate(index),
      merchantName: `测试商户${String(number).padStart(3, '0')}`,
      incomeType,
      incomeAmount: resolveIncomeAmount(incomeType),
    };
  });
}

export async function fetchMockIncomeRecords(): Promise<IncomeRecord[]> {
  await new Promise((resolve) => window.setTimeout(resolve, resolveMockIncomeDelay()));

  const params = new URLSearchParams(window.location.search);
  const shouldFail = params.get('mockIncomeError') === '1' || window.sessionStorage.getItem('hzy:income-details:mock-error') === '1';
  if (shouldFail) throw new Error('mock income loader failed');

  return buildMockIncomeRecords(resolveMockIncomeCount());
}
