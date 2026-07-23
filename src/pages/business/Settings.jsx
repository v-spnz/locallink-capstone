export default function Settings() {
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
            placeholder="Your Business Name"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Location / Region</label>
          <input
            className="form-input"
            disabled
            placeholder="e.g. Auckland, NZ"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <input
            className="form-input"
            disabled
            placeholder="e.g. Café, Plumber, Retailer…"
          />
        </div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Notifications</div>
        <div className="placeholder-bar medium" />
        <div className="placeholder-bar short" />
      </div>
    </>
  )
}
