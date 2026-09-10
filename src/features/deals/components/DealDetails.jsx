import Button from '../../../components/ui/Button'
import { CalendarX, ReceiptText, Tag, Trash2 } from 'lucide-react'

function DetailRow({ label, value }) {
  return (
    <div className="deal-detail-row">
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </div>
  )
}

export default function DealDetails({
  id,
  deal,
  lifecycle,
  isDeleteConfirming,
  isDeleting,
  isCanceling,
  onClose,
  onEdit,
  onRequestDelete,
  onCancelDeleteRequest,
  onConfirmDelete,
  onCancelScheduling,
}) {
  const isDraft = lifecycle.value === 'draft'
  const isScheduled = lifecycle.value === 'scheduled'
  const isEditable = isDraft || isScheduled

  return (
    <div id={id} className="deal-details">
      <div className="deal-details-heading">
        <div>
          <h3>Deal details</h3>
          <p>Claim limits, customer terms and redemption information.</p>
        </div>
      </div>

      <div className="deal-detail-sections">
        <section className="deal-detail-section">
          <div className="deal-detail-section-heading">
            <Tag aria-hidden="true" />
            <h4>Claim details</h4>
          </div>
          <dl className="deal-detail-list">
            <DetailRow
              label="Claim limit"
              value={deal.claimLimit ? `${deal.claimLimit} total claims` : ''}
            />
            <DetailRow
              label="How to redeem"
              value={deal.redemptionInstructions}
            />
          </dl>
        </section>

        <section className="deal-detail-section">
          <div className="deal-detail-section-heading">
            <ReceiptText aria-hidden="true" />
            <h4>Conditions and exclusions</h4>
          </div>
          <dl className="deal-detail-list">
            <DetailRow label="Conditions" value={deal.conditions} />
            <DetailRow label="Exclusions" value={deal.exclusions} />
          </dl>
        </section>
      </div>

      {!isEditable && (
        <p className="deal-detail-readonly-note">
          This deal is {lifecycle.label.toLowerCase()} and can no longer be
          edited.
        </p>
      )}

      {isDraft && isDeleteConfirming && (
        <div className="deal-delete-confirmation" role="alert">
          <strong>Delete this draft?</strong>
          <p>
            This permanently removes the draft. It was never published, so no
            customers are notified.
          </p>
          <div>
            <Button
              variant="danger"
              onClick={() => onConfirmDelete(deal.id)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting…' : 'Confirm delete'}
            </Button>
            <Button
              variant="secondary"
              onClick={onCancelDeleteRequest}
              disabled={isDeleting}
            >
              Keep draft
            </Button>
          </div>
        </div>
      )}

      {isScheduled && (
        <div className="deal-cancel-scheduling-note">
          <CalendarX aria-hidden="true" />
          <p>
            This deal is scheduled to go live on its start date. Cancelling
            returns it to Draft so it stays private.
          </p>
        </div>
      )}

      <div className="deal-actions">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {isEditable && (
          <Button onClick={onEdit}>
            {isDraft ? 'Continue draft' : 'Edit deal'}
          </Button>
        )}
        {isDraft && !isDeleteConfirming && (
          <Button variant="danger" onClick={() => onRequestDelete(deal.id)}>
            <Trash2 aria-hidden="true" />
            Delete draft
          </Button>
        )}
        {isScheduled && (
          <Button
            variant="secondary"
            onClick={() => onCancelScheduling(deal.id)}
            disabled={isCanceling}
          >
            {isCanceling ? 'Cancelling…' : 'Cancel scheduled publication'}
          </Button>
        )}
      </div>
    </div>
  )
}
