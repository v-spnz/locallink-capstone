import { CircleUserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import BrandLogo from './BrandLogo'

const navigationItems = [
  ['/home', 'Home'],
  ['/deals', 'Nearby deals'],
  ['/loyalty', 'Loyalty rewards'],
  ['/jobs', 'Job requests'],
]

export default function CustomerNav() {
  const { user } = useAuth()

  return (
    <header className="portal-header">
      <nav className="nav" aria-label="Main navigation">
        <BrandLogo to="/home" />

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

        {user ? (
          <NavLink
            className={({ isActive }) =>
              `portal-account-link${isActive ? ' active' : ''}`
            }
            to="/profile"
          >
            <CircleUserRound aria-hidden="true" />
            <span>Profile</span>
          </NavLink>
        ) : (
          <div className="portal-auth-links" aria-label="Account actions">
            <Link className="portal-login-link" to="/login" viewTransition>
              Log in
            </Link>
            <Link className="portal-create-link" to="/register" viewTransition>
              Create account
            </Link>
          </div>
        )}
      </nav>
    </header>
  )
}
