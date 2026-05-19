<template>
  <view class="profile-page">
    <view class="profile-page__shell">
      <view class="profile-topbar">
        <text class="profile-topbar__title">我的</text>
      </view>

      <view class="profile-hero">
        <view class="profile-hero__avatar" aria-hidden="true"></view>
        <view class="profile-hero__body">
          <text class="profile-hero__name">{{ displayProfile.user_name }}</text>
          <text class="profile-hero__meta">{{ profileMeta }}</text>
          <view class="profile-hero__tags">
            <text class="profile-hero__tag">零售</text>
            <text class="profile-hero__tag">收单</text>
          </view>
        </view>
      </view>

      <view class="profile-performance">
        <view class="profile-performance__card">
          <view class="profile-performance__glyph profile-performance__glyph--primary" aria-hidden="true"></view>
          <text class="profile-performance__value">¥{amount}</text>
          <text class="profile-performance__label">本月绩效</text>
        </view>
        <view class="profile-performance__card">
          <view class="profile-performance__glyph profile-performance__glyph--warning" aria-hidden="true"></view>
          <text class="profile-performance__value">第{rank}名</text>
          <text class="profile-performance__label">AUM排行</text>
        </view>
      </view>

      <view class="profile-info">
        <view class="profile-info__grid">
          <view class="profile-info__item" data-field="user_name">
            <text class="profile-info__label">真实姓名</text>
            <text class="profile-info__value">{{ displayProfile.user_name }}</text>
          </view>
          <view class="profile-info__item" data-field="employee_id">
            <text class="profile-info__label">工号</text>
            <text class="profile-info__value">{{ displayProfile.employee_id }}</text>
          </view>
          <view class="profile-info__item" data-field="job_level">
            <text class="profile-info__label">职级</text>
            <text class="profile-info__value">{{ displayProfile.job_level }}</text>
          </view>
          <view class="profile-info__item" data-field="phone">
            <text class="profile-info__label">手机号</text>
            <button
              class="profile-info__value profile-info__value--action"
              @click="handlePhoneTap"
            >
              {{ displayProfile.phone }}
            </button>
          </view>
          <view class="profile-info__item" data-field="email">
            <text class="profile-info__label">邮箱地址</text>
            <button
              class="profile-info__value profile-info__value--action"
              @click="handleEmailTap"
            >
              {{ displayProfile.email }}
            </button>
          </view>
          <view class="profile-info__item" data-field="join_date">
            <text class="profile-info__label">入职日期</text>
            <text class="profile-info__value">{{ displayProfile.join_date }}</text>
          </view>
          <view class="profile-info__item" data-field="org_branch">
            <text class="profile-info__label">所属分行</text>
            <text class="profile-info__value">{{ displayProfile.org_branch }}</text>
          </view>
          <view class="profile-info__item" data-field="org_sub_branch">
            <text class="profile-info__label">所属支行</text>
            <text class="profile-info__value">{{ displayProfile.org_sub_branch }}</text>
          </view>
          <view class="profile-info__item" data-field="position">
            <text class="profile-info__label">职位</text>
            <text class="profile-info__value">{{ displayProfile.position }}</text>
          </view>
          <view class="profile-info__item" data-field="level">
            <text class="profile-info__label">级别</text>
            <text class="profile-info__value">{{ displayProfile.level }}</text>
          </view>
        </view>
      </view>

      <view class="profile-section">
        <text class="profile-section__title">我的工具</text>
        <view class="profile-menu">
          <view class="profile-menu__item" @click="handleMenuAction('performance_detail')">
            <view class="profile-menu__icon profile-menu__icon--primary" aria-hidden="true"></view>
            <view class="profile-menu__body">
              <text class="profile-menu__title">绩效明细</text>
              <text class="profile-menu__desc">查看本期绩效收入构成</text>
            </view>
            <view class="profile-menu__chevron" aria-hidden="true"></view>
          </view>
          <view class="profile-menu__item" @click="handleMenuAction('retail_ranking')">
            <view class="profile-menu__icon profile-menu__icon--warning" aria-hidden="true"></view>
            <view class="profile-menu__body">
              <text class="profile-menu__title">零售排行榜</text>
              <text class="profile-menu__desc">AUM · 绩效 · 联系数等</text>
            </view>
            <view class="profile-menu__chevron" aria-hidden="true"></view>
          </view>
        </view>
      </view>

      <view class="profile-section">
        <text class="profile-section__title">设置</text>
        <view class="profile-menu">
          <view class="profile-menu__item" @click="handleMenuAction('notification_settings')">
            <view class="profile-menu__icon" aria-hidden="true"></view>
            <text class="profile-menu__title profile-menu__title--solo">消息通知</text>
            <view class="profile-menu__chevron" aria-hidden="true"></view>
          </view>
          <view class="profile-menu__item" @click="handleMenuAction('privacy_settings')">
            <view class="profile-menu__icon" aria-hidden="true"></view>
            <text class="profile-menu__title profile-menu__title--solo">隐私设置</text>
            <view class="profile-menu__chevron" aria-hidden="true"></view>
          </view>
          <view class="profile-menu__item" @click="handleMenuAction('about')">
            <view class="profile-menu__icon" aria-hidden="true"></view>
            <text class="profile-menu__title profile-menu__title--solo">关于我们</text>
            <view class="profile-menu__chevron" aria-hidden="true"></view>
          </view>
        </view>
      </view>

      <view class="profile-version">
        <text>版本号 v1.0.0</text>
      </view>

      <button class="profile-logout" @click="handleLogoutTap">退出登录</button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  clearUserSession,
  hydrateUserState,
  userState
} from '../../stores/user'

const EMPTY_TEXT = '暂未配置'
const PHONE_PATTERN = /^1[3-9]\d{9}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PLACEHOLDER_MENU_ACTIONS = new Set([
  'performance_detail',
  'retail_ranking',
  'notification_settings',
  'privacy_settings',
  'about'
])

onShow(() => {
  hydrateUserState()
})

const displayProfile = computed(() => ({
  user_name: normalizeDisplayText(userState.profile.user_name),
  employee_id: normalizeDisplayText(userState.profile.employee_id),
  job_level: normalizeDisplayText(userState.profile.job_level),
  phone: normalizeDisplayText(userState.profile.phone),
  email: normalizeDisplayText(userState.profile.email),
  join_date: formatDate(userState.profile.join_date),
  org_branch: normalizeDisplayText(userState.profile.org_branch),
  org_sub_branch: normalizeDisplayText(userState.profile.org_sub_branch),
  position: normalizeDisplayText(userState.profile.position),
  level: normalizeDisplayText(userState.profile.level)
}))

const profileMeta = computed(() => {
  const parts = [displayProfile.value.org_sub_branch, displayProfile.value.position]
    .filter((value) => value !== EMPTY_TEXT)
  return parts.length ? parts.join(' · ') : EMPTY_TEXT
})

const normalizedPhone = computed(() => normalizeRawText(userState.profile.phone).replace(/\s/g, ''))
const normalizedEmail = computed(() => normalizeRawText(userState.profile.email))

function handlePhoneTap() {
  const phone = normalizedPhone.value
  if (!PHONE_PATTERN.test(phone)) {
    showToast('手机号暂不可用')
    return
  }

  uni.showModal({
    title: '确认拨号',
    content: `确认拨打 ${phone}？`,
    success: (result) => {
      if (!result.confirm) {
        return
      }
      uni.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          showToast('拨号暂不可用')
        }
      })
    },
    fail: () => {
      showToast('拨号暂不可用')
    }
  })
}

function handleEmailTap() {
  const email = normalizedEmail.value
  if (!EMAIL_PATTERN.test(email)) {
    showToast('邮箱暂不可用')
    return
  }

  uni.setClipboardData({
    data: email,
    fail: () => {
      showToast('邮箱暂不可用')
    }
  })
}

function handleLogoutTap() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出当前账号吗？',
    success: (result) => {
      if (!result.confirm) {
        return
      }
      try {
        clearUserSession()
        showToast('已退出登录')
      } catch (error) {
        showToast('退出暂不可用')
      }
    },
    fail: () => {
      showToast('退出暂不可用')
    }
  })
}

function handleMenuAction(actionId) {
  if (PLACEHOLDER_MENU_ACTIONS.has(actionId)) {
    showToast(EMPTY_TEXT)
  }
}

function normalizeDisplayText(value) {
  return isEmptyDisplayValue(value) ? EMPTY_TEXT : String(value).trim()
}

function normalizeRawText(value) {
  return isEmptyDisplayValue(value) ? '' : String(value).trim()
}

function isEmptyDisplayValue(value) {
  if (value === null || value === undefined) {
    return true
  }
  const text = String(value).trim()
  return !text || text === '-' || ['null', 'undefined'].includes(text.toLowerCase())
}

function formatDate(value) {
  const text = normalizeRawText(value)
  if (!text) {
    return EMPTY_TEXT
  }
  const directMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`
  }
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) {
    return EMPTY_TEXT
  }
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-')
}

function showToast(title) {
  if (!title) return
  uni.showToast({
    title,
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.profile-page {
  min-height: 100vh;
  overflow-x: hidden;
  background: var(--color-surface);
  color: var(--color-on-surface);
}

.profile-page__shell {
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: calc(16px + env(safe-area-inset-top)) 20px calc(96px + env(safe-area-inset-bottom));
}

.profile-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 44px;
  margin-bottom: 12px;
}

.profile-topbar__title {
  color: var(--color-primary);
  font-family: var(--font-family-headline);
  font-size: var(--font-size-lg);
  font-weight: 800;
  line-height: var(--line-height-tight);
}

.profile-hero {
  display: flex;
  align-items: center;
  gap: 18px;
  min-width: 0;
  padding: 24px;
  overflow: hidden;
  color: var(--color-on-primary);
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-container));
  border-radius: var(--radius-xl);
}

.profile-hero__avatar {
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  border: 2px solid var(--color-on-primary);
  border-radius: var(--radius-lg);
  background: var(--color-primary-container);
}

.profile-hero__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.profile-hero__name {
  overflow: hidden;
  font-family: var(--font-family-headline);
  font-size: var(--font-size-xl);
  font-weight: 800;
  line-height: var(--line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-hero__meta {
  margin-top: 8px;
  overflow-wrap: anywhere;
  font-family: var(--font-family-label);
  font-size: var(--font-size-sm);
  opacity: 0.86;
}

.profile-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.profile-hero__tag {
  padding: 5px 12px;
  color: var(--color-on-primary);
  font-family: var(--font-family-label);
  font-size: var(--font-size-xs);
  font-weight: 600;
  background: var(--color-primary-container);
  border: 1px solid var(--color-on-primary);
  border-radius: var(--radius-full);
}

.profile-performance {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-xl);
}

.profile-performance__card {
  display: flex;
  min-width: 0;
  align-items: center;
  flex-direction: column;
  gap: 6px;
  padding: 16px 10px;
  background: var(--color-surface-container-low);
  border-radius: var(--radius-lg);
}

.profile-performance__glyph,
.profile-menu__icon {
  position: relative;
  display: block;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  background: var(--color-surface-container);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.profile-performance__glyph::before,
.profile-menu__icon::before {
  position: absolute;
  inset: 11px;
  display: block;
  border: 2px solid currentColor;
  border-radius: var(--radius-default);
  content: "";
}

.profile-performance__glyph--primary,
.profile-menu__icon--primary {
  color: var(--color-primary);
  background: var(--color-secondary-container);
}

.profile-performance__glyph--warning,
.profile-menu__icon--warning {
  color: var(--color-warning);
  background: var(--color-warning-container);
}

.profile-performance__value {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-on-surface);
  font-family: var(--font-family-headline);
  font-size: var(--font-size-lg);
  font-weight: 800;
  line-height: var(--line-height-tight);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-performance__label {
  color: var(--color-on-surface-variant);
  font-family: var(--font-family-label);
  font-size: var(--font-size-2xs);
  font-weight: 600;
}

.profile-info,
.profile-section {
  margin-top: 16px;
  padding: 18px;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-xl);
}

.profile-info__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.profile-info__item {
  display: flex;
  min-width: 0;
  min-height: 72px;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: var(--color-surface-container-low);
  border-radius: var(--radius-lg);
}

.profile-info__label {
  color: var(--color-on-surface-variant);
  font-family: var(--font-family-label);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.profile-info__value {
  display: block;
  max-width: 100%;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--color-on-surface);
  font-family: var(--font-family-body);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: var(--line-height-normal);
  text-align: left;
}

.profile-info__value--action {
  color: var(--color-primary);
}

.profile-section__title {
  display: block;
  margin-bottom: 8px;
  color: var(--color-on-surface);
  font-family: var(--font-family-headline);
  font-size: var(--font-size-sm);
  font-weight: 800;
}

.profile-menu {
  display: flex;
  flex-direction: column;
}

.profile-menu__item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--color-outline-variant);
  transition: opacity var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.profile-menu__item:last-child {
  border-bottom: 0;
}

.profile-menu__item:active {
  opacity: 0.7;
  transform: scale(0.99);
}

.profile-menu__body {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 4px;
}

.profile-menu__title {
  min-width: 0;
  overflow: hidden;
  color: var(--color-on-surface);
  font-family: var(--font-family-label);
  font-size: var(--font-size-sm);
  font-weight: 700;
  line-height: var(--line-height-normal);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-menu__title--solo {
  flex: 1;
}

.profile-menu__desc {
  color: var(--color-on-surface-variant);
  font-family: var(--font-family-label);
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-normal);
}

.profile-menu__chevron {
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-top: 2px solid var(--color-on-surface-variant);
  border-right: 2px solid var(--color-on-surface-variant);
  transform: rotate(45deg);
}

.profile-version {
  margin: 18px 0 12px;
  color: var(--color-on-surface-variant);
  font-family: var(--font-family-label);
  font-size: var(--font-size-xs);
  text-align: center;
}

.profile-logout {
  display: flex;
  width: 100%;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  color: var(--color-danger);
  font-family: var(--font-family-body);
  font-size: var(--font-size-sm);
  font-weight: 700;
  background: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
  transition: opacity var(--motion-duration-short) var(--motion-easing-standard),
    transform var(--motion-duration-short) var(--motion-easing-standard);
}

.profile-logout:active {
  opacity: 0.7;
  transform: scale(0.99);
}

@media (max-width: 380px) {
  .profile-page__shell {
    padding-right: 16px;
    padding-left: 16px;
  }

  .profile-hero {
    gap: 14px;
    padding: 20px;
  }

  .profile-hero__avatar {
    width: 64px;
    height: 64px;
    flex-basis: 64px;
  }

  .profile-info,
  .profile-section {
    padding: 16px;
  }
}
</style>
