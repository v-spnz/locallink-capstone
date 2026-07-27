import { Routes, Route, Navigate } from 'react-router-dom'
import CustomerNav from '../../components/navigation/CustomerNav'
import PortalLayout from '../../layouts/PortalLayout'
import ProtectedRoute from '../../auth/ProtectedRoute'
import LoginPage from '../auth/LoginPage'
import Home from './Home'
import DealsDiscovery from './DealsDiscovery'
import Jobs from './Jobs'
import Loyalty from './Loyalty'
import Profile from './Profile'

export default function CustomerPortal() {
  return (
    <PortalLayout navigation={<CustomerNav />}>
      <Routes>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="deals" element={<DealsDiscovery />} />
        <Route path="loyalty" element={<Loyalty />} />
        <Route path="jobs" element={<Jobs />} />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </PortalLayout>
  )
}
