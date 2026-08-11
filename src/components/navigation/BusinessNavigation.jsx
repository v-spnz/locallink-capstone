import { CircleUserRound, House, Settings } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import BrandLogo from './BrandLogo'

export default function BusinessNavigation() {
  const { capabilities, membership } = useBusiness()
  const canManageBusiness = ['owner', 'admin'].includes(membership.role)
  const navigationItems = [['/business/analytics', 'Dashboard']]

  if (capabilities.deals_enabled) {
    navigationItems.push(['/business/create-deal', 'Deals'])
  }

  if (capabilities.loyalty_enabled) {
    navigationItems.push(['/business/create-loyalty', 'Loyalty'])
  }

  if (capabilities.service_marketplace_enabled) {
    navigationItems.push(['/business/services', 'Services'])
  }

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

        <div className="business-nav-actions">
          <Link
            className="business-personal-link"
            to="/home"
            aria-label="Open personal LocalLink pages"
            title="Personal pages"
          >
            <House aria-hidden="true" />
          </Link>
          {canManageBusiness ? (
            <NavLink
              className={({ isActive }) =>
                `portal-account-link${isActive ? ' active' : ''}`
              }
              to="/business/settings"
            >
              <Settings aria-hidden="true" />
              <span>Settings</span>
            </NavLink>
          ) : (
            <Link className="portal-account-link" to="/profile">
              <CircleUserRound aria-hidden="true" />
              <span>Profile</span>
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
