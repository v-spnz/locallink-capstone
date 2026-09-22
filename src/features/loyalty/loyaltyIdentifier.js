export function normaliseLoyaltyIdentifier(value) {
  const presentedValue = String(value ?? '')
  const code = presentedValue.includes(':')
    ? presentedValue.split(':').at(-1)
    : presentedValue

  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
}

export function normaliseLoyaltyLookupCode(value) {
  const presentedValue = String(value ?? '')
  const code = presentedValue.includes(':')
    ? presentedValue.split(':').at(-1)
    : presentedValue
  const normalised = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  return normalised.startsWith('LL')
    ? normalised.slice(0, 10)
    : normalised.slice(0, 12)
}

export function formatLoyaltyIdentifier(value) {
  const normalised = normaliseLoyaltyIdentifier(value)
  const parts = [
    normalised.slice(0, 2),
    normalised.slice(2, 6),
    normalised.slice(6, 10),
  ].filter(Boolean)

  return parts.join('-')
}

export function isCompleteLoyaltyIdentifier(value) {
  return /^LL[A-Z0-9]{8}$/.test(normaliseLoyaltyIdentifier(value))
}

export function formatLoyaltyLookupCode(value) {
  const normalised = normaliseLoyaltyLookupCode(value)
  if (normalised.startsWith('LL')) return formatLoyaltyIdentifier(normalised)
  return [
    normalised.slice(0, 4),
    normalised.slice(4, 8),
    normalised.slice(8, 12),
  ]
    .filter(Boolean)
    .join(' ')
}

export function isCompleteLoyaltyLookupCode(value) {
  return /^(LL[A-Z0-9]{8}|[A-Z0-9]{12})$/.test(
    normaliseLoyaltyLookupCode(value),
  )
}

export function getLoyaltyIdentifierPayload(value) {
  return `locallink:loyalty-record:${normaliseLoyaltyLookupCode(value)}`
}
