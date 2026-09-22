import { useLayoutEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BusinessNavigation from '../../components/navigation/BusinessNavigation'
import BusinessPageLoader from '../../components/ui/BusinessPageLoader'
import PortalLayout from '../../layouts/PortalLayout'
import ProtectedRoute from '../../auth/ProtectedRoute'
import BusinessProvider from '../../business/BusinessProvider'
import BusinessProtectedRoute from '../../business/BusinessProtectedRoute'
import Dashboard from './Dashboard'
import CreateDeal from './CreateDeal'
import CreateLoyalty from './CreateLoyalty'
import LoyaltyCustomerLookup from './LoyaltyCustomerLookup'
import Settings from './Settings'
import BusinessOnboarding from './BusinessOnboarding'
import Services from './Services'
import './BusinessTypography.css'
import './BusinessPortal.css'
import './BusinessMarketplace.css'

function BusinessPage({ children, capability, roles }) {
  return (
    <BusinessProtectedRoute capability={capability} roles={roles}>
      <PortalLayout navigation={<BusinessNavigation />}>
        {children}
      </PortalLayout>
    </BusinessProtectedRoute>
  )
}

export default function BusinessPortal() {
  useLayoutEffect(() => {
    document.body.classList.add('business-surface')

    return () => document.body.classList.remove('business-surface')
  }, [])

  return (
    <BusinessProvider>
      <Routes>
        <Route index element={<Navigate to="/business/analytics" replace />} />
        <Route path="login" element={<Navigate to="/login" replace />} />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute
              loadingFallback={
                <BusinessPageLoader label="Loading your account…" fullPage />
              }
            >
              <BusinessOnboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="analytics"
          element={
            <BusinessPage>
              <Dashboard />
            </BusinessPage>
          }
        />
        <Route
          path="create-deal"
          element={
            <BusinessPage capability="deals">
              <CreateDeal />
            </BusinessPage>
          }
        />
        <Route
          path="create-loyalty"
          element={
            <BusinessPage capability="loyalty">
              <CreateLoyalty />
            </BusinessPage>
          }
        />
        <Route
          path="loyalty/customers"
          element={
            <BusinessPage capability="loyalty">
              <LoyaltyCustomerLookup />
            </BusinessPage>
          }
        />
        <Route
          path="services"
          element={
            <BusinessPage capability="service_marketplace">
              <Services />
            </BusinessPage>
          }
        />
        <Route
          path="job-leads"
          element={<Navigate to="/business/services" replace />}
        />
        <Route
          path="quotes"
          element={<Navigate to="/business/services?tab=quotes" replace />}
        />
        <Route
          path="active-jobs"
          element={<Navigate to="/business/services?tab=jobs" replace />}
        />
        <Route
          path="settings/*"
          element={
            <BusinessPage roles={['owner', 'admin']}>
              <Settings />
            </BusinessPage>
          }
        />
        <Route
          path="*"
          element={<Navigate to="/business/analytics" replace />}
        />
      </Routes>
    </BusinessProvider>
  )
}
