<template>
  <main class="history-performance" data-page="history-performance">
    <section class="history-summary" aria-label="年度业绩汇总">
      <div class="history-summary__tabs" role="tablist" aria-label="业绩口径">
        <button
          v-for="tab in periodTabs"
          :key="tab.id"
          class="history-summary__tab"
          :class="{ 'is-active': selectedPeriod === tab.id }"
          :aria-selected="selectedPeriod === tab.id"
          role="tab"
          type="button"
          @click="selectPeriod(tab.id)"
        >
          {{ tab.label }}
        </button>
      </div>

      <article class="history-summary__card">
        <header class="history-summary__header">
          <span>业绩概览</span>
          <time :datetime="currentSummary.updatedAtText">{{ currentSummary.updatedAtText }}</time>
        </header>

        <div class="history-summary__metrics">
          <div
            v-for="metric in currentSummary.metrics"
            :key="metric.label"
            class="history-summary__metric"
          >
            <span class="history-summary__label">{{ metric.label }}</span>
            <strong class="history-summary__value">{{ metric.value }}</strong>
            <span class="history-summary__trend" :data-tone="metric.trendTone">{{ metric.trendText }}</span>
          </div>
        </div>

        <div class="history-summary__aum">
          <div class="history-summary__aum-label">
            <span>{{ currentSummary.aum.label }}</span>
            <span class="history-summary__priority">{{ currentSummary.aum.priority }}</span>
          </div>
          <div class="history-summary__aum-value">
            <strong>{{ currentSummary.aum.value }}</strong>
            <span :data-tone="currentSummary.aum.trendTone">{{ currentSummary.aum.trendText }}</span>
          </div>
        </div>
      </article>
    </section>

    <section class="history-months" aria-label="近12个月明细">
      <header class="history-months__header">近12个月明细</header>

      <div v-if="loading" class="history-months__loading">加载中</div>
      <div v-else-if="loadError" class="history-months__error">
        <span class="history-months__error-text"><!-- TODO(HZYMiniAppStyle): 历史业绩异常态展示文案由样式/体验侧补齐 --></span>
        <button class="history-months__retry" type="button" @click="loadHistoryPerformance">重试</button>
      </div>

      <article
        v-for="month in monthlyList"
        v-else
        :key="month.statMonth"
        class="history-month-card"
        :class="{ 'is-current': month.current }"
        :data-clickable="false"
      >
        <header class="history-month-card__header">
          <span>{{ month.statMonth }}</span>
          <span v-if="month.current" class="history-month-card__badge">当前</span>
        </header>
        <div class="history-month-card__metrics">
          <div
            v-for="metric in month.metrics"
            :key="metric.label"
            class="history-month-card__metric"
          >
            <span class="history-month-card__label">{{ metric.label }}</span>
            <strong class="history-month-card__value">{{ metric.value }}</strong>
            <span class="history-month-card__trend" :data-tone="metric.trendTone">{{ metric.trendText }}</span>
          </div>
        </div>
      </article>
    </section>

    <div v-if="loadFailure" class="history-performance__load-failure" data-observable="history-performance-load-failed">
      <!-- TODO(HZYMiniAppStyle): mock 请求失败可观察占位，样式层补充最终异常态展示 -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { useHistoryPerformance } from './historyPerformanceLogic';

const {
  currentSummary,
  loadError,
  loadFailure,
  loading,
  loadHistoryPerformance,
  monthlyList,
  periodTabs,
  selectPeriod,
  selectedPeriod,
} = useHistoryPerformance();
</script>
