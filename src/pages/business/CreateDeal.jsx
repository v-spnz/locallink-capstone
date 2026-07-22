import { useState } from 'react'

export default function CreateDeal() {

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [discount, setDiscount] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const [errors, setErrors] = useState({})

  const[deals, setDeals] = useState([])
  const[successMessage, setSuccessMessage] = useState('')
  
  function validate() {
    const newErrors = {}
    if (!title) newErrors.title = 'Title is required'
    if (!description) newErrors.description = 'Description is required'
    if (!discount) newErrors.discount = 'Discount is required'
    if (!expiryDate) newErrors.expiryDate = 'Expiry date is required'

    if (expiryDate) {
      const today = new Date().toISOString().split('T')[0]
      if (expiryDate < today) newErrors.expiryDate = 'Expiry date must be in the future'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSuccessMessage('')

    if (!validate()) return

    const newDeal = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      discount: discount.trim(),
      expiryDate,
    }

    setDeals(prev => [newDeal, ...prev])

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
        
        <div className="form-group">
         <label className="form-label">Deal Title</label>
         <input 
           className="form-input"
           value={title}
           onChange={e => setTitle(e.target.value)}
            placeholder="e.g. 20% off this weekend"
          />
          {errors.title && <span className="form-error">{errors.title}</span>}
         </div> 

        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Short description..."
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Discount</label>
          <input
            className="form-input"
            value={discount}
            onChange={e => setDiscount(e.target.value)}
            placeholder="e.g. 20% off, Buy 1 Get 1 Free"
          />
          {errors.discount && <span className="form-error">{errors.discount}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Expiry Date</label>
          <input
            className="form-input"
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
          />
          {errors.expiryDate && <span className="form-error">{errors.expiryDate}</span>}
        </div>

        <button type="submit" className="btn-primary">Publish Deal</button>
        {successMessage && <p style={{ color: 'seagreen', marginTop: 10 }}>{successMessage}</p>}
      </form>

      {deals.length > 0 && (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Your Deals</div>
          {deals.map(deal => (
            <div key={deal.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <strong>{deal.title}</strong> - {deal.discount}
              <div style={{ fontSize: 13, color: '#666' }}>{deal.description}</div>
              <div style={{ fontSize: 12, color: '#999' }}>Expires: {deal.expiryDate}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}