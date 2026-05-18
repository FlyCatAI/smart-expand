<template>
  <view class="merchant-detail-page hzy-theme">
    <view v-if="loading" class="merchant-detail-page__loading"></view>
    <view v-else-if="loadFailed" class="merchant-detail-page__error"></view>
    <template v-else-if="merchant">
      <view class="merchant-detail-card merchant-detail-card--summary">
        <view class="merchant-detail-card__title">{{ merchant.merchant_name }}</view>
        <view
          class="merchant-detail-card__meta merchant-detail-card__meta--status"
          :class="{
            'merchant-detail-card__meta--status-unqualified': merchant.status === '未达标',
            'merchant-detail-card__meta--status-qualified': merchant.status === '已达标',
            'merchant-detail-card__meta--status-active': merchant.status === '已有效'
          }"
        >
          {{ merchant.status }}
        </view>
        <view class="merchant-detail-card__meta">{{ merchant.aum_level }}</view>
      </view>

      <view class="merchant-detail-tabs">
        <button
          v-for="section in sections"
          :key="section.id"
          class="merchant-detail-tabs__item"
          :class="{ 'merchant-detail-tabs__item--active': activeSection === section.id }"
          @click="handleSectionTab(section.id)"
        >
          {{ section.label }}
        </button>
      </view>

      <scroll-view
        class="merchant-detail-scroll"
        scroll-y
        :scroll-into-view="scrollTarget"
        @scroll="handleDetailScroll"
      >
        <view id="section-assets" class="merchant-detail-section">
          <view class="merchant-detail-section__title">经营与资产信息</view>
          <view
            v-for="field in assetFields"
            :key="field.key"
            class="merchant-detail-field"
          >
            <text class="merchant-detail-field__label">{{ field.label }}</text>
            <text class="merchant-detail-field__value">{{ field.value }}</text>
          </view>
        </view>

        <view id="section-product" class="merchant-detail-section">
          <view class="merchant-detail-section__title">产品状态</view>
          <merchant-product-state
            :has-product="merchant.has_product"
            :summary="merchant.product_summary"
          />
        </view>

        <view id="section-competitor" class="merchant-detail-section">
          <view class="merchant-detail-section__title">他行同名转出</view>
          <view
            v-for="item in competitorTransfers"
            :key="item.competitor_bank"
            class="merchant-detail-field"
          >
            <text class="merchant-detail-field__label">{{ item.competitor_bank }}</text>
            <text class="merchant-detail-field__value">{{ item.amountText }}</text>
          </view>
        </view>

        <view id="section-opportunity" class="merchant-detail-section">
          <view class="merchant-detail-section__title">商机信息</view>
          <view
            v-for="(opportunity, index) in merchant.opportunities"
            :key="opportunity.opportunity_id"
            class="merchant-opportunity"
          >
            <view class="merchant-opportunity__index">{{ index + 1 }}项</view>
            <view class="merchant-opportunity__type">{{ opportunity.opportunity_type }}</view>
            <view class="merchant-opportunity__desc">{{ opportunity.opportunity_desc }}</view>
            <view class="merchant-opportunity__date">{{ opportunity.opportunity_pub_date }}</view>
            <view class="merchant-opportunity__actions">
              <button
                v-for="action in opportunityActions"
                :key="action.id"
                class="merchant-opportunity__action"
                @click="handleOpportunityAction(action.id, opportunity)"
              >
                {{ action.label }}
              </button>
            </view>
          </view>
        </view>

        <view id="section-basic" class="merchant-detail-section">
          <view class="merchant-detail-section__title">基础信息</view>
          <view
            v-for="field in basicFields"
            :key="field.key"
            class="merchant-detail-field"
          >
            <text class="merchant-detail-field__label">{{ field.label }}</text>
            <text class="merchant-detail-field__value">{{ field.value }}</text>
          </view>
        </view>

        <view id="section-actions" class="merchant-detail-section">
          <view class="merchant-detail-section__title">操作</view>
          <view class="merchant-detail-actions">
            <button class="merchant-detail-actions__item" @click="goDynamics">商户动态</button>
            <button class="merchant-detail-actions__item" @click="openQuotaModal">额度管理</button>
            <button class="merchant-detail-actions__item" @click="takePhoto">拍照</button>
            <button class="merchant-detail-actions__item" @click="confirmCall">拨打电话</button>
          </view>
        </view>
      </scroll-view>

      <view v-if="quotaModalVisible" class="quota-modal">
        <view class="quota-modal__panel">
          <view class="quota-modal__title">{{ quotaModalTitle }}</view>
          <view class="quota-modal__current">
            {{ currentMonthlyAvgBalanceText }}
          </view>
          <view
            v-for="row in quotaRows"
            :key="row.id"
            class="quota-modal__row"
            :class="{ 'quota-modal__row--active': row.isActive }"
          >
            <text class="quota-modal__cell">{{ row.currentValueText || currentMonthlyAvgBalanceText }}</text>
            <text class="quota-modal__cell">{{ row.requiredTransferText }}</text>
            <text class="quota-modal__cell">{{ row.rangeText }}</text>
            <text class="quota-modal__cell">{{ row.subsidyText }}</text>
          </view>
          <button class="quota-modal__close" @click="closeQuotaModal">关闭</button>
        </view>
      </view>
    </template>
  </view>
</template>

<script>
import MerchantProductState from '../../components/MerchantProductState.vue'
import { DEFAULT_MERCHANT_ID } from '../../fixtures/merchant-detail.js'
import { dialMerchant, fetchMerchantDetail } from '../../services/merchantService.js'
import { formatWanAmount } from '../../utils/money.js'
import { buildQuotaRows } from '../../utils/subsidyTiers.js'

const SECTION_SCROLL_OFFSET = 24

export default {
  name: 'MerchantDetailPage',
  components: {
    MerchantProductState
  },
  data() {
    return {
      merchantId: DEFAULT_MERCHANT_ID,
      merchant: null,
      loading: false,
      loadFailed: false,
      activeSection: 'section-assets',
      scrollTarget: '',
      sectionOffsets: [],
      quotaModalVisible: false,
      calling: false,
      sections: [
        { id: 'section-assets', label: '经营资产' },
        { id: 'section-product', label: '产品状态' },
        { id: 'section-competitor', label: '他行转出' },
        { id: 'section-opportunity', label: '商机' },
        { id: 'section-basic', label: '基础' },
        { id: 'section-actions', label: '操作' }
      ],
      opportunityActions: [
        { id: 'view_policy', label: '查看政策' },
        { id: 'recommended_script', label: '推荐话术' },
        { id: 'marketing_poster', label: '营销海报' },
        { id: 'submit_record', label: '提交记录' }
      ]
    }
  },
  computed: {
    assetFields() {
      const assets = this.merchant?.operation_assets || {}
      return [
        { key: 'subsidy_current', label: '本期补贴额度', value: formatWanAmount(assets.subsidy_current) },
        { key: 'subsidy_estimate', label: '下期预估补贴额度', value: formatWanAmount(assets.subsidy_estimate) },
        { key: 'monthly_settlement', label: '当月结算流水', value: formatWanAmount(assets.monthly_settlement) },
        { key: 'current_balance', label: '当前活期余额', value: formatWanAmount(assets.current_balance) },
        { key: 'monthly_avg_balance', label: '本月月日均活期', value: formatWanAmount(assets.monthly_avg_balance) },
        { key: 'current_fin_assets', label: '当前金融资产', value: formatWanAmount(assets.current_fin_assets) },
        { key: 'monthly_avg_fin_assets', label: '本月月日均金融资产', value: formatWanAmount(assets.monthly_avg_fin_assets) },
        { key: 'loan_limit', label: '普惠贷款额度', value: formatWanAmount(assets.loan_limit) },
        { key: 'eloan_limit', label: 'E秒贷额度', value: formatWanAmount(assets.eloan_limit) },
        { key: 'credit_card_limit', label: '信用卡额度', value: formatWanAmount(assets.credit_card_limit) }
      ]
    },
    competitorTransfers() {
      return (this.merchant?.competitor_transfers || []).map((item) => ({
        ...item,
        amountText: formatWanAmount(item.competitor_amount)
      }))
    },
    basicFields() {
      return [
        { key: 'merchant_name', label: '商户全称', value: this.merchant.merchant_name },
        { key: 'contact_name', label: '联系人姓名', value: this.merchant.contact_name },
        { key: 'contact_phone', label: '联系人手机号', value: this.merchant.contact_phone },
        { key: 'merchant_no', label: '商户编号', value: this.merchant.merchant_no },
        { key: 'account_no', label: '账户号', value: this.merchant.account_no },
        { key: 'address', label: '地址', value: this.merchant.address },
        { key: 'merchant_nature', label: '商户性质', value: this.merchant.merchant_nature },
        { key: 'pay_org', label: '支付机构', value: this.merchant.pay_org },
        { key: 'entry_time', label: '入网时间', value: this.merchant.entry_time },
        { key: 'qualified_time', label: '达标时间', value: this.merchant.qualified_time || '' }
      ]
    },
    quotaRows() {
      return buildQuotaRows(this.merchant.operation_assets.monthly_avg_balance)
    },
    currentMonthlyAvgBalanceText() {
      return formatWanAmount(this.merchant.operation_assets.monthly_avg_balance)
    },
    quotaModalTitle() {
      return '月日均额达标准'
    }
  },
  onLoad(options = {}) {
    this.merchantId = options.merchantId ? decodeURIComponent(options.merchantId) : DEFAULT_MERCHANT_ID
    this.loadMerchantDetail()
  },
  methods: {
    async loadMerchantDetail() {
      this.loading = true
      this.loadFailed = false

      try {
        const merchant = await fetchMerchantDetail(this.merchantId)
        this.merchant = merchant
        this.$nextTick(() => {
          this.refreshSectionOffsets()
        })
      } catch (error) {
        this.loadFailed = true
        uni.showToast({ title: '数据加载失败，请下拉刷新重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    handleSectionTab(sectionId) {
      this.activeSection = sectionId
      this.scrollTarget = ''
      this.$nextTick(() => {
        this.scrollTarget = sectionId
      })
    },
    handleDetailScroll(event) {
      if (!this.sectionOffsets.length) {
        return
      }

      const scrollTop = Number(event.detail?.scrollTop || 0)
      const currentSection = this.sectionOffsets.reduce((matched, item) => (
        scrollTop + SECTION_SCROLL_OFFSET >= item.top ? item.id : matched
      ), this.sectionOffsets[0].id)

      if (currentSection !== this.activeSection) {
        this.activeSection = currentSection
      }
    },
    refreshSectionOffsets() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.merchant-detail-scroll').boundingClientRect()
      query.selectAll('.merchant-detail-section').boundingClientRect()
      query.exec(([scrollRect, sectionRects]) => {
        if (!scrollRect || !Array.isArray(sectionRects) || !sectionRects.length) {
          return
        }

        this.sectionOffsets = sectionRects
          .map((rect, index) => ({
            id: this.sections[index]?.id,
            top: Math.max(0, Math.round(rect.top - scrollRect.top))
          }))
          .filter((item) => item.id)
      })
    },
    handleOpportunityAction() {
      // COMPLIANCE-FOLLOWUP: 真实接入 view_policy / recommended_script / marketing_poster / submit_record 前，所有话术/海报文案必须由 HZYCompliance 终审后再发版；本期 toast 仅作占位。
      uni.showToast({
        title: '该功能即将上线',
        icon: 'none'
      })
    },
    goDynamics() {
      uni.navigateTo({
        url: `/pages/merchant-dynamics/merchant-dynamics?merchantId=${encodeURIComponent(this.merchant.merchant_id)}`
      })
    },
    openQuotaModal() {
      this.quotaModalVisible = true
    },
    closeQuotaModal() {
      this.quotaModalVisible = false
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        fail: () => {
          uni.showToast({ title: '未获取相机权限，请在系统设置中开启后重试', icon: 'none' })
        }
      })
    },
    confirmCall() {
      if (this.calling) {
        return
      }

      uni.showModal({
        title: '拨打电话',
        content: this.merchant.contact_phone,
        success: async (result) => {
          if (!result.confirm) {
            return
          }

          this.calling = true
          uni.showLoading({ title: '拨号中' })
          let callFailed = false
          try {
            await dialMerchant(this.merchant.merchant_id)
          } catch (error) {
            callFailed = true
          } finally {
            this.calling = false
            uni.hideLoading()
          }

          if (callFailed) {
            uni.showToast({ title: '拨号未成功，请稍后再试或手动拨打', icon: 'none' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.merchant-detail-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  padding: var(--space-24);
  background: var(--bg-color);
  color: var(--text-color-primary);
  font-size: var(--font-body);
}

.merchant-detail-page__loading,
.merchant-detail-page__error {
  min-height: 420rpx;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
  position: relative;
  overflow: hidden;
}

.merchant-detail-page__loading::before,
.merchant-detail-page__loading::after {
  content: '';
  position: absolute;
  left: var(--space-32);
  right: var(--space-32);
  border-radius: var(--radius-sm);
  background: var(--color-secondary);
}

.merchant-detail-page__loading::before {
  top: var(--space-40);
  height: 44rpx;
}

.merchant-detail-page__loading::after {
  top: 116rpx;
  height: 220rpx;
}

.merchant-detail-page__error {
  border: 2rpx solid var(--border-color);
}

.merchant-detail-page__error::before {
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

.merchant-detail-card {
  box-sizing: border-box;
  border-radius: var(--radius-lg);
  padding: var(--space-32);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
  border: 2rpx solid var(--border-color);
}

.merchant-detail-card--summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-12);
}

.merchant-detail-card__title {
  width: 100%;
  font-size: var(--font-title);
  line-height: 1.35;
  font-weight: 700;
  color: var(--text-color-primary);
  word-break: break-all;
  overflow-wrap: anywhere;
}

.merchant-detail-card__meta {
  display: inline-flex;
  align-items: center;
  min-height: 44rpx;
  padding: 0 var(--space-16);
  border-radius: 999rpx;
  background: var(--color-secondary);
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 1.3;
}

.merchant-detail-card__meta--status-unqualified {
  background: var(--status-not-qualified-bg);
  color: var(--status-not-qualified-gray);
  border: 2rpx solid var(--status-not-qualified-blue);
}

.merchant-detail-card__meta--status-qualified {
  background: var(--status-qualified-bg);
  color: var(--status-qualified-green);
  border: 2rpx solid var(--status-qualified-blue);
}

.merchant-detail-card__meta--status-active {
  background: var(--status-active-bg);
  color: var(--status-active-green);
  border: 2rpx solid var(--status-active-green);
}

.merchant-detail-tabs {
  display: flex;
  gap: var(--space-8);
  margin: var(--space-24) calc(var(--space-24) * -1) 0;
  padding: 0 var(--space-24) var(--space-16);
  overflow-x: auto;
  white-space: nowrap;
}

.merchant-detail-tabs__item {
  flex: 0 0 auto;
  min-width: 112rpx;
  min-height: 56rpx;
  margin: 0;
  padding: 0 var(--space-16);
  border: 2rpx solid var(--border-color);
  border-radius: 999rpx;
  background: var(--bg-surface);
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 56rpx;
}

.merchant-detail-tabs__item::after,
.merchant-opportunity__action::after,
.merchant-detail-actions__item::after,
.quota-modal__close::after {
  border: 0;
}

.merchant-detail-tabs__item--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-weight: 600;
}

.merchant-detail-scroll {
  flex: 1;
  min-height: 0;
  height: calc(100vh - 246rpx);
}

.merchant-detail-section {
  box-sizing: border-box;
  margin-bottom: var(--space-24);
  padding: var(--space-24);
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-card);
}

.merchant-detail-section__title {
  margin-bottom: var(--space-16);
  color: var(--text-color-primary);
  font-size: var(--font-title);
  line-height: 1.35;
  font-weight: 700;
}

.merchant-detail-field {
  padding: var(--space-16) 0;
  border-bottom: 2rpx solid var(--border-color);
}

.merchant-detail-field:last-child {
  border-bottom: 0;
}

.merchant-detail-field__label {
  display: block;
  min-width: 0;
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 1.45;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.merchant-detail-field__value {
  display: block;
  min-width: 0;
  margin-top: var(--space-8);
  color: var(--text-color-primary);
  font-size: var(--font-body);
  line-height: 1.45;
  font-weight: 600;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.merchant-opportunity {
  padding: var(--space-24) 0;
  border-bottom: 2rpx solid var(--border-color);
}

.merchant-opportunity:last-child {
  padding-bottom: 0;
  border-bottom: 0;
}

.merchant-opportunity__index {
  display: inline-flex;
  align-items: center;
  min-height: 40rpx;
  padding: 0 var(--space-12);
  border-radius: 999rpx;
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  font-size: var(--font-micro);
  line-height: 1.3;
}

.merchant-opportunity__type {
  margin-top: var(--space-12);
  color: var(--text-color-primary);
  font-size: var(--font-body);
  line-height: 1.45;
  font-weight: 700;
}

.merchant-opportunity__desc,
.merchant-opportunity__date {
  margin-top: var(--space-8);
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.merchant-opportunity__actions,
.merchant-detail-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-12);
  margin-top: var(--space-16);
}

.merchant-opportunity__action,
.merchant-detail-actions__item,
.quota-modal__close {
  min-height: 72rpx;
  margin: 0;
  padding: 0 var(--space-12);
  border-radius: var(--radius-md);
  background: var(--bg-surface-muted);
  color: var(--text-color-primary);
  border: 2rpx solid var(--border-color);
  font-size: var(--font-caption);
  line-height: 72rpx;
  text-align: center;
}

.merchant-detail-actions__item {
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  border-color: var(--color-primary);
  font-weight: 600;
}

.quota-modal {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-sizing: border-box;
  padding: var(--space-24);
  background: var(--bg-overlay);
}

.quota-modal__panel {
  width: 100%;
  max-height: 86vh;
  box-sizing: border-box;
  padding: var(--space-24);
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  box-shadow: var(--shadow-modal);
  overflow: auto;
}

.quota-modal__title {
  color: var(--text-color-primary);
  font-size: var(--font-title);
  line-height: 1.35;
  font-weight: 700;
}

.quota-modal__current {
  margin: var(--space-12) 0 var(--space-16);
  color: var(--text-color-secondary);
  font-size: var(--font-caption);
  line-height: 1.45;
}

.quota-modal__row {
  display: grid;
  grid-template-columns: 1.02fr 1.18fr 1.12fr 0.88fr;
  gap: var(--space-8);
  align-items: center;
  min-height: 86rpx;
  box-sizing: border-box;
  padding: var(--space-12);
  border: 2rpx solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-surface-muted);
}

.quota-modal__row + .quota-modal__row {
  margin-top: var(--space-8);
}

.quota-modal__row--active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.quota-modal__cell {
  min-width: 0;
  color: var(--text-color-primary);
  font-size: var(--font-micro);
  line-height: 1.35;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.quota-modal__row--active .quota-modal__cell {
  color: var(--color-primary-strong);
  font-weight: 600;
}

.quota-modal__close {
  width: 100%;
  margin-top: var(--space-24);
  background: var(--color-primary);
  color: var(--text-color-inverse);
  border-color: var(--color-primary);
  font-size: var(--font-body);
  font-weight: 700;
}

@media screen and (max-width: 380px) {
  .merchant-detail-page {
    padding: var(--space-16);
  }

  .merchant-detail-tabs {
    margin-right: calc(var(--space-16) * -1);
    margin-left: calc(var(--space-16) * -1);
    padding-right: var(--space-16);
    padding-left: var(--space-16);
  }

  .merchant-detail-section,
  .merchant-detail-card,
  .quota-modal__panel {
    padding: var(--space-16);
  }

  .merchant-opportunity__actions,
  .merchant-detail-actions {
    gap: var(--space-8);
  }

  .quota-modal__row {
    grid-template-columns: 1fr 1.16fr 1fr 0.86fr;
    gap: var(--space-4);
    padding: var(--space-8);
  }
}
</style>
