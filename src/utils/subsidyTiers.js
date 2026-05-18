import { formatWanAmount, normalizeFiniteAmount } from './money.js'

export const SUBSIDY_TIERS = [
  {
    id: 'tier-1',
    label: '第1档',
    minInclusive: 0,
    maxExclusive: 2,
    rangeText: '0-2万（不含）',
    subsidyText: '200元/月',
    subsidyAmount: 200
  },
  {
    id: 'tier-2',
    label: '第2档',
    minInclusive: 2,
    maxExclusive: 4,
    rangeText: '2-4万（不含）',
    subsidyText: '500元/月',
    subsidyAmount: 500
  },
  {
    id: 'tier-3',
    label: '第3档',
    minInclusive: 4,
    maxExclusive: 6,
    rangeText: '4-6万（不含）',
    subsidyText: '800元/月',
    subsidyAmount: 800
  },
  {
    id: 'tier-4',
    label: '第4档',
    minInclusive: 6,
    maxExclusive: 8,
    rangeText: '6-8万（不含）',
    subsidyText: '1200元/月',
    subsidyAmount: 1200
  },
  {
    id: 'tier-5',
    label: '第5档',
    minInclusive: 8,
    maxExclusive: null,
    rangeText: '8万及以上',
    subsidyText: '1500元/月',
    subsidyAmount: 1500
  }
]

export function getSubsidyTierByMonthlyAvg(monthlyAvgBalance) {
  const amount = normalizeFiniteAmount(monthlyAvgBalance)

  // 负活期视为输入异常，不归任何档；上层负责展示空态。
  if (amount === null || amount < 0) {
    return null
  }

  return SUBSIDY_TIERS.find((tier) => {
    if (tier.maxExclusive === null) {
      return amount >= tier.minInclusive
    }

    return amount >= tier.minInclusive && amount < tier.maxExclusive
  }) || null
}

export function buildQuotaRows(currentMonthlyAvgBalance) {
  const activeTier = getSubsidyTierByMonthlyAvg(currentMonthlyAvgBalance)
  const amount = normalizeFiniteAmount(currentMonthlyAvgBalance)
  const hasValidAmount = amount !== null && amount >= 0

  return SUBSIDY_TIERS.map((tier) => ({
    ...tier,
    currentValueText: tier.id === 'tier-5' && activeTier?.id === tier.id
      ? formatWanAmount(amount)
      : '-',
    requiredTransferText: resolveRequiredTransferText(tier, amount, hasValidAmount),
    isActive: activeTier?.id === tier.id
  }))
}

function resolveRequiredTransferText(tier, amount, hasValidAmount) {
  if (!hasValidAmount) {
    return '-'
  }

  if (tier.id === 'tier-5') {
    return amount >= tier.minInclusive ? '已达标' : '-'
  }

  if (amount >= tier.minInclusive) {
    return '已达标'
  }

  return `还需 ${formatWanAmount(tier.minInclusive - amount)}`
}
