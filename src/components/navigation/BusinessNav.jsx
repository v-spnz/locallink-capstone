import { NavLink } from 'react-router-dom'
import { Settings } from 'lucide-react'
import BrandLogo from './BrandLogo'

const navigationItems = [
  ['/business/analytics', 'Dashboard'],
  ['/business/create-deal', 'Deals'],
  ['/business/create-loyalty', 'Loyalty'],
]

export default function BusinessNav() {
  return (
    <header className="portal-header">
      <nav className="nav" aria-label="Business navigation">
        <BrandLogo to="/business/analytics" badge="Business" />

        <div className="nav-links">
          {navigationItems.map(([to, label]) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                `nav-btn${isActive ? ' active' : ''}`
              }
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <NavLink
          className={({ isActive }) =>
            `portal-account-link${isActive ? ' active' : ''}`
          }
          to="/business/settings"
        >
          <Settings aria-hidden="true" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </header>
  )
}
