import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatLoyaltyIdentifier,
  formatLoyaltyLookupCode,
  getLoyaltyIdentifierPayload,
  isCompleteLoyaltyLookupCode,
  isCompleteLoyaltyIdentifier,
  normaliseLoyaltyIdentifier,
} from '../src/features/loyalty/loyaltyIdentifier.js'
import {
  getLoyaltyEligibilityLabel,
  getLoyaltyProgressPresentation,
} from '../src/features/loyalty/loyaltyProgress.js'

const ACTIVE_RECORD = {
  programmeType: 'visit_card',
  programmeStatus: 'active',
  currentProgress: 6,
  rewardThreshold: 8,
  rewardEligible: false,
}

test('US0109 AC1: presented loyalty identifiers are normalised and validated', () => {
  assert.equal(normaliseLoyaltyIdentifier('ll cafe 0109'), 'LLCAFE0109')
  assert.equal(formatLoyaltyIdentifier('llcafe0109'), 'LL-CAFE-0109')
  assert.equal(isCompleteLoyaltyIdentifier('LL-CAFE-0109'), true)
  assert.equal(isCompleteLoyaltyIdentifier('LL-CAFE'), false)
  assert.equal(
    normaliseLoyaltyIdentifier('locallink:loyalty-record:LLCAFE0109'),
    'LLCAFE0109',
  )
  assert.equal(
    getLoyaltyIdentifierPayload('LL-CAFE-0109'),
    'locallink:loyalty-record:LLCAFE0109',
  )
  assert.equal(formatLoyaltyLookupCode('scan01090001'), 'SCAN 0109 0001')
  assert.equal(isCompleteLoyaltyLookupCode('SCAN 0109 0001'), true)
})

test('US0109 AC3: current progress and eligibility have clear business-facing labels', () => {
  assert.deepEqual(getLoyaltyProgressPresentation(ACTIVE_RECORD), {
    progress: 6,
    target: 8,
    percentage: 75,
    progressLabel: '6 of 8 visits',
    remainingLabel: '2 visits to go',
  })
  assert.equal(getLoyaltyEligibilityLabel(ACTIVE_RECORD), 'In progress')
  assert.deepEqual(
    getLoyaltyProgressPresentation({
      ...ACTIVE_RECORD,
      programmeType: 'purchase_card',
    }),
    {
      progress: 6,
      target: 8,
      percentage: 75,
      progressLabel: '6 of 8 purchases',
      remainingLabel: '2 purchases to go',
    },
  )
  assert.equal(
    getLoyaltyEligibilityLabel({
      ...ACTIVE_RECORD,
      currentProgress: 8,
      rewardEligible: true,
    }),
    'Reward ready',
  )
})

test('US0109 AC1-3: the protected business workflow finds and presents its matching record', async () => {
  const [page, api, hook, portal, list, customerCard, customerApi, scanner] =
    await Promise.all([
      readFile(
        new URL(
          '../src/pages/business/LoyaltyCustomerLookup.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/loyalty/api/loyaltyCustomerRecords.js',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/loyalty/hooks/useLoyaltyCustomerLookup.js',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/BusinessPortal.jsx', import.meta.url),
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
          '../src/features/loyalty/components/ProgramCard.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/features/loyalty/api/loyaltyApi.js', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../src/components/ui/QrCodeScanner.jsx', import.meta.url),
        'utf8',
      ),
    ])

  assert.match(page, /Loyalty code/)
  assert.match(page, /Scan code/)
  assert.match(page, /QrCodeScanner/)
  assert.match(page, /Current progress/)
  assert.match(page, /Customer reward/)
  assert.match(page, /How customers earn/)
  assert.match(api, /lookup_business_loyalty_record/)
  assert.match(api, /p_business_id: businessId/)
  assert.match(hook, /business\.id/)
  assert.match(hook, /handleScannedCode/)
  assert.match(portal, /path="loyalty\/customers"/)
  assert.match(portal, /capability="loyalty"/)
  assert.doesNotMatch(list, /\/business\/loyalty\/customers/)
  assert.doesNotMatch(list, /Your loyalty programmes/)
  assert.doesNotMatch(list, /Prepare private drafts/)
  assert.ok(
    list.indexOf('loyalty-status-tabs') < list.indexOf('loyalty-list-actions'),
  )
  assert.match(customerCard, /QRCodeSVG/)
  assert.match(customerCard, /getLoyaltyIdentifierPayload/)
  assert.match(customerCard, /Show loyalty QR/)
  assert.match(customerCard, /createMyLoyaltyScanCode/)
  // Loyalty QR codes no longer expire (deals keep their own separate
  // 15-minute redemption window, untouched) — this guards against the
  // countdown silently coming back.
  assert.doesNotMatch(customerCard, /Code expires in/)
  assert.match(customerApi, /get_my_loyalty_records/)
  assert.match(customerApi, /create_my_loyalty_scan_code/)
  assert.match(scanner, /BarcodeDetector/)
  assert.match(scanner, /getUserMedia/)
})

test('US0105 and US0109: loyalty creation and preview reuse the Deals workspace', async () => {
  const [page, form, review] = await Promise.all([
    readFile(
      new URL('../src/pages/business/CreateLoyalty.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammeReview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(page, /CreateDeal\.css/)
  assert.match(page, /business-deals-page/)
  assert.match(form, /className="deal-form loyalty-draft-form"/)
  assert.match(form, /deal-form-workspace/)
  assert.match(form, /deal-draft-rail/)
  assert.match(form, /deal-live-preview/)
  assert.match(form, /Customer Preview/)
  assert.match(form, /Customer-presented loyalty QR/)
  assert.match(review, /placeholder-section deal-review/)
  assert.match(review, /deal-publish-confirmation/)
})

test('US0109 AC4-5: invalid and cross-business lookups disclose no record', async () => {
  const [hook, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/hooks/useLoyaltyCustomerLookup.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/migrations/20260922000000_identify_customer_loyalty_records.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(hook, /Enter the complete customer loyalty code\./)
  assert.match(hook, /No loyalty record was found for this business\./)
  assert.match(migration, /business_has_capability\(p_business_id, 'loyalty'\)/)
  assert.match(migration, /where programme\.business_id = p_business_id/)
  assert.match(
    migration,
    /where record\.customer_id = \(select auth\.uid\(\)\)/,
  )
  assert.match(migration, /get_my_loyalty_records/)
  assert.match(migration, /create_my_loyalty_scan_code/)
  assert.match(migration, /interval '15 minutes'/)
  assert.doesNotMatch(
    migration,
    /grant select[^;]*to authenticated[\s\S]*Members can view/i,
  )
})
