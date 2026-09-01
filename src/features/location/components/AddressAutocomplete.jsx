import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  autocompleteAddresses,
  autocompleteSuburbs,
  geocodeAddress,
  geocodeSuburb,
  getCurrentBrowserLocation,
  reverseGeocode,
} from '../api/geoapify'
import {
  getLocalSuburbSuggestions,
  mergeSuburbSuggestions,
} from '../localSuburbs'
import { toSuburbLocation } from '../suburb'
import '../location.css'

const SEARCH_SETTINGS = {
  address: { minimumCharacters: 3, delay: 350 },
  suburb: { minimumCharacters: 1, delay: 120 },
}

export default function AddressAutocomplete({
  id,
  label = 'Address',
  value = '',
  placeholder = 'Start typing a New Zealand address',
  bias,
  disabled = false,
  showCurrentLocation = true,
  searchType = 'address',
  onSelect,
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const requestNumber = useRef(0)
  const resultsId = `${id}-results`
  const searchSettings = SEARCH_SETTINGS[searchType]

  useEffect(() => {
    const trimmedQuery = query.trim()
    if (
      trimmedQuery.length < searchSettings.minimumCharacters ||
      query === value
    ) {
      return undefined
    }
    const localSuggestions =
      searchType === 'suburb' ? getLocalSuburbSuggestions(trimmedQuery) : []
    const controller = new AbortController()
    const currentRequest = ++requestNumber.current
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const search =
          searchType === 'suburb' ? autocompleteSuburbs : autocompleteAddresses
        const results = await search(trimmedQuery, {
          signal: controller.signal,
          bias,
        })
        if (currentRequest === requestNumber.current) {
          const nextSuggestions =
            searchType === 'suburb'
              ? mergeSuburbSuggestions(localSuggestions, results)
              : results
          setSuggestions(nextSuggestions)
          setActiveIndex(nextSuggestions.length > 0 ? 0 : -1)
          setIsOpen(true)
        }
      } catch (searchError) {
        if (
          searchError.name !== 'AbortError' &&
          localSuggestions.length === 0
        ) {
          setError(searchError.message)
        }
      } finally {
        if (currentRequest === requestNumber.current) setIsSearching(false)
      }
    }, searchSettings.delay)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [bias, query, searchSettings, searchType, value])

  async function selectSuggestion(suggestion) {
    setIsSearching(true)
    setError('')
    try {
      const location =
        searchType === 'suburb'
          ? suggestion.isLocalSuggestion
            ? await geocodeSuburb(suggestion.formattedAddress)
            : suggestion
          : await geocodeAddress(suggestion.formattedAddress)
      setQuery(location.formattedAddress)
      setSuggestions([])
      setActiveIndex(-1)
      setIsOpen(false)
      onSelect(location)
    } catch (selectionError) {
      setError(selectionError.message)
    } finally {
      setIsSearching(false)
    }
  }

  async function useCurrentLocation() {
    setIsSearching(true)
    setError('')
    try {
      const coordinates = await getCurrentBrowserLocation()
      let address
      try {
        const reverseGeocoded = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
        )
        if (searchType === 'suburb') {
          address = toSuburbLocation(reverseGeocoded)
          if (!address) throw new Error('Unable to identify your suburb.')
        } else {
          address = reverseGeocoded
        }
      } catch {
        if (searchType === 'suburb') {
          throw new Error(
            'We could not identify your suburb. Search for it instead.',
          )
        }
        address = {
          ...coordinates,
          name: 'Current location',
          formattedAddress: 'Current location',
          addressLine1: 'Current location',
          suburb: '',
          city: '',
          postcode: '',
          countryCode: 'nz',
        }
      }
      setQuery(address.formattedAddress)
      setSuggestions([])
      setActiveIndex(-1)
      setIsOpen(false)
      onSelect(address)
    } catch (locationError) {
      setError(locationError.message)
    } finally {
      setIsSearching(false)
    }
  }

  function closeResultsOnBlur(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  function handleKeyDown(event) {
    if (!isOpen || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      )
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      void selectSuggestion(suggestions[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="address-autocomplete">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div
        className="address-autocomplete-input-wrap"
        onBlur={closeResultsOnBlur}
      >
        <Search aria-hidden="true" size={17} />
        <input
          aria-activedescendant={
            isOpen && activeIndex >= 0
              ? `${resultsId}-option-${activeIndex}`
              : undefined
          }
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={isOpen && suggestions.length > 0}
          autoComplete="off"
          className="form-input"
          disabled={disabled}
          id={id}
          role="combobox"
          value={query}
          onChange={(event) => {
            const nextQuery = event.target.value
            const immediateSuggestions =
              searchType === 'suburb'
                ? getLocalSuburbSuggestions(nextQuery)
                : []
            setQuery(nextQuery)
            setSuggestions(immediateSuggestions)
            setActiveIndex(immediateSuggestions.length > 0 ? 0 : -1)
            setError('')
            setIsOpen(
              nextQuery.trim().length >= searchSettings.minimumCharacters,
            )
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        {isSearching && <span className="address-autocomplete-spinner" />}
        {isOpen && suggestions.length > 0 && (
          <div
            className="address-autocomplete-results"
            id={resultsId}
            role="listbox"
          >
            {suggestions.map((suggestion, index) => (
              <button
                className={index === activeIndex ? 'is-active' : undefined}
                id={`${resultsId}-option-${index}`}
                key={`${suggestion.placeId}-${suggestion.formattedAddress}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
              >
                <MapPin aria-hidden="true" size={17} />
                <span>
                  <strong>
                    {searchType === 'suburb'
                      ? suggestion.suburb || suggestion.city
                      : suggestion.addressLine1}
                  </strong>
                  <small>
                    {searchType === 'suburb'
                      ? suggestion.city || 'New Zealand'
                      : suggestion.formattedAddress}
                  </small>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="address-autocomplete-footer">
        {showCurrentLocation && (
          <button
            type="button"
            className="address-current-location"
            disabled={disabled || isSearching}
            onClick={useCurrentLocation}
          >
            <LocateFixed aria-hidden="true" size={15} />
            Use my current location
          </button>
        )}
        <span>
          {searchType === 'suburb'
            ? 'Suburbs by Geoapify'
            : 'Addresses by Geoapify'}
        </span>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
