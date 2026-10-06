import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  Settings,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardQuickLinks({ capabilities }) {
  return (
    <aside className="business-dashboard-panel business-quick-links">
      <div className="business-section-heading is-compact">
        <div>
          <h2>Quick links</h2>
          <p>Common account tasks.</p>
        </div>
      </div>
      <Link to="/business/settings/profile">
        <Building2 aria-hidden="true" />
        Business details
        <ArrowUpRight aria-hidden="true" />
      </Link>
      <Link to="/business/settings/overview">
        <Settings aria-hidden="true" />
        Account settings
        <ArrowUpRight aria-hidden="true" />
      </Link>
      {capabilities.service_marketplace_enabled && (
        <Link to="/business/services?tab=history">
          <BriefcaseBusiness aria-hidden="true" />
          Job history
          <ArrowUpRight aria-hidden="true" />
        </Link>
      )}
    </aside>
  )
}
