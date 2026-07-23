const statLabels = [
  'Active Customers',
  'Deals Redeemed',
  'Loyalty Points Issued',
]

export default function Dashboard() {
  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Overview of customer engagement and campaign performance.</p>
      </div>
      <div className="stat-strip">
        {statLabels.map((label) => (
          <div className="stat-tile" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-value">—</div>
            <div className="stat-sub">Placeholder</div>
          </div>
        ))}
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Engagement Over Time</div>
        <div className="placeholder-box tall">Chart component — TBD</div>
      </div>
      <div className="placeholder-section">
        <div className="placeholder-section-title">Top Performing Deals</div>
        <div className="placeholder-bar medium" />
        <div className="placeholder-bar full" />
        <div className="placeholder-bar short" />
      </div>
    </>
  )
}
