import { CAPABILITY_OPTIONS, listFromInput } from '../businessOnboarding'

export default function ReviewStep({ form, onEdit, selectedCount }) {
  const capabilities = CAPABILITY_OPTIONS.filter(({ key }) => form[key])

  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Review your business setup</h2>
        <p>Check the details below before opening your dashboard.</p>
      </header>

      <div className="business-onboarding-review">
        <section>
          <div>
            <h3>Business basics</h3>
            <button type="button" onClick={() => onEdit('basics')}>
              Edit
            </button>
          </div>
          <strong>{form.businessName}</strong>
          <p>{form.description || 'No description added.'}</p>
        </section>

        <section>
          <div>
            <h3>Enabled tools</h3>
            <button type="button" onClick={() => onEdit('capabilities')}>
              Edit
            </button>
          </div>
          <p>
            {selectedCount} {selectedCount === 1 ? 'tool' : 'tools'} selected
          </p>
          <div className="business-review-tools">
            {capabilities.map((capability) => (
              <span key={capability.key}>{capability.label}</span>
            ))}
          </div>
        </section>

        {(form.deals || form.serviceMarketplace) && (
          <section>
            <div>
              <h3>Additional setup</h3>
              <button type="button" onClick={() => onEdit('setup')}>
                Edit
              </button>
            </div>
            {form.deals && <p>{form.locations[0]?.formattedAddress}</p>}
            {form.serviceMarketplace && (
              <p>
                {listFromInput(form.categories).length} service{' '}
                {listFromInput(form.categories).length === 1
                  ? 'category'
                  : 'categories'}
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
