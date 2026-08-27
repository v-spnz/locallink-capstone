import Button from '../../../components/ui/Button'
import { formatDealOffer } from '../constants'

function DetailRow({ label, value }) {
  return (
    <div className="deal-detail-row">
      <span>{label}</span>
      <div>{value || '—'}</div>
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
      {deal.imageUrl && (
        <img className="deal-detail-image" src={deal.imageUrl} alt="" />
      )}
      <DetailRow label="Title" value={deal.title} />
      <DetailRow label="Offer" value={formatDealOffer(deal)} />
      <DetailRow
        label="GST"
        value={deal.gstIncluded ? `GST ${deal.gstIncluded}` : 'Not set'}
      />
      <DetailRow label="Locations" value={locationNames} />
      <DetailRow
        label="Dates"
        value={
          deal.startDate || deal.endDate
            ? `${deal.startDate || 'Not set'} to ${deal.endDate || 'Not set'}`
            : ''
        }
      />
      <DetailRow label="Claim limit" value={deal.claimLimit} />
      <div className="deal-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          {deal.status === 'draft' ? 'Continue Draft' : 'Edit Deal'}
        </Button>
      </div>
    </div>
  )
}
