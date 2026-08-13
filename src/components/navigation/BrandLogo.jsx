import { Link } from 'react-router-dom'
import { MapPin, Sparkles } from 'lucide-react'

export default function BrandLogo({ to, badge, variant = 'default' }) {
  const Mark = variant === 'business' ? MapPin : Sparkles

  return (
    <Link
      className={`nav-logo${variant === 'business' ? ' business-nav-logo' : ''}`}
      to={to}
      aria-label="LocalLink home"
    >
      <span className="nav-logo-mark" aria-hidden="true">
        <Mark />
      </span>
      <span>LocalLink</span>
      {badge && <span className="nav-logo-badge">{badge}</span>}
    </Link>
  )
}
