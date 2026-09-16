import { useEffect, useState } from 'react'
import { X, CheckCircle2, Ban, Tag, CalendarDays, MapPin } from 'lucide-react'
import { DEAL_REDEMPTION_METHOD } from '../../features/deals/constants'

export default function DealModal({
  deal,
  visual,
  isSaved,
  onToggleSaved,
  onClose,
  onClaim,
}) {
  const VisualIcon = visual.icon
  const [isClosing, setIsClosing] = useState(false)
  const [isClaimPopping, setIsClaimPopping] = useState(false)

  function handleClose() {
    setIsClosing(true)
    setTimeout(onClose, 180)
  }

  function handleClaim() {
    onClaim()
    setIsClaimPopping(true)
    setTimeout(() => setIsClaimPopping(false), 260)
  }

  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setIsClosing(true)
        setTimeout(onClose, 180)
      }
    }

    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <div
      className={`dd-modal-overlay${isClosing ? ' is-closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`dd-modal${isClosing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={deal.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dd-modal-media" style={{ background: visual.gradient }}>
          <VisualIcon className="dd-modal-media-icon" aria-hidden="true" />
          <span className="dd-badge dd-modal-badge">{deal.badge}</span>
          <button
            type="button"
            className="dd-modal-close"
            aria-label="Close"
            onClick={handleClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <div className="dd-modal-heading">
          <div className="dd-modal-business">{deal.businessName}</div>
          <h3 className="dd-modal-title">{deal.title}</h3>
        </div>

        <div className="dd-modal-content">
          <div className="dd-tag-row">
            <span className="dd-tag dd-tag-category">{deal.category}</span>
            <span className="dd-tag dd-tag-neutral">
              {deal.suburb} · {deal.distanceKm.toFixed(1)} km
            </span>
            <span className="dd-tag dd-tag-expiry">
              Expires {deal.expiryDate}
            </span>
            {deal.isOpenNow && (
              <span className="dd-tag dd-tag-open">• Open now</span>
            )}
          </div>

          <p className="dd-modal-desc">{deal.description}</p>

          <div className="dd-modal-address">
            <MapPin aria-hidden="true" />
            {deal.address}
          </div>

          <div className="dd-modal-columns">
            <div className="dd-modal-included">
              <div className="dd-modal-col-title">
                <CheckCircle2 aria-hidden="true" />
                What's included
              </div>
              <ul>
                {deal.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="dd-modal-excluded">
              <div className="dd-modal-col-title">
                <Ban aria-hidden="true" />
                What's excluded
              </div>
              <ul>
                {deal.excluded.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="dd-redeem-box">
            <div className="dd-redeem-title">
              <Tag aria-hidden="true" />
              Redemption method
            </div>
            <p>{DEAL_REDEMPTION_METHOD}</p>
          </div>

          <div className="dd-conditions">
            <div className="dd-conditions-title">Conditions</div>
            <p>{deal.conditions}</p>
          </div>

          <div className="dd-expiry-row">
            <CalendarDays aria-hidden="true" />
            <span>Offer expires:</span>
            <strong>{deal.expiryDate}</strong>
          </div>
        </div>

        <div className="dd-modal-footer">
          <button
            type="button"
            className={`dd-save-toggle${isSaved ? ' is-saved' : ''}`}
            onClick={onToggleSaved}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            className={`dd-claim-btn${isClaimPopping ? ' is-popping' : ''}`}
            onClick={handleClaim}
          >
            Claim Deal
          </button>
        </div>
      </div>
    </div>
  )
}
