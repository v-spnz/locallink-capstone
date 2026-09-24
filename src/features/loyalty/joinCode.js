export function normaliseJoinCode(value) {
  const presented = String(value ?? '')
  const code = presented.includes(':') ? presented.split(':').at(-1) : presented
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10)
}

export function formatJoinCode(value) {
  const normalised = normaliseJoinCode(value)
  return [
    normalised.slice(0, 2),
    normalised.slice(2, 6),
    normalised.slice(6, 10),
  ]
    .filter(Boolean)
    .join('-')
}

export function isCompleteJoinCode(value) {
  return /^LJ[A-Z0-9]{8}$/.test(normaliseJoinCode(value))
}
