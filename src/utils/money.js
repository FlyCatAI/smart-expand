export const NO_AMOUNT_TEXT = '无数据'

export function formatWanAmount(value, options = {}) {
  const { nanText = NO_AMOUNT_TEXT, signed = false } = options
  const amount = Number(value)

  if (!Number.isFinite(amount)) {
    return nanText
  }

  const absolute = Math.abs(amount).toFixed(2)
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

  return `${amount.toFixed(2)}万`
}
