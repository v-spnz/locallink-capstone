import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import LocalLinkLogo from '../branding/LocalLinkLogo'
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
        <LocalLinkLogo className="auth-page-brand-wordmark" />
      </Link>

      <Link className="auth-page-back" to="/" viewTransition>
        <ArrowLeft aria-hidden="true" />
        Back to landing page
      </Link>
    </header>
  )
}
