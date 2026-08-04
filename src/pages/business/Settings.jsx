import useBusiness from '../../business/useBusiness'

export default function Settings() {
  const {
    business,
    membership,
    capabilities,
    serviceProfile,
    serviceCategories,
    serviceAreas,
  } = useBusiness()

  const enabledCapabilities = [
    capabilities.deals_enabled && 'Deals',
    capabilities.loyalty_enabled && 'Loyalty',
    capabilities.service_marketplace_enabled && 'Service Marketplace',
  ].filter(Boolean)

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your business profile and notification preferences.</p>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Business Profile</div>
        <div className="form-group">
          <label className="form-label">Business Name</label>
          <input
            className="form-input"
            disabled
            value={business.business_name}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            disabled
            value={business.description || 'No description added'}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Your access</label>
          <input className="form-input" disabled value={membership.role} />
        </div>
        <div className="form-group">
          <label className="form-label">Enabled capabilities</label>
          <input
            className="form-input"
            disabled
            value={enabledCapabilities.join(', ')}
          />
        </div>
      </div>

      {capabilities.service_marketplace_enabled && (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Service Profile</div>
          <div className="form-group">
            <label className="form-label">Verification status</label>
            <input
              className="form-input"
              disabled
              value={business.verification_status.replace('_', ' ')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service description</label>
            <input
              className="form-input"
              disabled
              value={serviceProfile?.service_description ?? ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Availability</label>
            <input
              className="form-input"
              disabled
              value={serviceProfile?.availability ?? ''}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categories</label>
            <input
              className="form-input"
              disabled
              value={serviceCategories
                .map((category) => category.service_category)
                .join(', ')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Service areas</label>
            <input
              className="form-input"
              disabled
              value={serviceAreas.map((area) => area.service_area).join(', ')}
            />
          </div>
        </div>
      )}
    </>
  )
}
