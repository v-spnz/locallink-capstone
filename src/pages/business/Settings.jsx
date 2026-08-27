import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import { supabase } from '../../lib/supabase'
import AddressAutocomplete from '../../features/location/components/AddressAutocomplete'
import {
  addManagedBusinessLocation,
  deleteManagedBusinessLocation,
  fetchManagedBusinessLocations,
} from '../../features/location/api/locations'

export default function Settings() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState('')
  const [businessLocations, setBusinessLocations] = useState([])
  const [locationStatus, setLocationStatus] = useState('')
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

  useEffect(() => {
    if (!location.hash) return undefined

    const sectionId = location.hash.slice(1)
    const scrollFrame = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(scrollFrame)
  }, [location.hash])

  useEffect(() => {
    let active = true
    async function loadLocations() {
      try {
        const locations = await fetchManagedBusinessLocations(business.id)
        if (active) setBusinessLocations(locations)
      } catch (error) {
        console.error('Unable to load business locations.', error)
        if (active) setLocationStatus('Unable to load business locations.')
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

  async function addBusinessLocation(address) {
    setLocationStatus('Adding location…')
    try {
      await addManagedBusinessLocation(business.id, address)
      const locations = await fetchManagedBusinessLocations(business.id)
      setBusinessLocations(locations)
      setLocationStatus('Business location added.')
    } catch (error) {
      console.error('Unable to add business location.', error)
      setLocationStatus('Unable to add this location. Please try again.')
    }
  }

  async function removeBusinessLocation(locationId) {
    setLocationStatus('Removing location…')
    try {
      await deleteManagedBusinessLocation(business.id, locationId)
      setBusinessLocations((current) =>
        current.filter(
          (businessLocation) => businessLocation.id !== locationId,
        ),
      )
      setLocationStatus('Business location removed.')
    } catch (error) {
      console.error('Unable to remove business location.', error)
      setLocationStatus(
        'Unable to remove this location. It may be used by an existing deal.',
      )
    }
  }

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your business profile and notification preferences.</p>
      </div>
      <div
        className="placeholder-section business-settings-section"
        id="profile-details"
      >
        <div className="placeholder-section-title">Business Profile</div>
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input
            className="form-input"
            disabled
            value={business.business_name}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            disabled
            value={business.description || 'No description added'}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Your access</label>
          <input className="form-input" disabled value={membership.role} />
        </div>
        <div className="form-group">
          <label className="form-label">Enabled capabilities</label>
          <input
            className="form-input"
            disabled
            value={enabledCapabilities.join(', ')}
          />
        </div>
      </div>

      <div className="placeholder-section business-settings-section">
        <div className="placeholder-section-title is-complete">
          Business Locations
        </div>
        <p className="account-section-copy">
          These verified map locations can participate in deals and appear in
          nearby customer searches.
        </p>
        <AddressAutocomplete
          id="business-settings-address"
          label="Add a business address"
          onSelect={addBusinessLocation}
        />
        <div className="business-location-settings-list">
          {businessLocations.map((businessLocation) => (
            <div key={businessLocation.id}>
              <span>
                <strong>{businessLocation.name}</strong>
                <small>
                  {businessLocation.formatted_address ||
                    'Address needs updating'}
                </small>
              </span>
              <button
                type="button"
                onClick={() => removeBusinessLocation(businessLocation.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        {locationStatus && (
          <p className="account-section-copy" role="status">
            {locationStatus}
          </p>
        )}
      </div>

      {capabilities.service_marketplace_enabled && (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Service Profile</div>
          <div className="form-group">
            <label className="form-label">Verification status</label>
            <input
              className="form-input"
              disabled
              value={business.verification_status.replace('_', ' ')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service description</label>
            <input
              className="form-input"
              disabled
              value={serviceProfile?.service_description ?? ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Availability</label>
            <input
              className="form-input"
              disabled
              value={serviceProfile?.availability ?? ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categories</label>
            <input
              className="form-input"
              disabled
              value={serviceCategories
                .map((category) => category.service_category)
                .join(', ')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service areas</label>
            <input
              className="form-input"
              disabled
              value={serviceAreas.map((area) => area.service_area).join(', ')}
            />
          </div>
        </div>
      )}

      <div
        className="placeholder-section business-settings-section"
        id="notification-preferences"
      >
        <div className="placeholder-section-title">
          Notification Preferences
        </div>
        <p>
          Notification controls will be available here as the business account
          settings are expanded.
        </p>
      </div>

      <div className="placeholder-section business-settings-section">
        <div className="placeholder-section-title">Account</div>
        <p>
          Switch to your consumer portal without signing out, or log out of
          LocalLink on this device.
        </p>
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
            {isLoggingOut ? 'Logging out…' : 'Log Out'}
          </button>
        </div>
      </div>
    </>
  )
}
