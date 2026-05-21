<template>
  <main class="income-details">
    <header class="income-details__header">
      <button class="income-details__back" type="button" @click="goBack">返回</button>
      <h1 class="income-details__title">收入明细</h1>
      <button class="income-details__refresh" type="button" :disabled="refreshing || loading" @click="refreshIncomeRecords">
        {{ refreshing ? '刷新中' : '刷新' }}
      </button>
    </header>

    <section class="income-summary" aria-label="收入汇总">
      <span class="income-summary__label">累计收入</span>
      <strong class="income-summary__value">{{ summaryText }}</strong>
    </section>

    <section class="income-filters" aria-label="收入筛选">
      <div class="income-filters__tabs" role="tablist" aria-label="类型筛选">
        <button
          v-for="option in qualifiedTypeOptions"
          :key="option.value"
          class="income-filters__tab"
          :class="{ 'is-active': filters.qualifiedType === option.value }"
          :aria-selected="filters.qualifiedType === option.value"
          role="tab"
          type="button"
          @click="updateQualifiedType(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <div class="income-filters__dates">
        <input
          class="income-filters__date"
          type="date"
          :value="filters.startDate"
          aria-label="开始日期"
          @input="updateDateFilter('startDate', ($event.target as HTMLInputElement).value)"
        />
        <span class="income-filters__date-separator">至</span>
        <input
          class="income-filters__date"
          type="date"
          :value="filters.endDate"
          aria-label="结束日期"
          @input="updateDateFilter('endDate', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </section>

    <div v-if="dateRangeError" class="income-details__filter-error" data-observable="income-date-range-invalid">
      日期区间异常，请重新选择开始和结束日期
    </div>

    <section class="income-records" aria-label="收入记录">
      <div class="income-records__toolbar">
        <span class="income-records__title">收入记录</span>
        <span class="income-records__count">{{ filteredRecords.length }}</span>
      </div>

      <div v-if="loading" class="income-records__loading">加载中</div>
      <div v-else-if="loadError" class="income-records__error" data-observable="income-load-error">
        收入记录加载失败
        <button class="income-records__retry" type="button" @click="loadIncomeRecords()">重试</button>
      </div>
      <div v-else-if="!dateRangeError && pagedRecords.length === 0" class="income-records__empty" data-observable="income-records-empty">
        暂无收入记录
      </div>

      <article
        v-for="record in pagedRecords"
        v-else-if="!dateRangeError"
        :key="record.recordId"
        class="income-record"
        :data-record-id="record.recordId"
        :data-income-type="record.incomeType"
      >
        <div class="income-record__main">
          <strong class="income-record__merchant">{{ record.merchantName }}</strong>
          <span class="income-record__id">{{ record.recordId }}</span>
          <span class="income-record__date">{{ record.recordDate }}</span>
        </div>
        <div class="income-record__side">
          <span class="income-record__type">{{ record.incomeType }}</span>
          <strong class="income-record__amount">+¥{{ record.incomeAmount.toFixed(2) }}</strong>
        </div>
      </article>

      <button
        v-if="hasMore && !loading && !dateRangeError"
        class="income-records__more"
        type="button"
        :disabled="loadingMore"
        @click="loadNextPage"
      >
        {{ loadingMore ? '加载中' : '加载更多记录' }}
      </button>
      <div v-else-if="!loading && !dateRangeError && pagedRecords.length > 0" class="income-records__end">已加载全部</div>
    </section>

    <div v-if="loadFailure" class="income-details__load-failure" data-observable="income-load-failed">
      请求失败，请稍后重试
    </div>
  </main>
</template>

<script setup lang="ts">
import { useIncomeDetails } from './incomeDetailsLogic';
import type { QualifiedType } from './types';

const qualifiedTypeOptions: Array<{ label: string; value: QualifiedType }> = [
  { label: '全部', value: 'all' },
  { label: '达标', value: 'qualified' },
  { label: '有效', value: 'effective' },
];

const {
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
  pagedRecords,
  refreshIncomeRecords,
  refreshing,
  summaryText,
  updateDateFilter,
  updateQualifiedType,
} = useIncomeDetails();
</script>

<style scoped>
.income-details {
  --income-space-1: 4px;
  --income-space-2: 8px;
  --income-space-3: 12px;
  --income-space-4: 16px;
  --income-space-5: 20px;
  --income-space-6: 24px;
  --income-space-8: 32px;
  --income-font-xs: 12px;
  --income-font-sm: 14px;
  --income-font-md: 16px;
  --income-font-lg: 20px;
  --income-font-xl: 32px;
  --income-line-tight: 1.2;
  --income-line-normal: 1.5;
  --income-radius-sm: 8px;
  --income-radius-md: 12px;
  --income-radius-lg: 16px;
  --income-radius-pill: 999px;
  --income-color-primary: #003b99;
  --income-color-primary-container: #1a52bf;
  --income-color-on-primary: #ffffff;
  --income-color-summary-start: var(--income-color-primary);
  --income-color-summary-end: var(--income-color-primary-container);
  --income-color-on-summary: #ffffff;
  --income-color-surface: #f7f9fc;
  --income-color-surface-lowest: #ffffff;
  --income-color-surface-low: #f2f4f7;
  --income-color-surface-container: #eceef1;
  --income-color-surface-high: #e6e8eb;
  --income-color-on-surface: #191c1e;
  --income-color-on-surface-variant: #434653;
  --income-color-outline: #737685;
  --income-color-outline-variant: #c3c6d5;
  --income-color-qualified: #166534;
  --income-color-qualified-container: #e8f5ed;
  --income-color-qualified-outline: #b8dec4;
  --income-color-effective: #1d4ed8;
  --income-color-effective-container: #eaf2ff;
  --income-color-effective-outline: #bfd3ff;
  --income-color-error: #ba1a1a;
  --income-color-error-container: #ffdad6;
  --income-color-on-error-container: #93000a;
  --income-color-error-action: var(--income-color-error);
  --income-color-on-error-action: #ffffff;
  --income-shadow-card: 0 10px 28px color-mix(in srgb, var(--income-color-on-surface) 10%, transparent);
  --income-shadow-header: 0 1px 0 var(--income-color-outline-variant);

  box-sizing: border-box;
  min-height: 100vh;
  max-width: 540px;
  margin: 0 auto;
  padding: calc(env(safe-area-inset-top) + 88px) var(--income-space-5) calc(env(safe-area-inset-bottom) + var(--income-space-8));
  background: var(--income-color-surface);
  color: var(--income-color-on-surface);
  font-family: Inter, system-ui, sans-serif;
  line-height: var(--income-line-normal);
}

.income-details *,
.income-details *::before,
.income-details *::after {
  box-sizing: border-box;
}

.income-details__header {
  position: fixed;
  top: 0;
  left: 50%;
  z-index: 10;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 88px;
  align-items: center;
  width: min(100%, 540px);
  min-height: calc(env(safe-area-inset-top) + 64px);
  padding: calc(env(safe-area-inset-top) + var(--income-space-3)) var(--income-space-5) var(--income-space-3);
  background: color-mix(in srgb, var(--income-color-surface-lowest) 94%, transparent);
  box-shadow: var(--income-shadow-header);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.income-details__back,
.income-details__refresh,
.income-filters__tab,
.income-records__retry,
.income-records__more {
  border: 0;
  font: inherit;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 140ms ease,
    box-shadow 180ms ease;
}

.income-details__back,
.income-details__refresh {
  min-height: 40px;
  border-radius: var(--income-radius-md);
  font-size: var(--income-font-sm);
  font-weight: 700;
}

.income-details__back {
  justify-self: start;
  min-width: 64px;
  padding: 0 var(--income-space-4);
  background: var(--income-color-primary-container);
  color: var(--income-color-on-primary);
}

.income-details__refresh {
  justify-self: end;
  min-width: 64px;
  padding: 0 var(--income-space-3);
  background: var(--income-color-surface-container);
  color: var(--income-color-on-surface-variant);
}

.income-details__refresh:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.income-details__back:active,
.income-details__refresh:not(:disabled):active,
.income-filters__tab:active,
.income-records__retry:active,
.income-records__more:not(:disabled):active,
.income-record:active {
  transform: scale(0.98);
}

.income-details__title {
  margin: 0;
  overflow: hidden;
  color: var(--income-color-on-surface);
  font-size: var(--income-font-md);
  font-weight: 800;
  line-height: var(--income-line-tight);
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.income-summary {
  position: relative;
  display: grid;
  gap: var(--income-space-2);
  min-height: 150px;
  padding: var(--income-space-6);
  overflow: hidden;
  border-radius: var(--income-radius-lg);
  background:
    linear-gradient(135deg, var(--income-color-summary-start) 0%, var(--income-color-summary-end) 100%);
  box-shadow: var(--income-shadow-card);
  color: var(--income-color-on-summary);
}

.income-summary::after {
  position: absolute;
  right: var(--income-space-5);
  bottom: var(--income-space-5);
  width: 96px;
  height: 96px;
  border: 1px solid color-mix(in srgb, var(--income-color-on-summary) 28%, transparent);
  border-radius: 50%;
  content: "";
}

.income-summary__label {
  position: relative;
  z-index: 1;
  align-self: end;
  font-size: var(--income-font-xs);
  font-weight: 800;
  opacity: 0.84;
}

.income-summary__value {
  position: relative;
  z-index: 1;
  display: block;
  font-size: clamp(28px, 8vw, var(--income-font-xl));
  font-weight: 900;
  line-height: var(--income-line-tight);
  overflow-wrap: anywhere;
}

.income-filters {
  display: grid;
  gap: var(--income-space-4);
  margin-top: var(--income-space-5);
}

.income-filters__tabs {
  display: flex;
  gap: var(--income-space-2);
  overflow-x: auto;
  scrollbar-width: none;
}

.income-filters__tabs::-webkit-scrollbar {
  display: none;
}

.income-filters__tab {
  min-width: 76px;
  min-height: 38px;
  padding: 0 var(--income-space-5);
  border-radius: var(--income-radius-pill);
  background: var(--income-color-surface-container);
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  font-weight: 800;
  white-space: nowrap;
}

.income-filters__tab.is-active {
  background: var(--income-color-primary);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--income-color-primary) 24%, transparent);
  color: var(--income-color-on-primary);
}

.income-filters__dates {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: var(--income-space-3);
}

.income-filters__date {
  width: 100%;
  min-width: 0;
  min-height: 44px;
  border: 1px solid var(--income-color-outline-variant);
  border-radius: var(--income-radius-md);
  background: var(--income-color-surface-lowest);
  color: var(--income-color-on-surface);
  font: inherit;
  font-size: var(--income-font-sm);
  outline: 0;
  padding: 0 var(--income-space-3);
}

.income-filters__date:focus {
  border-color: var(--income-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--income-color-primary) 16%, transparent);
}

.income-filters__date-separator {
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-sm);
  font-weight: 700;
}

.income-details__filter-error,
.income-details__load-failure,
.income-records__error,
.income-records__empty,
.income-records__loading {
  margin-top: var(--income-space-4);
  border-radius: var(--income-radius-md);
  font-size: var(--income-font-sm);
  font-weight: 700;
  line-height: var(--income-line-normal);
}

.income-details__filter-error,
.income-details__load-failure,
.income-records__error {
  border: 1px solid color-mix(in srgb, var(--income-color-error) 24%, var(--income-color-error-container));
  background: var(--income-color-error-container);
  color: var(--income-color-on-error-container);
}

.income-details__filter-error,
.income-details__load-failure {
  padding: var(--income-space-3) var(--income-space-4);
}

.income-records {
  display: grid;
  gap: var(--income-space-3);
  margin-top: var(--income-space-5);
}

.income-records__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--income-space-4);
  padding: 0 var(--income-space-1);
}

.income-records__title {
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  font-weight: 900;
}

.income-records__count {
  min-width: 30px;
  padding: var(--income-space-1) var(--income-space-2);
  border-radius: var(--income-radius-pill);
  background: var(--income-color-surface-container);
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  font-weight: 800;
  text-align: center;
}

.income-records__loading,
.income-records__empty {
  padding: var(--income-space-6);
  background: var(--income-color-surface-lowest);
  color: var(--income-color-on-surface-variant);
  text-align: center;
}

.income-records__loading {
  animation: income-loading-pulse 1.2s ease-in-out infinite;
}

.income-records__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--income-space-3);
  padding: var(--income-space-3) var(--income-space-4);
}

.income-records__retry,
.income-records__more {
  min-height: 36px;
  border-radius: var(--income-radius-pill);
  font-size: var(--income-font-sm);
  font-weight: 800;
}

.income-records__retry {
  flex: 0 0 auto;
  padding: 0 var(--income-space-4);
  background: var(--income-color-error-action);
  color: var(--income-color-on-error-action);
}

.income-record {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--income-space-4);
  align-items: center;
  padding: var(--income-space-4);
  border: 1px solid color-mix(in srgb, var(--income-color-outline-variant) 58%, transparent);
  border-radius: var(--income-radius-lg);
  background: var(--income-color-surface-lowest);
  box-shadow: var(--income-shadow-card);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 140ms ease;
}

.income-record__main {
  display: grid;
  min-width: 0;
  gap: var(--income-space-1);
}

.income-record__merchant {
  overflow: hidden;
  color: var(--income-color-on-surface);
  font-size: var(--income-font-sm);
  font-weight: 900;
  line-height: var(--income-line-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.income-record__id,
.income-record__date {
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  line-height: var(--income-line-normal);
}

.income-record__side {
  display: grid;
  justify-items: end;
  gap: var(--income-space-2);
  min-width: 84px;
}

.income-record__type {
  padding: var(--income-space-1) var(--income-space-2);
  border: 1px solid var(--income-color-outline-variant);
  border-radius: var(--income-radius-pill);
  background: var(--income-color-surface-low);
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  font-weight: 800;
  line-height: var(--income-line-tight);
}

.income-record__amount {
  color: var(--income-color-primary);
  font-size: var(--income-font-md);
  font-weight: 900;
  line-height: var(--income-line-tight);
  white-space: nowrap;
}

.income-record[data-income-type="达标"] .income-record__type {
  border-color: var(--income-color-qualified-outline);
  background: var(--income-color-qualified-container);
  color: var(--income-color-qualified);
}

.income-record[data-income-type="达标"] .income-record__amount {
  color: var(--income-color-qualified);
}

.income-record[data-income-type="有效"] .income-record__type {
  border-color: var(--income-color-effective-outline);
  background: var(--income-color-effective-container);
  color: var(--income-color-effective);
}

.income-record[data-income-type="有效"] .income-record__amount {
  color: var(--income-color-effective);
}

.income-records__more {
  justify-self: center;
  min-width: 144px;
  margin-top: var(--income-space-2);
  padding: 0 var(--income-space-5);
  background: var(--income-color-surface-lowest);
  color: var(--income-color-primary);
  box-shadow: inset 0 0 0 1px var(--income-color-outline-variant);
}

.income-records__more:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.income-records__end {
  padding: var(--income-space-4) 0;
  color: var(--income-color-on-surface-variant);
  font-size: var(--income-font-xs);
  font-weight: 700;
  text-align: center;
}

@keyframes income-loading-pulse {
  0%,
  100% {
    opacity: 0.64;
  }

  50% {
    opacity: 1;
  }
}

@media (prefers-color-scheme: dark) {
  .income-details {
    --income-color-primary: #8ab4f8;
    --income-color-primary-container: #1a52bf;
    --income-color-on-primary: #07111f;
    --income-color-summary-start: #102a4f;
    --income-color-summary-end: #1a52bf;
    --income-color-on-summary: #ffffff;
    --income-color-surface: #101418;
    --income-color-surface-lowest: #181c20;
    --income-color-surface-low: #1f2429;
    --income-color-surface-container: #242a30;
    --income-color-surface-high: #2e343b;
    --income-color-on-surface: #e4e8ed;
    --income-color-on-surface-variant: #c3cad5;
    --income-color-outline: #89909a;
    --income-color-outline-variant: #454c55;
    --income-color-qualified: #9be7b0;
    --income-color-qualified-container: #123524;
    --income-color-qualified-outline: #2f6d47;
    --income-color-effective: #9cc4ff;
    --income-color-effective-container: #102a4f;
    --income-color-effective-outline: #29568f;
    --income-color-error: #ffb4ab;
    --income-color-error-container: #442220;
    --income-color-on-error-container: #ffdad6;
    --income-color-error-action: #ffb4ab;
    --income-color-on-error-action: #4b0900;
    color-scheme: dark;
  }

  .income-details__back {
    --income-color-on-primary: #ffffff;
  }
}

@media (max-width: 390px) {
  .income-details {
    padding-right: var(--income-space-4);
    padding-left: var(--income-space-4);
  }

  .income-details__header {
    grid-template-columns: 72px minmax(0, 1fr) 72px;
    padding-right: var(--income-space-4);
    padding-left: var(--income-space-4);
  }

  .income-details__back,
  .income-details__refresh {
    min-width: 56px;
    padding-right: var(--income-space-2);
    padding-left: var(--income-space-2);
  }

  .income-filters__dates {
    gap: var(--income-space-2);
  }

  .income-record {
    grid-template-columns: minmax(0, 1fr);
  }

  .income-record__side {
    grid-template-columns: auto auto;
    justify-content: space-between;
    justify-items: start;
    min-width: 0;
  }
}
</style>
