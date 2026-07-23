import { Link } from 'react-router-dom'

export default function BrandLogo({ to, badge }) {
  return (
    <Link className="nav-logo" to={to}>
      Local<span className="logo-link">Link</span>
      {badge && <span style={badgeStyles}>{badge}</span>}
    </Link>
  )
}

const badgeStyles = {
  fontSize: 11,
  background: 'rgba(255,255,255,0.18)',
  padding: '2px 8px',
  borderRadius: 10,
  marginLeft: 8,
  fontWeight: 500,
}
