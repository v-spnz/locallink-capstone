import { toSuburbLocation } from '../suburb.js'

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1/geocode'

function apiKey() {
  const key = import.meta.env.VITE_GEOAPIFY_API_KEY
  if (!key) {
    throw new Error(
      'Location search is not configured. Add VITE_GEOAPIFY_API_KEY to your environment.',
    )
  }
  return key
}

function normalizeAddress(result) {
  return {
    name: result.name || result.address_line1 || result.formatted,
    formattedAddress: result.formatted,
    addressLine1: result.address_line1 || result.formatted,
    suburb: result.suburb || '',
    district: result.district || '',
    city: result.city || result.county || '',
    resultType: result.result_type || '',
    postcode: result.postcode || '',
    countryCode: result.country_code || 'nz',
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    placeId: result.place_id || '',
  }
}

async function requestGeoapify(path, params, signal) {
  const query = new URLSearchParams({
    ...params,
    format: 'json',
    apiKey: apiKey(),
  })
  const response = await fetch(`${GEOAPIFY_BASE_URL}/${path}?${query}`, {
    signal,
  })
  if (!response.ok) throw new Error('Unable to search for this location.')
  return response.json()
}

export async function autocompleteAddresses(text, { signal, bias } = {}) {
  const data = await requestGeoapify(
    'autocomplete',
    {
      text,
      filter: 'countrycode:nz',
      lang: 'en',
      limit: '6',
      ...(bias ? { bias: `proximity:${bias.longitude},${bias.latitude}` } : {}),
    },
    signal,
  )
  return (data.results || []).map(normalizeAddress)
}

export async function autocompleteSuburbs(text, options = {}) {
  const data = await requestGeoapify(
    'autocomplete',
    {
      text,
      type: 'city',
      filter: 'countrycode:nz',
      lang: 'en',
      limit: '8',
      ...(options.bias
        ? {
            bias: `proximity:${options.bias.longitude},${options.bias.latitude}`,
          }
        : {}),
    },
    options.signal,
  )
  const seen = new Set()

  return (data.results || []).reduce((suburbs, result) => {
    const suburb = toSuburbLocation(normalizeAddress(result))
    const key = suburb?.formattedAddress.toLocaleLowerCase()

    if (!suburb || seen.has(key)) return suburbs

    seen.add(key)
    suburbs.push(suburb)
    return suburbs
  }, [])
}

export async function geocodeAddress(formattedAddress, { signal } = {}) {
  const data = await requestGeoapify(
    'search',
    {
      text: formattedAddress,
      filter: 'countrycode:nz',
      lang: 'en',
      limit: '1',
    },
    signal,
  )
  const result = data.results?.[0]
  if (!result) throw new Error('Choose a complete New Zealand address.')
  return normalizeAddress(result)
}

export async function geocodeSuburb(formattedSuburb, { signal } = {}) {
  const data = await requestGeoapify(
    'search',
    {
      text: formattedSuburb,
      type: 'city',
      filter: 'countrycode:nz',
      lang: 'en',
      limit: '1',
    },
    signal,
  )
  const result = data.results?.[0]
  const suburb = result ? toSuburbLocation(normalizeAddress(result)) : null

  if (!suburb) throw new Error('Choose a New Zealand suburb.')
  return suburb
}

export async function reverseGeocode(latitude, longitude) {
  const data = await requestGeoapify('reverse', {
    lat: String(latitude),
    lon: String(longitude),
    lang: 'en',
    limit: '1',
  })
  const result = data.results?.[0]
  if (!result) throw new Error('Unable to identify your current address.')
  return normalizeAddress(result)
}

export function getCurrentBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location services are not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      (error) => {
        const messages = {
          1: 'Location permission was denied. You can search manually instead.',
          2: 'Your current location is unavailable.',
          3: 'Finding your current location timed out.',
        }
        reject(
          new Error(messages[error.code] || 'Unable to use your location.'),
        )
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  })
}
