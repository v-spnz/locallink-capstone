import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getDealLifecycle } from '../src/features/deals/constants.js'

test('US0094: every persisted deal lifecycle status is presented accurately', () => {
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'scheduled',
        startDate: '2026-09-10',
        endDate: '2026-09-20',
      },
      '2026-09-09',
    ),
    { value: 'scheduled', label: 'Scheduled' },
  )
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'active',
        startDate: '2026-09-10',
        endDate: '2026-09-20',
      },
      '2026-09-10',
    ),
    { value: 'active', label: 'Active' },
  )
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'expired',
        startDate: '2026-09-10',
        endDate: '2026-09-20',
      },
      '2026-09-21',
    ),
    { value: 'expired', label: 'Expired' },
  )
})

test('US0094: lifecycle, discovery, claims, and history are enforced by the database', async () => {
  const [migration, databaseTest, api, modal] = await Promise.all([
    readFile(
      new URL(
        '../supabase/migrations/20260908000000_complete_deal_availability_lifecycle.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/tests/database/deal-availability-lifecycle.test.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/api/customerDeals.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealDetailModal.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /refresh_business_deal_statuses/)
  assert.match(migration, /refresh-business-deal-statuses/)
  assert.match(migration, /business_deal_status_events/)
  assert.match(migration, /primary key \(deal_id, status\)/)
  assert.match(migration, /is_business_deal_active/)
  assert.match(migration, /create table public\.business_deal_claims/)
  assert.match(migration, /create table public\.business_deal_redemptions/)
  assert.match(migration, /claim_business_deal/)
  assert.match(migration, /status = 'scheduled'/)
  assert.match(migration, /status = 'active'/)
  assert.match(migration, /status = 'expired'/)

  for (const acceptanceText of [
    'automatically becomes Active',
    'automatically becomes Expired',
    'cannot discover a Scheduled deal',
    'can discover an Active deal',
    'Expired deal is removed from consumer discovery',
    'Expired deal cannot receive a new claim',
    'existing claim remains stored after expiry',
    'existing redemption remains stored after expiry',
    'does not repeat the Active transition',
    'does not repeat the Expired transition',
  ]) {
    assert.match(databaseTest, new RegExp(acceptanceText, 'i'))
  }

  assert.match(api, /rpc\('claim_business_deal'/)
  assert.match(api, /\.lte\('start_date', today\)/)
  assert.match(api, /\.gte\('end_date', today\)/)
  assert.match(modal, /onClaim/)
  assert.match(modal, /Claim deal/)
})
