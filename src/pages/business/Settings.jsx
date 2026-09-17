import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Tags,
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
import useBusiness from '../../business/useBusiness'
import BusinessPageLoader from '../../components/ui/BusinessPageLoader'
import { supabase } from '../../lib/supabase'
import { fetchManagedBusinessLocations } from '../../features/location/api/locations'
import ClaimRecords from './ClaimRecords'

function SettingsHeading({ icon: Icon, title }) {
  return (
    <div className="business-settings-section-heading">
      {Icon && (
        <span aria-hidden="true">
          <Icon />
        </span>
      )}
      <h2>{title}</h2>
    </div>
  )
}

function AccountOverview({
  business,
  businessLocations,
  serviceCategories,
  enabledCapabilities,
}) {
  return (
    <section className="business-settings-section business-settings-overview">
      <SettingsHeading title="Account overview" />

      <dl className="business-settings-summary" aria-label="Account summary">
        <div>
          <dt>
            <ShieldCheck aria-hidden="true" />
            Verification
          </dt>
          <dd>{business.verification_status.replaceAll('_', ' ')}</dd>
        </div>
        <div>
          <dt>
            <MapPin aria-hidden="true" />
            Locations
          </dt>
          <dd>{businessLocations.length}</dd>
        </div>
        <div>
          <dt>
            <Tags aria-hidden="true" />
            Service categories
          </dt>
          <dd>{serviceCategories.length}</dd>
        </div>
        <div>
          <dt>
            <CheckCircle2 aria-hidden="true" />
            Enabled tools
          </dt>
          <dd>{enabledCapabilities.length}</dd>
        </div>
      </dl>
    </section>
  )
}

function BusinessProfile({ business, membership, enabledCapabilities }) {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={Building2} title="Business profile" />

      <dl className="business-settings-detail-list">
        <div>
          <dt>Business name</dt>
          <dd>{business.business_name}</dd>
        </div>
        <div>
          <dt>Your access</dt>
          <dd>{membership.role}</dd>
        </div>
        <div>
          <dt>Description</dt>
          <dd>{business.description || 'No description added'}</dd>
        </div>
        <div>
          <dt>Enabled capabilities</dt>
          <dd>{enabledCapabilities.join(', ') || 'None enabled'}</dd>
        </div>
      </dl>
    </section>
  )
}

function ServiceProfile({
  business,
  serviceProfile,
  serviceCategories,
  serviceAreas,
}) {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={BriefcaseBusiness} title="Service profile" />

      <dl className="business-settings-detail-list">
        <div>
          <dt>Verification status</dt>
          <dd>{business.verification_status.replace('_', ' ')}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{serviceProfile?.availability || 'Not set'}</dd>
        </div>
        <div>
          <dt>Service description</dt>
          <dd>{serviceProfile?.service_description || 'Not set'}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>
            {serviceCategories
              .map((category) => category.service_category)
              .join(', ') || 'Not set'}
          </dd>
        </div>
        <div>
          <dt>Service areas</dt>
          <dd>
            {serviceAreas.map((area) => area.service_area).join(', ') ||
              'Not set'}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function NotificationPreferences() {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={Bell} title="Notification preferences" />
      <div className="business-settings-callout">
        <Bell aria-hidden="true" />
        <span>
          <strong>Important notifications are on</strong>
          Lead and job updates remain enabled while preference controls are
          being developed.
        </span>
      </div>
    </section>
  )
}

function AccountAccess({ logoutError, isLoggingOut, handleLogout }) {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={UserCog} title="Account access" />
      {logoutError && (
        <div className="error" role="alert">
          {logoutError}
        </div>
      )}
      <div className="business-settings-actions">
        <Link className="btn-secondary" to="/home">
          Go to consumer portal
        </Link>
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

export default function Settings() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [businessLocations, setBusinessLocations] = useState([])
  const [areLocationsLoading, setAreLocationsLoading] = useState(true)
  const {
    business,
    membership,
    capabilities,
    serviceProfile,
    serviceCategories,
    serviceAreas,
  } = useBusiness()

  const enabledCapabilities = [
    capabilities.deals_enabled && 'Deals',
    capabilities.loyalty_enabled && 'Loyalty',
    capabilities.service_marketplace_enabled && 'Service Marketplace',
  ].filter(Boolean)

  const settingsPages = [
    {
      path: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      path: 'profile',
      label: 'Business profile',
      icon: Building2,
    },
    ...(capabilities.service_marketplace_enabled
      ? [
          {
            path: 'services',
            label: 'Service profile',
            icon: BriefcaseBusiness,
          },
        ]
      : []),
    ...(capabilities.deals_enabled
      ? [
          {
            path: 'claim-records',
            label: 'Claim records',
            icon: ReceiptText,
          },
        ]
      : []),
    {
      path: 'notifications',
      label: 'Notifications',
      icon: Bell,
    },
    {
      path: 'access',
      label: 'Account access',
      icon: UserCog,
    },
  ]

  useEffect(() => {
    let active = true
    async function loadLocations() {
      try {
        const locations = await fetchManagedBusinessLocations(business.id)
        if (active) setBusinessLocations(locations)
      } catch (error) {
        console.error('Unable to load business locations.', error)
      } finally {
        if (active) setAreLocationsLoading(false)
      }
    }
    loadLocations()
    return () => {
      active = false
    }
  }, [business.id])

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

  if (areLocationsLoading) {
    return <BusinessPageLoader label="Loading settings…" />
  }

  return (
    <div className="business-settings-page">
      <div className="business-settings-shell">
        <aside className="business-settings-sidebar">
          <nav aria-label="Business settings pages">
            <p>Settings</p>
            <div className="business-settings-nav-list">
              {settingsPages.map((page) => {
                const Icon = page.icon

                return (
                  <NavLink
                    key={page.path}
                    to={`/business/settings/${page.path}`}
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

          <div className="business-settings-sidebar-status">
            <ShieldCheck aria-hidden="true" />
            <span>
              <small>Business status</small>
              <strong>
                {business.verification_status.replaceAll('_', ' ')}
              </strong>
            </span>
          </div>
        </aside>

        <div className="business-settings-content">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route
              path="overview"
              element={
                <AccountOverview
                  business={business}
                  businessLocations={businessLocations}
                  serviceCategories={serviceCategories}
                  enabledCapabilities={enabledCapabilities}
                />
              }
            />
            <Route
              path="profile"
              element={
                <BusinessProfile
                  business={business}
                  membership={membership}
                  enabledCapabilities={enabledCapabilities}
                />
              }
            />
            <Route
              path="services"
              element={
                capabilities.service_marketplace_enabled ? (
                  <ServiceProfile
                    business={business}
                    serviceProfile={serviceProfile}
                    serviceCategories={serviceCategories}
                    serviceAreas={serviceAreas}
                  />
                ) : (
                  <Navigate to="/business/settings/overview" replace />
                )
              }
            />
            <Route
              path="claim-records"
              element={
                capabilities.deals_enabled ? (
                  <ClaimRecords />
                ) : (
                  <Navigate to="/business/settings/overview" replace />
                )
              }
            />
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
              element={<Navigate to="/business/settings/overview" replace />}
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}
