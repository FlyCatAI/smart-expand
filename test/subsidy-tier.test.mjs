import assert from 'node:assert/strict'
import { getSubsidyTierByMonthlyAvg } from '../src/utils/subsidyTiers.js'

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

console.log('subsidy tier boundaries passed')
