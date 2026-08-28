import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('Geoapify autocomplete and geocoding are used for selected addresses', async () => {
  const [api, component] = await Promise.all([
    read('../src/features/location/api/geoapify.js'),
    read('../src/features/location/components/AddressAutocomplete.jsx'),
  ])

  assert.match(api, /v1\/geocode/)
  assert.match(api, /autocomplete/)
  assert.match(api, /search/)
  assert.match(api, /filter: 'countrycode:nz'/)
  assert.match(api, /VITE_GEOAPIFY_API_KEY/)
  assert.match(component, /geocodeAddress\(suggestion\.formattedAddress\)/)
  assert.match(component, /Addresses by Geoapify/)
})

test('browser geolocation supports Use my current location', async () => {
  const [api, component] = await Promise.all([
    read('../src/features/location/api/geoapify.js'),
    read('../src/features/location/components/AddressAutocomplete.jsx'),
  ])
  assert.match(api, /navigator\.geolocation\.getCurrentPosition/)
  assert.match(component, /Use my current location/)
  assert.match(component, /reverseGeocode/)
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
