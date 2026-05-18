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
