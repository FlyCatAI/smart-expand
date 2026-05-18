import {
  DEFAULT_MERCHANT_ID,
  merchantDetailFixtures,
  merchantDynamicFixtures
} from '../fixtures/merchant-detail.js'

const MOCK_DELAY_MS = 160
const MOCK_TIMEOUT_MS = 3000
const MOCK_DIAL_PHONE_BY_MERCHANT_ID = {
  'merchant-with-product': '10000',
  'merchant-no-product': '10000'
}

function createMockError(message, options = {}) {
  const error = new Error(message)
  error.code = options.code || message
  error.statusCode = options.statusCode || 500
  return error
}

function cloneFixture(value) {
  if (Array.isArray(value)) {
    return value.map((item) => cloneFixture(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneFixture(item)])
    )
  }

  return value
}

function resolveMock(payload, options = {}) {
  const {
    forceError = false,
    forceTimeout = false,
    statusCode = 200,
    timeoutMs = MOCK_TIMEOUT_MS
  } = options

  return new Promise((resolve, reject) => {
    if (forceTimeout) {
      setTimeout(() => {
        reject(createMockError('MOCK_REQUEST_TIMEOUT', { code: 'MOCK_REQUEST_TIMEOUT', statusCode: 504 }))
      }, timeoutMs)
      return
    }

    const timeoutTimer = setTimeout(() => {
      reject(createMockError('MOCK_REQUEST_TIMEOUT', { code: 'MOCK_REQUEST_TIMEOUT', statusCode: 504 }))
    }, timeoutMs)

    setTimeout(() => {
      clearTimeout(timeoutTimer)

      if (forceError) {
        reject(createMockError('MOCK_REQUEST_FAILED', { code: 'MOCK_REQUEST_FAILED', statusCode: 500 }))
        return
      }

      if (statusCode >= 400) {
        reject(createMockError('MOCK_SERVER_ERROR', { code: 'MOCK_SERVER_ERROR', statusCode }))
        return
      }

      resolve(cloneFixture(payload))
    }, MOCK_DELAY_MS)
  })
}

function rejectMock(message, options) {
  return Promise.reject(createMockError(message, options))
}

function normalizeMerchantId(merchantId) {
  if (merchantId === undefined || merchantId === null) {
    return DEFAULT_MERCHANT_ID
  }

  if (typeof merchantId !== 'string' || merchantId.trim() === '') {
    return null
  }

  return merchantId.trim()
}

function normalizePositiveInteger(value, fallback) {
  if (value === undefined || value === null) {
    return fallback
  }

  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    return null
  }

  return value
}

export function fetchMerchantDetail(merchantId = DEFAULT_MERCHANT_ID, options = {}) {
  const normalizedMerchantId = normalizeMerchantId(merchantId)

  if (!normalizedMerchantId) {
    return rejectMock('MOCK_BAD_REQUEST', { code: 'MOCK_BAD_REQUEST', statusCode: 400 })
  }

  const fixture = merchantDetailFixtures[normalizedMerchantId]
  if (!fixture) {
    return rejectMock('MOCK_NOT_FOUND', { code: 'MOCK_NOT_FOUND', statusCode: 404 })
  }

  return resolveMock(fixture, options)
}

export function fetchMerchantDynamics(params = {}, options = {}) {
  const {
    merchantId = DEFAULT_MERCHANT_ID,
    page = 1,
    pageSize = 20
  } = params

  const normalizedMerchantId = normalizeMerchantId(merchantId)
  const normalizedPage = normalizePositiveInteger(page, 1)
  const normalizedPageSize = normalizePositiveInteger(pageSize, 20)

  if (!normalizedMerchantId || !normalizedPage || !normalizedPageSize) {
    return rejectMock('MOCK_BAD_REQUEST', { code: 'MOCK_BAD_REQUEST', statusCode: 400 })
  }

  if (!Object.hasOwn(merchantDynamicFixtures, normalizedMerchantId)) {
    return rejectMock('MOCK_NOT_FOUND', { code: 'MOCK_NOT_FOUND', statusCode: 404 })
  }

  const allRecords = merchantDynamicFixtures[normalizedMerchantId]
  const sortedRecords = [...allRecords].sort((a, b) => b.record_date.localeCompare(a.record_date))
  const start = (normalizedPage - 1) * normalizedPageSize
  const records = sortedRecords.slice(start, start + normalizedPageSize)

  return resolveMock({
    records,
    page: normalizedPage,
    page_size: normalizedPageSize,
    total: sortedRecords.length,
    has_more: start + records.length < sortedRecords.length
  }, options)
}

export async function dialMerchant(merchantId = DEFAULT_MERCHANT_ID, options = {}) {
  // TODO(HZYBackend GRA-XX): 真实拨号 token / 服务端代发。
  const phoneNumber = await resolveMock(
    MOCK_DIAL_PHONE_BY_MERCHANT_ID[merchantId] || MOCK_DIAL_PHONE_BY_MERCHANT_ID[DEFAULT_MERCHANT_ID],
    options
  )

  return new Promise((resolve, reject) => {
    if (typeof uni === 'undefined' || typeof uni.makePhoneCall !== 'function') {
      reject(new Error('UNI_MAKE_PHONE_CALL_UNAVAILABLE'))
      return
    }

    uni.makePhoneCall({
      phoneNumber,
      success: resolve,
      fail: reject
    })
  })
}
