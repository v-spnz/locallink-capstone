export default function CreateLoyalty() {
  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Manage → Loyalty</div>
        <h2>Create Loyalty Programme</h2>
        <p>
          Design a stamp card or points-based loyalty scheme for your customers.
        </p>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Programme Details</div>
        <div className="form-group">
          <label className="form-label">Programme Name</label>
          <input
            className="form-input"
            disabled
            placeholder="e.g. Coffee Stamp Card"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Reward Type</label>
          <input
            className="form-input"
            disabled
            placeholder="Stamp Card / Points…"
          />
        </div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Earn Rules</div>
        <div className="placeholder-box">Earn rule builder — TBD</div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Redeem Rules</div>
        <div className="placeholder-box">Redeem rule builder — TBD</div>
      </div>
      <button
        className="btn-primary"
        style={{ opacity: 0.5, cursor: 'not-allowed' }}
      >
        Launch Programme
      </button>
    </>
  )
}
