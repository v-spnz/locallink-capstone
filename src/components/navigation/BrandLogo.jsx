import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function BrandLogo({ to, badge }) {
  return (
    <Link className="nav-logo" to={to} aria-label="LocalLink home">
      <span className="nav-logo-mark" aria-hidden="true">
        <Sparkles />
      </span>
      <span>LocalLink</span>
      {badge && <span className="nav-logo-badge">{badge}</span>}
    </Link>
  )
}
