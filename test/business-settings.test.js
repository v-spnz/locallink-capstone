import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business settings provides a complete logout flow', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(settings, /supabase\.auth\.signOut\(\)/)
  assert.match(settings, /clearRegistrationFlow\(\)/)
  assert.match(settings, /navigate\('\/login', \{ replace: true \}\)/)
  assert.match(settings, /Unable to log out\. Please try again\./)
  assert.match(settings, /isLoggingOut \? 'Logging out…' : 'Log Out'/)
  assert.match(settings, /disabled=\{isLoggingOut\}/)
})

test('business settings can return to the consumer portal without logging out', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(settings, /<Link className="btn-secondary" to="\/home">/)
  assert.match(settings, /Go to consumer portal/)
})

test('business settings uses separate pages without a sidebar account name', async () => {
  const [settings, portal] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Settings.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessPortal.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(portal, /path="settings\/\*"/)
  assert.match(settings, /to=\{`\/business\/settings\/\$\{page\.path\}`\}/)
  for (const page of [
    'overview',
    'profile',
    'services',
    'claim-records',
    'notifications',
    'access',
  ]) {
    assert.match(settings, new RegExp(`path: '${page}'`))
  }
  assert.doesNotMatch(settings, /path: 'locations'|path="locations"/)
  assert.doesNotMatch(settings, /AddressAutocomplete/)
  assert.doesNotMatch(settings, /business-settings-identity|businessInitials/)
  assert.match(settings, /capabilities\.deals_enabled/)
  assert.match(settings, /<ClaimRecords \/>/)
})
