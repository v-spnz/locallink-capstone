import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'

function registrationError(message) {
  const normalised = message.toLowerCase()

  if (normalised.includes('already registered') || normalised.includes('already exists')) {
    return 'An account already exists for this email address.'
  }

  return 'We could not create your account. Please try again.'
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { user, isLoading: isSessionLoading } = useAuth()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const firstName = form.firstName.trim()
    const lastName = form.lastName.trim()
    const email = form.email.trim().toLowerCase()

    if (!firstName || !lastName || !email || !form.password || !form.confirmPassword) {
      setError('Please complete all registration details.')
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
        navigate('/profile', { replace: true })
        return
      }

      setSuccess('Account created. Check your email to confirm your address, then sign in.')
    } catch (requestError) {
      setError(registrationError(requestError.message || ''))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSessionLoading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Checking session…</div>
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 32 }}>
        <h2>Create your LocalLink account</h2>
        <p>Join LocalLink to discover local businesses and earn rewards.</p>
      </div>

      <div className="tab-row" style={{ margin: '0 auto 24px' }}>
        <button type="button" className="tab-btn" onClick={() => navigate('/login')}>
          Login
        </button>
        <button type="button" className="tab-btn active">
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="register-first-name">First name</label>
          <input id="register-first-name" name="firstName" className="form-input" type="text" value={form.firstName} onChange={updateField} autoComplete="given-name" disabled={isSubmitting} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-last-name">Last name</label>
          <input id="register-last-name" name="lastName" className="form-input" type="text" value={form.lastName} onChange={updateField} autoComplete="family-name" disabled={isSubmitting} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email</label>
          <input id="register-email" name="email" className="form-input" type="email" value={form.email} onChange={updateField} autoComplete="email" disabled={isSubmitting} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Password</label>
          <div className="password-input">
            <input id="register-password" name="password" className="form-input" type={showPassword ? 'text' : 'password'} value={form.password} onChange={updateField} autoComplete="new-password" disabled={isSubmitting} required />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} disabled={isSubmitting} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="register-confirm-password">Confirm password</label>
          <div className="password-input">
            <input id="register-confirm-password" name="confirmPassword" className="form-input" type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={updateField} autoComplete="new-password" disabled={isSubmitting} required />
            <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} disabled={isSubmitting} aria-label={showConfirmPassword ? 'Hide re-entered password' : 'Show re-entered password'} aria-pressed={showConfirmPassword}>
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && <div className="auth-success" role="status">{success}</div>}

        <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: 8, opacity: isSubmitting ? 0.7 : 1 }}>
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
