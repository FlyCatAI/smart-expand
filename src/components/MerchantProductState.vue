<template>
  <view class="merchant-product-state" :class="stateClass">
    <view class="merchant-product-state__title">{{ summary.title }}</view>
    <view v-if="hasProduct" class="merchant-product-state__list">
      <view
        v-for="item in summary.items"
        :key="item"
        class="merchant-product-state__item"
      >
        {{ item }}
      </view>
    </view>
    <view v-else class="merchant-product-state__empty"></view>
  </view>
</template>

<script>
export default {
  name: 'MerchantProductState',
  props: {
    hasProduct: {
      type: Boolean,
      required: true
    },
    summary: {
      type: Object,
      required: true
    }
  },
  computed: {
    stateClass() {
      return this.hasProduct
        ? 'merchant-product-state--has-product'
        : 'merchant-product-state--no-product'
    }
  }
}
</script>

<style scoped>
.merchant-product-state {
  box-sizing: border-box;
  padding: var(--space-16);
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-surface-muted);
}

.merchant-product-state__title {
  color: var(--text-color-primary);
  font-size: var(--font-body);
  line-height: 1.45;
  font-weight: 700;
}

.merchant-product-state__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-top: var(--space-12);
}

.merchant-product-state__item {
  min-height: 44rpx;
  padding: 0 var(--space-12);
  border-radius: 999rpx;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-size: var(--font-caption);
  line-height: 44rpx;
}

.merchant-product-state__empty {
  height: 96rpx;
  margin-top: var(--space-12);
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
  position: relative;
  overflow: hidden;
}

.merchant-product-state__empty::before,
.merchant-product-state__empty::after {
  content: '';
  position: absolute;
  left: var(--space-16);
  right: var(--space-16);
  height: 16rpx;
  border-radius: 999rpx;
  background: var(--border-color);
}

.merchant-product-state__empty::before {
  top: var(--space-24);
}

.merchant-product-state__empty::after {
  top: 56rpx;
  right: 128rpx;
}

.merchant-product-state--has-product {
  border-color: var(--status-active-green);
}

.merchant-product-state--no-product {
  border-color: var(--status-not-qualified-gray);
}
</style>
