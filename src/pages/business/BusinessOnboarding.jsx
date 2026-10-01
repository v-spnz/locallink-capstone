import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import BusinessPageLoader from '../../components/ui/BusinessPageLoader'
import useBusiness from '../../business/useBusiness'
import { supabase } from '../../lib/supabase'
import BusinessBasicsStep from '../../features/business-onboarding/components/BusinessBasicsStep'
import CapabilitiesStep from '../../features/business-onboarding/components/CapabilitiesStep'
import ConditionalSetupStep from '../../features/business-onboarding/components/ConditionalSetupStep'
import ReviewStep from '../../features/business-onboarding/components/ReviewStep'
import {
  CAPABILITY_OPTIONS,
  SETUP_STEPS,
  getInvalidFields,
  listFromInput,
  validateStep,
} from '../../features/business-onboarding/businessOnboarding'
import { saveCustomerLocation } from '../../features/location/api/locations'
import {
  clearRegistrationFlow,
  readRegistrationFlow,
} from '../../features/onboarding/registrationFlow'
import '../../features/business-onboarding/BusinessOnboarding.css'

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
  const [invalidFields, setInvalidFields] = useState([])
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
    if (invalidFields.includes(name)) {
      const nextInvalidFields = invalidFields.filter((field) => field !== name)
      setInvalidFields(nextInvalidFields)
      if (nextInvalidFields.length === 0) setError('')
    }
  }

  function toggleCapability(key) {
    setForm((current) => ({ ...current, [key]: !current[key] }))
  }

  function continueSetup(event) {
    event?.preventDefault()
    const validationError = validateStep(step, form, selectedCapabilityCount)
    setError(validationError)
    setInvalidFields(validationError ? getInvalidFields(step, form) : [])
    if (validationError) return

    const nextStep = SETUP_STEPS[currentStepIndex + 1]
    if (nextStep) setStep(nextStep.key)
  }

  function goBack() {
    setError('')
    setInvalidFields([])
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

    const invalidStep = ['basics', 'capabilities', 'setup'].find(
      (stepToValidate) =>
        validateStep(stepToValidate, form, selectedCapabilityCount),
    )
    const validationError = invalidStep
      ? validateStep(invalidStep, form, selectedCapabilityCount)
      : ''

    if (validationError) {
      setError(validationError)
      setInvalidFields(getInvalidFields(invalidStep, form))
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
    const nextInvalidFields = invalidFields.filter(
      (field) => field !== 'location',
    )
    setInvalidFields(nextInvalidFields)
    if (nextInvalidFields.length === 0) setError('')
  }

  function clearBusinessLocation() {
    setForm((current) => ({
      ...current,
      locations: [],
    }))
  }

  if (isLoading) {
    return <BusinessPageLoader label="Loading your account…" fullPage />
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
              <BusinessBasicsStep
                form={form}
                invalidFields={invalidFields}
                onChange={updateField}
              />
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
                invalidFields={invalidFields}
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
                id="business-onboarding-error"
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
