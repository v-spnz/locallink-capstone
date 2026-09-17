import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

async function read(path) {
  return readFile(new URL(path, import.meta.url), 'utf8')
}

test('business page loading uses the shared bouncing circles loader', async () => {
  const [loader, loaderStyles, screen, screenStyles] = await Promise.all([
    read('../src/components/ui/BouncingCirclesLoader.jsx'),
    read('../src/components/ui/BouncingCirclesLoader.css'),
    read('../src/components/ui/BusinessPageLoader.jsx'),
    read('../src/components/ui/BusinessPageLoader.css'),
  ])

  assert.match(loader, /circleCount = 10/)
  assert.match(loader, /animationDelay: `\$\{-index \* 0\.1\}s`/)
  assert.match(loader, /role="status"/)
  assert.match(loader, /aria-label=\{label\}/)
  assert.match(loaderStyles, /@keyframes bouncing-circles-loader-bounce/)
  assert.match(loaderStyles, /prefers-reduced-motion: reduce/)
  assert.match(screen, /color="bg-\[#3f5bd3\]"/)
  assert.match(screen, /fullPage && 'is-full-page'/)
  assert.match(screenStyles, /\.business-page-loader\.is-full-page/)
})

test('business routes and business data pages use the loader without changing customer loading', async () => {
  const [
    protectedRoute,
    businessGuard,
    businessPortal,
    onboarding,
    deals,
    loyalty,
    services,
    marketplace,
    settings,
    claimRecords,
    customerJobs,
  ] = await Promise.all([
    read('../src/auth/ProtectedRoute.jsx'),
    read('../src/business/BusinessProtectedRoute.jsx'),
    read('../src/pages/business/BusinessPortal.jsx'),
    read('../src/pages/business/BusinessOnboarding.jsx'),
    read('../src/features/deals/components/DealList.jsx'),
    read('../src/features/loyalty/components/LoyaltyDraftList.jsx'),
    read('../src/pages/business/Services.jsx'),
    read('../src/pages/business/ServiceMarketplacePage.jsx'),
    read('../src/pages/business/Settings.jsx'),
    read('../src/pages/business/ClaimRecords.jsx'),
    read('../src/pages/customer/Jobs.jsx'),
  ])

  assert.match(protectedRoute, /loadingFallback \?\?/)
  assert.match(businessGuard, /<BusinessPageLoader[^>]*fullPage/)
  assert.match(businessPortal, /loadingFallback=/)
  assert.match(onboarding, /<BusinessPageLoader[^>]*fullPage/)
  assert.match(deals, /<BusinessPageLoader label="Loading deals…"/)
  assert.match(
    loyalty,
    /<BusinessPageLoader label="Loading loyalty programmes…"/,
  )
  assert.match(services, /<BusinessPageLoader label="Loading services…"/)
  assert.match(marketplace, /<BusinessPageLoader[\s\S]*?contained/)
  assert.match(settings, /<BusinessPageLoader label="Loading settings…"/)
  assert.match(
    claimRecords,
    /<BusinessPageLoader contained label="Loading claim records…"/,
  )
  assert.doesNotMatch(customerJobs, /BusinessPageLoader/)
})
