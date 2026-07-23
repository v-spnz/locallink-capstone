import { NavLink } from 'react-router-dom'
import BrandLogo from './BrandLogo'

const navigationItems = [
  ['/business/analytics', 'Dashboard'],
  ['/business/create-deal', 'Deals'],
  ['/business/create-loyalty', 'Loyalty'],
  ['/business/settings', 'Settings'],
]

export default function BusinessNav() {
  return (
    <nav className="nav">
      <BrandLogo to="/business/analytics" badge="Business" />
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
