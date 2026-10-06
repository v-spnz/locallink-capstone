import { CalendarDays, ChevronDown, ImageIcon } from 'lucide-react'
import { formatDealOffer } from '../constants'
import DealDetails from './DealDetails'
import { formatDealDate } from './dealListPresentation'

function DealImage({ deal }) {
  return (
    <span className="deal-card-media">
      {deal.imageUrl ? (
        <img
          src={deal.imageUrl}
          alt={`Promotion for ${deal.title || 'deal draft'}`}
        />
      ) : (
        <span aria-label="No deal image">
          <ImageIcon aria-hidden="true" />
        </span>
      )}
    </span>
  )
}

export default function DealRow({
  record,
  selected,
  deleteConfirmationId,
  deletingDealId,
  cancelingDealId,
  onSelect,
  onEdit,
  onRequestDelete,
  onCancelDeleteRequest,
  onConfirmDelete,
  onCancelScheduling,
  isEnding,
  onRequestEnd,
  onEnd,
}) {
  const { deal, expiry, lifecycle } = record
  const detailId = `deal-details-${deal.id}`

  return (
    <article
      className={`deal-management-card${selected ? ' is-expanded' : ''}`}
    >
      <button
        type="button"
        className="deal-list-row"
        onClick={() => onSelect(deal.id)}
        aria-expanded={selected}
        aria-controls={detailId}
      >
        <DealImage deal={deal} />

        <span className="deal-card-copy">
          <small>{deal.category || 'Uncategorised deal'}</small>
          <strong className="deal-card-title">
            {deal.title || 'Untitled deal draft'}
          </strong>
          <span className="deal-card-description">
            {deal.description ||
              'Add a short description to explain what customers receive.'}
          </span>
        </span>

        <span className="deal-card-offer">
          <small>Offer</small>
          <strong>{formatDealOffer(deal) || 'Not set'}</strong>
        </span>

        <span className="deal-card-timing">
          <span className={`deal-status is-${lifecycle.value}`}>
            {lifecycle.label}
          </span>
          <span className={`deal-card-expiry ${expiry.tone}`}>
            <CalendarDays aria-hidden="true" />
            {expiry.label}
          </span>
          <small>
            {deal.startDate
              ? `${formatDealDate(deal.startDate, false)} to ${formatDealDate(deal.endDate, false)}`
              : 'Dates not set'}
          </small>
        </span>

        <span className="deal-card-disclosure" aria-hidden="true">
          <span>{selected ? 'Close' : 'Details'}</span>
          <ChevronDown />
        </span>
      </button>

      {selected && (
        <DealDetails
          id={detailId}
          deal={deal}
          lifecycle={lifecycle}
          isDeleteConfirming={deleteConfirmationId === deal.id}
          isDeleting={deletingDealId === deal.id}
          isCanceling={cancelingDealId === deal.id}
          onEdit={() => onEdit(deal.id)}
          onRequestDelete={onRequestDelete}
          onCancelDeleteRequest={onCancelDeleteRequest}
          onConfirmDelete={onConfirmDelete}
          onCancelScheduling={onCancelScheduling}
          canEnd={lifecycle.value === 'active'}
          isEnding={isEnding}
          onRequestEnd={() => onRequestEnd(deal.id)}
          onEnd={() => onEnd(deal.id)}
        />
      )}
    </article>
  )
}
