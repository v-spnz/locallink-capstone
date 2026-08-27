import Button from '../../../components/ui/Button'
import DealDetails from './DealDetails'

export default function DealList({
  deals,
  locations,
  selectedDealId,
  successMessage,
  onCreate,
  onSelect,
  onClose,
  onEdit,
}) {
  return (
    <div className="placeholder-section">
      <div className="deal-list-header">
        <div className="placeholder-section-title is-complete">All Deals</div>
        <Button onClick={onCreate}>+ New Deal</Button>
      </div>
      {successMessage && <p className="form-success">{successMessage}</p>}
      {deals.length === 0 && (
        <p className="deal-empty-state">
          No deals yet. Click &quot;+ New Deal&quot; to create one.
        </p>
      )}
      {deals.map((deal) => (
        <div key={deal.id}>
          <button
            type="button"
            className="deal-list-row"
            onClick={() => onSelect(deal.id)}
          >
            <span>
              <strong>{deal.title || 'Untitled deal draft'}</strong>
              <small>
                {deal.endDate ? `Ends: ${deal.endDate}` : 'Dates not set'}
              </small>
            </span>
            <span
              className={`deal-status ${
                deal.status === 'draft' ? 'is-draft' : ''
              }`}
            >
              {deal.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </button>
          {selectedDealId === deal.id && (
            <DealDetails
              deal={deal}
              locations={locations}
              onClose={onClose}
              onEdit={() => onEdit(deal.id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
