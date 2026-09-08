import { useState } from 'react'
import { MapPin, Clock, Bookmark } from 'lucide-react'

export default function DealCard({
  deal,
  visual,
  isSaved,
  onToggleSaved,
  onView,
  animationDelay = 0,
}) {
  const VisualIcon = visual.icon
  const [isPopping, setIsPopping] = useState(false)

  function handleToggleSaved(event) {
    event.stopPropagation()
    onToggleSaved()
    setIsPopping(true)
    setTimeout(() => setIsPopping(false), 260)
  }

  return (
    <div
      className="dd-card dd-card-enter"
      style={{ animationDelay: `${animationDelay}ms` }}
      onClick={onView}
    >
      <div className="dd-card-media" style={{ background: visual.gradient }}>
        <VisualIcon className="dd-card-media-icon" aria-hidden="true" />
        <span className="dd-badge">{deal.badge}</span>
        <button
          type="button"
          className={`dd-save-btn${isSaved ? ' is-saved' : ''}${isPopping ? ' is-popping' : ''}`}
          aria-label={isSaved ? 'Remove from saved deals' : 'Save this deal'}
          onClick={handleToggleSaved}
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