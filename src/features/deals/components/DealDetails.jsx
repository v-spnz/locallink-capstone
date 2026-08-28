import Button from '../../../components/ui/Button'
import { CalendarDays, MapPin, ReceiptText, Tag } from 'lucide-react'
import { formatDealOffer, getOfferTypeLabel } from '../constants'

function DetailRow({ label, value }) {
  return (
    <div className="deal-detail-row">
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </div>
  )
}

export default function DealDetails({ deal, locations, onClose, onEdit }) {
  const locationNames = locations
    .filter(({ id }) => deal.locationIds.includes(id))
    .map(({ name }) => name)
    .join(', ')

  return (
    <div className="deal-details">
      <div className="deal-detail-overview">
        {deal.imageUrl && (
          <img
            className="deal-detail-image"
            src={deal.imageUrl}
            alt={`Preview for ${deal.title || 'deal draft'}`}
          />
        )}
        <div className="deal-detail-offer">
          <span>
            {getOfferTypeLabel(deal.offerType) || 'Offer type not set'}
          </span>
          <strong>{formatDealOffer(deal) || 'Offer details not set'}</strong>
          <p>{deal.description || 'No customer-facing description added.'}</p>
        </div>
      </div>

      <div className="deal-detail-section-heading">
        <Tag aria-hidden="true" />
        <h3>Offer setup</h3>
      </div>
      <dl className="deal-detail-grid">
        <DetailRow label="Category" value={deal.category} />
        <DetailRow
          label="GST treatment"
          value={deal.gstIncluded ? `GST ${deal.gstIncluded}` : 'Not set'}
        />
        <DetailRow
          label="Claim limit"
          value={deal.claimLimit ? `${deal.claimLimit} total claims` : ''}
        />
        <DetailRow label="Status" value={deal.status} />
      </dl>

      <div className="deal-detail-section-heading">
        <CalendarDays aria-hidden="true" />
        <h3>Availability</h3>
      </div>
      <dl className="deal-detail-grid">
        <DetailRow label="Starts" value={deal.startDate} />
        <DetailRow label="Expires" value={deal.endDate} />
      </dl>
      <p className="deal-detail-location-line">
        <MapPin aria-hidden="true" />
        <span>
          <strong>Participating locations</strong>
          {locationNames || 'No locations selected'}
        </span>
      </p>

      <div className="deal-detail-section-heading">
        <ReceiptText aria-hidden="true" />
        <h3>Customer terms</h3>
      </div>
      <dl className="deal-detail-grid is-single-column">
        <DetailRow label="Conditions" value={deal.conditions} />
        <DetailRow label="Exclusions" value={deal.exclusions} />
        <DetailRow label="How to redeem" value={deal.redemptionInstructions} />
      </dl>
      <div className="deal-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          {deal.status === 'draft' ? 'Continue draft' : 'Edit deal'}
        </Button>
      </div>
    </div>
  )
}
