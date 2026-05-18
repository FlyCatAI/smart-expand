<template>
  <view class="merchant-dynamics-page">
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
    this.merchantId = options.merchantId || DEFAULT_MERCHANT_ID
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
        // TODO(HZYMiniAppStyle/HZYCompliance): 补齐异常态展示文案。
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
        // TODO(HZYMiniAppStyle/HZYCompliance): 补齐刷新失败提示文案。
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
        // TODO(HZYMiniAppStyle/HZYCompliance): 补齐分页失败提示文案。
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
