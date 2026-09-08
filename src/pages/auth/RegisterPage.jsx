import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Gift,
  MapPin,
  UserRound,
  Wrench,
} from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import AddressAutocomplete from '../../features/location/components/AddressAutocomplete'
import { saveCustomerLocation } from '../../features/location/api/locations'
import {
  clearRegistrationFlow,
  normaliseDestination,
  readRegistrationFlow,
  updateRegistrationFlow,
} from '../../features/onboarding/registrationFlow'
import localNeighbourhoodStreet from '../../assets/images/local-neighbourhood-street.jpg'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'
import './RegisterPage.css'

const INTRO_STEPS = ['welcome', 'location', 'how', 'account']

const STEP_LABELS = {
  welcome: 'Welcome',
  location: 'Your area',
  how: 'How it works',
  account: 'Your account',
  verify: 'Check your email',
  confirm: 'Confirm your area',
}

function registrationError(message) {
  const normalised = message.toLowerCase()

  if (
    normalised.includes('already registered') ||
    normalised.includes('already exists')
  ) {
    return 'An account already exists for this email address.'
  }

  return 'We could not create your account. Please try again.'
}

function nameParts(fullName) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' '),
  }
}

function destinationLabel(destination) {
  if (destination.startsWith('/jobs')) return 'your service request'
  if (destination.startsWith('/loyalty')) return 'your rewards'
  if (destination.startsWith('/deals')) return 'nearby deals'
  return 'My LocalLink'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading: isSessionLoading } = useAuth()
  const incomingDestination = normaliseDestination(location.state?.from)
  const incomingIntent =
    location.state?.intent === 'business' ? 'business' : null
  const resumeMode = new URLSearchParams(location.search).get('resume')
  const oauthComplete = new URLSearchParams(location.search).has('oauth')
  const [flow, setFlow] = useState(() => {
    const stored = readRegistrationFlow()
    return {
      ...stored,
      intent: incomingIntent || stored.intent,
      destination: incomingDestination || stored.destination,
    }
  })
  const [step, setStep] = useState(() => {
    if (
      ['choice', 'account'].includes(location.state?.startAt) ||
      incomingDestination
    ) {
      return 'account'
    }
    return 'welcome'
  })
  const [form, setForm] = useState({
    fullName: flow.fullName,
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isCompletingOAuth, setIsCompletingOAuth] = useState(false)

  useEffect(() => {
    if (!incomingDestination && !incomingIntent) return
    updateRegistrationFlow({
      ...(incomingDestination ? { destination: incomingDestination } : {}),
      ...(incomingIntent ? { intent: incomingIntent } : {}),
    })
  }, [incomingDestination, incomingIntent])

  useEffect(() => {
    if (!user || (!flow.resumeAfterAuth && !resumeMode && !oauthComplete))
      return

    let active = true

    async function resumeRegistration() {
      setIsCompletingOAuth(true)
      setError('')

      try {
        if (oauthComplete && flow.fullName && !user.user_metadata?.first_name) {
          const { firstName, lastName } = nameParts(flow.fullName)
          const { error: metadataError } = await supabase.auth.updateUser({
            data: {
              first_name: firstName,
              last_name: lastName,
              registration_intent: flow.intent,
            },
          })

          if (metadataError) throw metadataError

          const { error: profileError } = await supabase
            .from('profiles')
            .update({ first_name: firstName, last_name: lastName })
            .eq('id', user.id)

          if (profileError) throw profileError
        }

        if (!active) return

        if (flow.intent === 'business') {
          if (flow.location) {
            try {
              await saveCustomerLocation(flow.location)
            } catch {
              // The selected location remains available to business setup.
            }
          }
          navigate('/business/onboarding', { replace: true })
          return
        }

        setStep('confirm')
      } catch {
        if (active) {
          setError(
            'Your account is ready, but we could not finish your profile.',
          )
          setStep('account')
        }
      } finally {
        if (active) setIsCompletingOAuth(false)
      }
    }

    void resumeRegistration()

    return () => {
      active = false
    }
  }, [flow, navigate, oauthComplete, resumeMode, user])

  function persistFlow(changes) {
    const next = updateRegistrationFlow({ ...flow, ...changes })
    setFlow(next)
    return next
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function chooseLocation(address) {
    persistFlow({ location: address })
    setError('')
  }

  function chooseIntent(intent) {
    persistFlow({ intent })
  }

  function goBack() {
    const previousSteps = {
      location: 'welcome',
      how: 'location',
      account: incomingDestination ? null : 'how',
      confirm: 'account',
    }
    const previous = previousSteps[step]
    if (previous) setStep(previous)
    else navigate(-1)
  }

  async function handleEmailSubmit(event) {
    event.preventDefault()
    setError('')

    const { firstName, lastName } = nameParts(form.fullName)
    const email = form.email.trim().toLowerCase()

    if (
      !firstName ||
      !lastName ||
      !email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError('Enter your full name and complete all registration details.')
      return
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    persistFlow({ resumeAfterAuth: true })

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            registration_intent: flow.intent,
          },
        },
      })

      if (signUpError) {
        setError(registrationError(signUpError.message))
        return
      }

      if (data.user?.identities?.length === 0) {
        setError('An account already exists for this email address.')
        return
      }

      if (data.session) {
        if (flow.intent === 'business') {
          if (flow.location) {
            try {
              await saveCustomerLocation(flow.location)
            } catch {
              // The selected location remains available to business setup.
            }
          }
          navigate('/business/onboarding', { replace: true })
        } else {
          setStep('confirm')
        }
        return
      }

      setStep('verify')
    } catch (requestError) {
      setError(registrationError(requestError.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGoogleRegistration() {
    setError('')
    const { firstName, lastName } = nameParts(form.fullName)

    if (!firstName || !lastName) {
      setError('Enter your full name before continuing with Google.')
      return
    }

    setIsSubmitting(true)
    persistFlow({ fullName: form.fullName.trim(), resumeAfterAuth: true })

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/register?oauth=complete`,
      },
    })

    if (oauthError) {
      setError('Google registration is unavailable. Please use email instead.')
      setIsSubmitting(false)
    }
  }

  async function finishPersonalRegistration() {
    setError('')
    setIsSubmitting(true)

    try {
      if (flow.location) await saveCustomerLocation(flow.location)
      const destination = flow.destination || '/home'
      clearRegistrationFlow()
      navigate(destination, { replace: true })
    } catch {
      setError('We could not save this location. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (isSessionLoading || isCompletingOAuth) {
    return <div className="register-loading">Opening your registration…</div>
  }

  if (user && !flow.resumeAfterAuth && !resumeMode && !oauthComplete) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="register-page">
      <AuthPageHeader />

      <main className="register-main">
        <section className="register-photo-panel">
          <img
            src={localNeighbourhoodStreet}
            alt="People spending time among cafés and businesses in a local neighbourhood"
          />
          <div className="register-photo-overlay" />
          <div className="register-photo-copy">
            <h2>Make local feel a little closer.</h2>
            <p>
              Explore first. Create one LocalLink identity when you are ready to
              save, redeem, request, or manage a business.
            </p>
          </div>
        </section>

        <section
          className={`register-form-panel${
            step === 'account' ? '' : ' register-form-panel--slide'
          }`}
          aria-live="polite"
        >
          <RegistrationProgress step={step} />

          {step !== 'welcome' && step !== 'verify' && (
            <button className="register-back" type="button" onClick={goBack}>
              <ArrowLeft aria-hidden="true" />
              Back
            </button>
          )}

          {step === 'welcome' && (
            <WelcomeStep
              onContinue={() => setStep('location')}
              onExplore={() => navigate('/deals')}
            />
          )}

          {step === 'location' && (
            <LocationStep
              location={flow.location}
              onSelect={chooseLocation}
              onContinue={() => setStep('how')}
            />
          )}

          {step === 'how' && (
            <HowItWorksStep onContinue={() => setStep('account')} />
          )}

          {step === 'account' && (
            <AccountStep
              flow={flow}
              form={form}
              error={error}
              isSubmitting={isSubmitting}
              showPassword={showPassword}
              showConfirmPassword={showConfirmPassword}
              onIntentChange={chooseIntent}
              onFieldChange={updateField}
              onGoogle={handleGoogleRegistration}
              onSubmit={handleEmailSubmit}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onToggleConfirmPassword={() =>
                setShowConfirmPassword((current) => !current)
              }
              loginState={{
                from: flow.destination || undefined,
              }}
            />
          )}

          {step === 'verify' && <VerifyStep flow={flow} email={form.email} />}

          {step === 'confirm' && (
            <ConfirmLocationStep
              flow={flow}
              error={error}
              isSubmitting={isSubmitting}
              onSelect={chooseLocation}
              onContinue={finishPersonalRegistration}
            />
          )}
        </section>
      </main>
    </div>
  )
}

function RegistrationProgress({ step }) {
  const progressStep = INTRO_STEPS.includes(step)
    ? INTRO_STEPS.indexOf(step)
    : INTRO_STEPS.length - 1

  return (
    <div className="register-progress">
      <span>{STEP_LABELS[step]}</span>
      <div
        className="register-progress-track"
        role="progressbar"
        aria-label="Registration progress"
        aria-valuemin="1"
        aria-valuemax={INTRO_STEPS.length}
        aria-valuenow={progressStep + 1}
      >
        {INTRO_STEPS.map((item, index) => (
          <i className={index <= progressStep ? 'complete' : ''} key={item} />
        ))}
      </div>
    </div>
  )
}

function WelcomeStep({ onContinue, onExplore }) {
  return (
    <div className="register-step-content register-step-content--anchored">
      <h1>Welcome to LocalLink.</h1>
      <p className="register-intro">
        Find useful deals, local rewards, and trusted services around you.
      </p>
      <div className="register-value-list">
        <span>
          <Gift aria-hidden="true" />
          Discover useful local offers
        </span>
        <span>
          <Wrench aria-hidden="true" />
          Request help from nearby businesses
        </span>
        <span>
          <Building2 aria-hidden="true" />
          Manage your business in the same account
        </span>
      </div>
      <div className="register-step-actions">
        <button className="register-submit" type="button" onClick={onContinue}>
          Choose your location
          <ArrowRight aria-hidden="true" />
        </button>
        <button
          className="register-text-action"
          type="button"
          onClick={onExplore}
        >
          Explore without an account
        </button>
      </div>
    </div>
  )
}

function LocationStep({ location, onSelect, onContinue }) {
  return (
    <div className="register-step-content register-step-content--anchored">
      <h1>Start with your area.</h1>
      <p className="register-intro">
        Use your location or search for a suburb. We do not need your street
        address.
      </p>
      {location && (
        <div className="register-selected-location">
          <CheckCircle2 aria-hidden="true" />
          <span>
            <strong>
              {location.suburb || location.city || 'Selected area'}
            </strong>
            <small>Your LocalLink area</small>
          </span>
        </div>
      )}
      <AddressAutocomplete
        key={location?.formattedAddress || 'registration-location'}
        id="registration-location"
        label={location ? 'Change suburb' : 'Search for your suburb'}
        value={location?.formattedAddress || ''}
        bias={location}
        searchType="suburb"
        placeholder="Start typing a New Zealand suburb"
        onSelect={onSelect}
      />
      <div className="register-step-actions">
        <button
          className="register-submit"
          type="button"
          onClick={onContinue}
          disabled={!location}
        >
          Continue
          <ArrowRight aria-hidden="true" />
        </button>
        {!location && (
          <button
            className="register-text-action"
            type="button"
            onClick={onContinue}
          >
            Choose later
          </button>
        )}
      </div>
    </div>
  )
}

function HowItWorksStep({ onContinue }) {
  return (
    <div className="register-step-content register-step-content--anchored">
      <h1>LocalLink follows your goal.</h1>
      <p className="register-intro">
        Browse freely, then create an account only when an action needs one.
      </p>
      <div className="register-outcomes">
        <div>
          <Compass aria-hidden="true" />
          <span>
            <strong>Discover</strong>
            <small>Browse nearby businesses, deals, and rewards.</small>
          </span>
        </div>
        <div>
          <Wrench aria-hidden="true" />
          <span>
            <strong>Take action</strong>
            <small>Save, redeem, or request a trusted local service.</small>
          </span>
        </div>
        <div>
          <UserRound aria-hidden="true" />
          <span>
            <strong>Stay connected</strong>
            <small>Keep requests, saved items, and rewards together.</small>
          </span>
        </div>
      </div>
      <div className="register-step-actions">
        <button className="register-submit" type="button" onClick={onContinue}>
          Continue
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function AccountStep({
  flow,
  form,
  error,
  isSubmitting,
  showPassword,
  showConfirmPassword,
  onIntentChange,
  onFieldChange,
  onGoogle,
  onSubmit,
  onTogglePassword,
  onToggleConfirmPassword,
  loginState,
}) {
  return (
    <div className="register-step-content">
      <h1>Create one LocalLink identity.</h1>
      <p className="register-intro">
        Start personally or continue into business setup after registration.
      </p>

      <form onSubmit={onSubmit} noValidate>
        <fieldset className="register-intent">
          <legend>What are you here to do?</legend>
          <div className="register-intent-options">
            <button
              type="button"
              className={flow.intent === 'personal' ? 'active' : ''}
              onClick={() => onIntentChange('personal')}
              aria-pressed={flow.intent === 'personal'}
              disabled={isSubmitting}
            >
              <UserRound aria-hidden="true" />
              <span>
                <strong>Use LocalLink</strong>
                <small>Find local help and rewards</small>
              </span>
            </button>
            <button
              type="button"
              className={flow.intent === 'business' ? 'active' : ''}
              onClick={() => onIntentChange('business')}
              aria-pressed={flow.intent === 'business'}
              disabled={isSubmitting}
            >
              <Building2 aria-hidden="true" />
              <span>
                <strong>Set up a business</strong>
                <small>Personal access plus business tools</small>
              </span>
            </button>
          </div>
        </fieldset>

        <RegisterField
          label="Full name"
          id="register-full-name"
          name="fullName"
          type="text"
          placeholder="e.g. Alex Morgan"
          value={form.fullName}
          onChange={onFieldChange}
          autoComplete="name"
          disabled={isSubmitting}
        />

        <button
          className="register-google"
          type="button"
          onClick={onGoogle}
          disabled={isSubmitting}
        >
          Continue with Google
        </button>

        <div className="register-divider">
          <span>or use email</span>
        </div>

        <RegisterField
          label="Email address"
          id="register-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onFieldChange}
          autoComplete="email"
          disabled={isSubmitting}
        />

        <PasswordField
          label="Password"
          id="register-password"
          name="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={onFieldChange}
          visible={showPassword}
          onToggle={onTogglePassword}
          disabled={isSubmitting}
        />
        <PasswordField
          label="Confirm password"
          id="register-confirm-password"
          name="confirmPassword"
          placeholder="Enter your password again"
          value={form.confirmPassword}
          onChange={onFieldChange}
          visible={showConfirmPassword}
          onToggle={onToggleConfirmPassword}
          disabled={isSubmitting}
        />

        {error && (
          <div className="auth-error register-message" role="alert">
            {error}
          </div>
        )}

        <button
          className="register-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
          {!isSubmitting && <ArrowRight aria-hidden="true" />}
        </button>
      </form>

      <div className="register-login-row">
        <span>Already have an account?</span>
        <Link to="/login" state={loginState} viewTransition>
          Log in instead
        </Link>
      </div>
    </div>
  )
}

function VerifyStep({ flow, email }) {
  return (
    <div className="register-step-content register-step-content--anchored register-completion">
      <h1>Check your email.</h1>
      <p className="register-intro">
        We sent a confirmation link to <strong>{email}</strong>. Confirm it,
        then log in to continue where you left off.
      </p>
      <div className="register-step-actions">
        <Link
          className="register-submit"
          to="/login"
          state={{ from: flow.destination || undefined }}
        >
          Go to login
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}

function ConfirmLocationStep({
  flow,
  error,
  isSubmitting,
  onSelect,
  onContinue,
}) {
  return (
    <div className="register-step-content register-step-content--anchored">
      <h1>Confirm your location.</h1>
      <p className="register-intro">
        Keep the suburb you chose earlier or change it before continuing.
      </p>
      {flow.location && (
        <div className="register-selected-location">
          <CheckCircle2 aria-hidden="true" />
          <span>
            <strong>
              {flow.location.suburb || flow.location.city || 'Selected area'}
            </strong>
            <small>Your LocalLink area</small>
          </span>
        </div>
      )}
      <AddressAutocomplete
        key={flow.location?.formattedAddress || 'confirm-location'}
        id="confirm-registration-location"
        label={flow.location ? 'Change suburb' : 'Add your suburb'}
        value={flow.location?.formattedAddress || ''}
        bias={flow.location}
        searchType="suburb"
        placeholder="Start typing a New Zealand suburb"
        onSelect={onSelect}
        disabled={isSubmitting}
      />
      {error && (
        <div className="auth-error register-message" role="alert">
          {error}
        </div>
      )}
      <div className="register-step-actions">
        <button
          className="register-submit"
          type="button"
          onClick={onContinue}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? 'Saving your location…'
            : `Continue to ${destinationLabel(flow.destination)}`}
          {!isSubmitting && <ArrowRight aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

function RegisterField({ label, id, ...inputProps }) {
  return (
    <div className="register-field">
      <span className="register-field-label" id={`${id}-label`}>
        {label}
      </span>
      <input aria-labelledby={`${id}-label`} id={id} required {...inputProps} />
    </div>
  )
}

function PasswordField({
  label,
  id,
  visible,
  onToggle,
  disabled,
  ...inputProps
}) {
  return (
    <div className="register-field">
      <span className="register-field-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="register-password-wrap">
        <input
          aria-labelledby={`${id}-label`}
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete="new-password"
          disabled={disabled}
          required
          {...inputProps}
        />
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          title={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
