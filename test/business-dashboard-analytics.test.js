import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  DASHBOARD_REPORTING_PERIODS,
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  formatRecordedCurrency,
  getDashboardDateRange,
  getDashboardDateRangeError,
  getDefaultDashboardDateRange,
  hasDealActivity,
  hasLoyaltyActivity,
  hasMarketplaceActivity,
} from '../src/features/dashboard/dashboardPresentation.js'

const ANALYTICS_MIGRATION_URL = new URL(
  '../supabase/migrations/20260924030000_add_business_dashboard_analytics_rpcs.sql',
  import.meta.url,
)
const DEAL_VALUES_MIGRATION_URL = new URL(
  '../supabase/migrations/20260924000000_add_deal_redemption_value_fields.sql',
  import.meta.url,
)

test('dashboard analytics use the feature API and business-scoped hook', async () => {
  const [api, hook, dashboard] = await Promise.all([
    readFile(
      new URL(
        '../src/features/dashboard/api/businessDashboard.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/dashboard/hooks/useBusinessDashboardAnalytics.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(api, /get_business_dashboard_metrics/)
  assert.match(api, /get_business_deal_performance/)
  assert.match(api, /get_business_loyalty_programme_performance/)
  assert.match(api, /recordedTransactionValueCents/)
  assert.match(api, /redemptionsWithTransactionValue/)
  assert.match(hook, /useBusiness/)
  assert.match(hook, /Promise\.all/)
  assert.match(hook, /businessId: business\.id/)
  assert.match(dashboard, /useBusinessDashboardAnalytics/)
  assert.doesNotMatch(dashboard, /get_business_dashboard_metrics/)
})

test('the dashboard uses an inclusive 30-day Auckland reporting period', () => {
  const period = getDefaultDashboardDateRange(
    new Date('2026-09-24T12:00:00.000Z'),
  )

  assert.deepEqual(period, {
    startDate: '2026-08-27',
    endDate: '2026-09-25',
  })
  assert.equal(formatDashboardDateRange(period), '27 Aug 2026 – 25 Sept 2026')
})

test('reporting-period presets produce inclusive Auckland date ranges', () => {
  const referenceDate = new Date('2026-09-24T12:00:00.000Z')

  assert.deepEqual(getDashboardDateRange('last-7-days', referenceDate), {
    startDate: '2026-09-19',
    endDate: '2026-09-25',
  })
  assert.deepEqual(getDashboardDateRange('last-30-days', referenceDate), {
    startDate: '2026-08-27',
    endDate: '2026-09-25',
  })
  assert.deepEqual(getDashboardDateRange('last-6-months', referenceDate), {
    startDate: '2026-03-26',
    endDate: '2026-09-25',
  })
  assert.deepEqual(getDashboardDateRange('last-12-months', referenceDate), {
    startDate: '2025-09-26',
    endDate: '2026-09-25',
  })
  assert.deepEqual(
    DASHBOARD_REPORTING_PERIODS.map(({ label }) => label),
    [
      'Last 7 days',
      'Last 30 days',
      'Last 6 months',
      'Last 12 months',
      'Custom range',
    ],
  )
})

test('custom reporting ranges require valid chronological dates', () => {
  assert.equal(
    getDashboardDateRangeError({ startDate: '', endDate: '2026-09-25' }),
    'Choose both a start date and an end date.',
  )
  assert.equal(
    getDashboardDateRangeError({
      startDate: '2026-09-26',
      endDate: '2026-09-25',
    }),
    'End date cannot be earlier than the start date.',
  )
  assert.equal(
    getDashboardDateRangeError({
      startDate: '2026-09-01',
      endDate: '2026-09-25',
    }),
    '',
  )
})

test('the dashboard applies one selected period to every historical metric', async () => {
  const dashboard = await readFile(
    new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
    'utf8',
  )

  assert.match(dashboard, /<select[\s\S]*?aria-label="Reporting period"/)
  assert.match(dashboard, /DASHBOARD_REPORTING_PERIODS\.map/)
  assert.match(dashboard, /reportingPeriod === 'custom'/)
  assert.match(dashboard, /type="date"/)
  assert.match(dashboard, /min=\{customPeriod\.startDate/)
  assert.match(dashboard, /getDashboardDateRangeError\(customPeriod\)/)
  assert.match(dashboard, /setAnalyticsPeriod\(customPeriod\)/)
  assert.match(dashboard, /useBusinessDashboardAnalytics\(analyticsPeriod\)/)
})

test('current deal statuses are explicitly separated from period activity', async () => {
  const dashboard = await readFile(
    new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
    'utf8',
  )

  assert.match(dashboard, /Current deal status/)
  assert.match(dashboard, /Live totals, not affected by the reporting period\./)
  assert.match(dashboard, /\['Total deals', metrics\.totalDeals\]/)
  assert.match(dashboard, /metrics\.activeDeals/)
  assert.match(dashboard, /metrics\.scheduledDeals/)
  assert.match(dashboard, /metrics\.draftDeals/)
  assert.match(dashboard, /metrics\.expiredDeals/)
})

test('dashboard values format real zeroes while unknown sales stay unavailable', () => {
  assert.equal(formatDashboardCount(0), '0')
  assert.equal(formatDashboardCount(1234), '1,234')
  assert.equal(formatDashboardPercentage(0), '0%')
  assert.equal(formatDashboardPercentage(47.25), '47.3%')
  assert.equal(formatRecordedCurrency(4875), '$48.75')
  assert.equal(formatRecordedCurrency(null), null)
})

test('empty-state helpers use actual activity rather than sample data', () => {
  assert.equal(
    hasDealActivity({
      dealClaims: 0,
      dealRedemptions: 0,
      recordedTransactionValueCents: null,
    }),
    false,
  )
  assert.equal(hasDealActivity({ dealClaims: 1 }), true)
  assert.equal(hasLoyaltyActivity({ loyaltyActivityEvents: 0 }), false)
  assert.equal(hasLoyaltyActivity({ loyaltyActivityEvents: 2 }), true)
  assert.equal(
    hasMarketplaceActivity({
      marketplaceMatchedLeads: 0,
      marketplaceQuotesSubmitted: 0,
      marketplaceJobsWon: 0,
      marketplaceCompletedJobs: 0,
    }),
    false,
  )
  assert.equal(hasMarketplaceActivity({ marketplaceMatchedLeads: 1 }), true)
})

test('the dashboard only renders performance sections for enabled capabilities', async () => {
  const dashboard = await readFile(
    new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
    'utf8',
  )

  assert.match(
    dashboard,
    /capabilities\.deals_enabled && \([\s\S]*?title="Deals & Discovery"/,
  )
  assert.match(
    dashboard,
    /capabilities\.loyalty_enabled && \([\s\S]*?title="Loyalty"/,
  )
  assert.match(
    dashboard,
    /capabilities\.service_marketplace_enabled && \([\s\S]*?title="Service Marketplace"/,
  )
  assert.match(dashboard, /label="Claims"/)
  assert.match(dashboard, /label="Redemptions"/)
  assert.match(dashboard, /label="Recorded sales value"/)
  assert.match(dashboard, /label="Loyalty customers"/)
  assert.match(dashboard, /label="Matched leads"/)
  assert.match(dashboard, /label="Quotes submitted"/)
  assert.match(dashboard, /label="Jobs won"/)
})

test('the dashboard provides loading, retry, zero, and unknown-value states', async () => {
  const dashboard = await readFile(
    new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
    'utf8',
  )

  assert.match(dashboard, /PerformanceSkeleton/)
  assert.match(dashboard, /Performance information is unavailable/)
  assert.match(dashboard, /Try again/)
  assert.match(dashboard, /Not recorded/)
  assert.match(dashboard, /No deal claims or redemptions were recorded/)
  assert.match(dashboard, /No loyalty activity was recorded/)
  assert.match(dashboard, /No marketplace leads, quotes or jobs were recorded/)
  assert.doesNotMatch(dashboard, /sample data|mock data/i)
})

test('analytics preserve unknown transaction values and expose raw deal measures', async () => {
  const [api, analyticsMigration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/dashboard/api/businessDashboard.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(ANALYTICS_MIGRATION_URL, 'utf8'),
  ])

  assert.match(api, /value == null \? null : Number\(value\)/)
  assert.match(
    analyticsMigration,
    /sum\(redemption\.transaction_amount_cents\)/,
  )
  assert.match(
    analyticsMigration,
    /avg\(redemption\.transaction_amount_cents\)/,
  )
  assert.match(
    analyticsMigration,
    /count\(redemption\.transaction_amount_cents\)/,
  )
  assert.match(analyticsMigration, /claim_cohort_redemptions/)
  assert.doesNotMatch(
    analyticsMigration,
    /profit|return_on_investment|\broi\b/i,
  )
  assert.doesNotMatch(analyticsMigration, /best.perform|rank\s*\(/i)
})

test('analytics RPCs enforce membership and Auckland date semantics', async () => {
  const migration = await readFile(ANALYTICS_MIGRATION_URL, 'utf8')

  assert.match(migration, /auth\.uid\(\) is null/)
  assert.match(migration, /is_business_member\(p_business_id\)/)
  assert.match(migration, /security definer/gi)
  assert.match(migration, /set search_path = ''/gi)
  assert.match(migration, /at time zone 'Pacific\/Auckland'/g)
  assert.match(migration, /p_end_date \+ 1/)
  assert.match(migration, /then 0::numeric/)
})

test('deal redemption values remain optional and the existing API call stays compatible', async () => {
  const [migration, api] = await Promise.all([
    readFile(DEAL_VALUES_MIGRATION_URL, 'utf8'),
    readFile(
      new URL(
        '../src/features/deals/api/businessDealRedemptions.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /transaction_amount_cents integer/)
  assert.match(migration, /savings_amount_cents integer/)
  assert.doesNotMatch(migration, /transaction_amount_cents integer not null/)
  assert.match(migration, /p_transaction_amount_cents integer default null/)
  assert.match(api, /transactionAmountCents = null/)
  assert.match(api, /savingsAmountCents = null/)
})
