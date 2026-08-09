export default function LoyaltySummary({ totalPoints, pointsProgramCount }) {
  return (
    <div className="card loyalty-summary">
      <div>
        <div className="loyalty-summary-label">Total Points</div>
        <div className="loyalty-summary-points">
          {totalPoints.toLocaleString()}
        </div>
        <div className="loyalty-summary-note">
          Across {pointsProgramCount} points programmes
        </div>
      </div>
      <div className="loyalty-tier">
        <div>Gold Member</div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: '64%' }} />
        </div>
        <span>180 pts to Platinum</span>
      </div>
    </div>
  )
}
