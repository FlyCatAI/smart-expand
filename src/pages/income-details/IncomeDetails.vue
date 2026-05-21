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
      <!-- TODO(HZYMiniAppStyle): 日期倒置异常态展示占位，最终文案由样式/体验层补齐 -->
    </div>

    <section class="income-records" aria-label="收入记录">
      <div class="income-records__toolbar">
        <span class="income-records__title">收入记录</span>
        <span class="income-records__count">{{ filteredRecords.length }}</span>
      </div>

      <div v-if="loading" class="income-records__loading">加载中</div>
      <div v-else-if="loadError" class="income-records__error" data-observable="income-load-error">
        <!-- TODO(HZYMiniAppStyle): 请求失败/断网/超时异常态展示占位，最终文案由样式层补齐 -->
        <button class="income-records__retry" type="button" @click="loadIncomeRecords()">重试</button>
      </div>
      <div v-else-if="!dateRangeError && pagedRecords.length === 0" class="income-records__empty" data-observable="income-records-empty">
        <!-- TODO(HZYMiniAppStyle): 0 笔收入空态展示占位，最终文案由样式层补齐 -->
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
      <!-- TODO(HZYMiniAppStyle): mock 请求失败可观察占位，样式层补充最终异常态展示 -->
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
