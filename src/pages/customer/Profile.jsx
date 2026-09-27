import {
  Award,
  Bell,
  Briefcase,
  ChevronRight,
  LogOut,
  ShoppingBag,
  User,
  UserCog,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'
import AddressAutocomplete from '../../features/location/components/AddressAutocomplete'
import {
  fetchCustomerLocation,
  saveCustomerLocation,
} from '../../features/location/api/locations'
import useAllHistory from './hooks/useAllHistory'
import './AccountSettings.css'

function SettingsHeading({ icon: Icon, title }) {
  return (
    <div className="account-settings-section-heading">
      {Icon && (
        <span aria-hidden="true">
          <Icon />
        </span>
      )}
      <h2>{title}</h2>
    </div>
  )
}

function YourProfile({
  profile,
  user,
  customerLocation,
  locationStatus,
  onLocationSelect,
}) {
  return (
    <section className="account-settings-section">
      <SettingsHeading icon={User} title="Your profile" />

      <dl className="account-settings-detail-list">
        <div>
          <dt>First name</dt>
          <dd>
            {profile?.first_name ?? user.user_metadata?.first_name ?? '—'}
          </dd>
        </div>
        <div>
          <dt>Last name</dt>
          <dd>{profile?.last_name ?? user.user_metadata?.last_name ?? '—'}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user.email ?? '—'}</dd>
        </div>
      </dl>

      <div style={{ marginTop: 8 }}>
        <SettingsHeading icon={ShoppingBag} title="Registered suburb" />
        <p className="account-section-copy">
          LocalLink uses this suburb for all business and deal discovery. You
          can update it here if you move.
        </p>
        <AddressAutocomplete
          key={customerLocation?.formattedAddress || 'profile-location'}
          id="profile-address"
          label="Registered suburb"
          value={customerLocation?.formattedAddress || ''}
          bias={customerLocation}
          showCurrentLocation={false}
          searchType="suburb"
          onSelect={onLocationSelect}
        />
        {locationStatus && (
          <p className="account-section-copy" role="status">
            {locationStatus}
          </p>
        )}
      </div>
    </section>
  )
}

function BusinessAccess({ hasBusinessAccess }) {
  return (
    <section className="account-settings-section">
      <SettingsHeading icon={Briefcase} title="Business access" />
      <p className="account-section-copy">
        {hasBusinessAccess
          ? 'Manage your business without creating another login.'
          : 'Add business tools to this account while keeping your personal access.'}
      </p>
      <div className="account-settings-actions">
        <Link
          className="btn-secondary"
          to={
            hasBusinessAccess ? '/business/analytics' : '/business/onboarding'
          }
        >
          {hasBusinessAccess ? 'Open business portal' : 'Set up a business'}
        </Link>
      </div>
    </section>
  )
}

const HISTORY_ICONS = {
  job: Briefcase,
  deal: ShoppingBag,
  loyalty: Award,
}

function AllHistory() {
  const history = useAllHistory()

  return (
    <section className="account-settings-section">
      <SettingsHeading icon={Award} title="All history" />
      <p className="account-section-copy">
        Completed jobs, deal claims, and loyalty programmes, all in one place.
      </p>

      {history.error && (
        <div className="error" role="alert">
          {history.error}
        </div>
      )}

      {history.isLoading ? (
        <div className="account-settings-empty">Loading your history…</div>
      ) : history.items.length === 0 ? (
        <div className="account-settings-empty">
          Nothing here yet — completed jobs, claimed deals, and finished loyalty
          programmes will show up here.
        </div>
      ) : (
        <div className="account-history-list">
          {history.items.map((item) => {
            const Icon = HISTORY_ICONS[item.type]
            return (
              <div className="account-history-row" key={item.id}>
                <span className={`account-history-icon is-${item.type}`}>
                  <Icon aria-hidden="true" size={18} />
                </span>
                <div className="account-history-text">
                  <div className="account-history-title">{item.title}</div>
                  <div className="account-history-sub">
                    {item.subtitle} · {item.statusLabel}
                  </div>
                </div>
                <span className="account-history-date">
                  {item.date
                    ? new Date(item.date).toLocaleDateString('en-NZ', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function NotificationPreferences() {
  return (
    <section className="account-settings-section">
      <SettingsHeading icon={Bell} title="Notifications" />
      <div className="account-settings-callout">
        <Bell aria-hidden="true" />
        <span>
          <strong>Important notifications are on</strong>
          Job, deal, and loyalty updates remain enabled while preference
          controls are being developed.
        </span>
      </div>
    </section>
  )
}

function AccountAccess({ logoutError, isLoggingOut, handleLogout }) {
  return (
    <section className="account-settings-section">
      <SettingsHeading icon={UserCog} title="Account access" />
      {logoutError && (
        <div className="error" role="alert">
          {logoutError}
        </div>
      )}
      <div className="account-settings-actions">
        <button
          type="button"
          className="btn-danger"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut aria-hidden="true" />
          {isLoggingOut ? 'Logging out…' : 'Log Out'}
        </button>
      </div>
    </section>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [profile, setProfile] = useState(null)
  const [hasBusinessAccess, setHasBusinessAccess] = useState(false)
  const [customerLocation, setCustomerLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('')

  useEffect(() => {
    let active = true

    async function loadProfile() {
      const [profileResult, membershipResult, savedLocation] =
        await Promise.all([
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
          fetchCustomerLocation().catch(() => null),
        ])

      if (active) {
        setProfile(profileResult.data)
        setHasBusinessAccess(Boolean(membershipResult.data))
        setCustomerLocation(savedLocation)
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

  async function handleLocationSelect(address) {
    setLocationStatus('Saving location…')
    try {
      await saveCustomerLocation(address)
      setCustomerLocation(address)
      setLocationStatus('Location saved successfully.')
    } catch (error) {
      console.error('Unable to save profile location.', error)
      setLocationStatus('Unable to save this location. Please try again.')
    }
  }

  const settingsPages = [
    { path: 'profile', label: 'Your Profile', icon: User },
    { path: 'business-access', label: 'Business Access', icon: Briefcase },
    { path: 'history', label: 'All History', icon: Award },
    { path: 'notifications', label: 'Notifications', icon: Bell },
    { path: 'access', label: 'Account Access', icon: UserCog },
  ]

  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal details, history, and account.</p>
      </div>

      <div className="account-settings-shell">
        <aside className="account-settings-sidebar">
          <nav aria-label="Profile settings pages">
            <p>Settings</p>
            <div className="account-settings-nav-list">
              {settingsPages.map((page) => {
                const Icon = page.icon
                return (
                  <NavLink
                    key={page.path}
                    to={`/profile/${page.path}`}
                    className={({ isActive }) =>
                      isActive ? 'is-active' : undefined
                    }
                  >
                    <Icon aria-hidden="true" />
                    <span>{page.label}</span>
                    <ChevronRight aria-hidden="true" />
                  </NavLink>
                )
              })}
            </div>
          </nav>
        </aside>

        <div className="account-settings-content">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route
              path="profile"
              element={
                <YourProfile
                  profile={profile}
                  user={user}
                  customerLocation={customerLocation}
                  locationStatus={locationStatus}
                  onLocationSelect={handleLocationSelect}
                />
              }
            />
            <Route
              path="business-access"
              element={<BusinessAccess hasBusinessAccess={hasBusinessAccess} />}
            />
            <Route path="history" element={<AllHistory />} />
            <Route path="notifications" element={<NotificationPreferences />} />
            <Route
              path="access"
              element={
                <AccountAccess
                  logoutError={logoutError}
                  isLoggingOut={isLoggingOut}
                  handleLogout={handleLogout}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to="/profile/profile" replace />}
            />
          </Routes>
        </div>
      </div>
    </>
  )
}
