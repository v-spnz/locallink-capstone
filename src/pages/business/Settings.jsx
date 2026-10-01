import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  LayoutDashboard,
  ReceiptText,
  ShieldCheck,
  UserCog,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import BusinessPageLoader from '../../components/ui/BusinessPageLoader'
import AccountAccess from '../../features/business-settings/components/AccountAccess'
import AccountOverview from '../../features/business-settings/components/AccountOverview'
import BusinessProfile from '../../features/business-settings/components/BusinessProfile'
import NotificationPreferences from '../../features/business-settings/components/NotificationPreferences'
import ServiceProfile from '../../features/business-settings/components/ServiceProfile'
import {
  addManagedBusinessLocation,
  fetchManagedBusinessLocations,
} from '../../features/location/api/locations'
import { clearRegistrationFlow } from '../../features/onboarding/registrationFlow'
import { supabase } from '../../lib/supabase'
import ClaimRecords from './ClaimRecords'
import '../../features/business-settings/BusinessSettings.css'

export default function Settings() {
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [businessLocations, setBusinessLocations] = useState([])
  const [areLocationsLoading, setAreLocationsLoading] = useState(true)
  const [isSavingLocation, setIsSavingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState(null)
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
  const primaryLocation =
    businessLocations.find(
      (location) =>
        location.is_primary && location.formatted_address && location.suburb,
    ) ??
    businessLocations.find(
      (location) => location.formatted_address && location.suburb,
    ) ??
    businessLocations.find((location) => location.is_primary) ??
    businessLocations[0]

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

  async function handleLocationSelect(address) {
    if (!address.suburb?.trim()) {
      setLocationStatus({
        variant: 'error',
        message:
          'We could not identify the suburb for this address. Choose another search result.',
      })
      return false
    }

    setIsSavingLocation(true)
    setLocationStatus({ variant: 'loading', message: 'Saving location…' })

    try {
      await addManagedBusinessLocation(business.id, address)
      const locations = await fetchManagedBusinessLocations(business.id)
      setBusinessLocations(locations)
      setLocationStatus({
        variant: 'success',
        message: `Store address saved. Suburb: ${address.suburb}.`,
      })
      return true
    } catch (error) {
      console.error('Unable to save business location.', error)
      setLocationStatus({
        variant: 'error',
        message: 'Unable to save this address. Please try again.',
      })
      return false
    } finally {
      setIsSavingLocation(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    setLogoutError('')
    clearRegistrationFlow()

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
                  primaryLocation={primaryLocation}
                  locationStatus={locationStatus}
                  isSavingLocation={isSavingLocation}
                  onLocationSelect={handleLocationSelect}
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
