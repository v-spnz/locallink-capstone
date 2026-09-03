import { findKnownCityForSuburb } from '../location/localSuburbs.js'

function hasCompleteAddress(location) {
  return Boolean(
    location?.address_line1 &&
    location?.suburb &&
    location?.city &&
    location?.postcode,
  )
}

export function selectBusinessDealLocation(locations = []) {
  return (
    locations.find(
      (location) => location.is_primary && hasCompleteAddress(location),
    ) ||
    locations.find(hasCompleteAddress) ||
    locations.find((location) => location.is_primary) ||
    locations[0] ||
    null
  )
}

export function formatBusinessDealAddress(location) {
  if (!location) return ''

  const city = findKnownCityForSuburb(location.suburb) || location.city
  const cityAndPostcode = [city, location.postcode].filter(Boolean).join(' ')
  const parts = [location.address_line1, location.suburb, cityAndPostcode]
  const seen = new Set()

  return parts
    .map((part) => String(part || '').trim())
    .filter((part) => {
      const key = part.toLocaleLowerCase()
      if (!part || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .join(', ')
}
