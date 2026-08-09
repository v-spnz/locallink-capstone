import { Routes, Route, Navigate } from 'react-router-dom'
import BusinessNav from '../../components/navigation/BusinessNav'
import PortalLayout from '../../layouts/PortalLayout'
import ProtectedRoute from '../../auth/ProtectedRoute'
import BusinessProvider from '../../business/BusinessProvider'
import BusinessProtectedRoute from '../../business/BusinessProtectedRoute'
import Dashboard from './Dashboard'
import CreateDeal from './CreateDeal'
import CreateLoyalty from './CreateLoyalty'
import Settings from './Settings'
import BusinessOnboarding from './BusinessOnboarding'
import ServiceMarketplacePage from './ServiceMarketplacePage'

function BusinessPage({ children, capability, roles }) {
  return (
    <BusinessProtectedRoute capability={capability} roles={roles}>
      <PortalLayout navigation={<BusinessNav />}>{children}</PortalLayout>
    </BusinessProtectedRoute>
  )
}

export default function BusinessPortal() {
  return (
    <BusinessProvider>
      <Routes>
        <Route index element={<Navigate to="/business/analytics" replace />} />
        <Route path="login" element={<Navigate to="/login" replace />} />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute>
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
          path="job-leads"
          element={
            <BusinessPage capability="service_marketplace">
              <ServiceMarketplacePage type="leads" />
            </BusinessPage>
          }
        />
        <Route
          path="quotes"
          element={
            <BusinessPage capability="service_marketplace">
              <ServiceMarketplacePage type="quotes" />
            </BusinessPage>
          }
        />
        <Route
          path="active-jobs"
          element={
            <BusinessPage capability="service_marketplace">
              <ServiceMarketplacePage type="jobs" />
            </BusinessPage>
          }
        />
        <Route
          path="settings"
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
