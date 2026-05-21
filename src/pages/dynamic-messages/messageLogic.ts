import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  buildMessageTabs,
  categoryForMessage,
  fetchMockMessages,
  fetchMockNoticeDetail,
} from './mockMessages';
import type { MessageMockScenario } from './mockMessages';
import type {
  DynamicMessage,
  MessageFailure,
  MessageTabId,
  MessageTone,
  MessageType,
  NoticeDetail,
} from './types';

const PAGE_SIZE = 20;
const MERCHANT_DETAIL_ROUTE_READY = false;

const messageToneMap: Record<MessageType, MessageTone> = {
  商户动态: 'blue',
  商机推送: 'orange',
  业务动态: 'green',
  政策通知: 'red',
  培训通知: 'purple',
  通知公告: 'gray',
};

const messageTabs: MessageTabId[] = ['all', 'policy', 'training', 'notice', 'opportunity'];
const mockScenarios: MessageMockScenario[] = ['default', 'empty', 'single', 'fifty'];

function parseQuery() {
  return new URLSearchParams(window.location.search);
}

function validTab(value: string | null): MessageTabId {
  return value && messageTabs.includes(value as MessageTabId) ? value as MessageTabId : 'all';
}

function validMockScenario(value: string | null): MessageMockScenario {
  return value && mockScenarios.includes(value as MessageMockScenario) ? value as MessageMockScenario : 'default';
}

function notifyRouteFailure(failure: MessageFailure) {
  window.dispatchEvent(new CustomEvent('hzy:dynamic-message-route-failed', { detail: failure }));
}

function notifyLoadFailure(failure: MessageFailure) {
  window.dispatchEvent(new CustomEvent('hzy:dynamic-message-load-failed', { detail: failure }));
}

function notifyCompliancePending(detail: NoticeDetail) {
  window.dispatchEvent(new CustomEvent('hzy:notice-content-pending-compliance', { detail }));
}

function navigateTo(route: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams(query);
  const url = params.size ? `${route}?${params.toString()}` : route;
  window.history.pushState({}, '', url);
  window.dispatchEvent(new CustomEvent('hzy:navigation', { detail: { route, query } }));
}

export function toneForMessage(type: MessageType) {
  return messageToneMap[type];
}

export function useDynamicMessages() {
  const query = parseQuery();
  const activeTab = ref<MessageTabId>(validTab(query.get('tab')));
  const mockScenario = ref<MessageMockScenario>(validMockScenario(query.get('mockScenario')));
  const messages = ref<DynamicMessage[]>([]);
  const loading = ref(false);
  const refreshing = ref(false);
  const loadingMore = ref(false);
  const loadError = ref(false);
  const loadFailure = ref<MessageFailure | null>(null);
  const routeFailure = ref<MessageFailure | null>(null);
  const page = ref(1);
  let loadMoreTimer: number | null = null;
  let loadMoreRequestId = 0;

  const tabs = computed(() => buildMessageTabs(messages.value));

  const filteredMessages = computed(() => {
    if (activeTab.value === 'all') return messages.value;
    return messages.value.filter((message) => categoryForMessage(message) === activeTab.value);
  });

  const pagedMessages = computed(() => filteredMessages.value.slice(0, page.value * PAGE_SIZE));
  const hasMore = computed(() => !loadError.value && pagedMessages.value.length < filteredMessages.value.length);
  const emptyStateKey = computed(() => messages.value.length === 0 ? 'all_empty' : `${activeTab.value}_empty`);

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

  function switchTab(tabId: MessageTabId) {
    if (activeTab.value === tabId) return;
    activeTab.value = tabId;
    resetPage();
    navigateTo('/dynamic-messages', mockScenario.value === 'default'
      ? { tab: tabId }
      : { tab: tabId, mockScenario: mockScenario.value });
    if (mockScenario.value !== 'default') void loadMessages();
  }

  async function loadMessages(options: { refresh?: boolean; resetPage?: boolean } = {}) {
    if (loading.value || refreshing.value) return;
    if (options.resetPage !== false) resetPage();
    loadError.value = false;
    loadFailure.value = null;
    loading.value = !options.refresh;
    refreshing.value = Boolean(options.refresh);
    try {
      const nextMessages = await fetchMockMessages({ scenario: mockScenario.value, tabId: activeTab.value });
      messages.value = nextMessages.sort((a, b) => `${b.msg_date} ${b.msg_time}`.localeCompare(`${a.msg_date} ${a.msg_time}`));
    } catch {
      loadError.value = true;
      loadFailure.value = { target: 'dynamic-messages', reason: 'mock_loader_error', at: Date.now() };
      notifyLoadFailure(loadFailure.value);
    } finally {
      loading.value = false;
      refreshing.value = false;
    }
  }

  async function refreshMessages() {
    await loadMessages({ refresh: true, resetPage: true });
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

  function openMessage(message: DynamicMessage) {
    if (message.notice_id) {
      navigateTo('/notice-detail', { noticeId: message.notice_id });
      return;
    }
    if (message.merchant_id && MERCHANT_DETAIL_ROUTE_READY) {
      navigateTo('/merchant-detail', {
        merchantId: message.merchant_id,
        sourceMsgId: message.msg_id,
        sourceMsgType: message.msg_type,
      });
      return;
    }
    routeFailure.value = {
      target: message.merchant_id || message.msg_id,
      reason: message.merchant_id ? 'merchant_detail_route_pending' : 'unsupported_message_target',
      at: Date.now(),
    };
    notifyRouteFailure(routeFailure.value);
  }

  function handleWindowScroll() {
    const bottomGap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
    if (bottomGap < 80) loadNextPage();
  }

  onMounted(() => {
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    void loadMessages();
  });

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', handleWindowScroll);
    cancelPendingLoadMore();
  });

  return {
    activeTab,
    emptyStateKey,
    filteredMessages,
    hasMore,
    loadError,
    loadFailure,
    loadMessages,
    loadNextPage,
    loading,
    loadingMore,
    messages,
    mockScenario,
    openMessage,
    page,
    pagedMessages,
    refreshMessages,
    refreshing,
    routeFailure,
    switchTab,
    tabs,
    toneForMessage,
  };
}

export function useNoticeDetail() {
  const query = parseQuery();
  const noticeId = ref(query.get('noticeId') || '');
  const detail = ref<NoticeDetail | null>(null);
  const loading = ref(false);
  const loadError = ref(false);
  const loadFailure = ref<MessageFailure | null>(null);
  const compliancePending = computed(() => detail.value?.content_status === 'pending_compliance');

  async function loadNoticeDetail() {
    if (!noticeId.value || loading.value) return;
    loading.value = true;
    loadError.value = false;
    loadFailure.value = null;
    try {
      detail.value = await fetchMockNoticeDetail(noticeId.value);
      if (detail.value.content_status === 'pending_compliance') {
        notifyCompliancePending(detail.value);
      }
    } catch {
      loadError.value = true;
      loadFailure.value = { target: noticeId.value, reason: 'notice_detail_load_error', at: Date.now() };
      notifyLoadFailure(loadFailure.value);
    } finally {
      loading.value = false;
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigateTo('/dynamic-messages');
  }

  onMounted(() => {
    void loadNoticeDetail();
  });

  return {
    compliancePending,
    detail,
    goBack,
    loadError,
    loadFailure,
    loadNoticeDetail,
    loading,
    noticeId,
  };
}
