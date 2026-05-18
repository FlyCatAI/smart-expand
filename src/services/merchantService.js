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
        reject(new Error('MOCK_REQUEST_TIMEOUT'))
      }, timeoutMs)
      return
    }

    const timeoutTimer = setTimeout(() => {
      reject(new Error('MOCK_REQUEST_TIMEOUT'))
    }, timeoutMs)

    setTimeout(() => {
      clearTimeout(timeoutTimer)

      if (forceError) {
        reject(new Error('MOCK_REQUEST_FAILED'))
        return
      }

      if (statusCode >= 500) {
        reject(new Error('MOCK_SERVER_ERROR'))
        return
      }

      resolve(cloneFixture(payload))
    }, MOCK_DELAY_MS)
  })
}

export function fetchMerchantDetail(merchantId = DEFAULT_MERCHANT_ID, options = {}) {
  const fixture = merchantDetailFixtures[merchantId] || merchantDetailFixtures[DEFAULT_MERCHANT_ID]
  return resolveMock(fixture, options)
}

export function fetchMerchantDynamics(params = {}, options = {}) {
  const {
    merchantId = DEFAULT_MERCHANT_ID,
    page = 1,
    pageSize = 20
  } = params
  const allRecords = merchantDynamicFixtures[merchantId] || []
  const sortedRecords = [...allRecords].sort((a, b) => b.record_date.localeCompare(a.record_date))
  const start = (page - 1) * pageSize
  const records = sortedRecords.slice(start, start + pageSize)

  return resolveMock({
    records,
    page,
    page_size: pageSize,
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
