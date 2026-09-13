export const REDEMPTION_CODE_LENGTH = 12

export function normaliseRedemptionCode(value) {
  const rawValue = String(value ?? '')
  const payload = rawValue.includes(':') ? rawValue.split(':').at(-1) : rawValue

  return payload
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, REDEMPTION_CODE_LENGTH)
}

export function formatRedemptionCode(value) {
  return normaliseRedemptionCode(value).replace(/(.{4})(?=.)/g, '$1 ')
}

export function isCompleteRedemptionCode(value) {
  return normaliseRedemptionCode(value).length === REDEMPTION_CODE_LENGTH
}

export function getRedemptionCodePayload(value) {
  const code = normaliseRedemptionCode(value)
  return code ? `locallink:deal-claim:${code}` : ''
}
