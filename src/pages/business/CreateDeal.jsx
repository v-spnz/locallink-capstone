import { useState } from 'react'

export default function CreateDeal() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [discount, setDiscount] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [errors, setErrors] = useState({})
  const [deals, setDeals] = useState([])
  const [successMessage, setSuccessMessage] = useState('')

  function validate() {
    const newErrors = {}
    if (!title) newErrors.title = 'Title is required'
    if (!description) newErrors.description = 'Description is required'
    if (!discount) newErrors.discount = 'Discount is required'
    if (!expiryDate) newErrors.expiryDate = 'Expiry date is required'
    if (expiryDate && expiryDate < new Date().toISOString().split('T')[0]) {
      newErrors.expiryDate = 'Expiry date must be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSuccessMessage('')
    if (!validate()) return

    setDeals((previousDeals) => [
      {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        discount: discount.trim(),
        expiryDate,
      },
      ...previousDeals,
    ])
    setTitle('')
    setDescription('')
    setDiscount('')
    setExpiryDate('')
    setErrors({})
    setSuccessMessage('Deal created successfully!')
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Deals</div>
        <h2>Create Deal</h2>
        <p>Set up a new promotional deal visible to local customers.</p>
      </div>
      <form onSubmit={handleSubmit} className="placeholder-section" noValidate>
        <div className="placeholder-section-title">Deal Details</div>
        <FormField
          label="Deal Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g. 20% off this weekend"
          error={errors.title}
        />
        <FormField
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Short description..."
          error={errors.description}
        />
        <FormField
          label="Discount"
          value={discount}
          onChange={setDiscount}
          placeholder="e.g. 20% off, Buy 1 Get 1 Free"
          error={errors.discount}
        />
        <FormField
          label="Expiry Date"
          type="date"
          value={expiryDate}
          onChange={setExpiryDate}
          error={errors.expiryDate}
        />
        <button type="submit" className="btn-primary">
          Publish Deal
        </button>
        {successMessage && (
          <p style={{ color: 'seagreen', marginTop: 10 }}>{successMessage}</p>
        )}
      </form>
      {deals.length > 0 && (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Your Deals</div>
          {deals.map((deal) => (
            <div
              key={deal.id}
              style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}
            >
              <strong>{deal.title}</strong> - {deal.discount}
              <div style={{ fontSize: 13, color: '#666' }}>
                {deal.description}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                Expires: {deal.expiryDate}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

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
      <label className="form-label">{label}</label>
      <input
        className="form-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
