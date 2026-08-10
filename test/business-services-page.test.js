import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business services combines leads, quotes, and active jobs into tabs', async () => {
  const [page, navigation, routes] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Services.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/components/navigation/BusinessNavigation.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessPortal.jsx', import.meta.url),
      'utf8',
    ),
  ])

  for (const label of ['Job Leads', 'Quotes', 'Active Jobs']) {
    assert.match(page, new RegExp(label))
  }
  assert.match(page, /useBusinessMarketplace\('leads'\)/)
  assert.match(page, /useBusinessMarketplace\('quotes'\)/)
  assert.match(page, /useBusinessMarketplace\('jobs'\)/)
  assert.match(page, /<article[\s\S]+service-overview-card/)
  assert.doesNotMatch(page, /ChevronRight/)
  assert.doesNotMatch(page, /onClick=\{\(\) => selectTab\(summary\.type\)\}/)
  assert.match(navigation, /\['\/business\/services', 'Services'\]/)
  assert.doesNotMatch(navigation, /\/business\/job-leads/)
  assert.match(routes, /path="services"/)
  assert.match(routes, /services\?tab=quotes/)
  assert.match(routes, /services\?tab=jobs/)
})

test('submitting a quote refreshes every mounted services tab', async () => {
  const marketplaceHook = await readFile(
    new URL(
      '../src/features/service-marketplace/hooks/useBusinessMarketplace.js',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(marketplaceHook, /subscribeToBusinessMarketplaceChanges/)
  assert.match(marketplaceHook, /notifyBusinessMarketplaceChanged\(business\.id\)/)
  assert.match(
    marketplaceHook,
    /current\.filter\(\(item\) => item\.job_request_id !== selectedLead\)/,
  )
})
