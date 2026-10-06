import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  formatRecordedCurrency,
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
  const [dashboard, performance] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/dashboard/components/PerformanceOverview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(dashboard, /<PerformanceOverview/)
  assert.match(dashboard, /capabilities=\{capabilities\}/)
  assert.match(
    performance,
    /capabilities\.deals_enabled && \([\s\S]*?title="Deals & Discovery"/,
  )
  assert.match(
    performance,
    /capabilities\.loyalty_enabled && \([\s\S]*?title="Loyalty"/,
  )
  assert.match(
    performance,
    /capabilities\.service_marketplace_enabled && \([\s\S]*?title="Service Marketplace"/,
  )
  for (const label of [
    'Claims',
    'Redemptions',
    'Claim conversion',
    'Recorded sales value',
    'Average transaction value',
    'Deal customers',
    'Recorded customer savings',
    'Loyalty customers',
    'Active customers',
    'Activity events',
    'Rewards earned',
    'Rewards redeemed',
    'Matched leads',
    'Quotes submitted',
    'Jobs won',
    'Completed jobs',
    'Lead to quote',
    'Lead to job',
  ]) {
    assert.match(performance, new RegExp(`label="${label}"`))
  }
})

test('the dashboard provides loading, retry, zero, and unknown-value states', async () => {
  const [dashboard, performance] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/dashboard/components/PerformanceOverview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(dashboard, /recordedTransactionValueCents/)
  assert.match(dashboard, /averageRecordedTransactionCents/)
  assert.match(dashboard, /recordedCustomerSavingsCents/)
  assert.match(dashboard, /<PerformanceOverview/)
  assert.match(performance, /PerformanceSkeleton/)
  assert.match(performance, /Performance information is unavailable/)
  assert.match(performance, /Try again/)
  assert.match(performance, /disabled=\{isLoading\}/)
  assert.match(performance, /Not recorded/)
  assert.match(performance, /redemptionsWithTransactionValue/)
  assert.match(
    performance,
    /These figures are not total revenue, profit, ROI, or guaranteed additional revenue\./,
  )
  assert.match(performance, /No deal claims or redemptions were recorded/)
  assert.match(performance, /No loyalty activity was recorded/)
  assert.match(
    performance,
    /No marketplace leads, quotes or jobs were recorded/,
  )
  assert.match(performance, /No business tools are enabled/)
  assert.doesNotMatch(performance, /sample data|mock data/i)
})

test('deal status keeps lifecycle counts, ending-soon state and unfinished drafts', async () => {
  const [dashboard, status] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/dashboard/components/DealStatusOverview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(dashboard, /getDealStatusSummary\(deals\)/)
  assert.match(dashboard, /capabilities\.deals_enabled/)
  assert.match(dashboard, /<DealStatusOverview summary=\{dealSummary\}/)
  assert.match(status, /DEAL_STATUS_ORDER\.map/)
  assert.match(status, /summary\.counts\[state\]/)
  assert.match(status, /summary\.endingSoon\.length/)
  assert.match(status, /summary\.drafts\.slice\(0, 5\)/)
  assert.match(status, /Unfinished drafts/)
  assert.match(status, /to="\/business\/create-deal"/)
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
