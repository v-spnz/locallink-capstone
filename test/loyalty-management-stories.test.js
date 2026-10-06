import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const MIGRATION_URL = new URL(
  '../supabase/migrations/20260927000000_complete_loyalty_management_stories.sql',
  import.meta.url,
)

test('US0108: one database-backed list presents every business programme', async () => {
  const [api, hook, list, row] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/api/businessLoyalty.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/hooks/useBusinessLoyaltyProgrammes.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftList.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammeRow.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /from\('business_loyalty_programmes'\)/)
  assert.match(api, /eq\('business_id', businessId\)/)
  assert.match(hook, /fetchBusinessLoyaltyProgrammes\(business\.id\)/)
  assert.equal(list.match(/programmes\.map\(/g)?.length, 1)
  assert.match(list, /<LoyaltyProgrammeRow/)
  assert.match(row, /deal-management-card loyalty-programme-row/)
  assert.match(row, /loyalty-join-code/)
})

test('US0106: inactive programmes reject progress and redemption in the database and UI', async () => {
  const [migration, lookup] = await Promise.all([
    readFile(MIGRATION_URL, 'utf8'),
    readFile(
      new URL(
        '../src/pages/business/LoyaltyCustomerLookup.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.equal(migration.match(/v_programme_status <> 'active'/g)?.length, 2)
  assert.equal(migration.match(/Loyalty programme is not active/g)?.length, 2)
  assert.match(lookup, /record\.programmeStatus === 'active'/)
  assert.match(lookup, /Progress and rewards cannot be\s+recorded\./)
  assert.match(lookup, /disabled=\{!isProgrammeActive \|\| isAddingStamp\}/)
})

test('US0112: real progress and redemption events feed the business activity view', async () => {
  const [migration, api, page, lookupHook] = await Promise.all([
    readFile(MIGRATION_URL, 'utf8'),
    readFile(
      new URL(
        '../src/features/loyalty/api/loyaltyActivityApi.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/CreateLoyalty.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/hooks/useLoyaltyCustomerLookup.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /get_business_loyalty_activity/)
  assert.match(migration, /business_has_capability\(p_business_id, 'loyalty'\)/)
  assert.match(migration, /'progress_added'/)
  assert.match(migration, /'reward_earned'/)
  assert.match(migration, /'reward_redeemed'/)
  assert.match(api, /rpc\('get_business_loyalty_activity'/)
  assert.doesNotMatch(api, /from\('loyalty_activity'\)/)
  assert.match(page, /onActivityRecorded=\{activity\.loadActivity\}/)
  assert.equal(lookupHook.match(/onActivityRecorded\?\.\(\)/g)?.length, 2)
})
