import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business action feedback uses an accessible bottom toast', async () => {
  const [toast, styles] = await Promise.all([
    readFile(
      new URL('../src/components/ui/ActionToast.jsx', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../src/styles/shared-ui.css', import.meta.url), 'utf8'),
  ])

  assert.match(toast, /createPortal/)
  assert.match(toast, /role=\{isError \? 'alert' : 'status'\}/)
  assert.match(toast, /aria-live=\{isError \? 'assertive' : 'polite'\}/)
  assert.match(toast, /Dismiss \$\{variant\} notification/)
  assert.match(toast, /TOAST_DURATION = 6000/)
  assert.match(styles, /\.action-toast \{[\s\S]*?position: fixed/)
  assert.match(styles, /bottom: max\(20px/)
  assert.doesNotMatch(styles, /border-left: 4px solid var\(--toast-accent\)/)
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/)
})

test('deal and service actions provide contextual toast messages', async () => {
  const [dealPage, dealHook, servicePage, serviceHook] = await Promise.all([
    readFile(
      new URL('../src/pages/business/CreateDeal.jsx', import.meta.url),
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
        '../src/features/service-marketplace/components/business/BusinessMarketplaceContent.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/hooks/useBusinessMarketplace.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(dealPage, /deals\.feedback[\s\S]*?<ActionToast/)
  assert.match(dealHook, /Deal saved as draft/)
  assert.match(dealHook, /Deal published\. Status:/)
  assert.match(servicePage, /marketplace\.feedback[\s\S]*?<ActionToast/)

  for (const message of [
    'Quote submitted',
    'Opportunity declined',
    'Job marked as completed',
    'Job status updated',
    'Quote withdrawn',
  ]) {
    assert.match(serviceHook, new RegExp(message))
  }

  assert.match(serviceHook, /variant: 'error'/)
})
