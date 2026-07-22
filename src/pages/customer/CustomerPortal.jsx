import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'
import mockBusinesses from '../../data/mockBusinesses'
import { getDistanceKm } from '../../utils/distance'
import LoginPage from '../auth/LoginPage'
import ProtectedRoute from '../../auth/ProtectedRoute'
import Loyalty from './Loyalty'
import Jobs from './Jobs'
import Profile from './Profile'

export default function CustomerPortal() {
  return (
    <>
      <CustomerNav />
      <main style={styles.main}>
        <div style={styles.content}>
          <Routes>
            {/* All Navigates use absolute paths (/home not "home") to prevent loop */}
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home" element={<Home />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="jobs" element={<Jobs />} />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </main>
    </>
  )
}

function CustomerNav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" to="/home">
        Local<span className="logo-link">Link</span>
      </Link>
      <div className="nav-links">
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/home">Home</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/loyalty">Loyalty</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/jobs">Services</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/profile">Profile</NavLink>
      </div>
    </nav>
  )
}

// Default user location: Auckland CBD
const USER_LOCATION = { lat: -36.8485, lng: 174.7633 }

const styles = {
  main: { minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 24px' },
  content: { maxWidth: 860, margin: '0 auto', width: '100%' },
}


function Login() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2>Welcome to LocalLink</h2>
        <p>Sign in to discover local businesses and track your rewards.</p>
      </div>
      <div className="todo-note"><span>📝</span> Auth flow to be implemented — fields are placeholders only.</div>
      <div className="tab-row" style={{ margin: '0 auto 24px' }}>
        <button className="tab-btn active">Login</button>
        <button className="tab-btn">Register</button>
      </div>
      <div className="form-group">
        <label className="form-label">Email</label>
        <input className="form-input" type="email" placeholder="you@email.com" disabled />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input className="form-input" type="password" placeholder="••••••••" disabled />
      </div>
      <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/home')}>
        Sign In →
      </button>
    </div>
  )
} 

function Home() {
  const [activeFilter, setActiveFilter] = useState('All')
  const [radius, setRadius] = useState(5) // US009: default search radius in km
  const filters = ['All', 'Food & Drink', 'Retail', 'Services', 'Health', 'Trades']

  // US009: calculate distance for each business, filter by radius + category, sort nearest first
  const businessesWithDistance = mockBusinesses
    .map(biz => ({
      ...biz,
      distance: getDistanceKm(           // attach distance (km) to each business
        USER_LOCATION.lat, USER_LOCATION.lng,
        biz.lat, biz.lng
      ),
    }))
    .filter(biz => biz.distance <= radius) // only keep businesses within selected radius
    .filter(biz => activeFilter === 'All' || biz.category === activeFilter) // apply category filter
    .sort((a, b) => a.distance - b.distance) // sort closest first
  return (
    <>
      <div className="page-header">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Welcome Back</p>
        <h2>Discover Local</h2>
        <p>Find businesses near you and explore what's on.</p>
      </div>
      <div className="pill-filter-row">
        {filters.map(f => (
          <button key={f} className={`pill${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
      </div>
      {/* US009: radius slider - lets consumer adjust search range from 1 to 20 km */}
      <div className="radius-control">
        <div className="radius-header">
          <span className="radius-label">Search Radius</span>
          <span className="radius-value">{radius} km</span> {/* this displays current radius value */}
        </div>
        <input
          type="range"
          className="radius-slider"
          min={1}
          max={20}
          step={1}
          value={radius}
          onChange={e => setRadius(Number(e.target.value))} // this updates radius state on drag
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
      {/* US009: filtered business list -replaces old "Hot Deals"skeleton */}
      <div className="skeleton-section">
        {/* Header row: title on left, result count on right */}
        <div className="skeleton-section-title" style={{ justifyContent: 'space-between'}}>
          <span>Businesses Near You</span>
          <span style ={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-muted)',
            textTransform: 'none',
            letterSpacing: 'normal',
          }}>
            {/* dynamic count based on how many businesses pass the filters */}
            {businessesWithDistance.length} result{businessesWithDistance.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* US009: show empty state if no businesses within radius, otherwise render list */}
        {businessesWithDistance.length === 0 ? (
          <div className="empty-state">
            No Businesses found within {radius} km. Try increasing your radius.
          </div>
        ) : (
          <div className="business-grid">
            {businessesWithDistance.map(biz => (
              <div className="business-card" key={biz.id}>
                {/* category icon from getCategoryEmoji helper */}
                <div className="business-card-icon">
                  {getCategoryEmoji(biz.category)}
                </div>  
                {/* business info: name, ctageory tag, description */}
                <div className="business-card-body">
                  <div className="business-card-name">{biz.name}</div>
                  <div className="business-card-category">{biz.category}</div>
                  <div className="business-card-desc">{biz.description}</div>
                </div>
                {/* distance badge - calculated via Haversine, line 87 */}  
                <div className="business-card-distance">
                  {biz.distance.toFixed(1)} km
                </div>  
              </div>  
            ))}
          </div>  
        )}
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Business Detail View</div>
        <div className="skeleton-box tall">Business detail panel — component TBD</div>
      </div>
    </>
  )
}
// Helper: emoji icon for categories
function getCategoryEmoji(category) {
  const map = {
    'Food & Drink': '\u{1F354}',      // hamburger emoji
    'Retail': '\u{1F6CD}\u{FE0F}',    // shopping bags emoji
    'Services': '\u{2702}\u{FE0F}',   // scissors emoji
    'Health': '\u{1F3E5}',            // hospital emoji
    'Trades': '\u{1F527}',            // wrench emoji
  }
  return map[category] || '\u{1F4CD}' // map pin emoji
}
