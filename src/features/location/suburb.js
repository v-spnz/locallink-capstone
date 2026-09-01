export function toSuburbLocation(location) {
  if (!location) return null

  const localityName = ['suburb', 'city'].includes(location.resultType)
    ? location.name
    : ''
  const suburb =
    location.suburb ||
    localityName ||
    location.city ||
    location.name ||
    location.district ||
    location.county ||
    ''
  const city = location.city || location.county || ''
  const label = [...new Set([suburb, city].filter(Boolean))].join(', ')

  if (!suburb || !label) return null

  return {
    name: suburb,
    formattedAddress: label,
    addressLine1: suburb,
    suburb,
    city: city === suburb ? '' : city,
    postcode: '',
    countryCode: location.countryCode || location.country_code || 'nz',
    latitude: Number(location.latitude ?? location.lat),
    longitude: Number(location.longitude ?? location.lon),
    placeId: location.placeId || location.place_id || '',
    resultType: location.resultType || location.result_type || '',
  }
}
