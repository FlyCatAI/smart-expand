import { reactive } from 'vue'

export const USER_PROFILE_STORAGE_KEY = 'hzy_user_profile'

const AUTH_TOKEN_STORAGE_KEYS = [
  'hzy_auth_token',
  'hzy_refresh_token',
  'hzy_access_token',
  'hzy_token',
  'token',
  'access_token',
  'refresh_token'
]

const USER_TRACE_STORAGE_KEYS = [
  'avatar',
  'avatar_url',
  'user_avatar',
  'profile_avatar',
  'head_image',
  'avatarUrl',
  'name',
  'userName',
  'user_name',
  'real_name',
  'realName',
  'employee_id',
  'employeeId',
  'staff_no',
  'staffNo',
  'work_no',
  'workNo'
]

export const USER_PROFILE_FIELD_KEYS = [
  'user_name',
  'employee_id',
  'job_level',
  'phone',
  'email',
  'join_date',
  'org_branch',
  'org_sub_branch',
  'position',
  'level'
]

export const USER_SESSION_STORAGE_KEYS = [
  ...AUTH_TOKEN_STORAGE_KEYS,
  USER_PROFILE_STORAGE_KEY,
  'hzy_user_cache',
  'hzy_user_info',
  'hzy_profile_cache',
  'userInfo',
  'user_info',
  ...USER_TRACE_STORAGE_KEYS,
  ...USER_PROFILE_FIELD_KEYS
].filter((key, index, keys) => keys.indexOf(key) === index)

const emptyProfile = createEmptyUserProfile()

export const userState = reactive({
  isLoggedIn: false,
  profile: createEmptyUserProfile()
})

export function hydrateUserState() {
  const storedProfile = readStorageValue(USER_PROFILE_STORAGE_KEY)
  const profile = normalizeUserProfile(storedProfile || readLegacyProfileFields())

  Object.assign(userState.profile, profile)
  userState.isLoggedIn = hasAnyProfileValue(profile) || hasAnyToken()
}

export function clearUserSession() {
  try {
    clearUniStorage()
    USER_SESSION_STORAGE_KEYS.forEach((key) => {
      removeH5StorageValue('localStorage', key)
      removeH5StorageValue('sessionStorage', key)
    })
    clearH5SessionStorage()
  } finally {
    Object.assign(userState.profile, createEmptyUserProfile())
    userState.isLoggedIn = false
  }
}

export function createEmptyUserProfile() {
  return USER_PROFILE_FIELD_KEYS.reduce((profile, key) => {
    profile[key] = ''
    return profile
  }, {})
}

function normalizeUserProfile(value) {
  const source = isPlainObject(value) ? value : {}
  return USER_PROFILE_FIELD_KEYS.reduce((profile, key) => {
    profile[key] = normalizeProfileFieldValue(source[key])
    return profile
  }, { ...emptyProfile })
}

function readLegacyProfileFields() {
  return USER_PROFILE_FIELD_KEYS.reduce((profile, key) => {
    profile[key] = readStorageValue(key)
    return profile
  }, {})
}

function hasAnyProfileValue(profile) {
  return USER_PROFILE_FIELD_KEYS.some((key) => Boolean(profile[key]))
}

function hasAnyToken() {
  return AUTH_TOKEN_STORAGE_KEYS.some((key) => Boolean(readStorageValue(key)))
}

function readStorageValue(key) {
  try {
    const value = uni.getStorageSync(key)
    return parseStorageValue(value)
  } catch (error) {
    return parseStorageValue(readH5StorageValue('localStorage', key) || readH5StorageValue('sessionStorage', key))
  }
}

function parseStorageValue(value) {
  if (!value) return ''
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (error) {
    return value
  }
}

function removeStorageValue(key) {
  try {
    uni.removeStorageSync(key)
  } catch (error) {
    // noop: H5 direct storage cleanup below covers non-uni runtimes.
  }
}

function readH5StorageValue(type, key) {
  try {
    const storage = getH5Storage(type)
    return storage ? storage.getItem(key) : ''
  } catch (error) {
    return ''
  }
}

function removeH5StorageValue(type, key) {
  try {
    const storage = getH5Storage(type)
    if (storage) {
      storage.removeItem(key)
    }
  } catch (error) {
    // noop: userState is reset in clearUserSession finally.
  }
}

function clearH5SessionStorage() {
  try {
    const storage = getH5Storage('sessionStorage')
    if (storage) {
      storage.clear()
    }
  } catch (error) {
    // noop: userState is reset in clearUserSession finally.
  }
}

function getH5Storage(type) {
  try {
    if (typeof window === 'undefined' || !window[type]) {
      return null
    }
    return window[type]
  } catch (error) {
    return null
  }
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function clearUniStorage() {
  try {
    uni.clearStorageSync()
  } catch (error) {
    USER_SESSION_STORAGE_KEYS.forEach((key) => removeStorageValue(key))
  }
}

function normalizeProfileFieldValue(value) {
  if (isEmptyProfileValue(value)) {
    return ''
  }
  return String(value).trim()
}

function isEmptyProfileValue(value) {
  if (value === null || value === undefined) {
    return true
  }
  const text = String(value).trim()
  return !text || text === '-' || ['null', 'undefined'].includes(text.toLowerCase())
}
