export default function BusinessBasicsStep({ form, invalidFields, onChange }) {
  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Business basics</h2>
        <p>Tell customers who they will be dealing with.</p>
      </header>

      <div className="business-onboarding-field">
        <span id="business-name-label">Business name</span>
        <input
          aria-describedby={
            invalidFields.includes('businessName')
              ? 'business-onboarding-error'
              : undefined
          }
          aria-invalid={invalidFields.includes('businessName')}
          aria-labelledby="business-name-label"
          name="businessName"
          value={form.businessName}
          onChange={onChange}
          placeholder="e.g. Morgan Plumbing"
          required
        />
      </div>

      <div className="business-onboarding-field">
        <span id="business-description-label">Short description</span>
        <textarea
          aria-labelledby="business-description-label"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="What does your business help people with?"
          rows="5"
          maxLength="1000"
        />
        <small>{form.description.length} of 1,000 characters</small>
      </div>
    </div>
  )
}
