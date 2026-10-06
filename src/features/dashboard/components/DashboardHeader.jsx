import { BarChart3, CalendarDays, CheckCircle2 } from 'lucide-react'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'

export default function DashboardHeader({ business, membership }) {
  return (
    <header className="page-header business-dashboard-header">
      <div className="business-dashboard-header-copy">
        <span className="business-dashboard-eyebrow">
          <BarChart3 aria-hidden="true" />
          Business performance
        </span>
        <h1>{business.business_name}</h1>
        <p>
          See how customers are using the LocalLink tools enabled for your
          business.
        </p>
        <div className="business-dashboard-header-meta">
          <span className="business-role-badge">
            <CheckCircle2 aria-hidden="true" />
            {membership.role} access
          </span>
          <span>
            <CalendarDays aria-hidden="true" />
            Last 30 days
          </span>
        </div>
      </div>
      <figure className="business-dashboard-hero-art">
        <img
          src={localBusinessNeighbourhood}
          alt="Local shops, a cafe and a service business in a connected neighbourhood"
        />
      </figure>
    </header>
  )
}
