import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'
import {useState} from 'react'
import CreateDeal from './CreateDeal'
import CreateLoyalty from './CreateLoyalty'
import Analytics from './Analytics'
import Settings from './Settings'

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
    </>
  )
}

function BusinessNav() {
  return (
    <nav className="nav">
      <Link className="nav-logo" to="/business/analytics">
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


function Login() {
  const navigate = useNavigate()
  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2>Business Portal</h2>
        <p>Sign in to manage your LocalLink business presence.</p>
      </div>
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
