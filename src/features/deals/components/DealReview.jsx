import Button from '../../../components/ui/Button'

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <div className="review-row-label">{label}</div>
      <div>{value || '-'}</div>
    </div>
  )
}

export default function DealReview({ deal, onBack, onConfirm }) {
  return (
    <div className="placeholder-section">
      <div className="placeholder-section-title is-complete">Review Deal</div>
      <p className="review-introduction">
        Please review the deal details before publishing.
      </p>
      <ReviewRow label="Deal Title" value={deal.title} />
      <ReviewRow label="Description" value={deal.description} />
      <ReviewRow label="Discount" value={deal.discount} />
      <ReviewRow label="Expiry Date" value={deal.expiryDate} />
      <div className="review-actions">
        <Button variant="secondary" onClick={onBack}>
          Back to Edit
        </Button>
        <Button onClick={onConfirm}>Confirm &amp; Publish</Button>
      </div>
    </div>
  )
}
