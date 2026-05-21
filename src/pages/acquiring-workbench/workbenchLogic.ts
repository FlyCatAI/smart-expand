import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { fetchMockMerchants } from './mockMerchants';
import type {
  KpiCard,
  KpiTone,
  Merchant,
  MerchantAdmissionStatus,
  MarketingTag,
  MerchantProgress,
  MerchantType,
  QuickAction,
  QuickActionId,
  RawKpi,
  RouteFailure,
  SortMode,
  WorkbenchFilters,
  WorkbenchNotification,
} from './types';

const SESSION_NOTIFICATION_CLOSED = 'hzy:acquiring-workbench:notification-closed';
const SESSION_KPI_SCENARIO = 'hzy:acquiring-workbench:mock-kpi-scenario';
const PAGE_SIZE = 20;
const knownRoutes = new Set(['/income-details', '/history-performance', '/merchant-detail', '/notice-detail']);

export const quickActions: QuickAction[] = [
  { id: 'new_entry', name: '新入网', action: 'toast' },
  { id: 'merchant_dedup', name: '商户查重', action: 'toast' },
  { id: 'ranking', name: '排行榜', action: 'toast' },
  { id: 'first_followup', name: '首期二访', action: 'filter_list' },
  { id: 'potential_active', name: '潜力有效', action: 'filter_list' },
  { id: 'high_subsidy_visit', name: '高补贴回访', action: 'filter_list' },
  { id: 'query', name: '查询', action: 'expand_input' },
  { id: 'opportunity', name: '商机', action: 'sort_list' },
  { id: 'subsidy', name: '补贴', action: 'sort_list' },
  { id: 'transaction', name: '流水', action: 'sort_list' },
  { id: 'filter_advanced', name: '筛选', action: 'modal' },
];

const defaultRawKpi: RawKpi = {
  incomeAmount: 28.56,
  incomeDelta: 0.82,
  entryCount: 45,
  entryDelta: 3,
  qualifiedCount: 38,
  qualifiedDelta: 5,
  activeCount: 42,
  activeDelta: 1,
  activeThreshold: 50,
};

const mockKpiScenarios: Record<string, Partial<RawKpi>> = {
  'income-zero': { incomeAmount: 0, incomeDelta: 0 },
  'income-billion': { incomeAmount: 100000, incomeDelta: 0.01 },
  'income-max-99999': { incomeAmount: 99999.99, incomeDelta: 0.01 },
  'income-negative': { incomeAmount: -1.23, incomeDelta: -0.01 },
  'income-nan': { incomeAmount: Number.NaN, incomeDelta: Number.NaN },
  'income-infinity': { incomeAmount: Number.POSITIVE_INFINITY, incomeDelta: Number.POSITIVE_INFINITY },
  'income-rounding': { incomeAmount: 1.235, incomeDelta: 0.005 },
  'delta-zero': { incomeDelta: 0 },
  'delta-positive-cent': { incomeDelta: 0.01 },
  'delta-negative-cent': { incomeDelta: -0.01 },
  'delta-over-100-positive': { incomeAmount: 28.56, incomeDelta: 128.57 },
  'delta-over-100-negative': { incomeAmount: 28.56, incomeDelta: -128.57 },
};

const defaultNotification: WorkbenchNotification = {
  id: 'notice-20260519-001',
  type: '网点动态',
  title: '本日回访清单已更新',
  url: '',
};

function initialFilters(): WorkbenchFilters {
  return {
    admissionStatuses: [],
    merchantTypes: [],
    progresses: [],
    partner: '全部',
    entryStart: '',
    entryEnd: '',
    region: {
      province: '',
      city: '',
      district: '',
      branch: '',
    },
  };
}

function cloneFilters(source: WorkbenchFilters): WorkbenchFilters {
  return {
    admissionStatuses: [...source.admissionStatuses],
    merchantTypes: [...source.merchantTypes],
    progresses: [...source.progresses],
    partner: source.partner,
    entryStart: source.entryStart,
    entryEnd: source.entryEnd,
    region: { ...source.region },
  };
}

function parseMockNumber(value: string | null) {
  if (value === null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'null') return null;
  if (normalized === 'nan') return Number.NaN;
  if (normalized === 'infinity' || normalized === '+infinity' || normalized === 'inf' || normalized === '+inf') {
    return Number.POSITIVE_INFINITY;
  }
  if (normalized === '-infinity' || normalized === '-inf') return Number.NEGATIVE_INFINITY;
  return Number(normalized);
}

function resolveRawKpi() {
  if (typeof window === 'undefined') return { data: defaultRawKpi, scenario: '' };

  const params = new URLSearchParams(window.location.search);
  const scenarioParam = params.get('mockKpiScenario');
  const scenario = scenarioParam ?? window.sessionStorage.getItem(SESSION_KPI_SCENARIO) ?? '';
  if (scenarioParam !== null) {
    if (scenarioParam === 'default' || scenarioParam === '') window.sessionStorage.removeItem(SESSION_KPI_SCENARIO);
    else window.sessionStorage.setItem(SESSION_KPI_SCENARIO, scenarioParam);
  }

  const scenarioData = scenario && scenario !== 'default' ? mockKpiScenarios[scenario] : undefined;
  const data: RawKpi = { ...defaultRawKpi, ...scenarioData };
  const incomeAmount = parseMockNumber(params.get('mockKpiIncomeAmount'));
  const incomeDelta = parseMockNumber(params.get('mockKpiIncomeDelta'));

  if (incomeAmount !== undefined) data.incomeAmount = incomeAmount;
  if (incomeDelta !== undefined) data.incomeDelta = incomeDelta;

  return {
    data,
    scenario: scenarioData ? scenario : '',
  };
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function moneyAmount(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return '--';
  return `¥${value.toFixed(2)}万`;
}

function moneyDelta(value: number | null | undefined) {
  if (!isFiniteNumber(value)) return { text: '--', tone: 'neutral' as KpiTone };
  if (Object.is(value, -0) || value === 0) return { text: '¥0.00万', tone: 'neutral' as KpiTone };
  const prefix = value > 0 ? '+' : '-';
  return { text: `${prefix}¥${Math.abs(value).toFixed(2)}万`, tone: value > 0 ? 'positive' as KpiTone : 'negative' as KpiTone };
}

function countDelta(value: number) {
  if (!Number.isFinite(value) || value === 0 || Object.is(value, -0)) return { text: '较昨日 0', tone: 'neutral' as KpiTone };
  return { text: `较昨日 ${value > 0 ? '+' : ''}${value}`, tone: value > 0 ? 'positive' as KpiTone : 'negative' as KpiTone };
}

function buildKpiCards(data: RawKpi): KpiCard[] {
  const income = moneyDelta(data.incomeDelta);
  const entry = countDelta(data.entryDelta);
  const qualified = countDelta(data.qualifiedDelta);
  const active = countDelta(data.activeDelta);

  return [
    { id: 'income', label: '本月收入', value: moneyAmount(data.incomeAmount), delta: income.text, deltaTone: income.tone, route: '/income-details' },
    { id: 'entry', label: '本月入网', value: `${data.entryCount}户`, delta: entry.text, deltaTone: entry.tone, route: '/history-performance' },
    { id: 'qualified', label: '本月达标', value: `${data.qualifiedCount}户`, delta: qualified.text, deltaTone: qualified.tone, route: '/history-performance' },
    { id: 'active', label: '本月有效', value: `${data.activeCount}/${data.activeThreshold}`, delta: active.text, deltaTone: active.tone, route: '/history-performance' },
  ];
}

function sameDateOrAfter(value: string, start: string) {
  return !value || !start || value >= start;
}

function containsAllRegion(merchant: Merchant, filters: WorkbenchFilters) {
  const { region } = filters;
  return (!region.province || merchant.region.province === region.province)
    && (!region.city || merchant.region.city === region.city)
    && (!region.district || merchant.region.district === region.district)
    && (!region.branch || merchant.region.branch === region.branch);
}

function applyFilters(merchant: Merchant, filters: WorkbenchFilters, searchKeyword: string, quickFilterTag: string) {
  const keyword = searchKeyword.trim();
  const quickTagMatched = !quickFilterTag || merchant.marketingTags.includes(quickFilterTag as never);
  const searchMatched = !keyword || merchant.merchantName.includes(keyword);
  const statusMatched = filters.admissionStatuses.length === 0 || filters.admissionStatuses.includes(merchant.admissionStatus);
  const typeMatched = filters.merchantTypes.length === 0 || filters.merchantTypes.includes(merchant.merchantType);
  const progressMatched = filters.progresses.length === 0 || filters.progresses.includes(merchant.progress);
  const partnerMatched = filters.partner === '全部' || (filters.partner === '是' ? Boolean(merchant.partnerOrg) : !merchant.partnerOrg);
  const startMatched = !filters.entryStart || merchant.entryDate >= filters.entryStart;
  const endMatched = !filters.entryEnd || merchant.entryDate <= filters.entryEnd;

  return quickTagMatched
    && searchMatched
    && statusMatched
    && typeMatched
    && progressMatched
    && partnerMatched
    && startMatched
    && endMatched
    && containsAllRegion(merchant, filters);
}

function sortMerchants(list: Merchant[], sortMode: SortMode) {
  const next = [...list];
  if (sortMode === 'opportunity') return next.sort((a, b) => a.opportunityTime.localeCompare(b.opportunityTime));
  if (sortMode === 'subsidy') return next.sort((a, b) => b.subsidyAmount - a.subsidyAmount);
  if (sortMode === 'transaction') return next.sort((a, b) => b.transactionAmount - a.transactionAmount);
  return next.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
}

function setArrayItem<T>(values: T[], value: T) {
  const index = values.indexOf(value);
  if (index >= 0) values.splice(index, 1);
  else values.push(value);
}

export function useAcquiringWorkbench() {
  const merchants = ref<Merchant[]>([]);
  const loading = ref(false);
  const loadingMore = ref(false);
  const refreshing = ref(false);
  const loadError = ref(false);
  const routeFailure = ref<RouteFailure | null>(null);
  const loadFailure = ref<RouteFailure | null>(null);
  const toastMessage = ref('');
  const page = ref(1);
  const searchKeyword = ref('');
  const showFilterModal = ref(false);
  const showSearchInput = ref(false);
  const activeToolbarAction = ref<QuickActionId | ''>('');
  const sortMode = ref<SortMode>('');
  const quickFilterTag = ref('');
  const notification = ref(defaultNotification);
  const showNotification = ref(true);
  const filters = reactive<WorkbenchFilters>(initialFilters());
  const draftFilters = reactive<WorkbenchFilters>(initialFilters());
  const resolvedKpi = resolveRawKpi();
  const kpiCards = computed(() => buildKpiCards(resolvedKpi.data));
  const activeKpiMockScenario = resolvedKpi.scenario;
  let loadMoreTimer: number | null = null;
  let loadMoreRequestId = 0;

  const regionOptions = computed(() => {
    const provinces = [...new Set(merchants.value.map((item) => item.region.province))];
    const cities = [...new Set(merchants.value.filter((item) => !draftFilters.region.province || item.region.province === draftFilters.region.province).map((item) => item.region.city))];
    const districts = [...new Set(merchants.value.filter((item) => !draftFilters.region.city || item.region.city === draftFilters.region.city).map((item) => item.region.district))];
    const branches = [...new Set(merchants.value.filter((item) => !draftFilters.region.district || item.region.district === draftFilters.region.district).map((item) => item.region.branch))];
    return { provinces, cities, districts, branches };
  });

  const activeFilterCount = computed(() => {
    let count = 0;
    if (filters.admissionStatuses.length) count += 1;
    if (filters.merchantTypes.length) count += 1;
    if (filters.progresses.length) count += 1;
    if (filters.partner !== '全部') count += 1;
    if (filters.entryStart || filters.entryEnd) count += 1;
    if (Object.values(filters.region).some(Boolean)) count += 1;
    return count;
  });

  const visibleAllMerchants = computed(() => {
    const matched = merchants.value.filter((merchant) => applyFilters(merchant, filters, searchKeyword.value, quickFilterTag.value));
    return sortMerchants(matched, sortMode.value);
  });

  const pagedMerchants = computed(() => visibleAllMerchants.value.slice(0, page.value * PAGE_SIZE));
  const hasMore = computed(() => !loadError.value && pagedMerchants.value.length < visibleAllMerchants.value.length);
  const emptyStateText = computed(() => merchants.value.length === 0 ? '暂无商户数据' : '未找到符合条件的商户');

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

  function showToast(message: string) {
    toastMessage.value = message;
    window.setTimeout(() => {
      if (toastMessage.value === message) toastMessage.value = '';
    }, 1800);
  }

  function notifyRouteFailure(route: string, reason: string) {
    routeFailure.value = { route, reason, at: Date.now() };
    window.dispatchEvent(new CustomEvent('hzy:route-failed', { detail: routeFailure.value }));
  }

  function notifyLoadFailure(reason: string) {
    loadFailure.value = { route: 'mock-merchants', reason, at: Date.now() };
    window.dispatchEvent(new CustomEvent('hzy:merchant-load-failed', { detail: loadFailure.value }));
  }

  function navigateTo(route: string, query: Record<string, string> = {}) {
    if (!route) return;
    if (!knownRoutes.has(route)) {
      notifyRouteFailure(route, 'unknown_route');
      return;
    }
    const params = new URLSearchParams(query);
    const url = params.size ? `${route}?${params.toString()}` : route;
    window.history.pushState({}, '', url);
  }

  async function loadMerchants(options: { resetPage?: boolean; refresh?: boolean } = {}) {
    if (loading.value || refreshing.value) return;
    if (options.resetPage !== false) resetPage();
    loadError.value = false;
    loadFailure.value = null;
    loading.value = !options.refresh;
    refreshing.value = Boolean(options.refresh);
    try {
      merchants.value = await fetchMockMerchants();
    } catch {
      loadError.value = true;
      notifyLoadFailure('mock_loader_error');
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  async function refreshMerchants() {
    await loadMerchants({ refresh: true, resetPage: true });
  }

  function loadNextPage() {
    if (loading.value || refreshing.value || loadError.value || !hasMore.value || loadingMore.value) return;
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

  function closeNotification() {
    showNotification.value = false;
    window.sessionStorage.setItem(SESSION_NOTIFICATION_CLOSED, '1');
  }

  function handleNotificationTap() {
    if (!notification.value.url) return;
    navigateTo(notification.value.url);
  }

  function handleKpiTap(card: KpiCard) {
    navigateTo(card.route, { source: card.id });
  }

  function setQuickFilter(actionId: QuickActionId, tag: MarketingTag) {
    const isCancelling = quickFilterTag.value === tag;
    quickFilterTag.value = isCancelling ? '' : tag;
    activeToolbarAction.value = isCancelling ? '' : actionId;
    sortMode.value = '';
    showSearchInput.value = false;
    searchKeyword.value = '';
    resetPage();
  }

  function resetListControls() {
    Object.assign(filters, initialFilters());
    Object.assign(draftFilters, initialFilters());
    quickFilterTag.value = '';
    searchKeyword.value = '';
    showSearchInput.value = false;
    sortMode.value = '';
    activeToolbarAction.value = '';
    resetPage();
  }

  function clearSortAndToolbar() {
    sortMode.value = '';
    activeToolbarAction.value = '';
  }

  function handleQuickAction(action: QuickAction) {
    if (action.action === 'toast') {
      showToast('功能开发中，即将上线');
      return;
    }
    if (action.id === 'first_followup') {
      setQuickFilter(action.id, '首期二访');
      return;
    }
    if (action.id === 'potential_active') {
      setQuickFilter(action.id, '潜力有效');
      return;
    }
    if (action.id === 'high_subsidy_visit') {
      setQuickFilter(action.id, '高补贴回访');
      return;
    }
    if (action.id === 'query') {
      const willShow = !showSearchInput.value;
      showSearchInput.value = willShow;
      activeToolbarAction.value = willShow ? 'query' : '';
      sortMode.value = '';
      quickFilterTag.value = '';
      if (!willShow) searchKeyword.value = '';
      showToast(willShow ? '展开搜索框' : '收起');
      resetPage();
      return;
    }
    if (action.id === 'filter_advanced') {
      Object.assign(draftFilters, cloneFilters(filters));
      showFilterModal.value = true;
      return;
    }
    const nextSort = action.id as SortMode;
    if (sortMode.value === nextSort) {
      clearSortAndToolbar();
      showToast('已取消排序');
    } else {
      showSearchInput.value = false;
      searchKeyword.value = '';
      quickFilterTag.value = '';
      sortMode.value = nextSort;
      activeToolbarAction.value = action.id;
      const messages: Record<SortMode, string> = {
        opportunity: '按商机时间从早到晚排序',
        subsidy: '按补贴金额从高到低排序',
        transaction: '按流水金额从高到低排序',
        '': '',
      };
      showToast(messages[nextSort]);
    }
    resetPage();
  }

  function toggleAdmissionStatus(value: MerchantAdmissionStatus) {
    const isCancelling = draftFilters.admissionStatuses.includes(value);
    setArrayItem(draftFilters.admissionStatuses, value);
    if (isCancelling) showToast('已取消入网状态筛选');
  }

  function toggleMerchantType(value: MerchantType) {
    const isCancelling = draftFilters.merchantTypes.includes(value);
    setArrayItem(draftFilters.merchantTypes, value);
    if (isCancelling) showToast('已取消商户类型筛选');
  }

  function toggleProgress(value: MerchantProgress) {
    const isCancelling = draftFilters.progresses.includes(value);
    setArrayItem(draftFilters.progresses, value);
    if (isCancelling) showToast('已取消达标进度筛选');
  }

  function setPartnerFilter(value: WorkbenchFilters['partner']) {
    const wasPartnerFiltered = draftFilters.partner !== '全部';
    const isCancelling = wasPartnerFiltered && value === '全部';
    draftFilters.partner = value;
    if (isCancelling) showToast('已取消合作伙伴筛选');
  }

  function updateRegion(level: keyof WorkbenchFilters['region'], value: string) {
    draftFilters.region[level] = value;
    if (level === 'province') Object.assign(draftFilters.region, { city: '', district: '', branch: '' });
    if (level === 'city') Object.assign(draftFilters.region, { district: '', branch: '' });
    if (level === 'district') Object.assign(draftFilters.region, { branch: '' });
  }

  function resetDraftFilters() {
    Object.assign(draftFilters, initialFilters());
    showToast('筛选已重置');
  }

  function closeFilterModal() {
    showFilterModal.value = false;
  }

  function applyDraftFilters() {
    if (!sameDateOrAfter(draftFilters.entryEnd, draftFilters.entryStart)) {
      showToast('入网结束日期不可早于开始日期');
      return;
    }
    Object.assign(filters, cloneFilters(draftFilters));
    resetPage();
    showFilterModal.value = false;
    showToast('筛选已应用');
  }

  function countFor(option: {
    admissionStatus?: MerchantAdmissionStatus;
    merchantType?: MerchantType;
    progress?: MerchantProgress;
    partner?: WorkbenchFilters['partner'];
  }) {
    return merchants.value.filter((merchant) => {
      if (option.admissionStatus && merchant.admissionStatus !== option.admissionStatus) return false;
      if (option.merchantType && merchant.merchantType !== option.merchantType) return false;
      if (option.progress && merchant.progress !== option.progress) return false;
      if (option.partner === '是' && !merchant.partnerOrg) return false;
      if (option.partner === '否' && merchant.partnerOrg) return false;
      return true;
    }).length;
  }

  function handleMerchantTap(merchant: Merchant) {
    navigateTo('/merchant-detail', { merchantId: merchant.merchantId });
  }

  function handleWindowScroll() {
    const bottomGap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    if (bottomGap < 80) loadNextPage();
  }

  onMounted(() => {
    showNotification.value = window.sessionStorage.getItem(SESSION_NOTIFICATION_CLOSED) !== '1';
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    void loadMerchants();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleWindowScroll);
    cancelPendingLoadMore();
  });

  return {
    activeFilterCount,
    activeKpiMockScenario,
    activeToolbarAction,
    applyDraftFilters,
    closeFilterModal,
    closeNotification,
    countFor,
    draftFilters,
    emptyStateText,
    handleKpiTap,
    handleMerchantTap,
    handleNotificationTap,
    handleQuickAction,
    hasMore,
    kpiCards,
    loadError,
    loadMerchants,
    loadNextPage,
    loading,
    loadingMore,
    loadFailure,
    notification,
    page,
    pagedMerchants,
    quickActions,
    quickFilterTag,
    refreshMerchants,
    refreshing,
    regionOptions,
    resetPage,
    resetDraftFilters,
    routeFailure,
    searchKeyword,
    showFilterModal,
    showNotification,
    showSearchInput,
    toastMessage,
    setPartnerFilter,
    toggleAdmissionStatus,
    toggleMerchantType,
    toggleProgress,
    updateRegion,
    visibleAllMerchants,
  };
}
