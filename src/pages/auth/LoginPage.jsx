import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import AuthPageHeader from '../../components/auth/AuthPageHeader'
import loginLocalStreet from '../../assets/images/login-local-street.jpg'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'
import { getDefaultAuthenticatedPath } from '../../business/businessAccess'
import {
  getRegistrationResumePath,
  normaliseDestination,
} from '../../features/onboarding/registrationFlow'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading: isSessionLoading } = useAuth()

  const requestedDestination = normaliseDestination(location.state?.from)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authenticatedDestination, setAuthenticatedDestination] = useState('')

  useEffect(() => {
    let isActive = true

    async function resolveDestination() {
      if (!user) {
        setAuthenticatedDestination('')
        return
      }

      const registrationResumePath = getRegistrationResumePath()
      if (registrationResumePath) {
        setAuthenticatedDestination(registrationResumePath)
        return
      }

      if (requestedDestination) {
        setAuthenticatedDestination(requestedDestination)
        return
      }

      try {
        const nextPath = await getDefaultAuthenticatedPath(user)
        if (isActive) setAuthenticatedDestination(nextPath)
      } catch {
        if (isActive) setAuthenticatedDestination('/home')
      }
    }

    resolveDestination()

    return () => {
      isActive = false
    }
  }, [requestedDestination, user])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (signInError) {
        setError('The email or password you entered is incorrect.')
        return
      }

      let nextPath = getRegistrationResumePath() || requestedDestination

      if (!nextPath) {
        try {
          nextPath = await getDefaultAuthenticatedPath(data.user)
        } catch {
          nextPath = '/home'
        }
      }

      navigate(nextPath, { replace: true })
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleForgotPassword() {
    setError('')
    setSuccess('')
    if (!email.trim()) {
      setError(
        'Enter your email address first, then select “Forgot password?”.',
      )
      return
    }

    setIsResetting(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/login` },
    )

    if (resetError) setError('Unable to send a reset email. Please try again.')
    else setSuccess('Password reset email sent. Check your inbox.')
    setIsResetting(false)
  }

  if (isSessionLoading) {
    return <div className="login-loading">Checking session…</div>
  }

  if (user) {
    if (!authenticatedDestination) {
      return <div className="login-loading">Opening your account…</div>
    }

    return <Navigate to={authenticatedDestination} replace />
  }

  return (
    <div className="login-page">
      <AuthPageHeader />

      <main className="login-main">
        <section className="login-photo-panel">
          <img
            src={loginLocalStreet}
            alt="Rainy city laneway lined with local restaurants and businesses"
          />
          <div className="login-photo-overlay" />
          <div className="login-photo-copy">
            <h2>Welcome back to LocalLink.</h2>
            <p>
              Pick up where you left, with your requests, nearby choices, and
              local rewards kept together.
            </p>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-content">
            <div className="login-eyebrow">Good to see you again</div>
            <h1>Log in.</h1>
            <p className="login-intro">
              Enter your details to continue to your LocalLink account.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="login-field">
                <span className="login-field-label" id="login-email-label">
                  Email address
                </span>
                <input
                  aria-labelledby="login-email-label"
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  disabled={isSubmitting || isResetting}
                  required
                />
              </div>

              <div className="login-field">
                <span className="login-field-label" id="login-password-label">
                  Password
                </span>
                <div className="login-password-wrap">
                  <input
                    aria-labelledby="login-password-label"
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={isSubmitting || isResetting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={isSubmitting || isResetting}
                    aria-label={
                      showPassword ? 'Hide Password' : 'Show Password'
                    }
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" />
                    ) : (
                      <Eye aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              <button
                className="login-forgot"
                type="button"
                onClick={handleForgotPassword}
                disabled={isSubmitting || isResetting}
              >
                {isResetting ? 'Sending reset email…' : 'Forgot password?'}
              </button>

              {error && (
                <div className="auth-error login-message" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div className="auth-success login-message" role="status">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="login-submit"
                disabled={isSubmitting || isResetting}
              >
                {isSubmitting ? 'Logging in…' : 'Log in'}
                {!isSubmitting && <ArrowRight aria-hidden="true" />}
              </button>
            </form>

            <div className="login-register-row">
              <span>New to LocalLink?</span>
              <Link
                to="/register"
                state={{ from: location.state?.from, startAt: 'account' }}
                viewTransition
              >
                Create an account
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
