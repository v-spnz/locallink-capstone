import { LogOut, UserCog } from 'lucide-react'
import { Link } from 'react-router-dom'
import SettingsHeading from './SettingsHeading'

export default function AccountAccess({
  logoutError,
  isLoggingOut,
  handleLogout,
}) {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={UserCog} title="Account access" />
      {logoutError && (
        <div className="error" role="alert">
          {logoutError}
        </div>
      )}
      <div className="business-settings-actions">
        <Link className="btn-secondary" to="/home">
          Go to consumer portal
        </Link>
        <button
          type="button"
          className="btn-danger"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut aria-hidden="true" />
          {isLoggingOut ? 'Logging out…' : 'Log Out'}
        </button>
      </div>
    </section>
  )
}
