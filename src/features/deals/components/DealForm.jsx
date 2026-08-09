import Button from '../../../components/ui/Button'

function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
}) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        <input
          className="form-input"
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

export default function DealForm({
  deal,
  errors,
  isEditing,
  onChange,
  onBack,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="placeholder-section" noValidate>
      <Button variant="secondary" className="deal-back" onClick={onBack}>
        ← Back to Deals
      </Button>
      <div className="placeholder-section-title is-complete">
        {isEditing ? 'Edit Deal' : 'Deal Details'}
      </div>
      <FormField
        label="Deal Title"
        value={deal.title}
        onChange={(value) => onChange('title', value)}
        placeholder="e.g. 20% off this weekend"
        error={errors.title}
      />
      <FormField
        label="Description"
        value={deal.description}
        onChange={(value) => onChange('description', value)}
        placeholder="Short description..."
        error={errors.description}
      />
      <FormField
        label="Discount"
        value={deal.discount}
        onChange={(value) => onChange('discount', value)}
        placeholder="e.g. 20% off, Buy 1 Get 1 Free"
        error={errors.discount}
      />
      <FormField
        label="Expiry Date"
        type="date"
        value={deal.expiryDate}
        onChange={(value) => onChange('expiryDate', value)}
        error={errors.expiryDate}
      />
      <div className="form-group">
        <label className="form-label">
          Status
          <select
            className="form-input"
            value={deal.status}
            onChange={(event) => onChange('status', event.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Draft">Draft</option>
          </select>
        </label>
      </div>
      <Button type="submit">Preview Deal</Button>
    </form>
  )
}
