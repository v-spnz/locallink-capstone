import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout failed:', error.message)
      setLogoutError('Unable to log out. Please try again.')
      setIsLoggingOut(false)
      return
    }

    navigate('/login', { replace: true })
  }

  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal details and location preferences.</p>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title is-complete">
          Profile Details
        </div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" disabled placeholder="Your Name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" disabled placeholder="you@email.com" />
        </div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Location Range Filter</div>
        <div className="placeholder-box">
          Range filter slider — component TBD
        </div>
      </div>

      {logoutError && <div className="error">{logoutError}</div>}

      <button
        type="button"
        className="btn-danger"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Logging out…' : 'Log Out'}
      </button>
    </>
  )
}
