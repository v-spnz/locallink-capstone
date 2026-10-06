import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

function read(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8')
}

test('business settings keeps the logout workflow in the page', async () => {
  const [settings, access] = await Promise.all([
    read('../src/pages/business/Settings.jsx'),
    read('../src/features/business-settings/components/AccountAccess.jsx'),
  ])

  assert.match(settings, /supabase\.auth\.signOut\(\)/)
  assert.match(settings, /clearRegistrationFlow\(\)/)
  assert.match(settings, /navigate\('\/login', \{ replace: true \}\)/)
  assert.match(settings, /Unable to log out\. Please try again\./)
  assert.match(settings, /isLoggingOut=\{isLoggingOut\}/)
  assert.match(settings, /handleLogout=\{handleLogout\}/)
  assert.match(access, /isLoggingOut \? 'Logging out…' : 'Log Out'/)
  assert.match(access, /disabled=\{isLoggingOut\}/)
  assert.match(access, /logoutError/)
})

test('account access links to the consumer portal without logging out', async () => {
  const access = await read(
    '../src/features/business-settings/components/AccountAccess.jsx',
  )

  assert.match(access, /<Link className="btn-secondary" to="\/home">/)
  assert.match(access, /Go to consumer portal/)
  assert.doesNotMatch(access, /signOut\(/)
})

test('business profile shows the selected store address and suburb', async () => {
  const [settings, profile] = await Promise.all([
    read('../src/pages/business/Settings.jsx'),
    read('../src/features/business-settings/components/BusinessProfile.jsx'),
  ])

  const locationPriority = [
    'location.is_primary && location.formatted_address && location.suburb',
    'location.formatted_address && location.suburb',
    'location.is_primary',
    'businessLocations[0]',
  ]
  let lastPosition = -1
  for (const criterion of locationPriority) {
    const position = settings.indexOf(criterion, lastPosition + 1)
    assert.ok(
      position > lastPosition,
      `location priority includes ${criterion}`,
    )
    lastPosition = position
  }
  assert.match(profile, /<dt>Store address<\/dt>/)
  assert.match(
    profile,
    /primaryLocation\?\.formatted_address \|\| 'No address added'/,
  )
  assert.match(profile, /<dt>Suburb<\/dt>/)
  assert.match(profile, /primaryLocation\?\.suburb \|\| 'No suburb added'/)
  assert.match(settings, /primaryLocation=\{primaryLocation\}/)
})

test('business managers can add a missing store address inline from settings', async () => {
  const [settings, profile, styles] = await Promise.all([
    read('../src/pages/business/Settings.jsx'),
    read('../src/features/business-settings/components/BusinessProfile.jsx'),
    read('../src/features/business-settings/BusinessSettings.css'),
  ])

  assert.match(profile, /import AddressAutocomplete/)
  assert.match(profile, /\['owner', 'admin'\]\.includes\(membership\.role\)/)
  assert.match(profile, /business-settings-inline-address/)
  assert.match(profile, /className="business-settings-address-edit"/)
  assert.match(profile, /<Pencil aria-hidden="true" \/>/)
  assert.match(profile, /<X aria-hidden="true" \/>/)
  assert.match(profile, /aria-label=/)
  assert.match(profile, /isEditingLocation/)
  assert.match(profile, /id="business-settings-address"/)
  assert.match(profile, /autoFocus/)
  assert.match(profile, /showCurrentLocation=\{false\}/)
  assert.match(profile, /onSelect=\{handleInlineLocationSelect\}/)
  assert.match(
    profile,
    /role=\{locationStatus\.variant === 'error' \? 'alert' : 'status'\}/,
  )
  assert.doesNotMatch(profile, /business-settings-location-setup/)
  assert.doesNotMatch(profile, /Add your store location/)
  assert.match(settings, /addManagedBusinessLocation\(business\.id, address\)/)
  assert.match(settings, /if \(!address\.suburb\?\.trim\(\)\)/)
  assert.match(settings, /Suburb: \$\{address\.suburb\}/)
  assert.match(settings, /fetchManagedBusinessLocations\(business\.id\)/)
  assert.match(settings, /Unable to save this address\. Please try again\./)
  assert.match(
    styles,
    /\.business-settings-address-editor[\s\S]*\.address-autocomplete-input-wrap[\s\S]*\.form-input \{[\s\S]*padding-left: 44px;/,
  )
})

test('business settings keeps all routes and capability guards', async () => {
  const [settings, portal] = await Promise.all([
    read('../src/pages/business/Settings.jsx'),
    read('../src/pages/business/BusinessPortal.jsx'),
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
  assert.match(
    settings,
    /<Route index element=\{<Navigate to="overview" replace \/>\}/,
  )
  assert.match(settings, /path="\*"/)
  assert.doesNotMatch(settings, /path: 'locations'|path="locations"/)
  assert.doesNotMatch(settings, /business-settings-identity|businessInitials/)
  assert.match(settings, /capabilities\.service_marketplace_enabled/)
  assert.match(settings, /capabilities\.deals_enabled/)
  assert.match(settings, /<ClaimRecords \/>/)
})
