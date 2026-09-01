import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Gift,
  MapPin,
} from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import useBusiness from '../../business/useBusiness'
import { supabase } from '../../lib/supabase'
import AddressAutocomplete from '../../features/location/components/AddressAutocomplete'
import { saveCustomerLocation } from '../../features/location/api/locations'
import {
  clearRegistrationFlow,
  readRegistrationFlow,
} from '../../features/onboarding/registrationFlow'
import './BusinessOnboarding.css'

const CAPABILITY_OPTIONS = [
  {
    key: 'deals',
    label: 'Promote deals',
    description: 'Publish useful local offers for nearby customers.',
    icon: BadgePercent,
  },
  {
    key: 'loyalty',
    label: 'Run loyalty programmes',
    description: 'Create repeat-visit rewards and loyalty cards.',
    icon: Gift,
  },
  {
    key: 'serviceMarketplace',
    label: 'Receive service requests',
    description: 'Find local job leads and send quotes.',
    icon: BriefcaseBusiness,
  },
]

const SETUP_STEPS = [
  { key: 'basics', label: 'Business basics' },
  { key: 'capabilities', label: 'Select tools' },
  { key: 'setup', label: 'Conditional setup' },
  { key: 'review', label: 'Review and finish' },
]

function listFromInput(value) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

export default function BusinessOnboarding() {
  const navigate = useNavigate()
  const { membership, isLoading, refreshBusiness } = useBusiness()
  const [registrationFlow] = useState(() => readRegistrationFlow())
  const [step, setStep] = useState('basics')
  const [form, setForm] = useState(() => ({
    businessName: '',
    description: '',
    deals: true,
    loyalty: false,
    serviceMarketplace: false,
    serviceDescription: '',
    availability: '',
    categories: '',
    areas: '',
    locations: [],
  }))
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedCapabilityCount = CAPABILITY_OPTIONS.filter(
    ({ key }) => form[key],
  ).length
  const currentStepIndex = SETUP_STEPS.findIndex((item) => item.key === step)

  useEffect(() => {
    if (!registrationFlow.location) return

    void saveCustomerLocation(registrationFlow.location).catch(() => {
      // Business setup keeps the location even if profile syncing is delayed.
    })
  }, [registrationFlow.location])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function toggleCapability(key) {
    setForm((current) => ({ ...current, [key]: !current[key] }))
  }

  function validateStep(stepToValidate) {
    if (stepToValidate === 'basics' && form.businessName.trim().length < 2) {
      return 'Enter your business name.'
    }

    if (stepToValidate === 'capabilities' && selectedCapabilityCount === 0) {
      return 'Select at least one way to use LocalLink.'
    }

    if (stepToValidate === 'setup') {
      if (form.deals && form.locations.length === 0) {
        return 'Enter at least one location that can participate in deals.'
      }

      if (
        form.serviceMarketplace &&
        (form.serviceDescription.trim().length < 10 ||
          !form.availability.trim() ||
          listFromInput(form.categories).length === 0 ||
          listFromInput(form.areas).length === 0)
      ) {
        return 'Complete all Service Marketplace details.'
      }
    }

    return ''
  }

  function continueSetup(event) {
    event?.preventDefault()
    const validationError = validateStep(step)
    setError(validationError)
    if (validationError) return

    const nextStep = SETUP_STEPS[currentStepIndex + 1]
    if (nextStep) setStep(nextStep.key)
  }

  function goBack() {
    setError('')
    const previousStep = SETUP_STEPS[currentStepIndex - 1]
    if (previousStep) setStep(previousStep.key)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (step !== 'review') {
      continueSetup()
      return
    }

    setError('')

    const validationError =
      validateStep('basics') ||
      validateStep('capabilities') ||
      validateStep('setup')

    if (validationError) {
      setError(validationError)
      return
    }

    const categories = listFromInput(form.categories)
    const areas = listFromInput(form.areas)
    const locations = form.locations
    setIsSubmitting(true)

    const { error: createError } = await supabase.rpc(
      'create_business_with_owner',
      {
        p_business_name: form.businessName.trim(),
        p_description: form.description.trim(),
        p_deals_enabled: form.deals,
        p_loyalty_enabled: form.loyalty,
        p_service_marketplace_enabled: form.serviceMarketplace,
        p_service_description: form.serviceMarketplace
          ? form.serviceDescription.trim()
          : null,
        p_availability: form.serviceMarketplace
          ? form.availability.trim()
          : null,
        p_categories: form.serviceMarketplace ? categories : [],
        p_areas: form.serviceMarketplace ? areas : [],
        p_locations: form.deals
          ? locations.map((businessLocation) => ({
              name: businessLocation.name,
              formatted_address: businessLocation.formattedAddress,
              address_line1: businessLocation.addressLine1,
              suburb: businessLocation.suburb,
              city: businessLocation.city,
              postcode: businessLocation.postcode,
              country_code: businessLocation.countryCode,
              latitude: businessLocation.latitude,
              longitude: businessLocation.longitude,
            }))
          : [],
      },
    )

    if (createError) {
      setError('Unable to create the business account. Please try again.')
      setIsSubmitting(false)
      return
    }

    await refreshBusiness()
    clearRegistrationFlow()
    navigate('/business/analytics', { replace: true })
  }

  function setBusinessLocation(address) {
    setForm((current) => ({
      ...current,
      locations: [address],
    }))
  }

  function clearBusinessLocation() {
    setForm((current) => ({
      ...current,
      locations: [],
    }))
  }

  if (isLoading) {
    return <div className="business-onboarding-state">Loading account…</div>
  }

  if (membership) {
    return <Navigate to="/business/analytics" replace />
  }

  return (
    <div className="business-onboarding-page">
      <AuthPageHeader />

      <main className="business-onboarding-main">
        <section className="business-onboarding-intro">
          <div className="business-onboarding-mark" aria-hidden="true">
            <BriefcaseBusiness />
          </div>
          <h1>Set up your business.</h1>
          <p className="business-onboarding-intro-copy">
            Add only the details needed for the LocalLink tools you choose.
          </p>
          <nav
            className="business-onboarding-progress"
            aria-label="Business setup progress"
          >
            {SETUP_STEPS.map((setupStep, index) => (
              <button
                type="button"
                className={
                  index < currentStepIndex
                    ? 'is-complete'
                    : index === currentStepIndex
                      ? 'is-current'
                      : ''
                }
                onClick={() =>
                  index < currentStepIndex && setStep(setupStep.key)
                }
                disabled={index > currentStepIndex}
                key={setupStep.key}
              >
                <span aria-hidden="true">
                  {index < currentStepIndex ? <Check /> : index + 1}
                </span>
                {setupStep.label}
              </button>
            ))}
          </nav>
          <Link to="/home" onClick={clearRegistrationFlow}>
            Continue with personal access instead
          </Link>
        </section>

        <section className="business-onboarding-card">
          <form onSubmit={handleSubmit} noValidate>
            {step === 'basics' && (
              <BusinessBasicsStep form={form} onChange={updateField} />
            )}

            {step === 'capabilities' && (
              <CapabilitiesStep
                form={form}
                selectedCount={selectedCapabilityCount}
                onToggle={toggleCapability}
              />
            )}

            {step === 'setup' && (
              <ConditionalSetupStep
                form={form}
                onChange={updateField}
                onSetLocation={setBusinessLocation}
                onClearLocation={clearBusinessLocation}
              />
            )}

            {step === 'review' && (
              <ReviewStep
                form={form}
                onEdit={setStep}
                selectedCount={selectedCapabilityCount}
              />
            )}

            {error && (
              <div
                className="auth-error business-onboarding-error"
                role="alert"
              >
                {error}
              </div>
            )}

            <div className="business-onboarding-actions">
              {currentStepIndex > 0 && (
                <button
                  className="business-onboarding-back"
                  type="button"
                  onClick={goBack}
                  disabled={isSubmitting}
                >
                  <ArrowLeft aria-hidden="true" />
                  Back
                </button>
              )}

              {step === 'review' ? (
                <button
                  key="finish-business-setup"
                  className="business-onboarding-submit"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating business…' : 'Finish setup'}
                  {!isSubmitting && <ArrowRight aria-hidden="true" />}
                </button>
              ) : (
                <button
                  key={`continue-business-setup-${step}`}
                  className="business-onboarding-submit"
                  type="button"
                  onClick={continueSetup}
                >
                  Continue
                  <ArrowRight aria-hidden="true" />
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

function BusinessBasicsStep({ form, onChange }) {
  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Business basics</h2>
        <p>Tell customers who they will be dealing with.</p>
      </header>

      <label className="business-onboarding-field">
        <span>Business name</span>
        <input
          name="businessName"
          value={form.businessName}
          onChange={onChange}
          placeholder="e.g. Morgan Plumbing"
          required
        />
      </label>

      <label className="business-onboarding-field">
        <span>Short description</span>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="What does your business help people with?"
          rows="5"
          maxLength="1000"
        />
        <small>{form.description.length} of 1,000 characters</small>
      </label>
    </div>
  )
}

function CapabilitiesStep({ form, selectedCount, onToggle }) {
  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Select your LocalLink tools</h2>
        <p>Choose one or more. You can change these later.</p>
      </header>

      <div className="business-capability-options">
        {CAPABILITY_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = form[option.key]

          return (
            <button
              key={option.key}
              type="button"
              className={selected ? 'selected' : ''}
              onClick={() => onToggle(option.key)}
              aria-pressed={selected}
            >
              <span className="business-capability-icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              <Check className="business-capability-check" />
            </button>
          )
        })}
      </div>
      <p className="business-capability-selection-count" role="status">
        {selectedCount}{' '}
        {selectedCount === 1 ? 'tool selected' : 'tools selected'}
      </p>
    </div>
  )
}

function ConditionalSetupStep({
  form,
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

          <label className="business-onboarding-field">
            <span>Service description</span>
            <textarea
              name="serviceDescription"
              value={form.serviceDescription}
              onChange={onChange}
              placeholder="Describe the services you provide"
              rows="4"
              required
            />
          </label>

          <div className="business-onboarding-field-grid">
            <label className="business-onboarding-field">
              <span>Service categories</span>
              <input
                name="categories"
                value={form.categories}
                onChange={onChange}
                placeholder="Plumbing, Roofing"
                required
              />
              <small>Separate categories with commas.</small>
            </label>

            <label className="business-onboarding-field">
              <span>Service areas</span>
              <input
                name="areas"
                value={form.areas}
                onChange={onChange}
                placeholder="Takapuna, Albany"
                required
              />
              <small>Separate areas with commas.</small>
            </label>
          </div>

          <label className="business-onboarding-field">
            <span>Availability</span>
            <input
              name="availability"
              value={form.availability}
              onChange={onChange}
              placeholder="e.g. Monday-Friday, 8am-5pm"
              required
            />
          </label>

          <p className="business-verification-note">
            Service Marketplace verification starts as pending. Evidence can be
            supplied when the review process is confirmed.
          </p>
        </section>
      )}
    </div>
  )
}

function ReviewStep({ form, onEdit, selectedCount }) {
  const capabilities = CAPABILITY_OPTIONS.filter(({ key }) => form[key])

  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Review your business setup</h2>
        <p>Check the details below before opening your dashboard.</p>
      </header>

      <div className="business-onboarding-review">
        <section>
          <div>
            <h3>Business basics</h3>
            <button type="button" onClick={() => onEdit('basics')}>
              Edit
            </button>
          </div>
          <strong>{form.businessName}</strong>
          <p>{form.description || 'No description added.'}</p>
        </section>

        <section>
          <div>
            <h3>Enabled tools</h3>
            <button type="button" onClick={() => onEdit('capabilities')}>
              Edit
            </button>
          </div>
          <p>
            {selectedCount} {selectedCount === 1 ? 'tool' : 'tools'} selected
          </p>
          <div className="business-review-tools">
            {capabilities.map((capability) => (
              <span key={capability.key}>{capability.label}</span>
            ))}
          </div>
        </section>

        {(form.deals || form.serviceMarketplace) && (
          <section>
            <div>
              <h3>Additional setup</h3>
              <button type="button" onClick={() => onEdit('setup')}>
                Edit
              </button>
            </div>
            {form.deals && <p>{form.locations[0]?.formattedAddress}</p>}
            {form.serviceMarketplace && (
              <p>
                {listFromInput(form.categories).length} service{' '}
                {listFromInput(form.categories).length === 1
                  ? 'category'
                  : 'categories'}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
