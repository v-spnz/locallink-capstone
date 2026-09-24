import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const ANALYTICS_MIGRATION_URL = new URL(
  '../supabase/migrations/20260924030000_add_business_dashboard_analytics_rpcs.sql',
  import.meta.url,
)
const DEAL_VALUES_MIGRATION_URL = new URL(
  '../supabase/migrations/20260924000000_add_deal_redemption_value_fields.sql',
  import.meta.url,
)

test('dashboard analytics use a feature API and hook without changing the dashboard UI', async () => {
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
  assert.doesNotMatch(dashboard, /useBusinessDashboardAnalytics/)
  assert.doesNotMatch(dashboard, /get_business_dashboard_metrics/)
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
