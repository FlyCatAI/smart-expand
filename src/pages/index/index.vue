<template>
  <view class="workbench-page">
    <view class="workbench-kpi">
      <view class="workbench-kpi__updated">{{ kpi.updated_at }}</view>
      <view
        v-for="card in kpiCards"
        :key="card.id"
        class="workbench-kpi__card"
        @click="handleKpiClick(card)"
      >
        <view class="workbench-kpi__label">{{ card.title }}</view>
        <view class="workbench-kpi__value">{{ card.value }}</view>
        <view :class="['workbench-kpi__delta', card.deltaClass]">{{ card.deltaText }}</view>
      </view>
    </view>

    <view
      v-if="notificationVisible && notification"
      class="workbench-notice"
      @click="handleNotificationClick"
    >
      <view class="workbench-notice__type">{{ notification.notification_type }}</view>
      <view class="workbench-notice__title">{{ notification.notification_title }}</view>
      <button class="workbench-notice__close" @click.stop="closeNotification">关闭</button>
    </view>

    <scroll-view class="workbench-actions" scroll-x>
      <button
        v-for="button in quickButtons"
        :key="button.button_id"
        :class="getQuickButtonClass(button)"
        @click="handleQuickButton(button)"
      >
        {{ button.button_name }}
        <text v-if="button.button_id === 'filter_advanced' && filterActiveCount" class="workbench-actions__badge">
          {{ filterActiveCount }}
        </text>
      </button>
    </scroll-view>

    <view v-if="queryExpanded" class="workbench-search">
      <input
        :value="queryText"
        class="workbench-search__input"
        confirm-type="search"
        @input="handleQueryInput"
        @confirm="applyQuery"
      />
      <button class="workbench-search__clear" @click="clearQuery">清除</button>
    </view>

    <view v-if="filterModalVisible" class="workbench-filter">
      <view class="workbench-filter__section">
        <view class="workbench-filter__title">准入状态</view>
        <button
          v-for="option in filterOptions.status"
          :key="option.value"
          :class="getFilterTagClass('status', option.value)"
          @click="toggleMultiFilter('status', option.value)"
        >
          {{ option.label }}{{ option.value === 'all' ? `(${totalMerchantCount})` : `(${getOptionCount('status', option.value)})` }}
        </button>
      </view>

      <view class="workbench-filter__section">
        <view class="workbench-filter__title">经营类型</view>
        <button
          v-for="option in filterOptions.type"
          :key="option.value"
          :class="getFilterTagClass('type', option.value)"
          @click="toggleMultiFilter('type', option.value)"
        >
          {{ option.label }}{{ option.value === 'all' ? '' : `(${getOptionCount('type', option.value)})` }}
        </button>
      </view>

      <view class="workbench-filter__section">
        <view class="workbench-filter__title">进度</view>
        <button
          v-for="option in filterOptions.progress"
          :key="option.value"
          :class="getFilterTagClass('progress', option.value)"
          @click="toggleMultiFilter('progress', option.value)"
        >
          {{ option.label }}{{ option.value === 'all' ? `(${totalMerchantCount})` : `(${getOptionCount('progress', option.value)})` }}
        </button>
      </view>

      <view class="workbench-filter__section">
        <view class="workbench-filter__title">合作机构</view>
        <button
          v-for="option in filterOptions.partner"
          :key="option.value"
          :class="getPartnerClass(option.value)"
          @click="setPartnerFilter(option.value)"
        >
          {{ option.label }}
        </button>
      </view>

      <view class="workbench-filter__section">
        <view class="workbench-filter__title">入网时间</view>
        <picker mode="date" :value="advancedFilters.entryStart" @change="handleDateChange('entryStart', $event)">
          <view class="workbench-filter__date">{{ advancedFilters.entryStart || '开始日期' }}</view>
        </picker>
        <picker mode="date" :value="advancedFilters.entryEnd" @change="handleDateChange('entryEnd', $event)">
          <view class="workbench-filter__date">{{ advancedFilters.entryEnd || '结束日期' }}</view>
        </picker>
      </view>

      <view class="workbench-filter__section">
        <view class="workbench-filter__title">区域</view>
        <picker
          :range="regionProvinceOptions"
          :value="regionProvinceIndex"
          @change="handleRegionChange('province', $event)"
        >
          <view class="workbench-filter__region">{{ advancedFilters.region.province || '请选择' }}</view>
        </picker>
        <picker
          :range="regionCityOptions"
          :value="regionCityIndex"
          @change="handleRegionChange('city', $event)"
        >
          <view class="workbench-filter__region">{{ advancedFilters.region.city || '请选择' }}</view>
        </picker>
        <picker
          :range="regionDistrictOptions"
          :value="regionDistrictIndex"
          @change="handleRegionChange('district', $event)"
        >
          <view class="workbench-filter__region">{{ advancedFilters.region.district || '请选择' }}</view>
        </picker>
        <picker
          :range="regionBranchOptions"
          :value="regionBranchIndex"
          @change="handleRegionChange('branch', $event)"
        >
          <view class="workbench-filter__region">{{ advancedFilters.region.branch || '请选择' }}</view>
        </picker>
      </view>

      <view class="workbench-filter__actions">
        <button class="workbench-filter__reset" @click="resetAdvancedFilters">重置</button>
        <button class="workbench-filter__apply" @click="applyAdvancedFilters">应用筛选</button>
        <button class="workbench-filter__close" @click="closeFilterModal">关闭</button>
      </view>
    </view>

    <view class="workbench-list">
      <view
        v-for="merchant in visibleMerchants"
        :key="merchant.merchant_id"
        class="workbench-merchant"
      >
        <view class="workbench-merchant__heading" @click="handleMerchantClick(merchant)">
          {{ merchant.merchant_name }}
        </view>
        <view class="workbench-merchant__manager">{{ merchant.manager_name }}</view>
        <view class="workbench-merchant__meta">{{ merchant.expand_type }} · {{ merchant.entry_date }} · {{ merchant.distance_km.toFixed(1) }} km</view>
        <view class="workbench-merchant__status">{{ merchant.status }}</view>
        <view class="workbench-merchant__aum">{{ merchant.aum_level }}</view>
        <view v-if="getMarketingTags(merchant).length" class="workbench-merchant__tags">
          <text v-for="tag in getMarketingTags(merchant)" :key="tag" class="workbench-merchant__tag">{{ tag }}</text>
        </view>
        <view v-if="merchant.partner_org" class="workbench-merchant__partner">{{ merchant.partner_org }}</view>
      </view>

      <view v-if="!loading && !visibleMerchants.length" class="workbench-list__empty">
        暂无商户数据
      </view>
      <view v-if="loading" class="workbench-list__loading"></view>
      <view v-if="requestState.failed" class="workbench-list__error"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

const PAGE_SIZE = 20
const REQUEST_TIMEOUT_MS = 8000
const NOTICE_SESSION_KEY = 'hzy_workbench_notice_closed'
let noticeClosedInRuntime = false

const quickButtons = [
  { button_id: 'new_entry', button_name: '新入网', button_action: 'toast' },
  { button_id: 'merchant_dedup', button_name: '商户查重', button_action: 'toast' },
  { button_id: 'ranking', button_name: '排行榜', button_action: 'toast' },
  { button_id: 'first_followup', button_name: '首期二访', button_action: 'filter_list' },
  { button_id: 'potential_active', button_name: '潜力有效', button_action: 'filter_list' },
  { button_id: 'high_subsidy_visit', button_name: '高补贴回访', button_action: 'filter_list' },
  { button_id: 'query', button_name: '查询', button_action: 'expand_input' },
  { button_id: 'opportunity', button_name: '商机', button_action: 'sort_list' },
  { button_id: 'subsidy', button_name: '补贴', button_action: 'sort_list' },
  { button_id: 'transaction', button_name: '流水', button_action: 'sort_list' },
  { button_id: 'filter_advanced', button_name: '筛选', button_action: 'modal' }
]

const filterOptions = {
  status: [
    { label: '全部', value: 'all' },
    { label: '准入成功', value: '准入成功' },
    { label: '准入失败', value: '准入失败' },
    { label: '已补贴', value: '已补贴' },
    { label: '无补贴', value: '无补贴' }
  ],
  type: [
    { label: '全部', value: 'all' },
    { label: '正餐餐饮', value: '正餐餐饮' },
    { label: '饮品甜点', value: '饮品甜点' },
    { label: '商超购物', value: '商超购物' },
    { label: '社区便利', value: '社区便利' },
    { label: '美容美发', value: '美容美发' },
    { label: '医疗保健', value: '医疗保健' }
  ],
  progress: [
    { label: '全部', value: 'all' },
    { label: '已达标', value: '已达标' },
    { label: '已有效', value: '已有效' },
    { label: '未达标', value: '未达标' },
    { label: '未有效', value: '未有效' }
  ],
  partner: [
    { label: '全部', value: 'all' },
    { label: '是', value: 'yes' },
    { label: '否', value: 'no' }
  ]
}

const regionTree = [
  {
    name: '浙江省',
    cities: [
      {
        name: '杭州市',
        districts: [
          { name: '西湖区', branches: ['测试网点一', '测试网点二'] },
          { name: '拱墅区', branches: ['测试网点三'] }
        ]
      },
      {
        name: '宁波市',
        districts: [
          { name: '鄞州区', branches: ['测试网点四'] }
        ]
      }
    ]
  },
  {
    name: '江苏省',
    cities: [
      {
        name: '南京市',
        districts: [
          { name: '建邺区', branches: ['测试网点五'] }
        ]
      }
    ]
  }
]

const kpi = reactive({
  income_amount: 0,
  income_delta: 0,
  entry_count: 0,
  entry_delta: 0,
  qualified_count: 0,
  qualified_delta: 0,
  active_count: 0,
  active_delta: 0,
  active_threshold: 50,
  updated_at: ''
})
const notification = ref(null)
const notificationVisible = ref(false)
const merchants = ref([])
const loading = ref(false)
const requestState = reactive({
  failed: false,
  errorType: ''
})

const queryExpanded = ref(false)
const queryText = ref('')
const activeControl = ref('')
const activeActionFilter = ref('')
const activeSort = ref('')
const filterModalVisible = ref(false)
const currentPage = ref(1)

const advancedFilters = reactive(createEmptyAdvancedFilters())

const kpiCards = computed(() => [
  {
    id: 'income_amount',
    title: '本月收入',
    value: formatWanAmount(kpi.income_amount),
    deltaText: formatWanDelta(kpi.income_delta),
    deltaClass: getDeltaClass(kpi.income_delta),
    route: '/income-details'
  },
  {
    id: 'entry_count',
    title: '本月入网',
    value: formatInteger(kpi.entry_count),
    deltaText: formatIntegerDelta(kpi.entry_delta),
    deltaClass: getDeltaClass(kpi.entry_delta),
    route: '/history-performance'
  },
  {
    id: 'qualified_count',
    title: '本月达标',
    value: formatInteger(kpi.qualified_count),
    deltaText: formatIntegerDelta(kpi.qualified_delta),
    deltaClass: getDeltaClass(kpi.qualified_delta),
    route: '/history-performance'
  },
  {
    id: 'active_count',
    title: '本月有效',
    value: `${formatInteger(kpi.active_count)}/${formatInteger(kpi.active_threshold)}`,
    deltaText: formatIntegerDelta(kpi.active_delta),
    deltaClass: getDeltaClass(kpi.active_delta),
    route: '/history-performance'
  }
])

const totalMerchantCount = computed(() => merchants.value.length)

const filteredMerchants = computed(() => {
  const keyword = queryText.value.trim()
  return merchants.value.filter((merchant) => {
    const marketingTags = getMarketingTags(merchant)
    if (activeActionFilter.value === 'first_followup' && !marketingTags.includes('首期二访')) {
      return false
    }
    if (activeActionFilter.value === 'high_subsidy_visit' && !marketingTags.includes('高补贴')) {
      return false
    }
    if (keyword && !merchant.merchant_name.includes(keyword)) {
      return false
    }
    if (advancedFilters.status.length && !advancedFilters.status.includes(merchant.admission_status)) {
      return false
    }
    if (advancedFilters.type.length && !advancedFilters.type.includes(merchant.merchant_type)) {
      return false
    }
    if (advancedFilters.progress.length && !advancedFilters.progress.includes(merchant.status)) {
      return false
    }
    if (advancedFilters.partner === 'yes' && !merchant.partner_org) {
      return false
    }
    if (advancedFilters.partner === 'no' && merchant.partner_org) {
      return false
    }
    if (advancedFilters.entryStart && merchant.entry_date < advancedFilters.entryStart) {
      return false
    }
    if (advancedFilters.entryEnd && merchant.entry_date > advancedFilters.entryEnd) {
      return false
    }
    return matchesRegionFilter(merchant)
  })
})

const sortedMerchants = computed(() => {
  const list = [...filteredMerchants.value]
  if (activeSort.value === 'opportunity') {
    return list.sort((a, b) => compareNullableText(a.opportunity_date, b.opportunity_date, 'asc'))
  }
  // 补贴/流水排序仅用于当前 mock 列表展示顺序，不改变真实资金口径，不引入资金计算、佣金公式或费率逻辑。
  if (activeSort.value === 'subsidy') {
    return list.sort((a, b) => compareNumber(b.subsidy_amount, a.subsidy_amount))
  }
  if (activeSort.value === 'transaction') {
    return list.sort((a, b) => compareNumber(b.transaction_amount, a.transaction_amount))
  }
  return list.sort((a, b) => compareNullableText(a.entry_date, b.entry_date, 'desc'))
})

const visibleMerchants = computed(() => sortedMerchants.value.slice(0, currentPage.value * PAGE_SIZE))
const hasMore = computed(() => visibleMerchants.value.length < sortedMerchants.value.length)

const filterActiveCount = computed(() => {
  let count = 0
  if (advancedFilters.status.length) count += 1
  if (advancedFilters.type.length) count += 1
  if (advancedFilters.progress.length) count += 1
  if (advancedFilters.partner !== 'all') count += 1
  if (advancedFilters.entryStart || advancedFilters.entryEnd) count += 1
  if (advancedFilters.region.province || advancedFilters.region.city || advancedFilters.region.district || advancedFilters.region.branch) count += 1
  return count
})

const regionProvinceOptions = computed(() => ['请选择', ...regionTree.map((province) => province.name)])
const selectedProvince = computed(() => regionTree.find((province) => province.name === advancedFilters.region.province))
const regionCityOptions = computed(() => ['请选择', ...(selectedProvince.value?.cities.map((city) => city.name) || [])])
const selectedCity = computed(() => selectedProvince.value?.cities.find((city) => city.name === advancedFilters.region.city))
const regionDistrictOptions = computed(() => ['请选择', ...(selectedCity.value?.districts.map((district) => district.name) || [])])
const selectedDistrict = computed(() => selectedCity.value?.districts.find((district) => district.name === advancedFilters.region.district))
const regionBranchOptions = computed(() => ['请选择', ...(selectedDistrict.value?.branches || [])])
const regionProvinceIndex = computed(() => Math.max(0, regionProvinceOptions.value.indexOf(advancedFilters.region.province)))
const regionCityIndex = computed(() => Math.max(0, regionCityOptions.value.indexOf(advancedFilters.region.city)))
const regionDistrictIndex = computed(() => Math.max(0, regionDistrictOptions.value.indexOf(advancedFilters.region.district)))
const regionBranchIndex = computed(() => Math.max(0, regionBranchOptions.value.indexOf(advancedFilters.region.branch)))

onLoad(() => {
  notificationVisible.value = !isNoticeClosedForSession()
  loadHomeData()
})

onPullDownRefresh(async () => {
  try {
    await loadHomeData({ refresh: true })
  } finally {
    uni.stopPullDownRefresh()
  }
})

onReachBottom(() => {
  loadMoreMerchants()
})

async function loadHomeData() {
  loading.value = true
  requestState.failed = false
  requestState.errorType = ''
  try {
    const data = await withTimeout(requestHomeWorkbench(), REQUEST_TIMEOUT_MS)
    Object.assign(kpi, data.kpi)
    notification.value = data.notification
    merchants.value = data.merchants
    currentPage.value = 1
  } catch (error) {
    requestState.failed = true
    requestState.errorType = normalizeRequestError(error)
    // TODO(HZYMiniAppStyle): 网络异常/超时/500 fallback 展示文案由样式与合规接力补齐。
  } finally {
    loading.value = false
  }
}

function requestHomeWorkbench() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        kpi: {
          income_amount: 28.56,
          income_delta: 0.82,
          entry_count: 45,
          entry_delta: 3,
          qualified_count: 38,
          qualified_delta: 5,
          active_count: 42,
          active_delta: 1,
          active_threshold: 50,
          updated_at: '2026-05-19 09:30'
        },
        notification: {
          notification_title: '网点动态更新',
          notification_type: '网点动态',
          notification_url: ''
        },
        merchants: createMockMerchants(48)
      })
    }, 120)
  })
}

function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), timeout)
    })
  ])
}

function normalizeRequestError(error) {
  if (error?.message === 'REQUEST_TIMEOUT') {
    return 'timeout'
  }
  if (error?.statusCode >= 500) {
    return 'server'
  }
  return 'network'
}

function handleKpiClick(card) {
  navigateByPrdRoute(card.route)
}

function handleNotificationClick() {
  if (!notification.value?.notification_url) {
    return
  }
  navigateByPrdRoute(notification.value.notification_url)
}

function closeNotification() {
  notificationVisible.value = false
  closeNoticeForSession()
}

function handleQuickButton(button) {
  if (button.button_action === 'toast') {
    showToast('功能开发中，即将上线')
    return
  }
  if (button.button_action === 'filter_list') {
    handleActionFilter(button.button_id)
    return
  }
  if (button.button_action === 'expand_input') {
    toggleQuery()
    return
  }
  if (button.button_action === 'sort_list') {
    toggleSort(button.button_id)
    return
  }
  if (button.button_action === 'modal') {
    filterModalVisible.value = true
  }
}

function handleActionFilter(buttonId) {
  if (buttonId === 'potential_active') {
    resetAllListControls()
    return
  }
  activeActionFilter.value = activeActionFilter.value === buttonId ? '' : buttonId
  resetPagination()
}

function toggleQuery() {
  queryExpanded.value = !queryExpanded.value
  activeControl.value = queryExpanded.value ? 'query' : ''
  if (!queryExpanded.value) {
    queryText.value = ''
    showToast('收起')
  } else {
    showToast('展开搜索框')
  }
  activeSort.value = ''
  resetPagination()
}

function handleQueryInput(event) {
  queryText.value = event.detail.value
  resetPagination()
}

function applyQuery() {
  resetPagination()
}

function clearQuery() {
  queryText.value = ''
  resetPagination()
}

function toggleSort(buttonId) {
  queryExpanded.value = false
  queryText.value = ''
  activeControl.value = buttonId
  if (activeSort.value === buttonId) {
    activeSort.value = ''
    activeControl.value = ''
    showToast('已取消排序')
  } else {
    activeSort.value = buttonId
    showToast(getSortToast(buttonId))
  }
  resetPagination()
}

function getSortToast(buttonId) {
  const toastMap = {
    opportunity: '按商机时间从早到晚排序',
    subsidy: '按补贴金额从高到低排序',
    transaction: '按流水金额从高到低排序'
  }
  return toastMap[buttonId] || ''
}

function getQuickButtonClass(button) {
  const classes = ['workbench-actions__button']
  if (button.button_id === activeActionFilter.value) {
    classes.push('workbench-actions__button--active')
  }
  if (['query', 'opportunity', 'subsidy', 'transaction'].includes(button.button_id) && activeControl.value === button.button_id) {
    classes.push('border-2', 'border-primary')
  }
  return classes
}

function getFilterTagClass(group, value) {
  const selected = value === 'all'
    ? !advancedFilters[group].length
    : advancedFilters[group].includes(value)
  return ['workbench-filter__tag', selected ? 'workbench-filter__tag--active' : '']
}

function getPartnerClass(value) {
  return ['workbench-filter__tag', advancedFilters.partner === value ? 'workbench-filter__tag--active' : '']
}

function toggleMultiFilter(group, value) {
  if (value === 'all') {
    advancedFilters[group] = []
    return
  }
  const next = new Set(advancedFilters[group])
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  advancedFilters[group] = [...next]
}

function setPartnerFilter(value) {
  advancedFilters.partner = value
}

function handleDateChange(field, event) {
  const value = event.detail.value
  if (field === 'entryEnd' && advancedFilters.entryStart && value < advancedFilters.entryStart) {
    // TODO(HZYMiniAppStyle): 结束日期早于开始日期的提示文案由样式与合规接力补齐。
    advancedFilters.entryEnd = ''
    return
  }
  if (field === 'entryStart' && advancedFilters.entryEnd && advancedFilters.entryEnd < value) {
    advancedFilters.entryEnd = ''
  }
  advancedFilters[field] = value
}

function handleRegionChange(level, event) {
  const index = Number(event.detail.value)
  if (level === 'province') {
    advancedFilters.region.province = regionProvinceOptions.value[index] === '请选择' ? '' : regionProvinceOptions.value[index]
    advancedFilters.region.city = ''
    advancedFilters.region.district = ''
    advancedFilters.region.branch = ''
  }
  if (level === 'city') {
    advancedFilters.region.city = regionCityOptions.value[index] === '请选择' ? '' : regionCityOptions.value[index]
    advancedFilters.region.district = ''
    advancedFilters.region.branch = ''
  }
  if (level === 'district') {
    advancedFilters.region.district = regionDistrictOptions.value[index] === '请选择' ? '' : regionDistrictOptions.value[index]
    advancedFilters.region.branch = ''
  }
  if (level === 'branch') {
    advancedFilters.region.branch = regionBranchOptions.value[index] === '请选择' ? '' : regionBranchOptions.value[index]
  }
}

function resetAdvancedFilters() {
  Object.assign(advancedFilters, createEmptyAdvancedFilters())
  resetPagination()
}

function applyAdvancedFilters() {
  filterModalVisible.value = false
  resetPagination()
}

function closeFilterModal() {
  filterModalVisible.value = false
}

function resetAllListControls() {
  activeActionFilter.value = ''
  activeSort.value = ''
  activeControl.value = ''
  queryExpanded.value = false
  queryText.value = ''
  resetAdvancedFilters()
}

function loadMoreMerchants() {
  if (loading.value || !hasMore.value) {
    return
  }
  currentPage.value += 1
}

function resetPagination() {
  currentPage.value = 1
}

function handleMerchantClick(merchant) {
  navigateByPrdRoute('/merchant-detail', { merchant_id: merchant.merchant_id })
}

function navigateByPrdRoute(route, params = {}) {
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  const url = query ? `${route}?${query}` : route
  uni.navigateTo({
    url,
    fail: (error) => {
      console.warn('navigateTo failed', { url, error })
      showToast('页面跳转失败')
    }
  })
}

function isNoticeClosedForSession() {
  const storage = getH5SessionStorage()
  if (storage) {
    return storage.getItem(NOTICE_SESSION_KEY) === '1'
  }
  return noticeClosedInRuntime
}

function closeNoticeForSession() {
  const storage = getH5SessionStorage()
  if (storage) {
    storage.setItem(NOTICE_SESSION_KEY, '1')
    return
  }
  noticeClosedInRuntime = true
}

function getH5SessionStorage() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }
  return window.sessionStorage
}

function showToast(title) {
  if (!title) return
  uni.showToast({
    title,
    icon: 'none'
  })
}

function formatWanAmount(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '—'
  }
  return `¥${number.toFixed(2)}万`
}

function formatWanDelta(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '—'
  }
  if (number === 0) {
    return '¥0.00万'
  }
  const sign = number > 0 ? '+' : '-'
  return `${sign}¥${Math.abs(number).toFixed(2)}万`
}

function formatInteger(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return '0'
  }
  return String(Math.trunc(number))
}

function formatIntegerDelta(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number === 0) {
    return '0'
  }
  const sign = number > 0 ? '+' : '-'
  return `${sign}${Math.abs(Math.trunc(number))}`
}

function getDeltaClass(value) {
  const number = Number(value)
  if (!Number.isFinite(number) || number === 0) {
    return 'text-on-surface-variant'
  }
  return number > 0 ? 'text-green-600' : 'text-red-500'
}

function getOptionCount(group, value) {
  return merchants.value.filter((merchant) => {
    if (group === 'status') return merchant.admission_status === value
    if (group === 'type') return merchant.merchant_type === value
    if (group === 'progress') return merchant.status === value
    return false
  }).length
}

function getMarketingTags(merchant) {
  return Array.isArray(merchant?.marketing_tags) ? merchant.marketing_tags : []
}

function matchesRegionFilter(merchant) {
  const region = advancedFilters.region
  if (region.province && merchant.region.province !== region.province) return false
  if (region.city && merchant.region.city !== region.city) return false
  if (region.district && merchant.region.district !== region.district) return false
  if (region.branch && merchant.region.branch !== region.branch) return false
  return true
}

function compareNullableText(left, right, direction) {
  if (!left && !right) return 0
  if (!left) return 1
  if (!right) return -1
  return direction === 'asc' ? left.localeCompare(right) : right.localeCompare(left)
}

function compareNumber(left, right) {
  const normalizedLeft = Number.isFinite(Number(left)) ? Number(left) : -Infinity
  const normalizedRight = Number.isFinite(Number(right)) ? Number(right) : -Infinity
  return normalizedLeft - normalizedRight
}

function createEmptyAdvancedFilters() {
  return {
    status: [],
    type: [],
    progress: [],
    partner: 'all',
    entryStart: '',
    entryEnd: '',
    region: {
      province: '',
      city: '',
      district: '',
      branch: ''
    }
  }
}

function createMockMerchants(count) {
  const statuses = ['未达标', '已达标', '已有效']
  const admissionStatuses = ['准入成功', '准入失败', '已补贴', '无补贴']
  const types = ['正餐餐饮', '饮品甜点', '商超购物', '社区便利', '美容美发', '医疗保健']
  const aumLevels = ['AUM 1万（含）-10万（不含）', 'AUM 10万（含）-100万（不含）', 'AUM 100万及以上']
  const tagGroups = [
    ['首期二访'],
    ['二访'],
    ['高补贴'],
    ['潜力有效'],
    ['首期二访', '高补贴'],
    []
  ]

  return Array.from({ length: count }, (_, index) => {
    const region = pickRegion(index)
    const sequence = index + 1
    return {
      merchant_id: `fake-merchant-${String(sequence).padStart(3, '0')}`,
      merchant_name: `测试商户${String(sequence).padStart(2, '0')}`,
      manager_name: `测试经理${(index % 5) + 1}`,
      expand_type: index % 3 === 0 ? '合作推荐' : '自拓',
      entry_date: `2026-05-${String(19 - (index % 19)).padStart(2, '0')}`,
      distance_km: Number(((index % 12) * 0.7 + 0.5).toFixed(1)),
      status: statuses[index % statuses.length],
      admission_status: admissionStatuses[index % admissionStatuses.length],
      merchant_type: types[index % types.length],
      aum_level: aumLevels[index % aumLevels.length],
      marketing_tags: tagGroups[index % tagGroups.length],
      partner_org: index % 4 === 0 ? `测试银行${index % 3 === 0 ? '合作推荐' : '自拓'}` : '',
      opportunity_date: `2026-05-${String((index % 19) + 1).padStart(2, '0')}`,
      subsidy_amount: index % 4 === 0 ? 0 : 1000 + index * 37,
      transaction_amount: 5000 + index * 420,
      region,
      list_rank: sequence
    }
  })
}

function pickRegion(index) {
  const province = regionTree[index % regionTree.length]
  const city = province.cities[index % province.cities.length]
  const district = city.districts[index % city.districts.length]
  return {
    province: province.name,
    city: city.name,
    district: district.name,
    branch: district.branches[index % district.branches.length]
  }
}
</script>

<style scoped>
.workbench-page {
  --color-primary: #003b99;
  --color-primary-container: #1a52bf;
  --color-secondary-container: #bfceff;
  --color-surface: #f7f9fc;
  --color-surface-container-low: #f2f4f7;
  --color-surface-container: #eceef1;
  --color-surface-container-high: #e6e8eb;
  --color-surface-container-lowest: #ffffff;
  --color-on-surface: #191c1e;
  --color-on-surface-variant: #434653;
  --color-outline: #737685;
  --color-outline-variant: #c3c6d5;
  --color-success: #1f7a3f;
  --color-error: #ba1a1a;
  --color-error-container: #ffdad6;
  --color-on-primary: #ffffff;
  --color-kpi-card: rgba(255, 255, 255, 0.12);
  --color-kpi-card-active: rgba(255, 255, 255, 0.18);
  --color-kpi-delta-surface: #ffffff;
  --color-shadow: rgba(25, 28, 30, 0.08);
  --color-shadow-strong: rgba(25, 28, 30, 0.16);
  --space-2xs: 6rpx;
  --space-xs: 10rpx;
  --space-sm: 16rpx;
  --space-md: 24rpx;
  --space-lg: 32rpx;
  --space-xl: 44rpx;
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --radius-xl: 32rpx;
  --font-size-2xs: 20rpx;
  --font-size-xs: 22rpx;
  --font-size-sm: 24rpx;
  --font-size-md: 28rpx;
  --font-size-lg: 32rpx;
  --font-size-xl: 38rpx;
  --line-tight: 1.18;
  --line-normal: 1.45;
  --duration-fast: 120ms;
  --duration-normal: 220ms;

  min-height: 100vh;
  box-sizing: border-box;
  padding: var(--space-lg) var(--space-md) calc(var(--space-xl) + env(safe-area-inset-bottom));
  color: var(--color-on-surface);
  background: var(--color-surface);
  font-size: var(--font-size-md);
  line-height: var(--line-normal);
}

@media (prefers-color-scheme: dark) {
  .workbench-page {
    --color-primary: #9fc0ff;
    --color-primary-container: #254f9f;
    --color-secondary-container: #2e3b5f;
    --color-surface: #101316;
    --color-surface-container-low: #171b20;
    --color-surface-container: #1d2228;
    --color-surface-container-high: #272d35;
    --color-surface-container-lowest: #14181d;
    --color-on-surface: #e3e6eb;
    --color-on-surface-variant: #c5c9d4;
    --color-outline: #9ba0ad;
    --color-outline-variant: #4b5260;
    --color-success: #70dc8f;
    --color-error: #ffb4ab;
    --color-error-container: #650008;
    --color-on-primary: #071833;
    --color-kpi-card: rgba(255, 255, 255, 0.16);
    --color-kpi-card-active: rgba(255, 255, 255, 0.24);
    --color-kpi-delta-surface: #101316;
    --color-shadow: rgba(0, 0, 0, 0.22);
    --color-shadow-strong: rgba(0, 0, 0, 0.34);
  }
}

.workbench-page,
.workbench-page * {
  box-sizing: border-box;
}

.workbench-page button {
  margin: 0;
  padding: 0;
  border: 0;
  color: inherit;
  background: transparent;
  font: inherit;
  line-height: inherit;
}

.workbench-page button::after {
  border: 0;
}

.workbench-kpi {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-xl);
  color: var(--color-on-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  box-shadow: 0 20rpx 48rpx var(--color-shadow-strong);
}

.workbench-kpi__updated {
  grid-column: 1 / -1;
  color: var(--color-on-primary);
  font-size: var(--font-size-xs);
  font-weight: 500;
  line-height: var(--line-tight);
  opacity: 0.78;
  text-align: right;
}

.workbench-kpi__card {
  min-width: 0;
  padding: var(--space-sm) var(--space-xs);
  border-radius: var(--radius-md);
  background: var(--color-kpi-card);
  transition: transform var(--duration-fast) ease, background-color var(--duration-fast) ease;
}

.workbench-kpi__card:active {
  transform: scale(0.97);
  background: var(--color-kpi-card-active);
}

.workbench-kpi__label {
  min-height: 52rpx;
  color: var(--color-on-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
  line-height: var(--line-tight);
  opacity: 0.82;
}

.workbench-kpi__value {
  margin-top: var(--space-xs);
  color: var(--color-on-primary);
  font-size: var(--font-size-lg);
  font-weight: 800;
  line-height: var(--line-tight);
  overflow-wrap: anywhere;
}

.workbench-kpi__delta {
  display: inline-flex;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: 999rpx;
  background: var(--color-kpi-delta-surface);
  margin-top: var(--space-2xs);
  font-size: var(--font-size-xs);
  font-weight: 700;
  line-height: var(--line-tight);
}

.workbench-kpi__delta.text-green-600 {
  color: var(--color-success);
}

.workbench-kpi__delta.text-red-500 {
  color: var(--color-error);
}

.workbench-kpi__delta.text-on-surface-variant {
  color: var(--color-on-surface-variant);
}

.workbench-notice {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: 1rpx solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  background: var(--color-surface-container-lowest);
  box-shadow: 0 12rpx 32rpx var(--color-shadow);
}

.workbench-notice__type {
  flex: 0 0 auto;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  background: var(--color-surface-container-low);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.workbench-notice__title {
  flex: 1;
  min-width: 0;
  color: var(--color-on-surface);
  font-size: var(--font-size-sm);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-notice__close {
  flex: 0 0 auto;
  min-height: 52rpx;
  padding: 0 var(--space-sm);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  background: var(--color-surface-container-low);
}

.workbench-actions {
  width: 100%;
  margin-top: var(--space-md);
  white-space: nowrap;
}

.workbench-actions__button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 136rpx;
  min-height: 72rpx;
  margin-right: var(--space-sm);
  padding: 0 var(--space-md);
  border: 1rpx solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-lowest);
  font-size: var(--font-size-sm);
  font-weight: 700;
  box-shadow: 0 8rpx 22rpx var(--color-shadow);
  transition: transform var(--duration-fast) ease, border-color var(--duration-fast) ease, background-color var(--duration-fast) ease;
}

.workbench-actions__button:active {
  transform: scale(0.96);
}

.workbench-actions__button--active,
.workbench-actions__button.border-2.border-primary {
  border-width: 2rpx;
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-surface-container);
}

.workbench-actions__badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 var(--space-2xs);
  border-radius: 999rpx;
  color: var(--color-on-primary);
  background: var(--color-error);
  font-size: var(--font-size-2xs);
  font-weight: 800;
  line-height: 32rpx;
  text-align: center;
}

.workbench-search {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding: var(--space-sm);
  border: 1rpx solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  background: var(--color-surface-container-lowest);
}

.workbench-search__input {
  flex: 1;
  min-width: 0;
  height: 72rpx;
  padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-on-surface);
  background: var(--color-surface-container-low);
  font-size: var(--font-size-md);
}

.workbench-search__clear {
  flex: 0 0 auto;
  min-height: 72rpx;
  padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  color: var(--color-primary);
  background: var(--color-surface-container);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.workbench-filter {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  max-height: 82vh;
  padding: var(--space-lg) var(--space-md) calc(var(--space-lg) + env(safe-area-inset-bottom));
  overflow-y: auto;
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  color: var(--color-on-surface);
  background: var(--color-surface-container-lowest);
  box-shadow: 0 -20rpx 56rpx var(--color-shadow-strong);
}

.workbench-filter__section {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  padding: var(--space-md) 0;
  border-bottom: 1rpx solid var(--color-outline-variant);
}

.workbench-filter__title {
  width: 100%;
  color: var(--color-on-surface);
  font-size: var(--font-size-md);
  font-weight: 800;
  line-height: var(--line-tight);
}

.workbench-filter__tag,
.workbench-filter__date,
.workbench-filter__region {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 64rpx;
  padding: 0 var(--space-md);
  border: 1rpx solid var(--color-outline);
  border-radius: var(--radius-md);
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-lowest);
  font-size: var(--font-size-sm);
  font-weight: 650;
}

.workbench-filter__tag--active {
  border-color: var(--color-primary);
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.workbench-filter__date,
.workbench-filter__region {
  min-width: 184rpx;
  justify-content: flex-start;
  color: var(--color-on-surface);
  background: var(--color-surface-container-low);
}

.workbench-filter__actions {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-sm);
  padding-top: var(--space-md);
  background: var(--color-surface-container-lowest);
}

.workbench-filter__reset,
.workbench-filter__apply,
.workbench-filter__close {
  min-height: 78rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  font-weight: 800;
}

.workbench-filter__reset,
.workbench-filter__close {
  border: 1rpx solid var(--color-outline);
  color: var(--color-primary);
  background: var(--color-surface-container-lowest);
}

.workbench-filter__apply {
  color: var(--color-on-primary);
  background: var(--color-primary);
}

.workbench-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

.workbench-merchant {
  position: relative;
  padding: var(--space-md);
  border: 1rpx solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  background: var(--color-surface-container-lowest);
  box-shadow: 0 12rpx 32rpx var(--color-shadow);
}

.workbench-merchant__heading {
  padding-right: 128rpx;
  color: var(--color-on-surface);
  font-size: var(--font-size-lg);
  font-weight: 800;
  line-height: var(--line-tight);
}

.workbench-merchant__manager,
.workbench-merchant__meta,
.workbench-merchant__partner {
  margin-top: var(--space-xs);
  color: var(--color-on-surface-variant);
  font-size: var(--font-size-sm);
  font-weight: 500;
  line-height: var(--line-normal);
}

.workbench-merchant__status {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  max-width: 124rpx;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: 999rpx;
  color: var(--color-primary);
  background: var(--color-surface-container);
  font-size: var(--font-size-xs);
  font-weight: 800;
  line-height: var(--line-tight);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workbench-merchant__aum {
  display: inline-flex;
  margin-top: var(--space-sm);
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-sm);
  color: var(--color-on-surface);
  background: var(--color-surface-container-low);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.workbench-merchant__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.workbench-merchant__tag {
  display: inline-flex;
  align-items: center;
  min-height: 44rpx;
  padding: 0 var(--space-xs);
  border: 1rpx solid var(--color-outline-variant);
  border-radius: 999rpx;
  color: var(--color-primary);
  background: var(--color-surface-container-low);
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.workbench-list__empty,
.workbench-list__error {
  min-height: 220rpx;
  padding: var(--space-xl) var(--space-md);
  border: 1rpx dashed var(--color-outline-variant);
  border-radius: var(--radius-lg);
  color: var(--color-on-surface-variant);
  background: var(--color-surface-container-lowest);
  font-size: var(--font-size-md);
  font-weight: 700;
  text-align: center;
}

.workbench-list__loading {
  width: 48rpx;
  height: 48rpx;
  margin: var(--space-sm) auto;
  border: 5rpx solid var(--color-outline-variant);
  border-top-color: var(--color-primary);
  border-radius: 999rpx;
  animation: workbench-spin var(--duration-normal) linear infinite;
}

@keyframes workbench-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 340px) {
  .workbench-page {
    --font-size-lg: 30rpx;
    --font-size-xl: 34rpx;
    --space-md: 20rpx;
  }

  .workbench-kpi {
    gap: var(--space-xs);
  }

  .workbench-kpi__card {
    padding-right: var(--space-2xs);
    padding-left: var(--space-2xs);
  }
}
</style>
