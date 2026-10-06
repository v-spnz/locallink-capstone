import { Building2, Pencil, X } from 'lucide-react'
import { useState } from 'react'
import AddressAutocomplete from '../../location/components/AddressAutocomplete'
import SettingsHeading from './SettingsHeading'

export default function BusinessProfile({
  business,
  membership,
  enabledCapabilities,
  primaryLocation,
  locationStatus,
  isSavingLocation,
  onLocationSelect,
}) {
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const hasCompleteLocation = Boolean(
    primaryLocation?.formatted_address && primaryLocation?.suburb,
  )
  const canManageLocation = ['owner', 'admin'].includes(membership.role)

  async function handleInlineLocationSelect(address) {
    const didSave = await onLocationSelect(address)
    if (didSave) setIsEditingLocation(false)
  }

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
        <div className="business-settings-address-row">
          <dt>Store address</dt>
          <dd className="business-settings-inline-address">
            {isEditingLocation ? (
              <div className="business-settings-address-editor">
                <AddressAutocomplete
                  id="business-settings-address"
                  label="Store address"
                  placeholder="Search for your shop, office, or service address"
                  disabled={isSavingLocation}
                  showCurrentLocation={false}
                  autoFocus
                  onSelect={handleInlineLocationSelect}
                />
              </div>
            ) : (
              <span>
                {primaryLocation?.formatted_address || 'No address added'}
              </span>
            )}
            {!hasCompleteLocation && canManageLocation && (
              <button
                type="button"
                className="business-settings-address-edit"
                aria-label={
                  isEditingLocation
                    ? 'Cancel adding store address'
                    : 'Add store address'
                }
                title={
                  isEditingLocation
                    ? 'Cancel adding store address'
                    : 'Add store address'
                }
                onClick={() => setIsEditingLocation((current) => !current)}
                disabled={isSavingLocation}
              >
                {isEditingLocation ? (
                  <X aria-hidden="true" />
                ) : (
                  <Pencil aria-hidden="true" />
                )}
              </button>
            )}
          </dd>
        </div>
        <div>
          <dt>Suburb</dt>
          <dd>{primaryLocation?.suburb || 'No suburb added'}</dd>
        </div>
        <div>
          <dt>Enabled capabilities</dt>
          <dd>{enabledCapabilities.join(', ') || 'None enabled'}</dd>
        </div>
      </dl>

      {!hasCompleteLocation && !canManageLocation && (
        <p className="business-settings-location-status">
          Ask a business owner or administrator to add the store address.
        </p>
      )}

      {locationStatus && (
        <p
          className={`business-settings-location-status is-${locationStatus.variant}`}
          role={locationStatus.variant === 'error' ? 'alert' : 'status'}
        >
          {locationStatus.message}
        </p>
      )}
    </section>
  )
}
