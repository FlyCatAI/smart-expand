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
          'is-active': activeToolbarAction === action.id
            || (action.id === 'first_followup' && quickFilterTag === '首期二访')
            || (action.id === 'potential_active' && quickFilterTag === '潜力有效')
            || (action.id === 'high_subsidy_visit' && quickFilterTag === '高补贴回访'),
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
        @input="resetPage"
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
        <span class="merchant-list__error-text">商户数据加载失败</span>
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
            @click="setPartnerFilter(partner)"
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
    <div v-if="loadFailure" class="merchant-list__load-failure" data-observable="merchant-load-failed">
      <!-- TODO(HZYMiniAppStyle): mock 请求失败可观察占位，样式层补充最终异常态展示 -->
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
  loadFailure,
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
  resetPage,
  resetDraftFilters,
  routeFailure,
  searchKeyword,
  showFilterModal,
  showNotification,
  showSearchInput,
  setPartnerFilter,
  toastMessage,
  toggleAdmissionStatus,
  toggleMerchantType,
  toggleProgress,
  updateRegion,
  visibleAllMerchants,
} = useAcquiringWorkbench();
</script>
