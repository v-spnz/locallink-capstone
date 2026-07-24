import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import useAuth from '../../auth/useAuth'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isLoading: isSessionLoading } = useAuth()

  const destination = location.state?.from?.pathname ?? '/profile'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        setError('The email or password you entered is incorrect.')
        return
      }

      navigate(destination, { replace: true })
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSessionLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>Checking session…</div>
    )
  }

  if (user) {
    return <Navigate to="/profile" replace />
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div
        className="page-header"
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <h2>Welcome to LocalLink</h2>
        <p>Sign in to discover local businesses and track your rewards.</p>
      </div>

      <div className="tab-row" style={{ margin: '0 auto 24px' }}>
        <button type="button" className="tab-btn active">
          Login
        </button>

        <button
          type="button"
          className="tab-btn"
          onClick={() => navigate('/register')}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">
            Email
          </label>

          <input
            id="login-email"
            className="form-input"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            disabled={isSubmitting}
            required
          />
        </div>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={isSubmitting}
          style={{
            width: '100%',
            marginTop: 8,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? 'Signing in…' : 'Sign In →'}
        </button>
      </form>
    </div>
  )
}
