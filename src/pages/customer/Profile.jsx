import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [profile, setProfile] = useState(null)
  const [hasBusinessAccess, setHasBusinessAccess] = useState(false)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      const [profileResult, membershipResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('business_members')
          .select('business_id')
          .eq('profile_id', user.id)
          .limit(1)
          .maybeSingle(),
      ])

      if (active) {
        setProfile(profileResult.data)
        setHasBusinessAccess(Boolean(membershipResult.data))
      }
    }

    loadProfile()
    return () => {
      active = false
    }
  }, [user.id])

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
          <label className="form-label" htmlFor="profile-first-name">
            First Name
          </label>
          <input
            id="profile-first-name"
            className="form-input"
            disabled
            value={profile?.first_name ?? user.user_metadata?.first_name ?? ''}
            placeholder="First name"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-last-name">
            Last Name
          </label>
          <input
            id="profile-last-name"
            className="form-input"
            disabled
            value={profile?.last_name ?? user.user_metadata?.last_name ?? ''}
            placeholder="Last name"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            className="form-input"
            disabled
            value={user.email ?? ''}
            placeholder="you@email.com"
          />
        </div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Location Range Filter</div>
        <div className="placeholder-box">
          Range filter slider — component TBD
        </div>
      </div>

      <div className="placeholder-section">
        <div className="placeholder-section-title">Business access</div>
        <p className="account-section-copy">
          {hasBusinessAccess
            ? 'Manage your business without creating another login.'
            : 'Add business tools to this account while keeping your personal access.'}
        </p>
        <Link
          className="btn-secondary"
          to={
            hasBusinessAccess ? '/business/analytics' : '/business/onboarding'
          }
        >
          {hasBusinessAccess ? 'Open business portal' : 'Set up a business'}
        </Link>
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
