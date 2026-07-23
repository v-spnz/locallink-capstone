import { useState } from 'react'
import mockBusinesses from '../../data/mockBusinesses'
import { getDistanceKm } from '../../utils/distance'

const USER_LOCATION = { lat: -36.8485, lng: 174.7633 }
const filters = [
  'All',
  'Food & Drink',
  'Retail',
  'Services',
  'Health',
  'Trades',
]

export default function Home() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [radius, setRadius] = useState(5)

  const businessesWithDistance = mockBusinesses
    .map((business) => ({
      ...business,
      distance: getDistanceKm(
        USER_LOCATION.lat,
        USER_LOCATION.lng,
        business.lat,
        business.lng,
      ),
    }))
    .filter((business) => business.distance <= radius)
    .filter(
      (business) =>
        activeFilter === 'All' || business.category === activeFilter,
    )
    .sort(
      (firstBusiness, secondBusiness) =>
        firstBusiness.distance - secondBusiness.distance,
    )

  return (
    <>
      <div className="page-header">
        <p
          style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}
        >
          Welcome Back
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses near you and explore what's on.</p>
      </div>

      <div className="pill-filter-row">
        {filters.map((filter) => (
          <button
            key={filter}
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
          type="range"
          className="radius-slider"
          min={1}
          max={20}
          step={1}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
        <div className="radius-ticks">
          <span>1 km</span>
          <span>10 km</span>
          <span>20 km</span>
        </div>
      </div>

      <div className="map-placeholder">
        <span className="map-placeholder-label">Map Preview</span>
      </div>

      <div className="placeholder-section">
        <div
          className="placeholder-section-title is-complete"
          style={{ justifyContent: 'space-between' }}
        >
          <span>Businesses Near You</span>
          <span style={resultCountStyles}>
            {businessesWithDistance.length} result
            {businessesWithDistance.length !== 1 ? 's' : ''}
          </span>
        </div>
        {businessesWithDistance.length === 0 ? (
          <div className="empty-state">
            No Businesses found within {radius} km. Try increasing your radius.
          </div>
        ) : (
          <div className="business-grid">
            {businessesWithDistance.map((business) => (
              <div className="business-card" key={business.id}>
                <div className="business-card-icon">
                  {getCategoryEmoji(business.category)}
                </div>
                <div className="business-card-body">
                  <div className="business-card-name">{business.name}</div>
                  <div className="business-card-category">
                    {business.category}
                  </div>
                  <div className="business-card-desc">
                    {business.description}
                  </div>
                </div>
                <div className="business-card-distance">
                  {business.distance.toFixed(1)} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title">Business Detail View</div>
        <div className="placeholder-box tall">
          Business detail panel — component TBD
        </div>
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
    Health: '🏥',
    Trades: '🔧',
  }

  return categoryIcons[category] || '📍'
}
