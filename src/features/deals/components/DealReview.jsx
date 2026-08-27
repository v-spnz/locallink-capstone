import Button from '../../../components/ui/Button'
import { formatDealOffer, getOfferTypeLabel } from '../constants'

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <div className="review-row-label">{label}</div>
      <div>{value || '—'}</div>
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
  const locationNames = locations
    .filter(({ id }) => deal.locationIds.includes(id))
    .map(({ name }) => name)
    .join(', ')

  return (
    <div className="placeholder-section deal-review">
      <div className="placeholder-section-title is-complete">
        Review Deal Before Publishing
      </div>
      <p className="review-introduction">
        Publishing makes this offer available to consumers. Confirm that these
        details match the agreed deal.
      </p>
      {requestError && (
        <div className="auth-error deal-request-error" role="alert">
          {requestError}
        </div>
      )}
      {deal.imageUrl && (
        <img className="deal-review-image" src={deal.imageUrl} alt="" />
      )}
      {deal.imageFile && (
        <p className="deal-review-image-note">
          New agreed image ready to upload
        </p>
      )}
      <ReviewRow label="Deal title" value={deal.title} />
      <ReviewRow label="Description" value={deal.description} />
      <ReviewRow label="Category" value={deal.category} />
      <ReviewRow label="Offer type" value={getOfferTypeLabel(deal.offerType)} />
      <ReviewRow label="Offer" value={formatDealOffer(deal)} />
      <ReviewRow
        label="GST"
        value={
          deal.gstIncluded === 'included' ? 'GST included' : 'GST excluded'
        }
      />
      <ReviewRow label="Participating locations" value={locationNames} />
      <ReviewRow
        label="Deal period"
        value={`${deal.startDate} to ${deal.endDate}`}
      />
      <ReviewRow label="Conditions" value={deal.conditions} />
      <ReviewRow label="Total claim limit" value={deal.claimLimit} />
      <ReviewRow label="Exclusions" value={deal.exclusions} />
      <ReviewRow
        label="Redemption instructions"
        value={deal.redemptionInstructions}
      />
      <div className="review-actions">
        <Button variant="secondary" onClick={onBack} disabled={isSaving}>
          Back to Edit
        </Button>
        <Button onClick={onConfirm} disabled={isSaving}>
          {isSaving ? 'Publishing…' : 'Confirm & Publish'}
        </Button>
      </div>
    </div>
  )
}
