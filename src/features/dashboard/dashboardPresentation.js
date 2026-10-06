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
