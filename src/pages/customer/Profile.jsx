

export default function Profile() {
    return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your personal details and location preferences.</p>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Profile Details</div>
        <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" disabled placeholder="Your Name" /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" disabled placeholder="you@email.com" /></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-section-title">Location Range Filter</div>
        <div className="skeleton-box">Range filter slider — component TBD</div>
      </div>
    </>
  )
}
