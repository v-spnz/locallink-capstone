import { BriefcaseBusiness } from 'lucide-react'
import SettingsHeading from './SettingsHeading'

export default function ServiceProfile({
  business,
  serviceProfile,
  serviceCategories,
  serviceAreas,
}) {
  return (
    <section className="business-settings-section">
      <SettingsHeading icon={BriefcaseBusiness} title="Service profile" />

      <dl className="business-settings-detail-list">
        <div>
          <dt>Verification status</dt>
          <dd>{business.verification_status.replace('_', ' ')}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{serviceProfile?.availability || 'Not set'}</dd>
        </div>
        <div>
          <dt>Service description</dt>
          <dd>{serviceProfile?.service_description || 'Not set'}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>
            {serviceCategories
              .map((category) => category.service_category)
              .join(', ') || 'Not set'}
          </dd>
        </div>
        <div>
          <dt>Service areas</dt>
          <dd>
            {serviceAreas.map((area) => area.service_area).join(', ') ||
              'Not set'}
          </dd>
        </div>
      </dl>
    </section>
  )
}
