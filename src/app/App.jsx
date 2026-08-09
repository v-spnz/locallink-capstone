import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerPortal from '../pages/customer/CustomerPortal'
import BusinessPortal from '../pages/business/BusinessPortal'
import LandingPage from '../pages/LandingPage'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import '../index.css'
import '../styles/pageTransitions.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/business/*" element={<BusinessPortal />} />
        <Route path="/*" element={<CustomerPortal />} />
      </Routes>
    </BrowserRouter>
  )
}
