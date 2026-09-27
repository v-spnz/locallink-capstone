import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerNavigation from '../../components/navigation/CustomerNavigation'
import PortalLayout from '../../layouts/PortalLayout'
import ProtectedRoute from '../../auth/ProtectedRoute'
import Home from './Home'
import Deals from './Deals'
import Jobs from './Jobs'
import Loyalty from './Loyalty'
import Profile from './Profile'

export default function CustomerPortal() {
  return (
    <PortalLayout navigation={<CustomerNavigation />}>
      <Routes>
        <Route index element={<Navigate to="/home" replace />} />
        <Route
          path="home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="deals"
          element={
            <ProtectedRoute>
              <Deals />
            </ProtectedRoute>
          }
        />
        <Route
          path="loyalty"
          element={
            <ProtectedRoute>
              <Loyalty />
            </ProtectedRoute>
          }
        />
        <Route
          path="jobs"
          element={
            <ProtectedRoute>
              <Jobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile/*"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </PortalLayout>
  )
}
