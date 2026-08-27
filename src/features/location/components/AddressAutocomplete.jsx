import { LocateFixed, MapPin, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  autocompleteAddresses,
  geocodeAddress,
  getCurrentBrowserLocation,
  reverseGeocode,
} from '../api/geoapify'
import '../location.css'

export default function AddressAutocomplete({
  id,
  label = 'Address',
  value = '',
  placeholder = 'Start typing a New Zealand address',
  bias,
  disabled = false,
  showCurrentLocation = true,
  onSelect,
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const requestNumber = useRef(0)

  useEffect(() => {
    if (query.trim().length < 3 || query === value) return undefined
    const controller = new AbortController()
    const currentRequest = ++requestNumber.current
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const results = await autocompleteAddresses(query.trim(), {
          signal: controller.signal,
          bias,
        })
        if (currentRequest === requestNumber.current) {
          setSuggestions(results)
          setIsOpen(true)
        }
      } catch (searchError) {
        if (searchError.name !== 'AbortError') setError(searchError.message)
      } finally {
        if (currentRequest === requestNumber.current) setIsSearching(false)
      }
    }, 350)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [bias, query, value])

  async function selectSuggestion(suggestion) {
    setIsSearching(true)
    setError('')
    try {
      const address = await geocodeAddress(suggestion.formattedAddress)
      setQuery(address.formattedAddress)
      setSuggestions([])
      setIsOpen(false)
      onSelect(address)
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
        address = await reverseGeocode(
          coordinates.latitude,
          coordinates.longitude,
        )
      } catch {
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
      setIsOpen(false)
      onSelect(address)
    } catch (locationError) {
      setError(locationError.message)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="address-autocomplete">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      <div className="address-autocomplete-input-wrap">
        <Search aria-hidden="true" size={17} />
        <input
          autoComplete="off"
          className="form-input"
          disabled={disabled}
          id={id}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
        />
        {isSearching && <span className="address-autocomplete-spinner" />}
      </div>
      {isOpen && suggestions.length > 0 && (
        <div className="address-autocomplete-results" role="listbox">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.placeId}-${suggestion.formattedAddress}`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectSuggestion(suggestion)}
            >
              <MapPin aria-hidden="true" size={17} />
              <span>
                <strong>{suggestion.addressLine1}</strong>
                <small>{suggestion.formattedAddress}</small>
              </span>
            </button>
          ))}
        </div>
      )}
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
        <span>Addresses by Geoapify</span>
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  )
}
