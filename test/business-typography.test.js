import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business pages use Figtree for UI text and numeric data', async () => {
  const [portal, typography] = await Promise.all([
    readFile(
      new URL('../src/pages/business/BusinessPortal.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessTypography.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(portal, /classList\.add\('business-surface'\)/)
  assert.match(portal, /classList\.remove\('business-surface'\)/)
  assert.match(typography, /body\.business-surface \*/)
  assert.match(typography, /--font-ui: 'Figtree'/)
  assert.doesNotMatch(typography, /DM Mono|font-data/)
  assert.match(typography, /--business-copy-size: 14px/)
  assert.match(typography, /--business-copy-leading: 1\.625/)
  assert.match(typography, /--business-primary-gradient/)
  assert.match(typography, /--business-hero-gradient/)
  assert.match(typography, /\.service-marketplace-card > p/)
  assert.match(typography, /\.service-lead-description/)
})

test('deal campaign rows retain the readable Services marketplace type scale', async () => {
  const [portalStyles, marketplaceStyles] = await Promise.all([
    readFile(
      new URL('../src/pages/business/BusinessPortal.css', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessMarketplace.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(
    marketplaceStyles,
    /\.service-marketplace-card h3 \{[\s\S]*?font-size: 20px/,
  )
  assert.match(portalStyles, /\.business-deals-page,[\s\S]*?var\(--font-ui\)/)
  assert.match(portalStyles, /\.deal-card-title \{[\s\S]*?font-size: 20px/)
  assert.match(
    portalStyles,
    /\.deal-card-description \{[\s\S]*?font-size: 14px/,
  )
  assert.match(
    portalStyles,
    /\.deal-card-timing > small \{[\s\S]*?font-size: 13px/,
  )
})

test('loyalty typography follows the Deals page type hierarchy', async () => {
  const [loyaltyStyles, portalStyles] = await Promise.all([
    readFile(
      new URL('../src/features/loyalty/BusinessLoyalty.css', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessPortal.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(
    loyaltyStyles,
    /\.business-loyalty-page,[\s\S]*?font-family: var\(--font-ui\)/,
  )
  assert.match(
    loyaltyStyles,
    /\.business-loyalty-heading p \{[\s\S]*?font-size: 16px;[\s\S]*?line-height: 1\.55/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-status-tabs button \{[\s\S]*?font-size: 14px/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-draft-card-copy h3 \{[\s\S]*?font-size: 20px;[\s\S]*?font-weight: 650/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-draft-card-copy p \{[\s\S]*?font-size: 14px;[\s\S]*?line-height: 1\.6/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-form-section-heading h2 \{[\s\S]*?font-size: 19px;[\s\S]*?font-weight: 750/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-review-heading h2 \{[\s\S]*?font-size: 25px/,
  )
  assert.match(
    loyaltyStyles,
    /\.loyalty-review-section-heading h3 \{[\s\S]*?font-size: 17px/,
  )
  assert.match(
    portalStyles,
    /\.portal-main-content:has\(> \.business-loyalty-page\) \{\s*max-width: 1080px/,
  )
})
