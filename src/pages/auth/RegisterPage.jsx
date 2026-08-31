import { useState } from 'react'
import { ArrowRight, Building2, Eye, EyeOff, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import localNeighbourhoodStreet from '../../assets/images/local-neighbourhood-street.jpg'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'
import './RegisterPage.css'

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

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, isLoading: isSessionLoading } = useAuth()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationIntent, setRegistrationIntent] = useState('personal')

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const nameParts = form.fullName.trim().split(/\s+/).filter(Boolean)
    const firstName = nameParts[0] ?? ''
    const lastName = nameParts.slice(1).join(' ')
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

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            registration_intent: registrationIntent,
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
        navigate(
          registrationIntent === 'business' ? '/business/onboarding' : '/home',
          { replace: true },
        )
        return
      }

      setSuccess(
        registrationIntent === 'business'
          ? 'Account created. Confirm your email, then sign in to finish setting up your business.'
          : 'Account created. Check your email to confirm your address, then sign in.',
      )
    } catch (requestError) {
      setError(registrationError(requestError.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSessionLoading) {
    return <div className="register-loading">Checking session…</div>
  }

  if (user) {
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
              Create an account to save your requests, discover nearby
              businesses, and keep local rewards in one place.
            </p>
          </div>
        </section>

        <section className="register-form-panel">
          <div className="register-eyebrow">Join LocalLink</div>
          <h1>Create your account.</h1>
          <p className="register-intro">
            It only takes a minute to get started.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <fieldset className="register-intent">
              <legend>How would you like to start?</legend>
              <div className="register-intent-options">
                <button
                  type="button"
                  className={registrationIntent === 'personal' ? 'active' : ''}
                  onClick={() => setRegistrationIntent('personal')}
                  aria-pressed={registrationIntent === 'personal'}
                  disabled={isSubmitting}
                >
                  <UserRound aria-hidden="true" />
                  <span>
                    <strong>Personal</strong>
                    <small>Find local help and rewards</small>
                  </span>
                </button>
                <button
                  type="button"
                  className={registrationIntent === 'business' ? 'active' : ''}
                  onClick={() => setRegistrationIntent('business')}
                  aria-pressed={registrationIntent === 'business'}
                  disabled={isSubmitting}
                >
                  <Building2 aria-hidden="true" />
                  <span>
                    <strong>Business</strong>
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
              onChange={updateField}
              autoComplete="name"
              disabled={isSubmitting}
            />
            <RegisterField
              label="Email address"
              id="register-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <PasswordField
              label="Password"
              id="register-password"
              name="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={updateField}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              disabled={isSubmitting}
            />
            <PasswordField
              label="Confirm password"
              id="register-confirm-password"
              name="confirmPassword"
              placeholder="Enter your password again"
              value={form.confirmPassword}
              onChange={updateField}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              disabled={isSubmitting}
            />

            {error && (
              <div className="auth-error register-message" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="auth-success register-message" role="status">
                {success}
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
            <Link to="/login" viewTransition>
              Log in instead
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

function RegisterField({ label, id, ...inputProps }) {
  return (
    <div className="register-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} required {...inputProps} />
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
      <label htmlFor={id}>{label}</label>
      <div className="register-password-wrap">
        <input
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
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
