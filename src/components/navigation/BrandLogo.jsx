import { Link } from 'react-router-dom'
import LocalLinkLogo from '../branding/LocalLinkLogo'

export default function BrandLogo({ to, badge, variant = 'default' }) {
  return (
    <Link
      className={`nav-logo${variant === 'business' ? ' business-nav-logo' : ''}`}
      to={to}
      aria-label="LocalLink home"
    >
      <LocalLinkLogo className="nav-logo-wordmark" />
      {badge && <span className="nav-logo-badge">{badge}</span>}
    </Link>
  )
}
