import {
  BadgePercent,
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
} from 'lucide-react'
import AddressAutocomplete from '../../location/components/AddressAutocomplete'

export default function ConditionalSetupStep({
  form,
  invalidFields,
  onChange,
  onSetLocation,
  onClearLocation,
}) {
  const needsExtraSetup = form.deals || form.serviceMarketplace
  const businessLocation = form.locations[0] || null

  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Complete the required setup</h2>
        <p>Only the tools you selected ask for additional information.</p>
      </header>

      {!needsExtraSetup && (
        <div className="business-onboarding-no-setup">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>No extra setup needed</strong>
            <p>Your selected tools are ready for review.</p>
          </div>
        </div>
      )}

      {form.deals && (
        <section className="business-conditional-section">
          <div className="business-conditional-heading">
            <BadgePercent aria-hidden="true" />
            <div>
              <h3>Deal locations</h3>
              <p>Add the shop, office, or service address for this business.</p>
            </div>
          </div>
          <AddressAutocomplete
            key={businessLocation?.formattedAddress || 'business-location'}
            id="business-location"
            label={
              businessLocation
                ? 'Change business location'
                : 'Business location'
            }
            value={businessLocation?.formattedAddress || ''}
            placeholder="Search for your shop, office, or service address"
            invalid={invalidFields.includes('location')}
            describedBy="business-onboarding-error"
            onSelect={onSetLocation}
          />
          {businessLocation && (
            <div className="business-onboarding-location-list">
              <div>
                <MapPin aria-hidden="true" />
                <span>{businessLocation.formattedAddress}</span>
                <button type="button" onClick={onClearLocation}>
                  Remove
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {form.serviceMarketplace && (
        <section className="business-conditional-section">
          <div className="business-conditional-heading">
            <BriefcaseBusiness aria-hidden="true" />
            <div>
              <h3>Service Marketplace</h3>
              <p>These details match your business with suitable leads.</p>
            </div>
          </div>

          <div className="business-onboarding-field">
            <span id="business-service-description-label">
              Service description
            </span>
            <textarea
              aria-describedby={
                invalidFields.includes('serviceDescription')
                  ? 'business-onboarding-error'
                  : undefined
              }
              aria-invalid={invalidFields.includes('serviceDescription')}
              aria-labelledby="business-service-description-label"
              name="serviceDescription"
              value={form.serviceDescription}
              onChange={onChange}
              placeholder="Describe the services you provide"
              rows="4"
              required
            />
          </div>

          <div className="business-onboarding-field-grid">
            <div className="business-onboarding-field">
              <span id="business-service-categories-label">
                Service categories
              </span>
              <input
                aria-describedby={
                  invalidFields.includes('categories')
                    ? 'business-onboarding-error'
                    : undefined
                }
                aria-invalid={invalidFields.includes('categories')}
                aria-labelledby="business-service-categories-label"
                name="categories"
                value={form.categories}
                onChange={onChange}
                placeholder="Plumbing, Roofing"
                required
              />
              <small>Separate categories with commas.</small>
            </div>

            <div className="business-onboarding-field">
              <span id="business-service-areas-label">Service areas</span>
              <input
                aria-describedby={
                  invalidFields.includes('areas')
                    ? 'business-onboarding-error'
                    : undefined
                }
                aria-invalid={invalidFields.includes('areas')}
                aria-labelledby="business-service-areas-label"
                name="areas"
                value={form.areas}
                onChange={onChange}
                placeholder="Takapuna, Albany"
                required
              />
              <small>Separate areas with commas.</small>
            </div>
          </div>

          <div className="business-onboarding-field">
            <span id="business-availability-label">Availability</span>
            <input
              aria-describedby={
                invalidFields.includes('availability')
                  ? 'business-onboarding-error'
                  : undefined
              }
              aria-invalid={invalidFields.includes('availability')}
              aria-labelledby="business-availability-label"
              name="availability"
              value={form.availability}
              onChange={onChange}
              placeholder="e.g. Monday-Friday, 8am-5pm"
              required
            />
          </div>

          <p className="business-verification-note">
            Service Marketplace verification starts as pending. Evidence can be
            supplied when the review process is confirmed.
          </p>
        </section>
      )}
    </div>
  )
}
