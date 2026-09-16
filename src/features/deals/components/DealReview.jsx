import { useLayoutEffect, useRef, useState } from 'react'
import Button from '../../../components/ui/Button'
import GstIncluded from '../../../components/ui/GstIncluded'
import Modal from '../../../components/ui/Modal'
import { CalendarDays, CheckCircle2, MapPin, ReceiptText } from 'lucide-react'
import {
  DEAL_REDEMPTION_METHOD,
  formatDealOffer,
  getOfferTypeLabel,
} from '../constants'
import { formatBusinessDealAddress } from '../businessLocation'

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <div className="review-row-label">{label}</div>
      <div>{value || 'Not set'}</div>
    </div>
  )
}

export default function DealReview({
  deal,
  locations,
  isSaving,
  requestError,
  onBack,
  onConfirm,
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const previewImageRef = useRef(null)
  const businessAddress = formatBusinessDealAddress(
    locations.find(({ id }) => deal.locationIds.includes(id)) || locations[0],
  )
  const hasImage = Boolean(deal.imageFile || deal.imageUrl)
  const savedImageUrl = deal.imageFile ? undefined : deal.imageUrl || undefined

  useLayoutEffect(() => {
    if (!deal.imageFile) return undefined

    const objectUrl = URL.createObjectURL(deal.imageFile)
    if (previewImageRef.current) previewImageRef.current.src = objectUrl

    return () => URL.revokeObjectURL(objectUrl)
  }, [deal.imageFile])

  function handleDeclinePublication() {
    if (isSaving) return
    setIsConfirming(false)
    onBack()
  }

  async function handleConfirmPublication() {
    const published = await onConfirm()
    if (!published) setIsConfirming(false)
  }

  return (
    <div className="placeholder-section deal-review">
      <div className="deal-review-heading">
        <div>
          <span className="deal-review-status">
            <CheckCircle2 aria-hidden="true" />
            Ready for review
          </span>
          <h2>Review deal before publishing</h2>
          <p className="review-introduction">
            Publishing makes this offer visible to customers. Check the offer,
            dates and customer terms before confirming.
          </p>
        </div>
        <span className="deal-review-offer">
          <small>{getOfferTypeLabel(deal.offerType)}</small>
          <strong>{formatDealOffer(deal)}</strong>
          <GstIncluded block />
        </span>
      </div>
      {requestError && (
        <div className="auth-error deal-request-error" role="alert">
          {requestError}
        </div>
      )}
      {hasImage && (
        <div className="deal-review-image-frame">
          <img
            ref={previewImageRef}
            className="deal-review-image"
            src={savedImageUrl}
            alt={`Preview for ${deal.title || 'deal draft'}`}
          />
        </div>
      )}

      <section className="deal-review-section">
        <div className="deal-review-section-heading">
          <ReceiptText aria-hidden="true" />
          <div>
            <h3>Customer-facing offer</h3>
            <p>What customers will see before they claim.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow label="Deal title" value={deal.title} />
          <ReviewRow label="Description" value={deal.description} />
          <ReviewRow label="Category" value={deal.category} />
          <ReviewRow
            label="Offer type"
            value={getOfferTypeLabel(deal.offerType)}
          />
          <ReviewRow label="Offer" value={formatDealOffer(deal)} />
          <ReviewRow label="GST" value="GST Included" />
        </div>
      </section>

      <section className="deal-review-section">
        <div className="deal-review-section-heading">
          <CalendarDays aria-hidden="true" />
          <div>
            <h3>Where and when</h3>
            <p>The business address and deal period.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow label="Business address" value={businessAddress} />
          <ReviewRow
            label="Deal period"
            value={`${deal.startDate} to ${deal.endDate}`}
          />
          <ReviewRow label="Total claim limit" value={deal.claimLimit} />
        </div>
        <p className="deal-review-location-note">
          <MapPin aria-hidden="true" />
          This deal uses the address saved to your business account.
        </p>
      </section>

      <section className="deal-review-section">
        <div className="deal-review-section-heading">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <h3>Conditions and redemption</h3>
            <p>What is included, excluded and required at redemption.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow label="Conditions" value={deal.conditions} />
          <ReviewRow label="Exclusions" value={deal.exclusions} />
          <ReviewRow label="Redemption method" value={DEAL_REDEMPTION_METHOD} />
        </div>
      </section>
      <div className="review-actions">
        <Button variant="secondary" onClick={onBack} disabled={isSaving}>
          Back to edit
        </Button>
        <Button onClick={() => setIsConfirming(true)} disabled={isSaving}>
          Confirm and publish
        </Button>
      </div>
      {isConfirming && (
        <Modal onClose={handleDeclinePublication} maxWidthClassName="max-w-lg">
          <section
            className="deal-publish-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-publish-confirmation-title"
          >
            <span className="deal-publish-confirmation-icon">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <h2 id="deal-publish-confirmation-title">Publish this deal?</h2>
            <p>
              Customers will be able to discover the offer when its start date
              is reached. You can continue editing if anything needs changing.
            </p>
            <div className="deal-publish-confirmation-actions">
              <Button
                variant="secondary"
                onClick={handleDeclinePublication}
                disabled={isSaving}
              >
                Continue editing
              </Button>
              <Button onClick={handleConfirmPublication} disabled={isSaving}>
                {isSaving ? 'Publishing…' : 'Publish deal'}
              </Button>
            </div>
          </section>
        </Modal>
      )}
    </div>
  )
}
