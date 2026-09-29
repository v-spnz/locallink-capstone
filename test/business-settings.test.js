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

test('business managers can add a missing store address inline from settings', async () => {
  const [settings, styles] = await Promise.all([
    readFile(
      new URL('../src/pages/business/Settings.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/BusinessPortal.css', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(settings, /import AddressAutocomplete/)
  assert.match(settings, /addManagedBusinessLocation/)
  assert.match(settings, /business-settings-inline-address/)
  assert.match(settings, /className="business-settings-address-edit"/)
  assert.match(settings, /<Pencil aria-hidden="true" \/>/)
  assert.match(settings, /aria-label=/)
  assert.match(settings, /isEditingLocation/)
  assert.match(settings, /id="business-settings-address"/)
  assert.match(settings, /autoFocus/)
  assert.match(settings, /onSelect=\{handleInlineLocationSelect\}/)
  assert.doesNotMatch(settings, /business-settings-location-setup/)
  assert.doesNotMatch(settings, /Add your store location/)
  assert.match(settings, /if \(!address\.suburb\?\.trim\(\)\)/)
  assert.match(settings, /Suburb: \$\{address\.suburb\}/)
  assert.match(settings, /fetchManagedBusinessLocations\(business\.id\)/)
  assert.match(
    styles,
    /\.business-settings-address-editor[\s\S]*\.address-autocomplete-input-wrap[\s\S]*\.form-input \{[\s\S]*padding-left: 44px;/,
  )
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
