import assert from 'node:assert/strict'
import { fetchMerchantDetail, fetchMerchantDynamics } from '../src/services/merchantService.js'
import { formatWanAmount } from '../src/utils/money.js'
import { buildQuotaRows, getSubsidyTierByMonthlyAvg } from '../src/utils/subsidyTiers.js'

const cases = [
  [-1, null],
  [0, 'tier-1'],
  [0.01, 'tier-1'],
  [1.99, 'tier-1'],
  [2, 'tier-2'],
  [3.99, 'tier-2'],
  [4, 'tier-3'],
  [5.99, 'tier-3'],
  [6, 'tier-4'],
  [7.99, 'tier-4'],
  [7.999999, 'tier-4'],
  [8, 'tier-5'],
  [200, 'tier-5'],
  [Number.NaN, null]
]

for (const [input, expectedTierId] of cases) {
  const tier = getSubsidyTierByMonthlyAvg(input)
  assert.equal(tier?.id || null, expectedTierId, `monthlyAvgBalance=${input}`)
}

const amountCases = [
  [0, '¥0.00万'],
  [0.01, '¥0.01万'],
  [Number.NaN, '无数据'],
  [-1.23, '-¥1.23万'],
  [0.005, '¥0.01万'],
  [99999999.99, '¥99999999.99万'],
  ['', '无数据'],
  ['   ', '无数据'],
  [true, '无数据'],
  [false, '无数据'],
  ['abc', '无数据'],
  ['1.23', '¥1.23万']
]

for (const [input, expected] of amountCases) {
  assert.equal(formatWanAmount(input), expected, `formatWanAmount=${input}`)
}

const tier1Rows = buildQuotaRows(1)
assert.deepEqual(
  tier1Rows.map((row) => row.requiredTransferText),
  ['已达标', '还需 ¥1.00万', '还需 ¥3.00万', '还需 ¥5.00万', '-']
)
assert.deepEqual(
  tier1Rows.map((row) => row.currentValueText),
  ['-', '-', '-', '-', '-']
)

const tier3Rows = buildQuotaRows(5)
assert.deepEqual(
  tier3Rows.map((row) => row.requiredTransferText),
  ['已达标', '已达标', '已达标', '还需 ¥1.00万', '-']
)
assert.deepEqual(
  tier3Rows.map((row) => row.currentValueText),
  ['-', '-', '-', '-', '-']
)

const tier5Rows = buildQuotaRows(11.7)
assert.deepEqual(
  tier5Rows.map((row) => row.requiredTransferText),
  ['已达标', '已达标', '已达标', '已达标', '已达标']
)
assert.deepEqual(
  tier5Rows.map((row) => row.currentValueText),
  ['-', '-', '-', '-', '¥11.70万']
)

const invalidTierInputs = ['', '   ', true, false, 'abc']
for (const input of invalidTierInputs) {
  const tier = getSubsidyTierByMonthlyAvg(input)
  assert.equal(tier, null, `invalid monthlyAvgBalance=${String(input)}`)
}

await assert.rejects(
  () => fetchMerchantDetail(''),
  (error) => error.statusCode === 400 && error.code === 'MOCK_BAD_REQUEST'
)
await assert.rejects(
  () => fetchMerchantDetail('missing'),
  (error) => error.statusCode === 404 && error.code === 'MOCK_NOT_FOUND'
)

const defaultMerchant = await fetchMerchantDetail()
assert.equal(defaultMerchant.merchant_id, 'merchant-with-product')

const defaultDynamics = await fetchMerchantDynamics({ merchantId: 'merchant-with-product' })
assert.equal(defaultDynamics.page, 1)
assert.equal(defaultDynamics.page_size, 20)

const invalidDynamicsCases = [
  { merchantId: 'merchant-with-product', page: 0, pageSize: 20 },
  { merchantId: 'merchant-with-product', page: -1, pageSize: 20 },
  { merchantId: 'merchant-with-product', page: 1, pageSize: 0 },
  { merchantId: 'merchant-with-product', page: 'x', pageSize: 20 },
  { merchantId: 'merchant-with-product', page: 1, pageSize: 'x' }
]

for (const params of invalidDynamicsCases) {
  await assert.rejects(
    () => fetchMerchantDynamics(params),
    (error) => error.statusCode === 400 && error.code === 'MOCK_BAD_REQUEST',
    `fetchMerchantDynamics invalid params=${JSON.stringify(params)}`
  )
}

console.log('merchant service, subsidy tier, and money formatting tests passed')
