import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  sanitizeClaimLimit,
  sanitizeDealMoney,
  validateDeal,
} from '../src/features/deals/validation.js'
import {
  formatBusinessDealAddress,
  selectBusinessDealLocation,
} from '../src/features/deals/businessLocation.js'

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
  redemptionInstructions: '',
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
  const [sections, fields, offer] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealFormSections.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealFormFields.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealOfferFields.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])
  const form = sections + fields + offer

  for (const expected of [
    'Deal title',
    'Description',
    'Category',
    'Deal image',
    'Offer type',
    'Business address',
    'Start date',
    'End date',
    'Conditions',
    'Total claim limit',
    'Exclusions',
    'Redemption method',
  ]) {
    assert.match(form, new RegExp(expected, 'i'))
  }

  assert.match(form, /include GST/i)
  assert.doesNotMatch(form, /GST excluded/i)
  assert.doesNotMatch(form, /onChange\('redemptionInstructions'/)
})

test('the fixed in-store redemption method is supplied when a deal is saved', async () => {
  const [form, api] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealFormSections.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/api/businessDeals.js', import.meta.url),
      'utf8',
    ),
  ])

  assert.deepEqual(validateDeal(VALID_DEAL, { forPublication: true }), {})
  assert.match(form, /DEAL_REDEMPTION_METHOD/)
  assert.match(api, /redemption_instructions: DEAL_REDEMPTION_METHOD/)
})

test('the deal form automatically uses one concise business address', async () => {
  const [form, api, hook] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealFormSections.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
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
  ])

  const selected = selectBusinessDealLocation([
    {
      id: 'city-only',
      name: 'Auckland, AUK, New Zealand',
      address_line1: 'Auckland',
      city: 'Auckland',
      is_primary: true,
    },
    {
      id: 'street-address',
      name: '93 Panama Road',
      address_line1: '93 Panama Road',
      suburb: 'Mount Wellington',
      city: 'Maungakiekie-Tamaki',
      postcode: '1062',
      district: 'Maungakiekie-Tamaki',
      formatted_address:
        '93 Panama Road, Mount Wellington, Maungakiekie-Tamaki 1062, New Zealand',
      is_primary: false,
    },
  ])

  assert.equal(selected.id, 'street-address')
  assert.equal(
    formatBusinessDealAddress(selected),
    '93 Panama Road, Mount Wellington, Auckland 1062',
  )
  assert.match(api, /suburb, city, postcode/)
  assert.match(form, /deal-business-address/)
  assert.doesNotMatch(form, /type="checkbox"|onToggleLocation/)
  assert.match(hook, /locationIds: locations\[0\]\?\.id/)
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

test('deal management cards omit location and GST metadata', async () => {
  const [list, row, details] = await Promise.all([
    readFile(
      new URL('../src/features/deals/components/DealList.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/components/DealRow.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealDetails.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.doesNotMatch(list, /GstIncluded|locationCount/)
  assert.doesNotMatch(row, /GstIncluded|locationCount/)
  assert.doesNotMatch(
    details,
    /GstIncluded|GST treatment|Participating locations|<img|deal-detail-image/,
  )
  assert.doesNotMatch(details, /onClick=\{onClose\}[\s\S]*?>\s*Close/)
  assert.ok(details.indexOf('Delete draft') < details.indexOf('Continue draft'))
})

test('deal form sections keep draft progress, live preview, and image URL cleanup', async () => {
  const [form, overview, sections, fields] = await Promise.all([
    readFile(
      new URL('../src/features/deals/components/DealForm.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealDraftOverview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealFormSections.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/components/DealFormFields.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /URL\.createObjectURL\(deal\.imageFile\)/)
  assert.match(form, /URL\.revokeObjectURL\(previewUrl\)/)
  for (const section of ['Basics', 'Offer', 'Availability', 'Redemption']) {
    assert.match(form, new RegExp(`<Deal${section}Section`))
  }
  for (const id of [
    'deal-basics-section',
    'deal-offer-section',
    'deal-availability-section',
    'deal-redemption-section',
  ]) {
    assert.match(overview, new RegExp(id))
    assert.match(sections, new RegExp(id))
  }
  assert.match(
    overview,
    /aria-label=\{`\$\{section\.label\}, \$\{section\.isComplete \? 'filled' : 'not filled'\}`\}/,
  )
  assert.match(overview, /formatDealOffer\(deal\)/)
  assert.match(overview, /formatBusinessDealAddress\(locations\[0\]\)/)
  assert.match(overview, /getPreviewPeriod\(deal\)/)
  assert.match(fields, /onChange\(event\.target\.files\?\.\[0\] \|\| null\)/)
})

test('AC11-12: draft saving and custom unsaved-change protection are wired into the flow', async () => {
  const [form, hook, guard, page, dialog, styles] = await Promise.all([
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
    readFile(
      new URL(
        '../src/business/useUnsavedBusinessDraftGuard.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/components/ui/UnsavedChangesDialog.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/deals/BusinessCampaignWorkspace.css',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /Save Draft/)
  assert.match(
    styles,
    /grid-template-columns:\s*minmax\(0, 1fr\)\s+minmax\(240px, 280px\)/,
  )
  assert.match(styles, /\.deal-draft-rail\s*\{[\s\S]*?grid-column:\s*2/)
  assert.match(hook, /persist\('draft'\)/)
  assert.match(hook, /useUnsavedBusinessDraftGuard\(/)
  assert.match(guard, /beforeunload/)
  assert.match(guard, /document\.addEventListener\('click'/)
  assert.doesNotMatch(hook, /window\.confirm/)
  assert.match(hook, /isLeaveConfirmationOpen/)
  assert.match(page, /UnsavedChangesDialog/)
  assert.match(dialog, /Save draft/)
  assert.match(dialog, /Leave without saving/)
  assert.match(dialog, /Continue editing/)
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

test('draft deletion uses an available, manager-scoped, draft-only RPC', async () => {
  const [api, migration, databaseTest] = await Promise.all([
    readFile(
      new URL('../src/features/deals/api/businessDeals.js', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/migrations/20260913030000_delete_business_deal_drafts_safely.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/tests/database/deal-draft-deletion.test.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /rpc\('delete_business_deal'/)
  assert.match(migration, /public\.can_manage_business\(p_business_id\)/)
  assert.match(migration, /v_deal_status <> 'draft'/)
  assert.match(migration, /delete from public\.business_deals/)
  assert.match(databaseTest, /another business cannot delete the draft/)
  assert.match(databaseTest, /published lifecycle deal cannot be deleted/)
})
