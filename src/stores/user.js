import { reactive } from 'vue'

export const USER_PROFILE_STORAGE_KEY = 'hzy_user_profile'

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
  'hzy_auth_token',
  'hzy_refresh_token',
  'hzy_access_token',
  'hzy_token',
  'token',
  'access_token',
  'refresh_token',
  USER_PROFILE_STORAGE_KEY,
  'hzy_user_cache',
  'hzy_user_info',
  'hzy_profile_cache',
  'userInfo',
  'user_info',
  ...USER_PROFILE_FIELD_KEYS
]

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
    uni.clearStorageSync()
  } catch (error) {
    USER_SESSION_STORAGE_KEYS.forEach((key) => removeStorageValue(key))
  }

  USER_SESSION_STORAGE_KEYS.forEach((key) => {
    removeStorageValue(key)
    removeH5StorageValue('localStorage', key)
    removeH5StorageValue('sessionStorage', key)
  })
  clearH5SessionStorage()

  Object.assign(userState.profile, createEmptyUserProfile())
  userState.isLoggedIn = false
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
    const fieldValue = source[key]
    profile[key] = fieldValue === null || fieldValue === undefined ? '' : String(fieldValue).trim()
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
  return USER_SESSION_STORAGE_KEYS
    .filter((key) => key.includes('token'))
    .some((key) => Boolean(readStorageValue(key)))
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
  const storage = getH5Storage(type)
  return storage ? storage.getItem(key) : ''
}

function removeH5StorageValue(type, key) {
  const storage = getH5Storage(type)
  if (storage) {
    storage.removeItem(key)
  }
}

function clearH5SessionStorage() {
  const storage = getH5Storage('sessionStorage')
  if (storage) {
    storage.clear()
  }
}

function getH5Storage(type) {
  if (typeof window === 'undefined' || !window[type]) {
    return null
  }
  return window[type]
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}
