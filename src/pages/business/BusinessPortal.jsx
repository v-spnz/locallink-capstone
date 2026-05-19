import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'

export default function BusinessPortal() {
  return (
    <>
      <BusinessNav />
      <main style={styles.main}>
        <div style={styles.content}>
          <Routes>
            {/* Absolute paths (/business/...) to prevent redirect loops */}
            <Route index element={<Navigate to="/business/login" replace />} />
            <Route path="login"          element={<Login />} />
            <Route path="analytics"      element={<Analytics />} />
            <Route path="create-deal"    element={<CreateDeal />} />
            <Route path="create-loyalty" element={<CreateLoyalty />} />
            <Route path="settings"       element={<Settings />} />
            <Route path="*"              element={<Navigate to="/business/login" replace />} />
          </Routes>
        </div>
      </main>
      <div className="skeleton-badge">v1 Skeleton</div>
    </>
  )
}

function BusinessNav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" to="/business/analytics">
        <span className="logo-pin">📍</span>
        Local<span className="logo-link">Link</span>
        <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: 10, marginLeft: 8, fontWeight: 500 }}>
          Business
        </span>
      </Link>
      <div className="nav-links">
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/business/analytics">Dashboard</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/business/create-deal">Deals</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/business/create-loyalty">Loyalty</NavLink>
        <NavLink className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} to="/business/settings">Settings</NavLink>
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
        <h2>Business Portal</h2>
        <p>Sign in to manage your LocalLink business presence.</p>
      </div>
      <div className="todo-note"><span>📝</span> Auth flow to be implemented — fields are placeholders only.</div>
      <div className="tab-row" style={{ margin: '0 auto 24px' }}>
        <button className="tab-btn active">Login</button>
        <button className="tab-btn">Register</button>
      </div>
      <div className="form-group">
        <label className="form-label">Business Email</label>
        <input className="form-input" type="email" placeholder="hello@yourbusiness.co.nz" disabled />
      </div>
      <div className="form-group">
        <label className="form-label">Password</label>
        <input className="form-input" type="password" placeholder="••••••••" disabled />
      </div>
      <button className="btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={() => navigate('/business/analytics')}>
        Enter Dashboard →
      </button>
    </div>
  )
}

function Analytics() {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of customer engagement and campaign performance.</p>
      </div>
      <div className="todo-note"><span>📝</span> Real data and chart components to be wired in during development sprints.</div>
      <div className="stat-strip">
        {['Active Customers', 'Deals Redeemed', 'Loyalty Points Issued'].map(label => (
          <div className="stat-tile" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">—</div>
            <div className="stat-sub">Placeholder</div>
          </div>
        ))}
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Engagement Over Time</div>
        <div className="skeleton-box tall">Chart component — TBD</div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Top Performing Deals</div>
        <div className="skeleton-bar medium" /><div className="skeleton-bar full" /><div className="skeleton-bar short" />
      </div>
    </>
  )
}

function CreateDeal() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Deals</div>
        <h2>Create Deal</h2>
        <p>Set up a new promotional deal visible to local customers.</p>
      </div>
      <div className="todo-note"><span>📝</span> Form logic and deal categories to be finalised with client.</div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Deal Details</div>
        <div className="form-group"><label className="form-label">Deal Title</label><input className="form-input" disabled placeholder="e.g. 20% off this weekend" /></div>
        <div className="form-group"><label className="form-label">Description</label><input className="form-input" disabled placeholder="Short description…" /></div>
        <div className="form-group"><label className="form-label">Category</label><input className="form-input" disabled placeholder="Food / Retail / Services…" /></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Validity Window</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" disabled placeholder="dd/mm/yyyy" /></div>
          <div className="form-group"><label className="form-label">End Date</label><input className="form-input" disabled placeholder="dd/mm/yyyy" /></div>
        </div>
      </div>
      <button className="btn-primary" style={{ opacity: .5, cursor: 'not-allowed' }}>Publish Deal (disabled)</button>
    </>
  )
}

function CreateLoyalty() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Loyalty</div>
        <h2>Create Loyalty Programme</h2>
        <p>Design a stamp card or points-based loyalty scheme for your customers.</p>
      </div>
      <div className="todo-note"><span>📝</span> Earn / redeem logic to be scoped in sprint planning.</div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Programme Details</div>
        <div className="form-group"><label className="form-label">Programme Name</label><input className="form-input" disabled placeholder="e.g. Coffee Stamp Card" /></div>
        <div className="form-group"><label className="form-label">Reward Type</label><input className="form-input" disabled placeholder="Stamp Card / Points…" /></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Earn Rules</div>
        <div className="skeleton-box">Earn rule builder — TBD</div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Redeem Rules</div>
        <div className="skeleton-box">Redeem rule builder — TBD</div>
      </div>
      <button className="btn-primary" style={{ opacity: .5, cursor: 'not-allowed' }}>Launch Programme (disabled)</button>
    </>
  )
}

function Settings() {
  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your business profile and notification preferences.</p>
      </div>
      <div className="todo-note"><span>📝</span> Settings fields to be defined — pending UCD research and client sign-off.</div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Business Profile</div>
        <div className="form-group"><label className="form-label">Business Name</label><input className="form-input" disabled placeholder="Your Business Name" /></div>
        <div className="form-group"><label className="form-label">Location / Region</label><input className="form-input" disabled placeholder="e.g. Auckland, NZ" /></div>
        <div className="form-group"><label className="form-label">Category</label><input className="form-input" disabled placeholder="e.g. Café, Plumber, Retailer…" /></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Notifications</div>
        <div className="skeleton-bar medium" /><div className="skeleton-bar short" />
      </div>
    </>
  )
}