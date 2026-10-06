function parseDealDate(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDealDate(value, includeYear = true) {
  const date = parseDealDate(value)
  return date
    ? date.toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        ...(includeYear ? { year: 'numeric' } : {}),
      })
    : 'Not set'
}

export function getExpiryDetail(endDate) {
  const expiry = parseDealDate(endDate)
  if (!expiry) return { label: 'End date not set', tone: 'is-unset' }

  expiry.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const difference = Math.ceil((expiry - today) / 86_400_000)

  if (difference < 0) {
    return { label: `Ended ${formatDealDate(endDate)}`, tone: 'is-expired' }
  }
  if (difference === 0) return { label: 'Ends today', tone: 'is-soon' }
  if (difference <= 7) {
    return {
      label: `Ends in ${difference} ${difference === 1 ? 'day' : 'days'}`,
      tone: 'is-soon',
    }
  }
  return { label: `Ends ${formatDealDate(endDate)}`, tone: '' }
}
