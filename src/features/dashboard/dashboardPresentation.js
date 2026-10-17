import { getDealLifecycle } from '../deals/constants.js'
import { validateDeal } from '../deals/validation.js'

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

export function getDefaultDashboardDateRange(
  referenceDate = new Date(),
  days = 30,
) {
  const end = getAucklandCalendarDate(referenceDate)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - days + 1)

  return {
    startDate: formatIsoDate(start),
    endDate: formatIsoDate(end),
  }
}

export function getPreviousDashboardDateRange({ startDate, endDate }) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const days = Math.round((end - start) / 86_400_000) + 1
  end.setTime(start.getTime() - 86_400_000)
  start.setTime(start.getTime() - days * 86_400_000)
  return { startDate: formatIsoDate(start), endDate: formatIsoDate(end) }
}

export function getPerformanceChange(current, previous, percentagePoints = false) {
  if (current == null || previous == null || !Number.isFinite(current) || !Number.isFinite(previous)) return null
  const difference = current - previous
  if (difference === 0) return previous === 0 ? null : { direction: 'same', label: 'Unchanged vs previous period' }
  if (previous === 0 && !percentagePoints) return current > 0 ? { direction: 'up', label: 'New activity vs previous period' } : null
  const amount = percentagePoints ? Math.abs(difference) : Math.abs(difference / previous * 100)
  return {
    direction: difference > 0 ? 'up' : 'down',
    label: `${percentageFormatter.format(amount)}${percentagePoints ? ' percentage points' : '%'} vs previous period`,
  }
}

export function groupDashboardTrends(rows, { startDate, endDate }) {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const days = Math.round((end - start) / 86_400_000) + 1
  const interval = days <= 31 ? 'day' : days <= 180 ? 'week' : 'month'
  const byDate = new Map(rows.map((row) => [row.date, row]))
  const buckets = []
  for (const date = new Date(start); date <= end;) {
    const key = interval === 'month' ? formatIsoDate(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))) : formatIsoDate(date)
    const next = new Date(date)
    if (interval === 'day') next.setUTCDate(next.getUTCDate() + 1)
    else if (interval === 'week') next.setUTCDate(next.getUTCDate() + 7)
    else next.setUTCMonth(next.getUTCMonth() + 1, 1)
    const row = byDate.get(key)
    buckets.push({
      date: formatIsoDate(date),
      endDate: formatIsoDate(new Date(Math.min(end.getTime(), next.getTime() - 86_400_000))),
      claims: row?.claims ?? 0,
      redemptions: row?.redemptions ?? 0,
      valuedRedemptions: row?.valuedRedemptions ?? 0,
      recordedValueCents: row?.recordedValueCents ?? (row?.redemptions ? null : 0),
    })
    date.setTime(next.getTime())
  }
  return buckets
}

export function getPerformanceDeals(deals) {
  return deals.filter((deal) => deal.status !== 'draft' && deal.status !== 'scheduled')
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

export const DEAL_STATUS_ORDER = [
  'draft',
  'scheduled',
  'active',
  'expired',
  'ended_early',
]

const ENDING_SOON_DAYS = 7

export function getDealStatusSummary(deals = [], today = new Date()) {
  const counts = {
    draft: 0,
    scheduled: 0,
    active: 0,
    expired: 0,
    ended_early: 0,
  }
  const drafts = []
  const endingSoon = []

  const todayStart = new Date(today)
  todayStart.setHours(0, 0, 0, 0)

  for (const deal of deals) {
    const rawState = getDealLifecycle(deal, today).value
    const state = rawState === 'ended-early' ? 'ended_early' : rawState
    if (!(state in counts)) continue

    counts[state] += 1

    if (state === 'draft') {
      drafts.push({
        id: deal.id,
        title: deal.title || 'Untitled deal draft',
        missingCount: Object.keys(validateDeal(deal, { forPublication: true }))
          .length,
      })
    }

    if (state === 'active' && deal.endDate) {
      const end = new Date(`${deal.endDate}T12:00:00`)
      if (!Number.isNaN(end.getTime())) {
        end.setHours(0, 0, 0, 0)
        const daysRemaining = Math.round((end - todayStart) / 86_400_000)
        if (daysRemaining >= 0 && daysRemaining <= ENDING_SOON_DAYS) {
          endingSoon.push({
            id: deal.id,
            title: deal.title || 'Untitled deal',
            daysRemaining,
          })
        }
      }
    }
  }

  endingSoon.sort((a, b) => a.daysRemaining - b.daysRemaining)

  return {
    counts,
    total: DEAL_STATUS_ORDER.reduce((sum, key) => sum + counts[key], 0),
    drafts,
    endingSoon,
  }
}

export function getDealMoneyCoverage(deal) {
  const redemptions = deal.redemptions
  const valued = deal.redemptionsWithTransactionValue

  if (redemptions === 0) {
    return { state: 'none', message: 'No redemptions in this period.' }
  }
  if (valued === 0) {
    return {
      state: 'missing',
      message:
        'No transaction values were recorded for these redemptions, so sales value is not available.',
    }
  }
  if (valued < redemptions) {
    return {
      state: 'partial',
      message: `Partial data: ${valued} of ${redemptions} redemptions have a recorded transaction value. Sales figures only include those and are not the deal's full sales.`,
    }
  }
  return {
    state: 'complete',
    message:
      'Every redemption in this period has a recorded transaction value.',
  }
}

export function getDealPerformanceSummary(deal) {
  if (deal.claims === 0 && deal.redemptions === 0) {
    return 'No claims or redemptions were recorded for this deal in the selected period.'
  }
  const claims = `${formatDashboardCount(deal.claims)} ${deal.claims === 1 ? 'claim' : 'claims'}`
  const redemptions = `${formatDashboardCount(deal.redemptions)} ${deal.redemptions === 1 ? 'redemption' : 'redemptions'}`
  return `${claims} and ${redemptions} were recorded in this period. ${formatDashboardPercentage(deal.claimToRedemptionRate)} of claims made in the period have been redeemed.`
}
