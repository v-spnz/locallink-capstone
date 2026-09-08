import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getDealLifecycle } from '../src/features/deals/constants.js'

test('US0091: a published future deal is Scheduled', () => {
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'published',
        startDate: '2026-09-05',
        endDate: '2026-09-30',
      },
      '2026-09-04',
    ),
    { value: 'scheduled', label: 'Scheduled' },
  )
})

test('US0091: a published deal whose start date has been reached is Active', () => {
  assert.deepEqual(
    getDealLifecycle(
      {
        status: 'published',
        startDate: '2026-09-04',
        endDate: '2026-09-30',
      },
      '2026-09-04',
    ),
    { value: 'active', label: 'Active' },
  )
})

test('US0091: draft and ended deals have accurate business-facing statuses', () => {
  assert.equal(
    getDealLifecycle({ status: 'draft' }, '2026-09-04').label,
    'Draft',
  )
  assert.equal(
    getDealLifecycle(
      {
        status: 'published',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      },
      '2026-09-04',
    ).label,
    'Expired',
  )
})

test('US0091: preview includes the consumer-facing details and an explicit confirmation', async () => {
  const review = await readFile(
    new URL('../src/features/deals/components/DealReview.jsx', import.meta.url),
    'utf8',
  )

  for (const expected of [
    'Deal title',
    'Description',
    'Offer',
    'Business address',
    'Deal period',
    'Conditions',
    'Redemption instructions',
  ]) {
    assert.match(review, new RegExp(expected, 'i'))
  }

  assert.match(review, /Publish this deal\?/)
  assert.match(review, /Continue editing/)
  assert.match(review, /Publish deal/)
  assert.match(review, /onBack\(\)/)
})

test('US0091: publication is atomic and guarded against repeated submissions', async () => {
  const [api, hook, migration] = await Promise.all([
    readFile(
      new URL('../src/features/deals/api/businessDeals.js', import.meta.url),
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
      new URL(
        '../supabase/migrations/20260904000000_publish_business_deals_atomically.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /rpc\(\s*['"]save_business_deal['"]/)
  assert.doesNotMatch(api, /\.delete\(\)[\s\S]+business_deal_locations/)
  assert.match(hook, /saveInProgressRef\.current/)
  assert.match(hook, /crypto\.randomUUID\(\)/)
  assert.match(hook, /setForm\(dealForSave\)/)
  assert.match(migration, /returns uuid[\s\S]+language plpgsql/)
  assert.match(migration, /set status = 'published'/)
})

test('US0091: successful publication announces a clear lifecycle status', async () => {
  const [hook, list] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/hooks/useBusinessDeals.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/components/DealList.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(hook, /Deal published successfully\. Status:/)
  assert.match(list, /role="status"/)
  assert.match(list, /getDealLifecycle\(deal\)/)
})

test('business deals uses an accessible campaign manager with responsive loading feedback', async () => {
  const [list, page] = await Promise.all([
    readFile(
      new URL('../src/features/deals/components/DealList.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(list, /Campaign manager/)
  assert.match(list, /aria-label="Filter deals"/)
  assert.match(list, /aria-pressed=/)
  assert.match(list, /Ending soon/)
  assert.match(list, /deal-campaign-table/)
  assert.match(page, /<DealListSkeleton \/>/)
})
