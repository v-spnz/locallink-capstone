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
