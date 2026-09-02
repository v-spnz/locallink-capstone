import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  sanitizeClaimLimit,
  sanitizeDealMoney,
  validateDeal,
} from '../src/features/deals/validation.js'

const VALID_DEAL = {
  title: '20% off weekend brunch',
  description: 'Enjoy a locally made brunch at a special weekend price.',
  category: 'Food & Drink',
  imageUrl: 'https://example.test/deal.jpg',
  imageFile: null,
  offerType: 'percentage_discount',
  discountPercentage: '20',
  discountAmount: '',
  originalPrice: '',
  dealPrice: '',
  offerDetails: '',
  gstIncluded: 'included',
  locationIds: ['location-1'],
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  conditions: 'Dine-in only.',
  claimLimit: '100',
  exclusions: 'Excludes public holidays.',
  redemptionInstructions: 'Show the deal in LocalLink before ordering.',
}

test('AC1-6 and AC8-9: a complete agreed deal is valid for publication', () => {
  assert.deepEqual(validateDeal(VALID_DEAL, { forPublication: true }), {})
})

test('AC7: the end date cannot be earlier than the start date', () => {
  const errors = validateDeal(
    { ...VALID_DEAL, endDate: '2026-08-31' },
    { forPublication: true },
  )
  assert.match(errors.endDate, /cannot be earlier/i)
})

test('AC10: invalid discounts, prices, and claim limits are identified clearly', () => {
  const percentageErrors = validateDeal(
    { ...VALID_DEAL, discountPercentage: '101', claimLimit: '0' },
    { forPublication: true },
  )
  assert.match(percentageErrors.discountPercentage, /no more than 100/i)
  assert.match(percentageErrors.claimLimit, /between 1 and 1,000,000/i)

  const priceErrors = validateDeal(
    {
      ...VALID_DEAL,
      offerType: 'special_price',
      originalPrice: '40',
      dealPrice: '45',
    },
    { forPublication: true },
  )
  assert.match(priceErrors.dealPrice, /lower than the original/i)
  assert.equal(sanitizeDealMoney('$1,250.999'), '1250.99')
  assert.equal(sanitizeClaimLimit('10 claims'), '10')
})

test('AC11: an incomplete but internally valid deal can be saved as a draft', () => {
  assert.deepEqual(
    validateDeal(
      {
        ...VALID_DEAL,
        title: '',
        description: '',
        category: '',
        imageUrl: '',
        offerType: '',
        gstIncluded: '',
        locationIds: [],
        startDate: '',
        endDate: '',
        claimLimit: '',
        redemptionInstructions: '',
      },
      { forPublication: false },
    ),
    {},
  )
})

test('AC1-6 and AC8-9: the form exposes every deal draft field', async () => {
  const form = await readFile(
    new URL('../src/features/deals/components/DealForm.jsx', import.meta.url),
    'utf8',
  )

  for (const expected of [
    'Deal title',
    'Description',
    'Category',
    'Agreed deal image',
    'Offer type',
    'Locations',
    'Start date',
    'End date',
    'Conditions',
    'Total claim limit',
    'Exclusions',
    'Redemption instructions',
  ]) {
    assert.match(form, new RegExp(expected, 'i'))
  }

  assert.match(form, /include GST/i)
  assert.doesNotMatch(form, /GST excluded/i)
})

test('all deals persist as GST included', async () => {
  const [api, migration] = await Promise.all([
    readFile(
      new URL('../src/features/deals/api/businessDeals.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/migrations/20260902000000_standardise_gst_and_job_attachment_limit.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /gst_included: true/)
  assert.doesNotMatch(api, /gstIncluded === 'included'/)
  assert.match(migration, /set gst_included = true/)
  assert.match(migration, /check \(gst_included = true\)/)
})

test('AC11-12: draft saving and unsaved-change protection are wired into the flow', async () => {
  const [form, hook] = await Promise.all([
    readFile(
      new URL('../src/features/deals/components/DealForm.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/hooks/useBusinessDeals.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /Save Draft/)
  assert.match(hook, /persist\('draft'\)/)
  assert.match(hook, /beforeunload/)
  assert.match(hook, /Leave without saving your deal draft\?/)
})

test('AC13: consumer visibility is restricted to published database deals', async () => {
  const migration = await readFile(
    new URL(
      '../supabase/migrations/20260827000000_create_deal_drafts.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(migration, /Consumers can view published deals/)
  assert.match(migration, /using \(status = 'published'\)/)
  assert.match(migration, /validate_published_business_deal/)
})
