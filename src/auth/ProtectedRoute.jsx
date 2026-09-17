import { Navigate, useLocation } from 'react-router-dom'
import useAuth from './useAuth'

export default function ProtectedRoute({ children, loadingFallback }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      loadingFallback ?? (
        <div style={{ textAlign: 'center', padding: 40 }}>Loading account…</div>
      )
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/register"
        replace
        state={{
          from: location,
          startAt: 'account',
          intent: location.pathname.startsWith('/business')
            ? 'business'
            : 'personal',
        }}
      />
    )
  }

  return children
}
