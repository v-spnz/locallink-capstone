import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  findKnownCityForSuburb,
  getLocalSuburbSuggestions,
  mergeSuburbSuggestions,
  preferKnownEnglishPlaceName,
} from '../src/features/location/localSuburbs.js'
import { formatGeoapifyAddress } from '../src/features/location/api/geoapify.js'
import { formatSavedAddress } from '../src/features/location/addressFormatting.js'

import { toSuburbLocation } from '../src/features/location/suburb.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Geoapify autocomplete and geocoding are used for selected addresses', async () => {
  const [api, component, styles] = await Promise.all([
    read('../src/features/location/api/geoapify.js'),
    read('../src/features/location/components/AddressAutocomplete.jsx'),
    read('../src/features/location/location.css'),
  ])

  assert.match(api, /v1\/geocode/)
  assert.match(api, /autocomplete/)
  assert.match(api, /search/)
  assert.match(api, /filter: 'countrycode:nz'/)
  assert.match(api, /VITE_GEOAPIFY_API_KEY/)
  assert.match(component, /geocodeAddress\(suggestion\.formattedAddress\)/)
  assert.match(component, /searchType === 'suburb'\s+\? suggestion/)
  assert.match(component, /suburb: \{ minimumCharacters: 1, delay: 120 \}/)
  assert.match(component, /aria-autocomplete="list"/)
  assert.match(component, /event\.key === 'ArrowDown'/)
  assert.match(component, /setSuggestions\(\[\]\)/)
  assert.match(component, /onBlur={closeResultsOnBlur}/)
  assert.match(component, /currentTarget\.contains\(event\.relatedTarget\)/)
  assert.match(component, /Addresses by Geoapify/)
  assert.match(
    styles,
    /\.address-autocomplete-results\s*{[^}]*position:\s*absolute/s,
  )
  assert.match(styles, /top:\s*calc\(100% \+ 8px\)/)
  assert.match(styles, /max-height:\s*min\(280px, 40vh\)/)
})

test('full address labels omit Geoapify administrative districts', () => {
  assert.equal(
    formatGeoapifyAddress({
      address_line1: '24 Mount Eden Road',
      suburb: 'Mount Eden',
      district: 'Albert-Eden',
      city: 'Auckland',
      postcode: '1024',
      country: 'New Zealand',
      formatted:
        '24 Mount Eden Road, Mount Eden, Albert-Eden, Auckland 1024, New Zealand',
    }),
    '24 Mount Eden Road, Mount Eden, Auckland 1024, New Zealand',
  )

  assert.equal(
    formatGeoapifyAddress({
      address_line1: '93 Panama Road',
      suburb: 'Mount Wellington',
      district: 'Auckland',
      city: 'Maungakiekie-Tamaki',
      county: 'Auckland',
      postcode: '1062',
      country: 'New Zealand',
    }),
    '93 Panama Road, Mount Wellington, Auckland 1062, New Zealand',
  )
})

test('legacy saved addresses replace local-board districts with the city', () => {
  assert.equal(findKnownCityForSuburb('Mount Wellington'), 'Auckland')
  assert.equal(
    formatSavedAddress(
      '93 Panama Road, Mount Wellington, Maungakiekie-Tamaki 1062, New Zealand',
    ),
    '93 Panama Road, Mount Wellington, Auckland 1062, New Zealand',
  )
  assert.equal(
    formatSavedAddress('An address outside the known suburb list'),
    'An address outside the known suburb list',
  )
})

test('browser geolocation supports Use my current location', async () => {
  const [api, component] = await Promise.all([
    read('../src/features/location/api/geoapify.js'),
    read('../src/features/location/components/AddressAutocomplete.jsx'),
  ])
  assert.match(api, /navigator\.geolocation\.getCurrentPosition/)
  assert.match(component, /Use my current location/)
  assert.match(component, /reverseGeocode/)
  assert.doesNotMatch(component, /geocodeSuburb\(suburb\.formattedAddress\)/)
})

test('suburb suggestions appear on the first character and narrow as typing continues', () => {
  const firstCharacter = getLocalSuburbSuggestions('m')
  const narrowed = getLocalSuburbSuggestions('miss')

  assert.ok(firstCharacter.length > 0)
  assert.ok(firstCharacter.some(({ suburb }) => suburb === 'Mission Bay'))
  assert.deepEqual(
    narrowed.map(({ suburb }) => suburb),
    ['Mission Bay'],
  )
})

test('remote suburb results enrich matching immediate suggestions', () => {
  const local = getLocalSuburbSuggestions('mission')
  const remote = [{ ...local[0], latitude: -36.85, isLocalSuggestion: false }]
  const merged = mergeSuburbSuggestions(local, remote)

  assert.equal(merged[0].latitude, -36.85)
  assert.equal(merged[0].isLocalSuggestion, false)
})

test('current location prefers a known English name without replacing genuine Maori place names', () => {
  const location = toSuburbLocation({
    suburb: 'Vinetown',
    city: 'Whangārei',
    latitude: -35.72,
    longitude: 174.32,
  })

  assert.equal(location.city, 'Whangarei')
  assert.equal(location.formattedAddress, 'Vinetown, Whangarei')
  assert.equal(preferKnownEnglishPlaceName('Te Aro'), 'Te Aro')
})

test('Mount Wellington GPS results do not collapse to the local-board district', () => {
  const location = toSuburbLocation({
    suburb: 'Mount Wellington',
    district: 'Auckland',
    city: 'Maungakiekie-Tāmaki',
    county: 'Auckland',
    latitude: -36.8999,
    longitude: 174.8402,
  })

  assert.equal(location.suburb, 'Mount Wellington')
  assert.equal(location.city, 'Auckland')
  assert.equal(location.formattedAddress, 'Mount Wellington, Auckland')
})

test('consumer discovery is derived from the authenticated saved suburb', async () => {
  const migration = await read(
    '../supabase/migrations/20260902020000_lock_deal_discovery_to_saved_suburb.sql',
  )
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/)
  assert.match(migration, /profile\.id = v_user_id/)
  assert.match(
    migration,
    /lower\(trim\(location\.suburb\)\) = lower\(origin\.suburb\)/,
  )
  assert.doesNotMatch(migration, /p_latitude|p_longitude|p_radius_km/)
  assert.match(migration, /order by candidate\.distance_km/i)
})

test('discovery uses Supabase results and a react-leaflet map instead of mocks', async () => {
  const [deals, home, map, boundaryApi, locationsApi, profile, portal] =
    await Promise.all([
      read('../src/pages/customer/Deals.jsx'),
      read('../src/pages/customer/Home.jsx'),
      read('../src/features/location/components/DiscoveryMap.jsx'),
      read('../src/features/location/api/suburbBoundaries.js'),
      read('../src/features/location/api/locations.js'),
      read('../src/pages/customer/Profile.jsx'),
      read('../src/pages/customer/CustomerPortal.jsx'),
    ])

  assert.match(deals, /fetchBusinessesInSavedSuburb/)
  assert.match(home, /fetchMySavedDeals/)
  assert.doesNotMatch(deals, /Where should we search|AddressAutocomplete/)
  assert.doesNotMatch(deals, /Search Radius|radius-slider|setRadius/)
  assert.doesNotMatch(deals, /saveCustomerLocation/)
  assert.doesNotMatch(home, /NEARBY_RADIUS_KM/)
  assert.match(
    locationsApi,
    /fetchBusinessesInSavedSuburb[\s\S]+businesses_in_my_suburb/,
  )
  assert.match(profile, /searchType="suburb"/)
  assert.match(profile, /showCurrentLocation=\{false\}/)
  assert.match(portal, /path="home"[\s\S]+<ProtectedRoute>[\s\S]+<Home \/>/)
  assert.match(portal, /path="deals"[\s\S]+<ProtectedRoute>[\s\S]+<Deals \/>/)

  assert.doesNotMatch(deals, /USER_LOCATION|mockBusinesses|getDistanceKm/)
  assert.doesNotMatch(home, /USER_LOCATION|mockBusinesses|getDistanceKm/)
  assert.doesNotMatch(deals, /Map Preview|map-placeholder/)
  assert.match(map, /MapContainer/)
  assert.match(map, /TileLayer/)
  assert.match(map, /CircleMarker/)
  assert.match(map, /tile\/osm-bright/)
  assert.match(map, /createOutsideMaskPositions/)
  assert.match(map, /fillOpacity: 0\.3/)
  assert.match(map, /<GeoJSON/)
  assert.match(map, /<GeoJSON[\s\S]*?weight: 2,[\s\S]*?fill: false/)
  assert.match(map, /fill: false/)
  assert.match(boundaryApi, /LINZ_NZ_Suburbs_and_Localities/)
  assert.match(boundaryApi, /esriSpatialRelIntersects/)
})

test('customer and business signup addresses are persisted and business locations feed deals', async () => {
  const [profile, onboarding, settings, dealsApi] = await Promise.all([
    read('../src/pages/customer/Profile.jsx'),
    read('../src/pages/business/BusinessOnboarding.jsx'),
    read('../src/pages/business/Settings.jsx'),
    read('../src/features/deals/api/businessDeals.js'),
  ])
  assert.match(profile, /saveCustomerLocation/)
  assert.match(onboarding, /AddressAutocomplete/)
  assert.match(onboarding, /p_locations/)
  assert.match(settings, /addManagedBusinessLocation/)
  assert.match(settings, /AddressAutocomplete/)
  assert.match(settings, /address\.suburb/)
  assert.match(dealsApi, /from\('business_locations'\)/)
})
