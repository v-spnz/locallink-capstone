import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getLocalSuburbSuggestions,
  mergeSuburbSuggestions,
  preferKnownEnglishPlaceName,
} from '../src/features/location/localSuburbs.js'
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

test('PostGIS performs indexed radius filtering and distance ordering', async () => {
  const migration = await read(
    '../supabase/migrations/20260828000000_add_postgis_location_discovery.sql',
  )
  assert.match(migration, /create extension if not exists postgis/i)
  assert.match(migration, /using gist \(location\)/i)
  assert.match(migration, /extensions\.st_dwithin/i)
  assert.match(migration, /operator\(extensions\.<->\)/i)
  assert.match(migration, /order by candidate\.distance_km/i)
})

test('discovery uses Supabase results and a react-leaflet map instead of mocks', async () => {
  const [deals, home, map] = await Promise.all([
    read('../src/pages/customer/Deals.jsx'),
    read('../src/pages/customer/Home.jsx'),
    read('../src/features/location/components/DiscoveryMap.jsx'),
  ])

  assert.match(deals, /fetchNearbyBusinesses/)
  assert.match(home, /fetchNearbyBusinesses/)
  assert.doesNotMatch(deals, /USER_LOCATION|mockBusinesses|getDistanceKm/)
  assert.doesNotMatch(home, /USER_LOCATION|mockBusinesses|getDistanceKm/)
  assert.doesNotMatch(deals, /Map Preview|map-placeholder/)
  assert.match(map, /MapContainer/)
  assert.match(map, /TileLayer/)
  assert.match(map, /CircleMarker/)
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
  assert.doesNotMatch(
    settings,
    /addManagedBusinessLocation|AddressAutocomplete/,
  )
  assert.match(dealsApi, /from\('business_locations'\)/)
})
