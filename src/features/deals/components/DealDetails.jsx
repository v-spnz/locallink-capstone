import Button from '../../../components/ui/Button'

function DetailRow({ label, value }) {
  return (
    <div className="deal-detail-row">
      <span>{label}</span>
      <div>{value || '-'}</div>
    </div>
  )
}

export default function DealDetails({ deal, onClose, onEdit, onPublish }) {
  const status = deal.status || 'Active'

  return (
    <div className="deal-details">
      <DetailRow label="Title" value={deal.title} />
      <DetailRow label="Discount" value={deal.discount} />
      <DetailRow label="Status" value={status} />
      <div className="deal-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {status === 'Draft' && (
          <Button onClick={onPublish}>Publish Deal</Button>
        )}
        {status === 'Active' && (
          <Button variant="secondary" onClick={onEdit}>
            Edit Deal
          </Button>
        )}
      </div>
    </div>
  )
}
