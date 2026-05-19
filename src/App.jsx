import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import CustomerPortal from './pages/customer/CustomerPortal'
import BusinessPortal from './pages/business/BusinessPortal'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Business portal — more specific, must come first */}
        <Route path="/business/*" element={<BusinessPortal />} />

        {/* Anything else → customer portal */}
        <Route path="/*" element={<CustomerPortal />} />
      </Routes>
    </BrowserRouter>
  )
}