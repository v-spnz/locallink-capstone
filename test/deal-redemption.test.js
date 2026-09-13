import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  formatClaimReference,
  isCompleteClaimReference,
  normaliseClaimReference,
} from '../src/features/deals/claimReference.js'
import {
  formatRedemptionCode,
  getRedemptionCodePayload,
  isCompleteRedemptionCode,
  normaliseRedemptionCode,
} from '../src/features/deals/redemptionCode.js'
import { getDealRedemptionErrorMessage } from '../src/features/deals/redemptionError.js'

const MIGRATION_URL = new URL(
  '../supabase/migrations/20260913000000_complete_deal_redemption.sql',
  import.meta.url,
)
const DATABASE_TEST_URL = new URL(
  '../supabase/tests/database/deal-redemption.test.sql',
  import.meta.url,
)
const PRIVACY_MIGRATION_URL = new URL(
  '../supabase/migrations/20260913010000_mask_redemption_customer_names.sql',
  import.meta.url,
)
const CLAIM_REFERENCE_MIGRATION_URL = new URL(
  '../supabase/migrations/20260913020000_add_claim_references.sql',
  import.meta.url,
)

test('US0097: claim references are readable identifiers, not redemption tokens', () => {
  assert.equal(normaliseClaimReference('ll 8e1b-42f7'), 'LL8E1B42F7')
  assert.equal(formatClaimReference('ll8e1b42f7'), 'LL-8E1B-42F7')
  assert.equal(isCompleteClaimReference('LL-8E1B-42F7'), true)
  assert.equal(isCompleteClaimReference('LL-E8B1'), false)
})

test('US0097: redemption codes support manual entry and QR payloads', () => {
  assert.equal(normaliseRedemptionCode('valid 0097-001'), 'VALID0097001')
  assert.equal(
    normaliseRedemptionCode('locallink:deal-claim:VALID0097001'),
    'VALID0097001',
  )
  assert.equal(formatRedemptionCode('VALID0097001'), 'VALI D009 7001')
  assert.equal(isCompleteRedemptionCode('VALID0097001'), true)
  assert.equal(isCompleteRedemptionCode('SHORT'), false)
  assert.equal(
    getRedemptionCodePayload('valid 0097 001'),
    'locallink:deal-claim:VALID0097001',
  )
})

test('US0097: invalid claim states have clear and different messages', () => {
  const messages = [
    getDealRedemptionErrorMessage({ message: 'Redemption code not found' }),
    getDealRedemptionErrorMessage({
      message: "This claim's redemption window has expired",
    }),
    getDealRedemptionErrorMessage({
      message: 'This claim has already been redeemed',
    }),
    getDealRedemptionErrorMessage({
      message: 'This code belongs to another business',
    }),
  ]

  assert.equal(new Set(messages).size, 4)
  assert.match(messages[0], /invalid/i)
  assert.match(messages[1], /expired/i)
  assert.match(messages[2], /already been redeemed/i)
  assert.match(messages[3], /another business/i)
})

test('US0097: the business flow validates, reviews, and explicitly confirms', async () => {
  const [dashboard, page, panel, styles, claimRecords, settings, hook, api] =
    await Promise.all([
      readFile(
        new URL('../src/pages/business/Dashboard.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/deals/components/DealRedemptionPanel.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/features/deals/DealRedemption.css', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/ClaimRecords.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/Settings.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/deals/hooks/useBusinessDealRedemption.js',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/deals/api/businessDealRedemptions.js',
          import.meta.url,
        ),
        'utf8',
      ),
    ])

  assert.match(dashboard, /capabilities\.deals_enabled/)
  assert.match(dashboard, /Redeem a customer deal/)
  assert.match(dashboard, /to="\/business\/create-deal\?redeem=scan"/)
  assert.match(page, /DealRedemptionPanel/)
  assert.match(page, /searchParams\.get\('redeem'\) === 'scan'/)
  assert.match(panel, /openScannerOnLoad/)
  assert.match(panel, /Scan code/)
  assert.match(panel, /Check code/)
  assert.match(panel, /Valid claim/)
  assert.match(panel, /Confirm redemption/)
  assert.doesNotMatch(
    panel,
    /Redeem a customer claim|Scan the QR code or enter the 12-character code\.|QrCode/,
  )
  assert.match(styles, /input\[aria-invalid='true'\]/)
  assert.match(styles, /\.deal-redemption-error[\s\S]*?background: transparent/)
  assert.match(panel, /View claim records/)
  assert.match(panel, /business\/settings\/claim-records/)
  assert.doesNotMatch(panel, /Find a claim|Recent redemptions/)
  assert.match(claimRecords, /Claim records/)
  assert.match(claimRecords, /Recent redemptions/)
  assert.match(claimRecords, /No redemption recorded/)
  assert.match(claimRecords, /records\.redemptions\.map/)
  assert.match(settings, /path: 'claim-records'/)
  assert.match(settings, /capabilities\.deals_enabled/)
  assert.match(settings, /<ClaimRecords \/>/)
  assert.match(hook, /redemptionInProgressRef\.current/)
  assert.match(hook, /lookupBusinessDealClaim/)
  assert.match(hook, /loadRecords = true/)
  assert.match(api, /rpc\('validate_business_deal_redemption_code'/)
  assert.match(api, /rpc\('redeem_business_deal_claim_by_code'/)
  assert.match(api, /rpc\(\s*'get_business_deal_redemptions'/)
  assert.match(api, /rpc\('lookup_business_deal_claim'/)
})

test('US0097: the customer receives a real QR code and retained history', async () => {
  const [modal, dealsPage, customerApi] = await Promise.all([
    readFile(
      new URL(
        '../src/features/deals/components/DealDetailModal.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/customer/Deals.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/api/customerDeals.js', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(modal, /QRCodeSVG/)
  assert.match(modal, /getRedemptionCodePayload/)
  assert.match(modal, /formatRedemptionCode/)
  assert.match(dealsPage, /redemptionCode=\{selectedClaim\?\.redemption_code\}/)
  assert.match(dealsPage, /claimReference=\{selectedClaim\?\.claim_reference\}/)
  assert.match(dealsPage, /claimRedeemedAt=\{selectedClaim\?\.redeemed_at\}/)
  assert.match(dealsPage, /Redeemed/)
  assert.match(customerApi, /redemption_code/)
  assert.match(customerApi, /claim_reference/)
  assert.match(modal, /Claim ref:/)
})

test('US0097: redemption is business-scoped, time-bound, and atomic', async () => {
  const [migration, databaseTest] = await Promise.all([
    readFile(MIGRATION_URL, 'utf8'),
    readFile(DATABASE_TEST_URL, 'utf8'),
  ])

  assert.match(migration, /for update of claim/i)
  assert.match(migration, /unique \(redemption_code\)/i)
  assert.match(migration, /already been redeemed/i)
  assert.match(migration, /now\(\) > v_claim\.expires_at/i)
  assert.match(migration, /is_business_member\(v_claim\.business_id\)/i)
  assert.match(migration, /insert into public\.business_deal_redemptions/i)

  for (const acceptanceText of [
    'valid entered code displays the relevant deal and claim',
    'wrong-business code has a distinct error',
    'expired code has a distinct validation error',
    'records its date and time',
    'cannot be redeemed again',
    'business deal records',
    'consumer deal history',
    'simultaneous attempts',
  ]) {
    assert.match(databaseTest, new RegExp(acceptanceText, 'i'))
  }
})

test('US0097: business records use masked names and safe claim references', async () => {
  const [privacyMigration, claimMigration, panel, claimRecords, details, api] =
    await Promise.all([
      readFile(PRIVACY_MIGRATION_URL, 'utf8'),
      readFile(CLAIM_REFERENCE_MIGRATION_URL, 'utf8'),
      readFile(
        new URL(
          '../src/features/deals/components/DealRedemptionPanel.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/ClaimRecords.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/deals/components/DealDetails.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/deals/api/businessDealRedemptions.js',
          import.meta.url,
        ),
        'utf8',
      ),
    ])

  assert.match(privacyMigration, /left\(nullif\(trim\(customer\.first_name\)/)
  assert.match(privacyMigration, /left\(nullif\(trim\(customer\.last_name\)/)
  assert.doesNotMatch(privacyMigration, /concat_ws\(' ', customer\.first_name/)
  assert.match(claimMigration, /unique \(claim_reference\)/i)
  assert.match(claimMigration, /lookup_business_deal_claim/i)
  assert.match(claimMigration, /then 'not_redeemed'/i)
  assert.match(claimMigration, /else 'redeemed'/i)
  const lookupResultShape =
    claimMigration.match(
      /create function public\.lookup_business_deal_claim[\s\S]*?returns table \(([\s\S]*?)\)\n+language/,
    )?.[1] ?? ''
  assert.doesNotMatch(
    lookupResultShape,
    /uuid|redemption_code|customer_id|email/i,
  )
  assert.match(panel, /customerDisplayName/)
  assert.match(panel, /Claim reference/)
  assert.match(claimRecords, /customerDisplayName/)
  assert.match(claimRecords, /claimReference/)
  assert.doesNotMatch(details, /Redemption records|deal-redemption-records/)
  assert.match(api, /customerDisplayName: record\.customer_name/)
  assert.doesNotMatch(details, /redemptionCode/)
})
