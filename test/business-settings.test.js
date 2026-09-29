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

test('business profile shows the store address and automatically saved suburb', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(
    settings,
    /location\.is_primary && location\.formatted_address && location\.suburb/,
  )
  assert.match(settings, /<dt>Store address<\/dt>/)
  assert.match(
    settings,
    /primaryLocation\?\.formatted_address \|\| 'No address added'/,
  )
  assert.match(settings, /<dt>Suburb<\/dt>/)
  assert.match(settings, /primaryLocation\?\.suburb \|\| 'No suburb added'/)
  assert.match(settings, /primaryLocation=\{primaryLocation\}/)
})

test('business managers can add a missing store address from settings', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(settings, /import AddressAutocomplete/)
  assert.match(settings, /addManagedBusinessLocation/)
  assert.match(settings, /!hasCompleteLocation && canManageLocation/)
  assert.match(settings, /id="business-settings-address"/)
  assert.match(settings, /onSelect=\{onLocationSelect\}/)
  assert.match(settings, /if \(!address\.suburb\?\.trim\(\)\)/)
  assert.match(settings, /Suburb: \$\{address\.suburb\}/)
  assert.match(settings, /fetchManagedBusinessLocations\(business\.id\)/)
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
  assert.doesNotMatch(settings, /business-settings-identity|businessInitials/)
  assert.match(settings, /capabilities\.deals_enabled/)
  assert.match(settings, /<ClaimRecords \/>/)
})
