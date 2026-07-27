import { useState } from 'react'

export default function CreateDeal() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [discount, setDiscount] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [errors, setErrors] = useState({})
  const [deals, setDeals] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [step, setStep] = useState('list')
  const [status, setStatus] = useState('Active')
  const [selectedDeal, setSelectedDealId] = useState(null)

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

  function handleReview(event) {
    event.preventDefault()
    setSuccessMessage('')
    if (!validate()) return
    setStep('review')
  }

  function handleBackToEdit() {
    setStep('form')
  }

  function handleConfirmPublish() {
    setDeals((previousDeals) => [
      {
        id: Date.now(),
        title: title.trim(),
        description: description.trim(),
        discount: discount.trim(),
        expiryDate,
        status,
      },
      ...previousDeals,
    ])
    setTitle('')
    setDescription('')
    setDiscount('')
    setExpiryDate('')
    setErrors({})
    setStep('list')
    setSuccessMessage('Deal created successfully!')
  }

  function handleStartNewDeal() {
    setSuccessMessage('')
    setErrors({})
    setStep('form')
  }

  function handleBackToList() {
    setStep('list')
  }

  function handleSelectDeal(dealId) {
    setSelectedDealId((currentId) => (currentId === dealId ? null : dealId))
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Deals</div>
        <h2>{step === 'list' ? 'Your Deals' : 'Create Deal'}</h2>
        <p>
          {step === 'list'
            ? 'View and manage all your promotional deals.'
            : 'Set up a new promotional deal visible to local customers.'}
        </p>
      </div>
      {step === 'list' && (
        <div className="placeholder-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <div
              className="placeholder-section-title is-complete"
              style={{ margin: 0 }}
            >
              {' '}
              All Deals
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={handleStartNewDeal}
            >
              {' '}
              + New Deal
            </button>
          </div>

          {successMessage && (
            <p style={{ color: 'seagreen', marginTop: 0, marginBottom: 10 }}>
              {successMessage}
            </p>
          )}

          {deals.length === 0 && (
            <p style={{ fontSize: 13, color: '#999' }}>
              {' '}
              No deals yet. Click "+ New Deal" to create one.
            </p>
          )}

          {deals.map((deal) => (
            <div key={deal.id}>
              <div
                onClick={() => handleSelectDeal(deal.id)}
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{deal.title}</strong> - {deal.discount}
                  <div style={{ fontSize: 12, color: '#999' }}>
                    {' '}
                    Expires: {deal.expiryDate}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: deal.status === 'Draft' ? '#eee' : '#e3f5e9',
                    color: deal.status === 'Draft' ? '#666' : 'seagreen',
                  }}
                >
                  {' '}
                  {deal.status || 'Active'}
                </span>
              </div>

              {selectedDeal === deal.id && (
                <div
                  style={{
                    padding: '10px 14px',
                    marginBottom: 10,
                    background: '#fafafa',
                    border: '1px solid #eee',
                    borderRadius: 6,
                  }}
                >
                  <DealDetailRow label="Title" value={deal.title} />
                  <DealDetailRow label="Discount" value={deal.discount} />
                  <DealDetailRow
                    label="Status"
                    value={deal.status || 'Active'}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: 10 }}
                    onClick={() => setSelectedDealId(null)}
                  >
                    {' '}
                    Close
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 'review' && (
        <div className="placeholder-section">
          <div className="placeholder-section-title is-complete">
            Review Deal
          </div>
          <p
            style={{
              fontSize: 13,
              color: '#666',
              marginTop: -6,
              marginBottom: 14,
            }}
          >
            Please review the deal details before publishing.
          </p>

          <ReviewRow label="Deal Title" value={title} />
          <ReviewRow label="Description" value={description} />
          <ReviewRow label="Discount" value={discount} />
          <ReviewRow label="Expiry Date" value={expiryDate} />

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBackToEdit}
            >
              Back to Edit
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirmPublish}
            >
              Confirm &amp; Publish
            </button>
          </div>
        </div>
      )}

      {step === 'form' && (
        <form
          onSubmit={handleReview}
          className="placeholder-section"
          noValidate
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ marginBottom: 14 }}
            onClick={handleBackToList}
          >
            {' '}
            ← Back to Deals
          </button>

          <div className="placeholder-section-title is-complete">
            Deal Details
          </div>

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

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-input"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <button type="submit" className="btn-primary">
            Preview Deal
          </button>
        </form>
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
      {error && (
        <span className="form-error" style={{ color: 'red' }}>
          {error}
        </span>
      )}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14 }}>{value || '-'}</div>
    </div>
  )
}

function DealDetailRow({ label, value }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
      <div style={{ fontSize: 12, color: '#999', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 14 }}>{value || '-'}</div>
    </div>
  )
}
