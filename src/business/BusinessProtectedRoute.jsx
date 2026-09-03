import { Navigate, useLocation } from 'react-router-dom'
import useAuth from '../auth/useAuth'
import useBusiness from './useBusiness'

const CAPABILITY_FIELDS = {
  deals: 'deals_enabled',
  loyalty: 'loyalty_enabled',
  service_marketplace: 'service_marketplace_enabled',
}

export default function BusinessProtectedRoute({
  children,
  capability,
  roles,
}) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const {
    membership,
    capabilities,
    isLoading: isBusinessLoading,
    error,
  } = useBusiness()
  const location = useLocation()

  if (isAuthLoading || isBusinessLoading) {
    return <div className="business-route-state">Loading business…</div>
  }

  if (!user) {
    return (
      <Navigate
        to="/register"
        replace
        state={{ from: location, startAt: 'account', intent: 'business' }}
      />
    )
  }

  if (error) {
    return <div className="business-route-state error">{error}</div>
  }

  if (!membership) {
    return <Navigate to="/business/onboarding" replace />
  }

  const capabilityField = CAPABILITY_FIELDS[capability]
  if (capabilityField && !capabilities[capabilityField]) {
    return <Navigate to="/business/analytics" replace />
  }

  if (roles && !roles.includes(membership.role)) {
    return <Navigate to="/business/analytics" replace />
  }

  return children
}
