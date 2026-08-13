import {
  BadgePercent,
  Bell,
  BriefcaseBusiness,
  Gift,
  House,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import BrandLogo from './BrandLogo'
import './BusinessNavigation.css'

const navigationItems = [
  { to: '/home', label: 'Home', icon: <House aria-hidden="true" /> },
  {
    to: '/deals',
    label: 'Nearby deals',
    icon: <BadgePercent aria-hidden="true" />,
  },
  {
    to: '/loyalty',
    label: 'Loyalty rewards',
    icon: <Gift aria-hidden="true" />,
  },
  {
    to: '/jobs',
    label: 'Job requests',
    icon: <BriefcaseBusiness aria-hidden="true" />,
  },
]

function getConsumerInitials(user) {
  const firstName = user?.user_metadata?.first_name ?? ''
  const lastName = user?.user_metadata?.last_name ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  return initials || user?.email?.[0]?.toUpperCase() || 'LL'
}

export default function CustomerNavigation() {
  const { user } = useAuth()

  return (
    <header className="portal-header business-portal-header customer-portal-header">
      <nav
        className="nav business-nav customer-nav"
        aria-label="Main navigation"
      >
        <BrandLogo to="/home" variant="business" />

        <div className="nav-links">
          {navigationItems.map(({ to, label, icon }) => {
            return (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  `nav-btn${isActive ? ' active' : ''}`
                }
                to={to}
              >
                {icon}
                <span>{label}</span>
              </NavLink>
            )
          })}
        </div>

        <div className="business-nav-actions customer-nav-actions">
          <button
            type="button"
            className="business-notification-button"
            aria-label="Notifications coming soon"
            aria-disabled="true"
            title="Notifications coming soon"
          >
            <Bell aria-hidden="true" />
          </button>

          {user ? (
            <NavLink
              className={({ isActive }) =>
                `business-account-link customer-account-link${isActive ? ' active' : ''}`
              }
              to="/profile"
            >
              <span className="business-account-avatar" aria-hidden="true">
                {getConsumerInitials(user)}
              </span>
              <span className="business-account-name">Profile</span>
            </NavLink>
          ) : (
            <div className="portal-auth-links" aria-label="Account actions">
              <Link className="portal-login-link" to="/login" viewTransition>
                Log in
              </Link>
              <Link
                className="portal-create-link"
                to="/register"
                viewTransition
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
