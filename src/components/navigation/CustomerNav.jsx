import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const navigationItems = [
  ['/home', 'Home'],
  ['/deals', 'Deals & Discovery'],
  ['/loyalty', 'Loyalty Cards'],
  ['/jobs', 'Service Marketplace'],
  ['/profile', 'Profile'],
]

export default function CustomerNav() {
  return (
    <nav className="nav">
      <BrandLogo to="/home" />
      <div className="nav-links">
        {navigationItems.map(([to, label]) => (
          <NavLink
            key={to}
            className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
