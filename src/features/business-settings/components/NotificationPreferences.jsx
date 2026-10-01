import { Bell } from 'lucide-react'
import SettingsHeading from './SettingsHeading'

export default function NotificationPreferences() {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={Bell} title="Notification preferences" />
      <div className="business-settings-callout">
        <Bell aria-hidden="true" />
        <span>
          <strong>Important notifications are on</strong>
          Lead and job updates remain enabled while preference controls are
          being developed.
        </span>
      </div>
    </section>
  )
}
