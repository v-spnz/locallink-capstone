import { Navigate, useLocation } from 'react-router-dom'
import useAuth from './useAuth'

export default function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        Loading account…
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}