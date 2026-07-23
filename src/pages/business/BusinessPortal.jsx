import { Routes, Route, Navigate } from 'react-router-dom'
import BusinessNav from '../../components/navigation/BusinessNav'
import PortalLayout from '../../layouts/PortalLayout'
import Login from './Login'
import Dashboard from './Dashboard'
import CreateDeal from './CreateDeal'
import CreateLoyalty from './CreateLoyalty'
import Settings from './Settings'

export default function BusinessPortal() {
  return (
    <PortalLayout navigation={<BusinessNav />}>
      <Routes>
        <Route index element={<Navigate to="/business/login" replace />} />
        <Route path="login" element={<Login />} />
        <Route path="analytics" element={<Dashboard />} />
        <Route path="create-deal" element={<CreateDeal />} />
        <Route path="create-loyalty" element={<CreateLoyalty />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/business/login" replace />} />
      </Routes>
    </PortalLayout>
  )
}
