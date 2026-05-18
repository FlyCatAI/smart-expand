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
