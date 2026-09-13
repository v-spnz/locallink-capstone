const CLAIM_REFERENCE_BODY_LENGTH = 8

export function normaliseClaimReference(value) {
  const compact = String(value ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (!compact) return ''
  const body = compact.startsWith('LL') ? compact.slice(2) : compact
  return `LL${body.slice(0, CLAIM_REFERENCE_BODY_LENGTH)}`
}

export function formatClaimReference(value) {
  const normalized = normaliseClaimReference(value)
  if (!normalized) return ''
  const body = normalized.slice(2)
  const groups = body.match(/.{1,4}/g) ?? []
  return ['LL', ...groups].join('-')
}

export function isCompleteClaimReference(value) {
  return /^LL[0-9A-F]{8}$/.test(normaliseClaimReference(value))
}
