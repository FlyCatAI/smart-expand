<template>
  <view class="merchant-detail-page">
    <view v-if="loading" class="merchant-detail-page__loading"></view>
    <view v-else-if="loadFailed" class="merchant-detail-page__error"></view>
    <template v-else-if="merchant">
      <view class="merchant-detail-card merchant-detail-card--summary">
        <view class="merchant-detail-card__title">{{ merchant.merchant_name }}</view>
        <view class="merchant-detail-card__meta">{{ merchant.status }}</view>
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

      <view v-if="quotaModalState !== modalStates.CLOSED" class="quota-modal">
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
import { fetchMerchantDetail } from '../../services/merchantService.js'
import { formatWanAmount } from '../../utils/money.js'
import { buildQuotaRows } from '../../utils/subsidyTiers.js'

const MODAL_STATES = {
  CLOSED: 'closed',
  OPENING: 'opening',
  OPEN: 'open',
  CLOSING: 'closing'
}

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
      quotaModalState: MODAL_STATES.CLOSED,
      modalStates: MODAL_STATES,
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
      // PRD §4.7 原文为“月目均额达标准”，待 HZYCompliance 终判是否改为“月日均额达标准”。
      return '月目均额达标准'
    }
  },
  onLoad(options = {}) {
    this.merchantId = options.merchantId || DEFAULT_MERCHANT_ID
    this.loadMerchantDetail()
  },
  methods: {
    async loadMerchantDetail() {
      this.loading = true
      this.loadFailed = false

      try {
        const merchant = await fetchMerchantDetail(this.merchantId)
        this.merchant = merchant
      } catch (error) {
        this.loadFailed = true
        // TODO(HZYMiniAppStyle/HZYCompliance): 补齐异常态展示文案。
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
    handleOpportunityAction() {
      uni.showToast({
        title: '该功能即将上线',
        icon: 'none'
      })
    },
    goDynamics() {
      uni.navigateTo({
        url: `/pages/merchant-dynamics/merchant-dynamics?merchantId=${this.merchant.merchant_id}`
      })
    },
    openQuotaModal() {
      this.quotaModalState = MODAL_STATES.OPENING
      this.$nextTick(() => {
        this.quotaModalState = MODAL_STATES.OPEN
      })
    },
    closeQuotaModal() {
      this.quotaModalState = MODAL_STATES.CLOSING
      this.$nextTick(() => {
        this.quotaModalState = MODAL_STATES.CLOSED
      })
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sourceType: ['camera'],
        fail: () => {
          // TODO(HZYMiniAppStyle/HZYCompliance): 补齐相机拒绝/失败提示文案。
          uni.showToast({ title: '', icon: 'none' })
        }
      })
    },
    confirmCall() {
      uni.showModal({
        title: '拨打电话',
        content: this.merchant.contact_phone,
        success: (result) => {
          if (!result.confirm) {
            return
          }

          uni.makePhoneCall({
            phoneNumber: this.merchant.dial_phone,
            fail: () => {
              // TODO(HZYMiniAppStyle/HZYCompliance): 补齐拨号失败提示文案。
              uni.showToast({ title: '', icon: 'none' })
            }
          })
        }
      })
    }
  }
}
</script>
