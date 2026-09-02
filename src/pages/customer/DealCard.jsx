import { MapPin, Clock, Bookmark } from 'lucide-react'

export default function DealCard({ deal, visual, isSaved, onToggleSaved, onView }) {
  const VisualIcon = visual.icon

  return (
    <div className="dd-card" onClick={onView}>
      <div className="dd-card-media" style={{ background: visual.gradient }}>
        <VisualIcon className="dd-card-media-icon" aria-hidden="true" />
        <span className="dd-badge">{deal.badge}</span>
        <button
          type="button"
          className={`dd-save-btn${isSaved ? ' is-saved' : ''}`}
          aria-label={isSaved ? 'Remove from saved deals' : 'Save this deal'}
          onClick={(event) => {
            event.stopPropagation()
            onToggleSaved()
          }}
        >
          <Bookmark aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="dd-card-body">
        <div className="dd-card-business">{deal.businessName}</div>
        <div className="dd-card-title">{deal.title}</div>
        <p className="dd-card-desc">{deal.description}</p>

        <div className="dd-card-meta">
          <span className="dd-card-location">
            <MapPin aria-hidden="true" />
            {deal.suburb} · {deal.distanceKm.toFixed(1)} km
          </span>
          <span className="dd-card-countdown">
            <Clock aria-hidden="true" />
            {deal.daysLeft}d left
          </span>
        </div>

        <button type="button" className="dd-view-btn" onClick={onView}>
          View Deal
        </button>
      </div>
    </div>
  )
}