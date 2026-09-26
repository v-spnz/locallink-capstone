const countFormatter = new Intl.NumberFormat('en-NZ')

const percentageFormatter = new Intl.NumberFormat('en-NZ', {
  maximumFractionDigits: 1,
})

const currencyFormatter = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

const displayDateFormatter = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function getAucklandCalendarDate(referenceDate) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Pacific/Auckland',
  }).formatToParts(referenceDate)

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  )

  return new Date(Date.UTC(values.year, values.month - 1, values.day))
}

export function getDefaultDashboardDateRange(referenceDate = new Date()) {
  const end = getAucklandCalendarDate(referenceDate)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - 29)

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  }
}

export function formatDashboardDateRange({ startDate, endDate }) {
  const start = displayDateFormatter.format(new Date(`${startDate}T00:00:00Z`))
  const end = displayDateFormatter.format(new Date(`${endDate}T00:00:00Z`))
  return `${start} – ${end}`
}

export function formatDashboardCount(value) {
  return countFormatter.format(Number(value) || 0)
}

export function formatDashboardPercentage(value) {
  return `${percentageFormatter.format(Number(value) || 0)}%`
}

export function formatRecordedCurrency(cents) {
  if (cents == null) return null
  return currencyFormatter.format(Number(cents) / 100)
}

export function hasDealActivity(metrics) {
  return Boolean(
    metrics &&
    (metrics.dealClaims > 0 ||
      metrics.dealRedemptions > 0 ||
      metrics.recordedTransactionValueCents != null),
  )
}

export function hasLoyaltyActivity(metrics) {
  return Boolean(metrics && metrics.loyaltyActivityEvents > 0)
}

export function hasMarketplaceActivity(metrics) {
  return Boolean(
    metrics &&
    (metrics.marketplaceMatchedLeads > 0 ||
      metrics.marketplaceQuotesSubmitted > 0 ||
      metrics.marketplaceJobsWon > 0 ||
      metrics.marketplaceCompletedJobs > 0),
  )
}
