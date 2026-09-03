import { MapPin } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import {
  fetchBusinessesInSavedSuburb,
  fetchCustomerLocation,
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
        const results = await fetchBusinessesInSavedSuburb(activeFilter)
        if (active) setBusinesses(results)
      } catch (searchError) {
        console.error('Unable to load businesses in your suburb.', searchError)
        if (active)
          setError(
            'Unable to load businesses in your suburb. Please try again.',
          )
      } finally {
        if (active) setIsSearching(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeFilter, location])

  return (
    <>
      <div className="page-header">
        <p
          style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}
        >
          Deals &amp; Discovery
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses and published deals in your registered suburb.</p>
        {location && (
          <div className="discovery-selected-location">
            <MapPin aria-hidden="true" size={17} />
            Showing {location.suburb}
          </div>
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

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {location ? (
        <Suspense
          fallback={<div className="discovery-map-empty">Loading map…</div>}
        >
          <DiscoveryMap location={location} businesses={businesses} />
        </Suspense>
      ) : (
        <div className="discovery-map-empty">
          {isLoadingLocation
            ? 'Loading your registered suburb...'
            : 'Add your suburb in Profile to discover local businesses.'}
        </div>
      )}

      <div className="placeholder-section">
        <div
          className="placeholder-section-title is-complete"
          style={{ justifyContent: 'space-between' }}
        >
          <span>
            {location ? `Businesses in ${location.suburb}` : 'Local businesses'}
          </span>
          <span style={resultCountStyles}>
            {isSearching
              ? 'Searching…'
              : `${businesses.length} result${businesses.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {!location ? (
          <div className="empty-state">
            Add your suburb in Profile to discover local businesses.
          </div>
        ) : !isSearching && businesses.length === 0 ? (
          <div className="empty-state">
            No businesses or deals are available in {location.suburb} right now.
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
