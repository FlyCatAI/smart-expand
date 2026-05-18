<template>
  <view class="merchant-dynamics-page hzy-theme">
    <view v-if="initialLoading" class="merchant-dynamics-page__loading"></view>
    <view v-else-if="loadFailed" class="merchant-dynamics-page__error"></view>
    <scroll-view
      v-else
      class="merchant-dynamics-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="refreshing"
      @refresherrefresh="refreshRecords"
      @scrolltolower="loadMoreRecords"
    >
      <view
        v-for="record in records"
        :key="record.record_id"
        class="merchant-dynamics-record"
      >
        <view class="merchant-dynamics-record__date">{{ record.record_date }}</view>
        <view class="merchant-dynamics-record__handler">{{ record.handler_name }}</view>
        <view class="merchant-dynamics-record__content">{{ record.record_content }}</view>
      </view>
      <view v-if="loadingMore" class="merchant-dynamics-list__loading-more"></view>
      <view v-if="!hasMore" class="merchant-dynamics-list__end"></view>
    </scroll-view>
  </view>
</template>

<script>
import { DEFAULT_MERCHANT_ID } from '../../fixtures/merchant-detail.js'
import { fetchMerchantDynamics } from '../../services/merchantService.js'

const PAGE_SIZE = 20

export default {
  name: 'MerchantDynamicsPage',
  data() {
    return {
      merchantId: DEFAULT_MERCHANT_ID,
      records: [],
      page: 1,
      hasMore: true,
      initialLoading: false,
      refreshing: false,
      loadingMore: false,
      loadFailed: false
    }
  },
  onLoad(options = {}) {
    this.merchantId = options.merchantId ? decodeURIComponent(options.merchantId) : DEFAULT_MERCHANT_ID
    this.loadFirstPage()
  },
  methods: {
    async loadFirstPage() {
      this.initialLoading = true
      this.loadFailed = false

      try {
        await this.fetchPage(1, { replace: true })
      } catch (error) {
        this.loadFailed = true
        uni.showToast({ title: '数据加载失败，请下拉刷新重试', icon: 'none' })
      } finally {
        this.initialLoading = false
      }
    },
    async refreshRecords() {
      if (this.refreshing) {
        return
      }

      this.refreshing = true
      this.loadFailed = false

      try {
        await this.fetchPage(1, { replace: true })
      } catch (error) {
        this.loadFailed = true
        uni.showToast({ title: '刷新失败，请检查网络后重试', icon: 'none' })
      } finally {
        this.refreshing = false
      }
    },
    async loadMoreRecords() {
      if (!this.hasMore || this.loadingMore) {
        return
      }

      this.loadingMore = true

      try {
        await this.fetchPage(this.page + 1, { replace: false })
      } catch (error) {
        uni.showToast({ title: '加载更多失败，下拉重试', icon: 'none' })
      } finally {
        this.loadingMore = false
      }
    },
    async fetchPage(page, options = {}) {
      const { replace } = options
      const response = await fetchMerchantDynamics({
        merchantId: this.merchantId,
        page,
        pageSize: PAGE_SIZE
      })

      this.page = response.page
      this.hasMore = response.has_more
      this.records = replace
        ? response.records
        : this.records.concat(response.records)
    }
  }
}
</script>

<style scoped>
.merchant-dynamics-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: var(--space-24);
  background: var(--bg-color);
  color: var(--text-color-primary);
  font-size: var(--font-body);
  overflow-x: hidden;
}

.merchant-dynamics-page__loading,
.merchant-dynamics-page__error {
  min-height: 420rpx;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.merchant-dynamics-page__loading::before,
.merchant-dynamics-page__loading::after {
  content: '';
  position: absolute;
  left: var(--space-32);
  right: var(--space-32);
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
}

.merchant-dynamics-page__loading::before {
  top: var(--space-40);
  height: 44rpx;
}

.merchant-dynamics-page__loading::after {
  top: 116rpx;
  height: 220rpx;
}

.merchant-dynamics-page__error {
  border: 2rpx solid var(--border-color);
}

.merchant-dynamics-page__error::before {
  content: '';
  width: 88rpx;
  height: 88rpx;
  position: absolute;
  top: 146rpx;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
  border: 4rpx solid var(--border-color);
  box-shadow: inset 0 -18rpx 0 var(--color-secondary);
}

.merchant-dynamics-list {
  width: calc(100vw - 48rpx);
  height: calc(100vh - 48rpx);
  box-sizing: border-box;
}

.merchant-dynamics-record {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  padding: var(--space-24);
  margin-bottom: var(--space-16);
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
}

.merchant-dynamics-record__date {
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.merchant-dynamics-record__handler {
  margin-top: var(--space-8);
  color: var(--text-color-primary);
  font-size: var(--font-body);
  line-height: 1.45;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.merchant-dynamics-record__content {
  margin-top: var(--space-12);
  color: var(--text-color-primary);
  font-size: var(--font-body);
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.merchant-dynamics-list__loading-more,
.merchant-dynamics-list__end {
  min-height: 96rpx;
  position: relative;
}

.merchant-dynamics-list__loading-more::before {
  content: '';
  width: 40rpx;
  height: 40rpx;
  position: absolute;
  top: 28rpx;
  left: 50%;
  margin-left: -20rpx;
  border-radius: 50%;
  border: 4rpx solid var(--border-color);
  border-top-color: var(--color-primary);
  animation: merchant-dynamics-spin 0.9s linear infinite;
}

.merchant-dynamics-list__end::before {
  content: '';
  width: 144rpx;
  height: 2rpx;
  position: absolute;
  top: 48rpx;
  left: 50%;
  transform: translateX(-50%);
  background: var(--border-color);
}

@keyframes merchant-dynamics-spin {
  to {
    transform: rotate(360deg);
  }
}

@media screen and (max-width: 380px) {
  .merchant-dynamics-page {
    padding: var(--space-16);
  }

  .merchant-dynamics-list {
    width: calc(100vw - 32rpx);
    height: calc(100vh - 32rpx);
  }

  .merchant-dynamics-record {
    padding: var(--space-16);
  }
}
</style>
