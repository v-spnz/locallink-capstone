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

export const DASHBOARD_REPORTING_PERIODS = [
  { value: 'last-7-days', label: 'Last 7 days' },
  { value: 'last-30-days', label: 'Last 30 days' },
  { value: 'last-6-months', label: 'Last 6 months' },
  { value: 'last-12-months', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
]

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

function subtractCalendarMonths(date, monthCount) {
  const result = new Date(date)
  const originalDay = result.getUTCDate()

  result.setUTCDate(1)
  result.setUTCMonth(result.getUTCMonth() - monthCount)
  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate()
  result.setUTCDate(Math.min(originalDay, daysInTargetMonth))

  return result
}

export function getDashboardDateRange(
  period = 'last-30-days',
  referenceDate = new Date(),
) {
  const end = getAucklandCalendarDate(referenceDate)
  const start = new Date(end)

  if (period === 'last-7-days') {
    start.setUTCDate(start.getUTCDate() - 6)
  } else if (period === 'last-6-months') {
    const sixMonthsAgo = subtractCalendarMonths(end, 6)
    start.setTime(sixMonthsAgo.getTime())
    start.setUTCDate(start.getUTCDate() + 1)
  } else if (period === 'last-12-months') {
    const twelveMonthsAgo = subtractCalendarMonths(end, 12)
    start.setTime(twelveMonthsAgo.getTime())
    start.setUTCDate(start.getUTCDate() + 1)
  } else {
    start.setUTCDate(start.getUTCDate() - 29)
  }

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  }
}

export function getDefaultDashboardDateRange(referenceDate = new Date()) {
  return getDashboardDateRange('last-30-days', referenceDate)
}

export function getDashboardPeriodLabel(period) {
  return (
    DASHBOARD_REPORTING_PERIODS.find((option) => option.value === period)
      ?.label ?? 'Reporting period'
  )
}

function isIsoCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && formatIsoDate(date) === value
}

export function getDashboardDateRangeError({ startDate, endDate }) {
  if (!startDate || !endDate) return 'Choose both a start date and an end date.'
  if (!isIsoCalendarDate(startDate) || !isIsoCalendarDate(endDate)) {
    return 'Choose valid start and end dates.'
  }
  if (endDate < startDate) {
    return 'End date cannot be earlier than the start date.'
  }
  return ''
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
