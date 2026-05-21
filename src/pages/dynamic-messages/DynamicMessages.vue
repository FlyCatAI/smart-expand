<template>
  <main class="dynamic-messages">
    <header class="dynamic-messages__header">
      <h1 class="dynamic-messages__title">动态消息</h1>
      <button class="dynamic-messages__refresh" type="button" :disabled="refreshing || loading" @click="refreshMessages">
        {{ refreshing ? '刷新中' : '刷新' }}
      </button>
    </header>

    <nav class="dynamic-messages__tabs" aria-label="消息分类">
      <button
        v-for="tab in tabs"
        :key="tab.tab_id"
        class="dynamic-messages__tab"
        :class="{ 'is-active': activeTab === tab.tab_id }"
        :data-tab-id="tab.tab_id"
        type="button"
        @click="switchTab(tab.tab_id)"
      >
        <span class="dynamic-messages__tab-name">{{ tab.tab_name }}</span>
        <span class="dynamic-messages__tab-badge">{{ tab.badge_count }}</span>
      </button>
    </nav>

    <section class="dynamic-messages__list" aria-label="消息列表">
      <div v-if="loading" class="dynamic-messages__loading">加载中</div>
      <div v-else-if="loadError" class="dynamic-messages__error">
        <span class="dynamic-messages__error-text"><!-- TODO(HZYMiniAppStyle): 消息加载失败展示文案由样式层接入 --></span>
        <button class="dynamic-messages__retry" type="button" @click="loadMessages()">重试</button>
      </div>
      <div v-else-if="pagedMessages.length === 0" class="dynamic-messages__empty" :data-empty-state="emptyStateKey">
        <!-- TODO(HZYMiniAppStyle): 空态展示由样式层接入 -->
      </div>

      <article
        v-for="message in pagedMessages"
        v-else
        :key="message.msg_id"
        class="dynamic-message-card"
        :data-msg-id="message.msg_id"
        :data-msg-type="message.msg_type"
        :data-tone="toneForMessage(message.msg_type)"
      >
        <button class="dynamic-message-card__tap-area" type="button" @click="openMessage(message)">
          <header class="dynamic-message-card__header">
            <span class="dynamic-message-card__type">{{ message.msg_type }}</span>
            <span class="dynamic-message-card__date">{{ message.msg_date }}</span>
            <span class="dynamic-message-card__time">{{ message.msg_time }}</span>
          </header>
          <strong class="dynamic-message-card__title">{{ message.msg_title }}</strong>
          <span class="dynamic-message-card__handler">{{ message.msg_handler }}</span>
          <p class="dynamic-message-card__summary">{{ message.msg_summary }}</p>
        </button>
      </article>

      <button
        v-if="hasMore && !loading"
        class="dynamic-messages__more"
        type="button"
        :disabled="loadingMore"
        @click="loadNextPage"
      >
        {{ loadingMore ? '加载中' : '加载更多' }}
      </button>
      <div v-else-if="!loading && pagedMessages.length > 0" class="dynamic-messages__end">已加载全部</div>
    </section>

    <div v-if="routeFailure" class="dynamic-messages__route-failure" data-observable="dynamic-message-route-failed">
      <!-- TODO(HZYMiniAppStyle): 商户详情 deeplink 未就绪/路由失败可观察占位 -->
    </div>
    <div v-if="loadFailure" class="dynamic-messages__load-failure" data-observable="dynamic-message-load-failed">
      <!-- TODO(HZYMiniAppStyle): 网络异常态可观察占位，最终展示文案由样式层补充 -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { useDynamicMessages } from './messageLogic';

const {
  activeTab,
  emptyStateKey,
  hasMore,
  loadError,
  loadFailure,
  loadMessages,
  loadNextPage,
  loading,
  loadingMore,
  openMessage,
  pagedMessages,
  refreshMessages,
  refreshing,
  routeFailure,
  switchTab,
  tabs,
  toneForMessage,
} = useDynamicMessages();
</script>
