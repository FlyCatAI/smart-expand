<template>
  <main class="acquiring-workbench">
    <section class="workbench-kpi" aria-label="本月业绩">
      <button
        v-for="card in kpiCards"
        :key="card.id"
        class="workbench-kpi__card"
        :data-kpi-id="card.id"
        type="button"
        @click="handleKpiTap(card)"
      >
        <span class="workbench-kpi__label">{{ card.label }}</span>
        <strong class="workbench-kpi__value">{{ card.value }}</strong>
        <span class="workbench-kpi__delta" :data-tone="card.deltaTone">{{ card.delta }}</span>
      </button>
    </section>

    <section
      v-if="showNotification"
      class="workbench-notice"
      :data-notice-type="notification.type"
      @click="handleNotificationTap"
    >
      <span class="workbench-notice__type">{{ notification.type }}</span>
      <span class="workbench-notice__title">{{ notification.title }}</span>
      <button class="workbench-notice__close" type="button" @click.stop="closeNotification">关闭</button>
    </section>

    <section class="workbench-actions" aria-label="快捷操作">
      <button
        v-for="action in quickActions"
        :key="action.id"
        class="workbench-actions__item"
        :class="{
          'is-active': activeToolbarAction === action.id || (action.id === 'first_followup' && quickFilterTag === '首期二访') || (action.id === 'high_subsidy_visit' && quickFilterTag === '高补贴'),
        }"
        :data-action-id="action.id"
        type="button"
        @click="handleQuickAction(action)"
      >
        <span>{{ action.name }}</span>
        <span v-if="action.id === 'filter_advanced' && activeFilterCount > 0" class="workbench-actions__badge">{{ activeFilterCount }}</span>
      </button>
    </section>

    <section v-if="showSearchInput" class="workbench-search">
      <input
        v-model.trim="searchKeyword"
        class="workbench-search__input"
        type="search"
        placeholder="输入商户名称搜索"
        @input="page = 1"
      />
    </section>

    <section class="merchant-list" aria-label="商户列表">
      <div class="merchant-list__toolbar">
        <button class="merchant-list__refresh" type="button" :disabled="refreshing" @click="refreshMerchants">
          {{ refreshing ? '刷新中' : '下拉刷新' }}
        </button>
        <span class="merchant-list__count">{{ visibleAllMerchants.length }}</span>
      </div>

      <div v-if="loading" class="merchant-list__loading">加载中</div>
      <div v-else-if="loadError" class="merchant-list__error">
        <!-- TODO(HZYMiniAppStyle): 补充网络异常/超时/500 fallback 展示文案与样式 -->
        <button class="merchant-list__retry" type="button" @click="loadMerchants()">重试</button>
      </div>
      <div v-else-if="pagedMerchants.length === 0" class="merchant-list__empty">{{ emptyStateText }}</div>

      <article
        v-for="merchant in pagedMerchants"
        v-else
        :key="merchant.merchantId"
        class="merchant-card"
        :data-progress="merchant.progress"
      >
        <button class="merchant-card__name" type="button" @click="handleMerchantTap(merchant)">
          {{ merchant.merchantName }}
        </button>
        <div class="merchant-card__meta">
          <span>{{ merchant.managerName }}</span>
          <span>{{ merchant.expandType }}</span>
          <span>{{ merchant.entryDate }}</span>
          <span>{{ merchant.distanceKm.toFixed(1) }} km</span>
        </div>
        <div class="merchant-card__status">
          <span>{{ merchant.admissionStatus }}</span>
          <span>{{ merchant.progress }}</span>
        </div>
        <div class="merchant-card__aum">
          <span>{{ merchant.aumLevel }}</span>
          <small>{{ merchant.aumBoundary }}</small>
        </div>
        <div v-if="merchant.marketingTags.length" class="merchant-card__tags">
          <span v-for="tag in merchant.marketingTags" :key="tag" class="merchant-card__tag">{{ tag }}</span>
        </div>
        <div v-if="merchant.partnerOrg" class="merchant-card__partner">{{ merchant.partnerOrg }}</div>
      </article>

      <button
        v-if="hasMore && !loading"
        class="merchant-list__more"
        type="button"
        :disabled="loadingMore"
        @click="loadNextPage"
      >
        {{ loadingMore ? '加载中' : '加载更多商户' }}
      </button>
      <div v-else-if="!loading && pagedMerchants.length > 0" class="merchant-list__end">已加载全部</div>
    </section>

    <section v-if="showFilterModal" class="filter-modal" role="dialog" aria-modal="true" aria-label="高级筛选">
      <div class="filter-modal__body">
        <header class="filter-modal__header">
          <h2>高级筛选</h2>
          <button type="button" class="filter-modal__close" @click="closeFilterModal">关闭</button>
        </header>

        <fieldset class="filter-group">
          <legend>入网状态</legend>
          <button
            v-for="status in admissionStatusOptions"
            :key="status"
            type="button"
            class="filter-chip"
            :class="{ 'is-selected': draftFilters.admissionStatuses.includes(status) }"
            @click="toggleAdmissionStatus(status)"
          >
            {{ status }} {{ countFor({ admissionStatus: status }) }}
          </button>
        </fieldset>

        <fieldset class="filter-group">
          <legend>商户类型</legend>
          <button
            v-for="type in merchantTypeOptions"
            :key="type"
            type="button"
            class="filter-chip"
            :class="{ 'is-selected': draftFilters.merchantTypes.includes(type) }"
            @click="toggleMerchantType(type)"
          >
            {{ type }} {{ countFor({ merchantType: type }) }}
          </button>
        </fieldset>

        <fieldset class="filter-group">
          <legend>达标进度</legend>
          <button
            v-for="progress in progressOptions"
            :key="progress"
            type="button"
            class="filter-chip"
            :class="{ 'is-selected': draftFilters.progresses.includes(progress) }"
            @click="toggleProgress(progress)"
          >
            {{ progress }} {{ countFor({ progress }) }}
          </button>
        </fieldset>

        <fieldset class="filter-group">
          <legend>合作伙伴</legend>
          <button
            v-for="partner in partnerOptions"
            :key="partner"
            type="button"
            class="filter-chip"
            :class="{ 'is-selected': draftFilters.partner === partner }"
            @click="draftFilters.partner = partner"
          >
            {{ partner }} {{ partner === '全部' ? visibleAllMerchants.length : countFor({ partner }) }}
          </button>
        </fieldset>

        <fieldset class="filter-group">
          <legend>入网时间</legend>
          <input v-model="draftFilters.entryStart" class="filter-date" type="date" />
          <input v-model="draftFilters.entryEnd" class="filter-date" type="date" />
        </fieldset>

        <fieldset class="filter-group">
          <legend>区域筛选</legend>
          <select :value="draftFilters.region.province" class="filter-select" @change="updateRegion('province', ($event.target as HTMLSelectElement).value)">
            <option value="">请选择</option>
            <option v-for="province in regionOptions.provinces" :key="province" :value="province">{{ province }}</option>
          </select>
          <select :value="draftFilters.region.city" class="filter-select" @change="updateRegion('city', ($event.target as HTMLSelectElement).value)">
            <option value="">请选择</option>
            <option v-for="city in regionOptions.cities" :key="city" :value="city">{{ city }}</option>
          </select>
          <select :value="draftFilters.region.district" class="filter-select" @change="updateRegion('district', ($event.target as HTMLSelectElement).value)">
            <option value="">请选择</option>
            <option v-for="district in regionOptions.districts" :key="district" :value="district">{{ district }}</option>
          </select>
          <select :value="draftFilters.region.branch" class="filter-select" @change="updateRegion('branch', ($event.target as HTMLSelectElement).value)">
            <option value="">请选择</option>
            <option v-for="branch in regionOptions.branches" :key="branch" :value="branch">{{ branch }}</option>
          </select>
        </fieldset>

        <footer class="filter-modal__footer">
          <button class="filter-modal__reset" type="button" @click="resetDraftFilters">重置</button>
          <button class="filter-modal__apply" type="button" @click="applyDraftFilters">应用筛选</button>
        </footer>
      </div>
    </section>

    <div v-if="toastMessage" class="workbench-toast" role="status">{{ toastMessage }}</div>
    <div v-if="routeFailure" class="workbench-route-failure" data-observable="route-failed">
      <!-- TODO(HZYMiniAppStyle): 路由失败可观察占位，不在逻辑层新增终态文案 -->
    </div>
  </main>
</template>

<script setup lang="ts">
import { useAcquiringWorkbench } from './workbenchLogic';
import type { MerchantAdmissionStatus, MerchantProgress, MerchantType } from './types';

const admissionStatusOptions: MerchantAdmissionStatus[] = ['准入成功', '准入失败', '已补贴', '无补贴'];
const merchantTypeOptions: MerchantType[] = ['正餐餐饮', '饮品甜点', '商超购物', '社区便利', '美容美发', '医疗保健'];
const progressOptions: MerchantProgress[] = ['已达标', '已有效', '未达标', '未有效'];
const partnerOptions = ['全部', '是', '否'] as const;

const {
  activeFilterCount,
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
  notification,
  pagedMerchants,
  page,
  quickActions,
  quickFilterTag,
  refreshMerchants,
  refreshing,
  regionOptions,
  resetDraftFilters,
  routeFailure,
  searchKeyword,
  showFilterModal,
  showNotification,
  showSearchInput,
  toastMessage,
  toggleAdmissionStatus,
  toggleMerchantType,
  toggleProgress,
  updateRegion,
  visibleAllMerchants,
} = useAcquiringWorkbench();
</script>

<style scoped>
.acquiring-workbench {
  --workbench-color-primary: #003b99;
  --workbench-color-primary-strong: #1a52bf;
  --workbench-color-primary-soft: #e8f0ff;
  --workbench-color-secondary: #4e5d88;
  --workbench-color-surface: #f7f9fc;
  --workbench-color-surface-low: #ffffff;
  --workbench-color-surface-muted: #f2f4f7;
  --workbench-color-surface-raised: #eceef1;
  --workbench-color-surface-pressed: #e0e3e6;
  --workbench-color-text: #191c1e;
  --workbench-color-text-muted: #434653;
  --workbench-color-outline: #737685;
  --workbench-color-outline-soft: #c3c6d5;
  --workbench-color-positive: #0b6b45;
  --workbench-color-positive-soft: #dff7ea;
  --workbench-color-negative: #ba1a1a;
  --workbench-color-negative-soft: #ffdad6;
  --workbench-color-neutral-soft: #eef1f5;
  --workbench-color-warning: #7a3f00;
  --workbench-color-warning-soft: #fff2d6;
  --workbench-color-overlay: rgba(10, 18, 32, 0.48);
  --workbench-shadow-card: 0 10px 28px rgba(17, 24, 39, 0.08);
  --workbench-shadow-float: 0 18px 48px rgba(17, 24, 39, 0.18);
  --workbench-space-2xs: 4px;
  --workbench-space-xs: 6px;
  --workbench-space-sm: 8px;
  --workbench-space-md: 12px;
  --workbench-space-lg: 16px;
  --workbench-space-xl: 20px;
  --workbench-space-2xl: 24px;
  --workbench-radius-sm: 6px;
  --workbench-radius-md: 8px;
  --workbench-font-xs: 11px;
  --workbench-font-sm: 12px;
  --workbench-font-md: 14px;
  --workbench-font-lg: 16px;
  --workbench-font-xl: 22px;
  --workbench-font-2xl: 28px;
  --workbench-line-tight: 1.25;
  --workbench-line-body: 1.5;
  --workbench-motion-fast: 120ms ease;
  box-sizing: border-box;
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + var(--workbench-space-xl)) var(--workbench-space-lg)
    calc(env(safe-area-inset-bottom) + var(--workbench-space-2xl));
  background: var(--workbench-color-surface);
  color: var(--workbench-color-text);
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.acquiring-workbench *,
.acquiring-workbench *::before,
.acquiring-workbench *::after {
  box-sizing: border-box;
}

.workbench-kpi {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--workbench-space-md);
}

.workbench-kpi__card {
  display: flex;
  min-height: 112px;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--workbench-space-sm);
  padding: var(--workbench-space-lg);
  border: 1px solid var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  box-shadow: var(--workbench-shadow-card);
  color: inherit;
  text-align: left;
  transition:
    transform var(--workbench-motion-fast),
    border-color var(--workbench-motion-fast),
    background var(--workbench-motion-fast);
}

.workbench-kpi__card:active {
  transform: translateY(1px);
  border-color: var(--workbench-color-primary);
  background: var(--workbench-color-primary-soft);
}

.workbench-kpi__label {
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-sm);
  font-weight: 600;
  line-height: var(--workbench-line-tight);
}

.workbench-kpi__value {
  display: block;
  width: 100%;
  overflow-wrap: anywhere;
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-xl);
  font-weight: 800;
  line-height: var(--workbench-line-tight);
}

.workbench-kpi__delta {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  padding: var(--workbench-space-2xs) var(--workbench-space-sm);
  border-radius: var(--workbench-radius-sm);
  background: var(--workbench-color-neutral-soft);
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-xs);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
}

.workbench-kpi__delta[data-tone="positive"] {
  background: var(--workbench-color-positive-soft);
  color: var(--workbench-color-positive);
}

.workbench-kpi__delta[data-tone="negative"] {
  background: var(--workbench-color-negative-soft);
  color: var(--workbench-color-negative);
}

.workbench-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--workbench-space-md);
  margin-top: var(--workbench-space-lg);
  padding: var(--workbench-space-md);
  border: 1px solid var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-warning-soft);
  color: var(--workbench-color-warning);
  box-shadow: var(--workbench-shadow-card);
}

.workbench-notice__type {
  display: inline-flex;
  min-width: 44px;
  justify-content: center;
  padding: var(--workbench-space-2xs) var(--workbench-space-sm);
  border: 1px solid currentColor;
  border-radius: var(--workbench-radius-sm);
  font-size: var(--workbench-font-xs);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
}

.workbench-notice__title {
  overflow: hidden;
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-md);
  font-weight: 700;
  line-height: var(--workbench-line-body);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-notice__close,
.merchant-list__refresh,
.merchant-list__retry,
.merchant-list__more,
.filter-modal__close,
.filter-modal__reset,
.filter-modal__apply {
  min-height: 36px;
  border-radius: var(--workbench-radius-md);
  font-size: var(--workbench-font-sm);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
  transition:
    opacity var(--workbench-motion-fast),
    transform var(--workbench-motion-fast),
    background var(--workbench-motion-fast);
}

.workbench-notice__close {
  padding: var(--workbench-space-xs) var(--workbench-space-md);
  border: 1px solid var(--workbench-color-outline);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-primary);
}

.workbench-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--workbench-space-sm);
  margin-top: var(--workbench-space-lg);
}

.workbench-actions__item {
  position: relative;
  display: flex;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  padding: var(--workbench-space-sm);
  border: 1px solid var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-sm);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
  text-align: center;
  transition:
    transform var(--workbench-motion-fast),
    border-color var(--workbench-motion-fast),
    background var(--workbench-motion-fast),
    color var(--workbench-motion-fast);
}

.workbench-actions__item.is-active {
  border-color: var(--workbench-color-primary);
  background: var(--workbench-color-primary-soft);
  color: var(--workbench-color-primary);
}

.workbench-actions__item:active,
.merchant-card:active,
.merchant-list__more:active,
.filter-chip:active,
.filter-modal__apply:active,
.filter-modal__reset:active {
  transform: translateY(1px);
}

.workbench-actions__badge {
  position: absolute;
  top: var(--workbench-space-xs);
  right: var(--workbench-space-xs);
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0 var(--workbench-space-xs);
  border-radius: 999px;
  background: var(--workbench-color-negative);
  color: var(--workbench-color-surface-low);
  font-size: var(--workbench-font-xs);
  font-weight: 800;
  line-height: 1;
}

.workbench-search {
  margin-top: var(--workbench-space-lg);
}

.workbench-search__input,
.filter-date,
.filter-select {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-md);
  line-height: var(--workbench-line-body);
  outline: none;
  transition:
    border-color var(--workbench-motion-fast),
    box-shadow var(--workbench-motion-fast),
    background var(--workbench-motion-fast);
}

.workbench-search__input {
  padding: 0 var(--workbench-space-lg);
}

.workbench-search__input::placeholder {
  color: var(--workbench-color-text-muted);
}

.workbench-search__input:focus,
.filter-date:focus,
.filter-select:focus {
  border-color: var(--workbench-color-primary);
  box-shadow: 0 0 0 3px var(--workbench-color-primary-soft);
}

.merchant-list {
  display: flex;
  flex-direction: column;
  gap: var(--workbench-space-md);
  margin-top: var(--workbench-space-lg);
}

.merchant-list__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--workbench-space-md);
}

.merchant-list__refresh,
.merchant-list__retry,
.merchant-list__more,
.filter-modal__apply {
  border: 1px solid var(--workbench-color-primary);
  background: var(--workbench-color-primary);
  color: var(--workbench-color-surface-low);
}

.merchant-list__refresh:disabled,
.merchant-list__more:disabled {
  border-color: var(--workbench-color-outline-soft);
  background: var(--workbench-color-surface-raised);
  color: var(--workbench-color-text-muted);
  opacity: 1;
}

.merchant-list__refresh {
  padding: 0 var(--workbench-space-md);
}

.merchant-list__count {
  display: inline-flex;
  min-width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-raised);
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-sm);
  font-weight: 800;
}

.merchant-list__loading,
.merchant-list__error,
.merchant-list__empty,
.merchant-list__end {
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-md);
  font-weight: 700;
  line-height: var(--workbench-line-body);
  text-align: center;
}

.merchant-list__error {
  flex-direction: column;
  gap: var(--workbench-space-md);
  border-color: var(--workbench-color-negative);
  background: var(--workbench-color-negative-soft);
  color: var(--workbench-color-negative);
}

.merchant-list__retry,
.merchant-list__more {
  padding: 0 var(--workbench-space-lg);
}

.merchant-list__more {
  width: 100%;
}

.merchant-list__end {
  min-height: 48px;
  border-style: solid;
  background: transparent;
}

.merchant-card {
  display: flex;
  flex-direction: column;
  gap: var(--workbench-space-md);
  padding: var(--workbench-space-lg);
  border: 1px solid var(--workbench-color-outline-soft);
  border-left: 4px solid var(--workbench-color-secondary);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  box-shadow: var(--workbench-shadow-card);
  transition:
    transform var(--workbench-motion-fast),
    border-color var(--workbench-motion-fast),
    background var(--workbench-motion-fast);
}

.merchant-card[data-progress="已达标"],
.merchant-card[data-progress="已有效"] {
  border-left-color: var(--workbench-color-positive);
}

.merchant-card[data-progress="未达标"],
.merchant-card[data-progress="未有效"] {
  border-left-color: var(--workbench-color-warning);
}

.merchant-card__name {
  display: block;
  width: 100%;
  border: 0;
  background: transparent;
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-lg);
  font-weight: 800;
  line-height: var(--workbench-line-tight);
  overflow-wrap: anywhere;
  padding: 0;
  text-align: left;
}

.merchant-card__meta,
.merchant-card__status,
.merchant-card__aum,
.merchant-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--workbench-space-sm);
  align-items: center;
}

.merchant-card__meta span,
.merchant-card__status span,
.merchant-card__partner,
.merchant-card__aum,
.merchant-card__tag {
  min-height: 26px;
  align-items: center;
  border-radius: var(--workbench-radius-sm);
  font-size: var(--workbench-font-xs);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
}

.merchant-card__meta span,
.merchant-card__partner {
  display: inline-flex;
  padding: var(--workbench-space-2xs) var(--workbench-space-sm);
  background: var(--workbench-color-surface-muted);
  color: var(--workbench-color-text-muted);
}

.merchant-card__status span {
  display: inline-flex;
  padding: var(--workbench-space-2xs) var(--workbench-space-sm);
  background: var(--workbench-color-primary-soft);
  color: var(--workbench-color-primary);
}

.merchant-card__aum {
  justify-content: space-between;
  padding: var(--workbench-space-sm);
  background: var(--workbench-color-surface-muted);
  color: var(--workbench-color-text);
}

.merchant-card__aum small {
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-xs);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
}

.merchant-card__tag {
  display: inline-flex;
  padding: var(--workbench-space-2xs) var(--workbench-space-sm);
  background: var(--workbench-color-warning-soft);
  color: var(--workbench-color-warning);
}

.filter-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--workbench-space-lg);
  background: var(--workbench-color-overlay);
}

.filter-modal__body {
  width: min(100%, 540px);
  max-height: min(86vh, 760px);
  overflow: auto;
  border: 1px solid var(--workbench-color-outline-soft);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  box-shadow: var(--workbench-shadow-float);
}

.filter-modal__header,
.filter-modal__footer {
  position: sticky;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--workbench-space-md);
  padding: var(--workbench-space-lg);
  background: var(--workbench-color-surface-low);
}

.filter-modal__header {
  top: 0;
  border-bottom: 1px solid var(--workbench-color-outline-soft);
}

.filter-modal__header h2 {
  margin: 0;
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-lg);
  font-weight: 800;
  line-height: var(--workbench-line-tight);
}

.filter-modal__close,
.filter-modal__reset {
  padding: 0 var(--workbench-space-md);
  border: 1px solid var(--workbench-color-outline);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-primary);
}

.filter-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--workbench-space-sm);
  margin: 0;
  padding: var(--workbench-space-lg);
  border: 0;
  border-bottom: 1px solid var(--workbench-color-outline-soft);
}

.filter-group legend {
  width: 100%;
  padding: 0 0 var(--workbench-space-xs);
  color: var(--workbench-color-text);
  font-size: var(--workbench-font-md);
  font-weight: 800;
  line-height: var(--workbench-line-tight);
}

.filter-chip {
  min-height: 36px;
  padding: 0 var(--workbench-space-md);
  border: 1px solid var(--workbench-color-outline);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-surface-low);
  color: var(--workbench-color-text-muted);
  font-size: var(--workbench-font-sm);
  font-weight: 700;
  line-height: var(--workbench-line-tight);
  transition:
    transform var(--workbench-motion-fast),
    border-color var(--workbench-motion-fast),
    background var(--workbench-motion-fast),
    color var(--workbench-motion-fast);
}

.filter-chip.is-selected {
  border-color: var(--workbench-color-primary);
  background: var(--workbench-color-primary);
  color: var(--workbench-color-surface-low);
}

.filter-date,
.filter-select {
  flex: 1 1 148px;
  padding: 0 var(--workbench-space-md);
}

.filter-modal__footer {
  bottom: 0;
  border-top: 1px solid var(--workbench-color-outline-soft);
}

.filter-modal__reset,
.filter-modal__apply {
  flex: 1 1 0;
}

.workbench-toast {
  position: fixed;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + var(--workbench-space-2xl));
  z-index: 40;
  width: min(calc(100vw - 40px), 360px);
  transform: translateX(-50%);
  padding: var(--workbench-space-md) var(--workbench-space-lg);
  border-radius: var(--workbench-radius-md);
  background: var(--workbench-color-text);
  box-shadow: var(--workbench-shadow-float);
  color: var(--workbench-color-surface-low);
  font-size: var(--workbench-font-md);
  font-weight: 700;
  line-height: var(--workbench-line-body);
  text-align: center;
}

.workbench-route-failure {
  position: fixed;
  right: var(--workbench-space-lg);
  bottom: calc(env(safe-area-inset-bottom) + var(--workbench-space-lg));
  z-index: 35;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--workbench-color-negative);
  box-shadow: 0 0 0 4px var(--workbench-color-negative-soft);
}

@media (prefers-color-scheme: dark) {
  .acquiring-workbench {
    --workbench-color-primary: #8fb3ff;
    --workbench-color-primary-strong: #b8ccff;
    --workbench-color-primary-soft: #18345f;
    --workbench-color-secondary: #bfceff;
    --workbench-color-surface: #101318;
    --workbench-color-surface-low: #191c22;
    --workbench-color-surface-muted: #222832;
    --workbench-color-surface-raised: #2b313d;
    --workbench-color-surface-pressed: #363d4a;
    --workbench-color-text: #f1f3f7;
    --workbench-color-text-muted: #c6cad4;
    --workbench-color-outline: #9ea3b0;
    --workbench-color-outline-soft: #454b57;
    --workbench-color-positive: #8ddcaf;
    --workbench-color-positive-soft: #123624;
    --workbench-color-negative: #ffb4ab;
    --workbench-color-negative-soft: #5f1d1d;
    --workbench-color-neutral-soft: #2b313d;
    --workbench-color-warning: #ffcf88;
    --workbench-color-warning-soft: #4b320f;
    --workbench-color-overlay: rgba(0, 0, 0, 0.62);
    --workbench-shadow-card: 0 10px 28px rgba(0, 0, 0, 0.28);
    --workbench-shadow-float: 0 18px 48px rgba(0, 0, 0, 0.5);
  }
}

@media (min-width: 560px) {
  .acquiring-workbench {
    max-width: 560px;
    margin: 0 auto;
    padding-right: var(--workbench-space-xl);
    padding-left: var(--workbench-space-xl);
  }

  .workbench-kpi {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 374px) {
  .workbench-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workbench-kpi__value {
    font-size: var(--workbench-font-lg);
  }

  .workbench-notice {
    grid-template-columns: 1fr auto;
  }

  .workbench-notice__type {
    display: none;
  }
}
</style>
