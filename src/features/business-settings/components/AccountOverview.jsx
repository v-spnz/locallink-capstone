import { CheckCircle2, MapPin, ShieldCheck, Tags } from 'lucide-react'
import SettingsHeading from './SettingsHeading'

export default function AccountOverview({
  business,
  businessLocations,
  serviceCategories,
  enabledCapabilities,
}) {
  return (
    <section className="business-settings-section business-settings-overview">
      <SettingsHeading title="Account overview" />

      <dl className="business-settings-summary" aria-label="Account summary">
        <div>
          <dt>
            <ShieldCheck aria-hidden="true" />
            Verification
          </dt>
          <dd>{business.verification_status.replaceAll('_', ' ')}</dd>
        </div>
        <div>
          <dt>
            <MapPin aria-hidden="true" />
            Locations
          </dt>
          <dd>{businessLocations.length}</dd>
        </div>
        <div>
          <dt>
            <Tags aria-hidden="true" />
            Service categories
          </dt>
          <dd>{serviceCategories.length}</dd>
        </div>
        <div>
          <dt>
            <CheckCircle2 aria-hidden="true" />
            Enabled tools
          </dt>
          <dd>{enabledCapabilities.length}</dd>
        </div>
      </dl>
    </section>
  )
}
