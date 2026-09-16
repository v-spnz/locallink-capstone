import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  DEAL_STATUS_FILTERS,
  getDealLifecycle,
  matchesDealStatusFilter,
} from '../src/features/deals/constants.js'

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

test('business deal filters open on Draft and group terminal deals in History', async () => {
  const list = await readFile(
    new URL('../src/features/deals/components/DealList.jsx', import.meta.url),
    'utf8',
  )

  assert.deepEqual(DEAL_STATUS_FILTERS, [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'history', label: 'History' },
    { value: 'all', label: 'All' },
  ])
  assert.equal(matchesDealStatusFilter('expired', 'history'), true)
  assert.equal(matchesDealStatusFilter('ended-early', 'history'), true)
  assert.equal(matchesDealStatusFilter('active', 'history'), false)
  assert.match(list, /useState\('draft'\)/)
  assert.match(list, /OVERFLOW_FILTER_VALUES = \['history', 'all'\]/)
  assert.doesNotMatch(list, /deal-filters-pill/)
  assert.match(list, /DEALS_PER_PAGE = 5/)
  assert.match(list, /visibleRecords\.slice\(0, visibleDealCount\)/)
  assert.match(list, /Show more/)
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
    'Redemption method',
  ]) {
    assert.match(review, new RegExp(expected, 'i'))
  }

  assert.match(review, /Publish this deal\?/)
  assert.match(review, /Continue editing/)
  assert.match(review, /Publish deal/)
  assert.match(review, /onBack\(\)/)
})

test('US0091: review images keep local uploads available and crop every ratio consistently', async () => {
  const [review, styles] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealReview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/CreateDeal.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(review, /useLayoutEffect/)
  assert.match(review, /previewImageRef\.current\.src = objectUrl/)
  assert.match(review, /URL\.revokeObjectURL\(objectUrl\)/)
  assert.match(
    styles,
    /\.deal-review-image-frame \{[\s\S]*?height: clamp\([\s\S]*?overflow: hidden/,
  )
  assert.match(
    styles,
    /\.deal-review-image \{[\s\S]*?height: 100%[\s\S]*?object-fit: cover/,
  )
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
  const [hook, page] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/hooks/useBusinessDeals.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(hook, /Deal published\. Status:/)
  assert.match(hook, /Deal saved as draft\./)
  assert.match(page, /<ActionToast/)
})

test('business deals uses accessible management controls with responsive loading feedback', async () => {
  const [list, page, styles] = await Promise.all([
    readFile(
      new URL('../src/features/deals/components/DealList.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessPortal.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.doesNotMatch(list, /Campaign manager/)
  assert.match(list, /aria-label="Filter deals"/)
  assert.match(list, /aria-pressed=/)
  assert.match(list, /deal-filter-actions[\s\S]*?New deal/)
  assert.match(list, /deal-list-pagination[\s\S]*?Showing[\s\S]*?Show more/)
  assert.match(styles, /\.deal-filter-bar \{[\s\S]*?align-items: flex-start/)
  assert.match(list, /Ending soon/)
  assert.match(list, /deal-campaign-table/)
  assert.match(page, /<DealListSkeleton \/>/)
  assert.match(styles, /\.deal-card-list \{[\s\S]*?gap: 16px/)
  assert.match(
    styles,
    /\.deal-management-card \{[\s\S]*?border: 1px solid var\(--business-border\)[\s\S]*?border-radius: var\(--business-radius-card\)/,
  )
  assert.doesNotMatch(
    styles,
    /body\.business-surface \.deal-list-panel \{[\s\S]*?background: transparent/,
  )
})
