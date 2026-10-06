import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BusinessProfileSnapshot({
  business,
  verificationLabel,
  moduleCount,
  capabilities,
  serviceAreas,
  serviceProfile,
}) {
  return (
    <section className="business-dashboard-panel business-presence-panel">
      <div className="business-panel-icon">
        <Building2 aria-hidden="true" />
      </div>
      <div>
        <h2>Profile snapshot</h2>
        <p>{business.description || 'No business description added yet.'}</p>
      </div>
      <dl className="business-presence-facts">
        <div>
          <dt>
            <ShieldCheck aria-hidden="true" />
            Verification
          </dt>
          <dd>{verificationLabel}</dd>
        </div>
        <div>
          <dt>
            <CheckCircle2 aria-hidden="true" />
            Enabled tools
          </dt>
          <dd>{moduleCount}</dd>
        </div>
        {capabilities.service_marketplace_enabled && (
          <div>
            <dt>
              <MapPin aria-hidden="true" />
              Service coverage
            </dt>
            <dd>
              {serviceAreas.length > 0
                ? `${serviceAreas.length} ${serviceAreas.length === 1 ? 'area' : 'areas'}`
                : 'Not set'}
            </dd>
          </div>
        )}
      </dl>
      {capabilities.service_marketplace_enabled && serviceProfile && (
        <p className="business-presence-availability">
          <strong>Availability</strong>
          {serviceProfile.availability || 'Not set'}
        </p>
      )}
      <Link to="/business/settings/profile">
        Review business details
        <ArrowUpRight aria-hidden="true" />
      </Link>
    </section>
  )
}
