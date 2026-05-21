import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { fetchMockIncomeRecords } from './mockIncomeRecords';
import type { IncomeFilters, IncomeLoadFailure, IncomeRecord, QualifiedType } from './types';

const PAGE_SIZE = 20;
const REQUEST_TIMEOUT_MS = 5000;
const qualifiedTypes = new Set<QualifiedType>(['all', 'qualified', 'effective']);

function normalizeQualifiedType(value: string | null): QualifiedType {
  if (value && qualifiedTypes.has(value as QualifiedType)) return value as QualifiedType;
  return 'all';
}

function initialFilters(): IncomeFilters {
  const params = new URLSearchParams(window.location.search);
  return {
    startDate: params.get('start_date') ?? '',
    endDate: params.get('end_date') ?? '',
    qualifiedType: normalizeQualifiedType(params.get('qualified_type')),
  };
}

function isValidDateRange(filters: IncomeFilters) {
  return !filters.startDate || !filters.endDate || filters.endDate >= filters.startDate;
}

function matchesQualifiedType(record: IncomeRecord, qualifiedType: QualifiedType) {
  if (qualifiedType === 'qualified') return record.incomeType === '达标';
  if (qualifiedType === 'effective') return record.incomeType === '有效';
  return true;
}

export function filterIncomeRecords(records: IncomeRecord[], filters: IncomeFilters) {
  if (!isValidDateRange(filters)) return [];

  return records.filter((record) => {
    const startMatched = !filters.startDate || record.recordDate >= filters.startDate;
    const endMatched = !filters.endDate || record.recordDate <= filters.endDate;
    return startMatched && endMatched && matchesQualifiedType(record, filters.qualifiedType);
  });
}

function formatMoney(value: number) {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function syncFilterQuery(filters: IncomeFilters) {
  const params = new URLSearchParams(window.location.search);
  if (filters.startDate) params.set('start_date', filters.startDate);
  else params.delete('start_date');

  if (filters.endDate) params.set('end_date', filters.endDate);
  else params.delete('end_date');

  if (filters.qualifiedType === 'all') params.delete('qualified_type');
  else params.set('qualified_type', filters.qualifiedType);

  const query = params.toString();
  window.history.replaceState({}, '', query ? `/income-details?${query}` : '/income-details');
}

function withTimeout<T>(request: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('request_timeout')), timeoutMs);
    request
      .then(resolve)
      .catch(reject)
      .finally(() => window.clearTimeout(timer));
  });
}

export function useIncomeDetails() {
  const records = ref<IncomeRecord[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const refreshing = ref(false);
  const loadError = ref(false);
  const loadFailure = ref<IncomeLoadFailure | null>(null);
  const filters = reactive<IncomeFilters>(initialFilters());
  const page = ref(1);
  let loadMoreTimer: number | null = null;
  let loadMoreRequestId = 0;

  const dateRangeError = computed(() => !isValidDateRange(filters));
  const filteredRecords = computed(() => filterIncomeRecords(records.value, filters));
  const pagedRecords = computed(() => filteredRecords.value.slice(0, page.value * PAGE_SIZE));
  const hasMore = computed(() => !loadError.value && pagedRecords.value.length < filteredRecords.value.length);
  const totalIncome = computed(() => filteredRecords.value.reduce((sum, record) => sum + record.incomeAmount, 0));
  const summaryText = computed(() => `¥${formatMoney(totalIncome.value)} 共 ${filteredRecords.value.length} 笔`);

  function cancelPendingLoadMore() {
    loadMoreRequestId += 1;
    if (loadMoreTimer !== null) {
      window.clearTimeout(loadMoreTimer);
      loadMoreTimer = null;
    }
    loadingMore.value = false;
  }

  function resetPage() {
    cancelPendingLoadMore();
    page.value = 1;
  }

  function notifyLoadFailure(reason: string) {
    loadFailure.value = { route: 'mock-income-records', reason, at: Date.now() };
    window.dispatchEvent(new CustomEvent('hzy:income-load-failed', { detail: loadFailure.value }));
  }

  async function loadIncomeRecords(options: { resetPage?: boolean; refresh?: boolean } = {}) {
    if (loading.value || refreshing.value) return;
    if (options.resetPage !== false) resetPage();
    loadError.value = false;
    loadFailure.value = null;
    loading.value = !options.refresh;
    refreshing.value = Boolean(options.refresh);

    try {
      records.value = await withTimeout(fetchMockIncomeRecords(), REQUEST_TIMEOUT_MS);
    } catch (error) {
      loadError.value = true;
      records.value = [];
      notifyLoadFailure(error instanceof Error ? error.message : 'mock_loader_error');
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  async function refreshIncomeRecords() {
    await loadIncomeRecords({ refresh: true, resetPage: true });
  }

  function updateQualifiedType(value: QualifiedType) {
    filters.qualifiedType = value;
    syncFilterQuery(filters);
    resetPage();
  }

  function updateDateFilter(field: 'startDate' | 'endDate', value: string) {
    filters[field] = value;
    syncFilterQuery(filters);
    resetPage();
  }

  function loadNextPage() {
    if (loading.value || refreshing.value || loadError.value || dateRangeError.value || !hasMore.value || loadingMore.value) return;
    loadingMore.value = true;
    const requestId = ++loadMoreRequestId;
    loadMoreTimer = window.setTimeout(() => {
      if (requestId !== loadMoreRequestId) return;
      loadMoreTimer = null;
      if (!hasMore.value) {
        loadingMore.value = false;
        return;
      }
      page.value += 1;
      loadingMore.value = false;
    }, 80);
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new CustomEvent('hzy:route-changed'));
  }

  function handleWindowScroll() {
    const bottomGap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    if (bottomGap < 80) loadNextPage();
  }

  onMounted(() => {
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    void loadIncomeRecords();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleWindowScroll);
    cancelPendingLoadMore();
  });

  return {
    dateRangeError,
    filteredRecords,
    filters,
    goBack,
    hasMore,
    loadError,
    loadFailure,
    loadIncomeRecords,
    loadNextPage,
    loading,
    loadingMore,
    page,
    pagedRecords,
    refreshIncomeRecords,
    refreshing,
    summaryText,
    totalIncome,
    updateDateFilter,
    updateQualifiedType,
  };
}
