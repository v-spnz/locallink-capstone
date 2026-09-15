import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getDealLifecycle } from '../src/features/deals/constants.js'

const MIGRATION_URL = new URL(
  '../supabase/migrations/20260910000000_end_active_business_deals_safely.sql',
  import.meta.url,
)
const DATABASE_TEST_URL = new URL(
  '../supabase/tests/database/deal-ending.test.sql',
  import.meta.url,
)

test('US0096: Ended Early is a distinct terminal deal status', () => {
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'ended_early',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      },
      '2026-09-10',
    ),
    { value: 'ended-early', label: 'Ended Early' },
  )
})

test('US0096: business UI checks claims and requires explicit confirmation', async () => {
  const [details, hook, api] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealDetails.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/hooks/useBusinessDeals.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/api/businessDeals.js', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(details, /End this active deal\?/)
  assert.match(details, /Keep deal active/)
  assert.match(details, /End deal now/)
  assert.match(details, /Checking existing claims/)
  assert.match(details, /Claims remain redeemable under the original terms/)
  assert.match(details, /No customer notifications will be sent/)
  assert.match(api, /rpc\('get_business_deal_end_summary'/)
  assert.match(api, /rpc\('end_business_deal'/)
  assert.match(hook, /endInProgressRef\.current/)
})

test('US0096: ending is atomic, retains history, and only notifies claimants', async () => {
  const [migration, databaseTest] = await Promise.all([
    readFile(MIGRATION_URL, 'utf8'),
    readFile(DATABASE_TEST_URL, 'utf8'),
  ])

  assert.match(migration, /for update/)
  assert.match(migration, /set status = 'ended_early', ended_at = v_ended_at/)
  assert.match(migration, /notification_type[\s\S]*'deal_ended'/)
  assert.match(migration, /Your existing claim remains redeemable/)
  assert.doesNotMatch(migration, /delete from public\.business_deal_claims/)
  assert.doesNotMatch(
    migration,
    /delete from public\.business_deal_redemptions/,
  )

  for (const acceptanceText of [
    'removed from consumer discovery immediately',
    'immediately prevents new claims',
    'not permanently deleted',
    'existing claim remains stored',
    'customer with an existing claim receives one notification',
    'notification explains that the claim remains redeemable',
    'redemption record remains available',
    'date and time the deal ended are recorded',
    'without claims creates no customer notifications',
  ]) {
    assert.match(databaseTest, new RegExp(acceptanceText, 'i'))
  }
})

test('US0096: customers retain access to ended claims and their notification opens them', async () => {
  const [dealsPage, customerApi, navigation, migration] = await Promise.all([
    readFile(
      new URL('../src/pages/customer/Deals.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/api/customerDeals.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/components/navigation/CustomerNavigation.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(MIGRATION_URL, 'utf8'),
  ])

  assert.match(customerApi, /rpc\('get_my_business_deal_claims'/)
  assert.match(dealsPage, /Claim history/)
  assert.match(dealsPage, /Claim remains redeemable/)
  assert.match(dealsPage, /URLSearchParams[\s\S]*?\.get\(\s*'claim',?\s*\)/)
  assert.match(navigation, /deal_ended: BadgePercent/)
  assert.match(migration, /'\/deals\?claim=' \|\| v_deal\.id/)
})
