export const NO_AMOUNT_TEXT = '无数据'

const NUMERIC_STRING_PATTERN = /^[-+]?(?:\d+|\d+\.\d+|\.\d+)$/

export function normalizeFiniteAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (!NUMERIC_STRING_PATTERN.test(trimmedValue)) {
      return null
    }

    const amount = Number(trimmedValue)
    return Number.isFinite(amount) ? amount : null
  }

  return null
}

function formatFixedTwo(value) {
  return (Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100).toFixed(2)
}

export function formatWanAmount(value, options = {}) {
  const { nanText = NO_AMOUNT_TEXT, signed = false } = options
  const amount = normalizeFiniteAmount(value)

  if (amount === null) {
    return nanText
  }

  const absolute = formatFixedTwo(amount)
  if (amount < 0) {
    return `-¥${absolute}万`
  }

  const prefix = signed && amount > 0 ? '+¥' : '¥'
  return `${prefix}${absolute}万`
}

export function formatPlainWanAmount(value, options = {}) {
  const { nanText = NO_AMOUNT_TEXT } = options
  const amount = normalizeFiniteAmount(value)

  if (amount === null) {
    return nanText
  }

  const prefix = amount < 0 ? '-' : ''
  return `${prefix}${formatFixedTwo(amount)}万`
}
