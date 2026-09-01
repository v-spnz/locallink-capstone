import suburbsByCity from '../../data/suburbs.js'

const MAX_SUGGESTIONS = 8

function normalizeSearchText(value) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/\bmt\b/g, 'mount')
    .replace(/\bst\b/g, 'saint')
}

function foldPlaceName(value) {
  return value
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
}

const englishPlaceNames = new Map(
  Object.entries(suburbsByCity).flatMap(([city, suburbs]) =>
    [city, ...suburbs].map((placeName) => [
      foldPlaceName(placeName),
      placeName,
    ]),
  ),
)
const englishCityNames = new Map(
  Object.keys(suburbsByCity).map((city) => [foldPlaceName(city), city]),
)

export function preferKnownEnglishPlaceName(placeName) {
  if (!placeName) return ''

  const names = placeName.split(/\s+\/\s+/)
  for (const name of names) {
    const englishName = englishPlaceNames.get(foldPlaceName(name))
    if (englishName) return englishName
  }

  return placeName
}

export function findKnownEnglishCity(...placeNames) {
  for (const placeName of placeNames) {
    if (!placeName) continue

    const names = placeName.split(/\s+\/\s+/)
    for (const name of names) {
      const englishName = englishCityNames.get(foldPlaceName(name))
      if (englishName) return englishName
    }
  }

  return ''
}

export function getLocalSuburbSuggestions(query) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return []

  return Object.entries(suburbsByCity)
    .flatMap(([city, suburbs]) =>
      suburbs.map((suburb) => ({
        city,
        suburb,
        searchableName: normalizeSearchText(suburb),
      })),
    )
    .filter(({ searchableName }) => searchableName.includes(normalizedQuery))
    .sort((first, second) => {
      const firstStartsWith = first.searchableName.startsWith(normalizedQuery)
      const secondStartsWith = second.searchableName.startsWith(normalizedQuery)

      if (firstStartsWith !== secondStartsWith) return firstStartsWith ? -1 : 1
      return first.suburb.localeCompare(second.suburb)
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(({ city, suburb }) => ({
      name: suburb,
      formattedAddress: `${suburb}, ${city}`,
      addressLine1: suburb,
      suburb,
      city,
      postcode: '',
      countryCode: 'nz',
      placeId: `local-${city}-${suburb}`,
      resultType: 'suburb',
      isLocalSuggestion: true,
    }))
}

export function mergeSuburbSuggestions(localSuggestions, remoteSuggestions) {
  const remoteByAddress = new Map(
    remoteSuggestions.map((suggestion) => [
      suggestion.formattedAddress.toLocaleLowerCase(),
      suggestion,
    ]),
  )
  const merged = localSuggestions.map(
    (suggestion) =>
      remoteByAddress.get(suggestion.formattedAddress.toLocaleLowerCase()) ||
      suggestion,
  )
  const existingAddresses = new Set(
    merged.map((suggestion) => suggestion.formattedAddress.toLocaleLowerCase()),
  )

  for (const suggestion of remoteSuggestions) {
    const address = suggestion.formattedAddress.toLocaleLowerCase()
    if (!existingAddresses.has(address)) merged.push(suggestion)
  }

  return merged.slice(0, MAX_SUGGESTIONS)
}
