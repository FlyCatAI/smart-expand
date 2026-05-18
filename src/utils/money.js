export const NO_AMOUNT_TEXT = '无数据'

function formatFixedTwo(value) {
  return (Math.round((Math.abs(value) + Number.EPSILON) * 100) / 100).toFixed(2)
}

export function formatWanAmount(value, options = {}) {
  const { nanText = NO_AMOUNT_TEXT, signed = false } = options
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
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
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return nanText
  }

  const prefix = amount < 0 ? '-' : ''
  return `${prefix}${formatFixedTwo(amount)}万`
}
