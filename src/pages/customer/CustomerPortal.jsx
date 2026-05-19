import { useState } from 'react'
import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'

export default function CustomerPortal() {
  return (
    <>
      <CustomerNav />
      <main style={styles.main}>
        <div style={styles.content}>
          <Routes>
            {/* All Navigates use absolute paths (/home not "home") to prevent loop */}
            <Route index element={<Navigate to="/home" replace />} />
            <Route path="home"    element={<Home />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="jobs"    element={<Jobs />} />
            <Route path="profile" element={<Profile />} />
            <Route path="login"   element={<Login />} />
            <Route path="*"       element={<Navigate to="/home" replace />} />
          </Routes>
        </div>
      </main>
      <div className="skeleton-badge">v1 Skeleton</div>
    </>
  )
}

function CustomerNav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" to="/home">
        <span className="logo-pin">📍</span>
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

const styles = {
  main:    { minHeight: 'calc(100vh - 60px)', background: 'var(--bg)', padding: '40px 24px' },
  content: { maxWidth: 860, margin: '0 auto', width: '100%' },
}

/* ══ Pages ══════════════════════════════════════════════════════════ */

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
  const filters = ['All', 'Food & Drink', 'Retail', 'Services', 'Health', 'Trades']
  return (
    <>
      <div className="page-header">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Good morning 👋</p>
        <h2>Discover Local</h2>
        <p>Find businesses near you and explore what's on.</p>
      </div>
      <div className="pill-filter-row">
        {filters.map(f => (
          <button key={f} className={`pill${activeFilter === f ? ' active' : ''}`} onClick={() => setActiveFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="map-placeholder">
        <span className="map-placeholder-label">📍 Map Overlay — component TBD</span>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Hot Deals Near You</div>
        <div className="skeleton-grid">
          {[1,2,3].map(i => (
            <div className="skeleton-card" key={i}>
              <div className="sk-icon" />
              <div className="skeleton-bar short" style={{ margin: 0 }} />
              <div className="skeleton-bar medium" style={{ margin: 0, height: 10 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>x.x km away</div>
            </div>
          ))}
        </div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Business Detail View</div>
        <div className="skeleton-box tall">Business detail panel — component TBD</div>
      </div>
    </>
  )
}

function Loyalty() {
  const [tab, setTab] = useState('inprogress')
  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your stamp cards and points across local businesses.</p>
      </div>
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Points</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--blue)' }}>—</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Placeholder</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>⭐ Gold Member</div>
          <div className="progress-bar-track" style={{ width: 160 }}>
            <div className="progress-bar-fill" style={{ width: '64%' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>180 pts to Platinum</div>
        </div>
      </div>
      <div className="tab-row">
        <button className={`tab-btn${tab === 'inprogress' ? ' active' : ''}`} onClick={() => setTab('inprogress')}>In Progress</button>
        <button className={`tab-btn${tab === 'completed'  ? ' active' : ''}`} onClick={() => setTab('completed')}>Completed</button>
      </div>
      {tab === 'inprogress' ? (
        <div className="skeleton-section">
          <div className="skeleton-section-title">In Progress</div>
          <div className="skeleton-grid">
            {[1,2,3].map(i => (
              <div className="skeleton-card" key={i}>
                <div className="sk-icon" />
                <div className="skeleton-bar short" style={{ margin: 0 }} />
                <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${30 + i * 20}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="skeleton-section">
          <div className="skeleton-section-title">Completed</div>
          <div className="skeleton-box">Completed programmes list — component TBD</div>
        </div>
      )}
    </>
  )
}

function Jobs() {
  return (
    <>
      <div className="page-header">
        <h2>Services</h2>
        <p>Post a job and receive quotes from local tradespeople in your area.</p>
      </div>
      <div className="todo-note"><span>📝</span> Quote visibility logic and job status flow to be confirmed with client.</div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Post a Job</div>
        <div className="form-group"><label className="form-label">Job Title</label><input className="form-input" disabled placeholder="e.g. Leaking tap repair" /></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" disabled placeholder="Describe the job…" /></div>
        <div className="form-group"><label className="form-label">Trade Category</label><input className="form-input" disabled placeholder="Plumbing / Electrical / Carpentry…" /></div>
        <button className="btn-primary" style={{ opacity: .5, cursor: 'not-allowed', marginTop: 4 }}>Post Job (disabled)</button>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Quotes Received</div>
        <div className="skeleton-box">Quotes list — component TBD</div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Job Status</div>
        <div className="skeleton-bar medium" /><div className="skeleton-bar short" />
      </div>
    </>
  )
}

function Profile() {
  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal details and location preferences.</p>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Profile Details</div>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" disabled placeholder="Your Name" /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" disabled placeholder="you@email.com" /></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Location Range Filter</div>
        <div className="todo-note" style={{ marginBottom: 12 }}><span>📝</span> Range slider — scope to be confirmed with client.</div>
        <div className="skeleton-box">Range filter slider — component TBD</div>
      </div>
    </>
  )
}