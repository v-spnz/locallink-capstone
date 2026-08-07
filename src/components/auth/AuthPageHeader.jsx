import { ArrowLeft, Crosshair } from 'lucide-react'
import { Link } from 'react-router-dom'
import './AuthPageHeader.css'

export default function AuthPageHeader() {
  return (
    <header className="auth-page-header">
      <Link
        className="auth-page-brand"
        to="/"
        viewTransition
        aria-label="LocalLink landing page"
      >
        <span className="auth-page-brand-mark" aria-hidden="true">
          <Crosshair />
        </span>
        <span>LocalLink</span>
      </Link>

      <Link className="auth-page-back" to="/" viewTransition>
        <ArrowLeft aria-hidden="true" />
        Back to landing page
      </Link>
    </header>
  )
}
