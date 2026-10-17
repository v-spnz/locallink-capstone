import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  formatRecordedCurrency,
  getDefaultDashboardDateRange,
  getPreviousDashboardDateRange,
  getPerformanceChange,
  getPerformanceDeals,
  groupDashboardTrends,
  hasDealActivity,
  hasLoyaltyActivity,
  hasMarketplaceActivity,
} from '../src/features/dashboard/dashboardPresentation.js'
import { groupDealsByCategory } from '../src/features/dashboard/categoryPerformance.js'

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
  assert.match(api, /get_business_dashboard_trends/)
  assert.match(api, /get_business_deal_performance/)
  assert.match(api, /get_business_loyalty_programme_performance/)
  assert.match(api, /recordedTransactionValueCents/)
  assert.match(api, /redemptionsWithTransactionValue/)
  assert.match(hook, /useBusiness/)
  assert.match(hook, /Promise\.allSettled/)
  assert.match(hook, /getPreviousDashboardDateRange/)
  assert.match(hook, /fetchBusinessDashboardTrends\(options\)/)
  assert.match(hook, /businessId: business\.id/)
  assert.match(dashboard, /useBusinessDashboardAnalytics/)
  assert.match(dashboard, /trends=\{trends\}/)
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
  assert.deepEqual(
    getDefaultDashboardDateRange(new Date('2026-09-24T12:00:00.000Z'), 7),
    { startDate: '2026-09-19', endDate: '2026-09-25' },
  )
})

test('previous reporting periods retain the same Auckland calendar-day length', () => {
  assert.deepEqual(
    getPreviousDashboardDateRange({ startDate: '2026-09-25', endDate: '2026-10-04' }),
    { startDate: '2026-09-15', endDate: '2026-09-24' },
  )
  assert.deepEqual(
    getPreviousDashboardDateRange({ startDate: '2026-04-04', endDate: '2026-04-04' }),
    { startDate: '2026-04-03', endDate: '2026-04-03' },
  )
})

test('trend buckets preserve empty days and unknown sale amounts', () => {
  const points = groupDashboardTrends([
    { date: '2026-10-01', claims: 2, redemptions: 0, valuedRedemptions: 0, recordedValueCents: null },
    { date: '2026-10-03', claims: 0, redemptions: 1, valuedRedemptions: 0, recordedValueCents: null },
    { date: '2026-10-04', claims: 0, redemptions: 1, valuedRedemptions: 1, recordedValueCents: 4900 },
  ], { startDate: '2026-10-01', endDate: '2026-10-04' })
  assert.deepEqual(points.map(({ claims, redemptions, recordedValueCents }) => [claims, redemptions, recordedValueCents]), [
    [2, 0, 0], [0, 0, 0], [0, 1, null], [0, 1, 4900],
  ])
  assert.equal(groupDashboardTrends([], { startDate: '2026-09-01', endDate: '2026-10-15' }).length, 7)
  assert.equal(groupDashboardTrends([], { startDate: '2026-01-15', endDate: '2026-09-15' }).length, 9)
})

test('trend charts show values in a chart tooltip and keep smaller date labels', async () => {
  const [chart, styles] = await Promise.all([
    readFile(new URL('../src/features/dashboard/components/PerformanceTrends.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/dashboard/Dashboard.css', import.meta.url), 'utf8'),
  ])

  assert.match(chart, /useState\(null\)/)
  assert.match(chart, /targetWidth = points\.length === 1 \? 520 : 520 \/ \(points\.length - 1\)/)
  assert.match(chart, /onPointerEnter=\{\(\) => setSelected\(index\)\}/)
  assert.match(chart, /onPointerLeave=\{\(event\) => \{[\s\S]*?setSelected\(null\)/)
  assert.match(chart, /className="business-trend-tooltip"/)
  assert.match(chart, /active\.recordedValueCents == null[\s\S]*?'Not recorded'/)
  assert.doesNotMatch(chart, /business-trend-detail/)
  assert.match(styles, /\.business-trend-date \{\s*font-size: 15px;/)
})

test('metric changes distinguish improvement, decline, no change and unavailable data', () => {
  assert.deepEqual(getPerformanceChange(12, 10), { direction: 'up', label: '20% vs previous period' })
  assert.deepEqual(getPerformanceChange(8, 10), { direction: 'down', label: '20% vs previous period' })
  assert.deepEqual(getPerformanceChange(10, 10), { direction: 'same', label: 'Unchanged vs previous period' })
  assert.deepEqual(getPerformanceChange(2, 0), { direction: 'up', label: 'New activity vs previous period' })
  assert.deepEqual(getPerformanceChange(37.5, 25, true), { direction: 'up', label: '12.5 percentage points vs previous period' })
  assert.equal(getPerformanceChange(0, 0), null)
  assert.equal(getPerformanceChange(null, 10), null)
  assert.equal(getPerformanceChange(100, null), null)
})

test('performance views exclude draft and scheduled deals', () => {
  const published = { status: 'active', claims: 3 }
  const ineligible = [{ status: 'draft', claims: 0 }, { status: 'scheduled', claims: 0 }]
  assert.deepEqual(getPerformanceDeals([...ineligible, published]), [published])
  assert.deepEqual(getPerformanceDeals(ineligible), [])
})

test('dashboard values format real zeroes while unknown sales stay unavailable', () => {
  assert.equal(formatDashboardCount(0), '0')
  assert.equal(formatDashboardCount(1234), '1,234')
  assert.equal(formatDashboardPercentage(0), '0%')
  assert.equal(formatDashboardPercentage(47.25), '47.3%')
  assert.equal(formatRecordedCurrency(4875), '$48.75')
  assert.equal(formatRecordedCurrency(null), null)
})

test('category distribution counts published deals independently of period activity', () => {
  const deal = (category, claims, cohort, status = 'published') => ({
    status,
    category,
    claims,
    redemptions: 0,
    claimCohortRedemptions: cohort,
  })
  const deals = [
    deal('Retail', 2, 0),
    deal('Retail', 0, 0),
    deal('Services', 1, 1),
    deal('Other', 0, 0, 'draft'),
    deal('Retail', 0, 0, 'scheduled'),
  ]

  assert.deepEqual(groupDealsByCategory([]), [])
  assert.deepEqual(groupDealsByCategory(deals.slice(3)), [])
  assert.equal(groupDealsByCategory(deals.slice(0, 2)).length, 1)
  assert.equal(groupDealsByCategory(deals.slice(0, 1))[0].deals.length, 1)
  assert.deepEqual(
    groupDealsByCategory(deals.slice(0, 2)).map((group) => group.deals.length),
    [2],
  )

  const groups = groupDealsByCategory(deals)
  assert.equal(groups.length, 2)
  assert.deepEqual(
    groups.map((group) => [
      group.category,
      group.deals.length,
      group.claims,
      group.redemptions,
    ]),
    [
      ['Retail', 2, 2, 0],
      ['Services', 1, 1, 0],
    ],
  )
  assert.equal(groups[0].conversion, 0)
  assert.equal(groups[1].conversion, 1)
})

test('category performance only appears for multiple categories and keeps drill-downs', async () => {
  const [dashboard, category, deal] = await Promise.all([
    readFile(new URL('../src/pages/business/Dashboard.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/dashboard/components/CategoryPerformanceSection.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/features/dashboard/components/DealPerformanceSection.jsx', import.meta.url), 'utf8'),
  ])

  assert.match(dashboard, /categoryGroups = groupDealsByCategory\(dealPerformance\)/)
  assert.match(dashboard, /categoryGroups\.length > 1 && \(\s*<CategoryPerformanceSection\s+groups=\{categoryGroups\}/)
  assert.match(dashboard, /<DealPerformanceSection\s+deals=\{dealPerformance\}\s+period=\{analyticsPeriod\}/)
  assert.match(category, /<CategoryDonut/)
  assert.match(category, /onClick=\{\(\) => toggleCategory\(group\.category\)\}/)
  assert.match(category, /onClick=\{\(\) => onSelect\(deal\.dealId\)\}/)
  assert.match(deal, /visibleDeals = showAll \? rankedDeals : rankedDeals\.slice\(0, 3\)/)
  assert.match(deal, /onClick=\{\(\) => onSelect\(deal\.dealId\)\}/)
})

test('deal details keep the heading, back action and metrics inside one card', async () => {
  const [deal, dashboard] = await Promise.all([
    readFile(new URL('../src/features/dashboard/components/DealPerformanceSection.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/business/Dashboard.jsx', import.meta.url), 'utf8'),
  ])
  const card = deal.slice(deal.indexOf('<article className="business-performance-card is-deals">'))

  assert.match(dashboard, /onBack=\{clearSelectedDeal\}/)
  assert.match(dashboard, /next\.delete\('deal'\)/)
  assert.match(card, /business-deal-perf-detail-heading/)
  assert.match(card, /aria-label="Back to dashboard"\s+onClick=\{onBack\}/)
  assert.match(card, /<ArrowLeft aria-hidden="true" \/>\s*<\/button>/)
  assert.ok(card.indexOf('business-deal-perf-title') < card.indexOf('business-deal-perf-summary'))
  assert.ok(card.indexOf('business-deal-perf-summary') < card.indexOf('business-performance-metrics'))
  assert.ok(card.indexOf('business-performance-metrics') < card.indexOf('business-deal-perf-coverage'))
})

test('deal comparison bars use one count scale and retain conversion', async () => {
  const deal = await readFile(new URL('../src/features/dashboard/components/DealPerformanceSection.jsx', import.meta.url), 'utf8')

  assert.match(deal, /largestCount = rankedDeals\.reduce\([\s\S]*?Math\.max\(maximum, deal\.claims, deal\.redemptions\),\s*1,/)
  assert.match(deal, /width: `\$\{\(deal\.claims \/ largestCount\) \* 100\}%`/)
  assert.match(deal, /width: `\$\{\(deal\.redemptions \/ largestCount\) \* 100\}%`/)
  assert.match(deal, /formatDashboardCount\(deal\.claims\)/)
  assert.match(deal, /formatDashboardCount\(deal\.redemptions\)/)
  assert.match(deal, /formatDashboardPercentage\(deal\.claimToRedemptionRate\)/)
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

test('deal comparison uses the selected reporting period and shows separate measures', async () => {
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

  assert.match(
    dashboard,
    /getDefaultDashboardDateRange\(new Date\(\), reportingDays\)/,
  )
  assert.match(performance, /Compare your deals/)
  assert.match(performance, /deal\.claims/)
  assert.match(performance, /deal\.redemptions/)
  assert.match(performance, /deal\.claimToRedemptionRate/)
  assert.match(performance, /deal\.recordedTransactionValueCents/)
  assert.match(performance, /deal\.recordedCustomerSavingsCents/)
  assert.doesNotMatch(performance, /Best deal|top performing/i)
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
  assert.match(dashboard, /<header className="business-dashboard-title">\s*<h1>Business dashboard<\/h1>/)
  assert.doesNotMatch(dashboard, /DashboardHeader/)
  assert.match(dashboard, /capabilities\.deals_enabled &&\s*!dealsLoading/)
  assert.match(dashboard, /<DealStatusOverview summary=\{dealSummary\}/)
  assert.ok(dashboard.indexOf('<DealStatusOverview') < dashboard.indexOf('<PerformanceOverview'))
  assert.match(status, /DEAL_STATUS_ORDER\.map/)
  assert.match(status, /summary\.counts\[state\]/)
  assert.match(status, /summary\.endingSoon\.length/)
  assert.match(status, /summary\.drafts\.slice\(0, 2\)/)
  assert.match(status, /summary\.drafts\.length > 2/)
  assert.match(status, /View all \{summary\.drafts\.length\} drafts/)
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
