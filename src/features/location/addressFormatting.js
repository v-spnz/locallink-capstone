import { findKnownCityForSuburb } from './localSuburbs.js'

export function formatSavedAddress(address) {
  if (!address) return ''

  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const suburbIndex = parts.findIndex((part) => findKnownCityForSuburb(part))

  if (suburbIndex < 0) return address

  const suburb = parts[suburbIndex]
  const city = findKnownCityForSuburb(suburb)
  const postcode = address.match(/\b\d{4}\b/)?.[0] || ''
  const country = parts.find((part) => /^(?:new zealand|aotearoa)$/i.test(part))

  return [
    ...parts.slice(0, suburbIndex),
    suburb,
    [city, postcode].filter(Boolean).join(' '),
    country,
  ]
    .filter(Boolean)
    .join(', ')
}
