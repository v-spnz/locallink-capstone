import { MapPin } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import AddressAutocomplete from '../../features/location/components/AddressAutocomplete'
import {
  fetchCustomerLocation,
  fetchNearbyBusinesses,
  saveCustomerLocation,
} from '../../features/location/api/locations'
import '../../features/location/discovery.css'

const DiscoveryMap = lazy(
  () => import('../../features/location/components/DiscoveryMap'),
)

const FILTERS = [
  'All',
  'Food & Drink',
  'Retail',
  'Services',
  'Health & Wellness',
  'Trades',
  'Entertainment',
  'Other',
]

export default function Deals() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [radius, setRadius] = useState(5)
  const [location, setLocation] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const savedLocation = await fetchCustomerLocation()
        if (active) setLocation(savedLocation)
      } catch (loadError) {
        console.error('Unable to load saved location.', loadError)
        if (active) setError('Unable to load your saved location.')
      } finally {
        if (active) setIsLoadingLocation(false)
      }
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!location) return undefined
    let active = true
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const results = await fetchNearbyBusinesses({
          latitude: location.latitude,
          longitude: location.longitude,
          radiusKm: radius,
          category: activeFilter,
        })
        if (active) setBusinesses(results)
      } catch (searchError) {
        console.error('Unable to search nearby businesses.', searchError)
        if (active)
          setError('Unable to search nearby businesses. Please try again.')
      } finally {
        if (active) setIsSearching(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeFilter, location, radius])

  async function selectLocation(address) {
    setLocation(address)
    setError('')
    try {
      await saveCustomerLocation(address)
    } catch (saveError) {
      console.error('Unable to save customer location.', saveError)
      setError(
        'This location can be used for this search, but could not be saved to your profile.',
      )
    }
  }

  return (
    <>
      <div className="page-header">
        <p
          style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}
        >
          Deals &amp; Discovery
        </p>
        <h2>Discover Local</h2>
        <p>Find real businesses and published deals near your location.</p>
      </div>

      <div className="discovery-location-card">
        <h3>Where should we search?</h3>
        <p>Select an address or securely use your browser location.</p>
        {location && (
          <div className="discovery-selected-location">
            <MapPin aria-hidden="true" size={17} />
            {location.formattedAddress}
          </div>
        )}
        {!isLoadingLocation && (
          <AddressAutocomplete
            key={location?.formattedAddress || 'new-location'}
            id="discovery-address"
            label={location ? 'Change search location' : 'Search location'}
            value={location?.formattedAddress || ''}
            bias={location}
            onSelect={selectLocation}
          />
        )}
      </div>

      <div className="pill-filter-row" aria-label="Business category filters">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`pill${activeFilter === filter ? ' active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="radius-control">
        <div className="radius-header">
          <span className="radius-label">Search Radius</span>
          <span className="radius-value">{radius} km</span>
        </div>
        <input
          aria-label="Search radius in kilometres"
          type="range"
          className="radius-slider"
          min={1}
          max={50}
          step={1}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <div className="radius-ticks">
          <span>1 km</span>
          <span>25 km</span>
          <span>50 km</span>
        </div>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {location ? (
        <Suspense
          fallback={<div className="discovery-map-empty">Loading map…</div>}
        >
          <DiscoveryMap
            location={location}
            radiusKm={radius}
            businesses={businesses}
          />
        </Suspense>
      ) : (
        <div className="discovery-map-empty">
          Choose an address or use your current location to view the map.
        </div>
      )}

      <div className="placeholder-section">
        <div
          className="placeholder-section-title is-complete"
          style={{ justifyContent: 'space-between' }}
        >
          <span>Businesses Near You</span>
          <span style={resultCountStyles}>
            {isSearching
              ? 'Searching…'
              : `${businesses.length} result${businesses.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {!location ? (
          <div className="empty-state">Select a search location above.</div>
        ) : !isSearching && businesses.length === 0 ? (
          <div className="empty-state">
            No businesses found within {radius} km. Try increasing your radius.
          </div>
        ) : (
          <div className="business-grid">
            {businesses.map((business) => (
              <div className="business-card" key={business.business_id}>
                <div className="business-card-icon">
                  {getCategoryEmoji(business.category)}
                </div>
                <div className="business-card-body">
                  <div className="business-card-name">
                    {business.business_name}
                  </div>
                  <div className="business-card-category">
                    {business.category}
                  </div>
                  <div className="business-card-desc">
                    {business.deal_description || business.description}
                  </div>
                  {business.deal_title && (
                    <div className="business-card-deal">
                      Deal: {business.deal_title}
                    </div>
                  )}
                  <div className="business-card-address">
                    {business.formatted_address}
                  </div>
                </div>
                <div className="business-card-distance">
                  {Number(business.distance_km).toFixed(1)} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const resultCountStyles = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'none',
  letterSpacing: 'normal',
}

function getCategoryEmoji(category) {
  const categoryIcons = {
    'Food & Drink': '🍔',
    Retail: '🛍️',
    Services: '✂️',
    'Health & Wellness': '🏥',
    Trades: '🔧',
    Entertainment: '🎟️',
  }
  return categoryIcons[category] || '📍'
}
