import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomerPortal from '../pages/customer/CustomerPortal'
import BusinessPortal from '../pages/business/BusinessPortal'
import '../index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/business/*" element={<BusinessPortal />} />
        <Route path="/*" element={<CustomerPortal />} />
      </Routes>
    </BrowserRouter>
  )
}
