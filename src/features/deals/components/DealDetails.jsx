import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import {
  BadgeCheck,
  CalendarX,
  CircleAlert,
  ReceiptText,
  ShieldCheck,
  Tag,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

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
  canEnd,
  isDeleteConfirming,
  isDeleting,
  isCanceling,
  isEnding,
  onEdit,
  onRequestDelete,
  onCancelDeleteRequest,
  onConfirmDelete,
  onCancelScheduling,
  onRequestEnd,
  onEnd,
}) {
  const isDraft = lifecycle.value === 'draft'
  const isScheduled = lifecycle.value === 'scheduled'
  const isEditable = isDraft || isScheduled
  const [isEndConfirmationOpen, setIsEndConfirmationOpen] = useState(false)
  const [endSummary, setEndSummary] = useState(null)
  const [isCheckingClaims, setIsCheckingClaims] = useState(false)
  const [endError, setEndError] = useState('')

  async function openEndConfirmation() {
    setIsEndConfirmationOpen(true)
    setIsCheckingClaims(true)
    setEndSummary(null)
    setEndError('')
    try {
      setEndSummary(await onRequestEnd())
    } catch (error) {
      console.error('Unable to check deal claims.', error)
      setEndError(
        'Unable to check existing claims. Please close and try again.',
      )
    } finally {
      setIsCheckingClaims(false)
    }
  }

  function closeEndConfirmation() {
    if (isEnding) return
    setIsEndConfirmationOpen(false)
    setEndSummary(null)
    setEndError('')
  }

  async function confirmEndDeal() {
    setEndError('')
    const ended = await onEnd()
    if (ended) {
      setIsEndConfirmationOpen(false)
      setEndSummary(null)
    } else setEndError('The deal could not be ended. Please try again.')
  }

  return (
    <>
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
              {deal.endedAt && (
                <DetailRow
                  label="Ended"
                  value={new Date(deal.endedAt).toLocaleString('en-NZ')}
                />
              )}
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
          {isDraft && !isDeleteConfirming && (
            <Button variant="danger" onClick={() => onRequestDelete(deal.id)}>
              <Trash2 aria-hidden="true" />
              Delete draft
            </Button>
          )}
          {isEditable && (
            <Button onClick={onEdit}>
              {isDraft ? 'Continue draft' : 'Edit deal'}
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
          {canEnd && (
            <Button variant="danger" onClick={openEndConfirmation}>
              End deal
            </Button>
          )}
        </div>
      </div>

      {isEndConfirmationOpen && (
        <Modal onClose={closeEndConfirmation} maxWidthClassName="max-w-lg">
          <section
            className="deal-end-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deal-end-confirmation-title"
          >
            <span className="deal-end-confirmation-icon">
              <CircleAlert aria-hidden="true" />
            </span>
            <h2 id="deal-end-confirmation-title">End this active deal?</h2>
            <p className="deal-end-confirmation-intro">
              This takes effect immediately and cannot be undone.
            </p>

            {isCheckingClaims && (
              <div className="deal-end-checking" role="status">
                Checking existing claims…
              </div>
            )}

            {endSummary && (
              <div className="deal-end-impact">
                <div>
                  <ShieldCheck aria-hidden="true" />
                  <span>
                    <strong>No new claims</strong>
                    The deal will be removed from customer discovery
                    immediately.
                  </span>
                </div>
                <div>
                  <BadgeCheck aria-hidden="true" />
                  <span>
                    <strong>
                      {endSummary.claimCount === 0
                        ? 'No existing claims'
                        : `${endSummary.claimCount} existing ${endSummary.claimCount === 1 ? 'claim' : 'claims'}`}
                    </strong>
                    {endSummary.claimCount === 0
                      ? 'No customer notifications will be sent.'
                      : 'Claims remain redeemable under the original terms. Each affected customer will be notified, and all claim and redemption records will remain available.'}
                  </span>
                </div>
              </div>
            )}

            {endError && (
              <p className="auth-error deal-end-error" role="alert">
                {endError}
              </p>
            )}

            <div className="deal-end-confirmation-actions">
              <Button
                variant="secondary"
                onClick={closeEndConfirmation}
                disabled={isEnding}
              >
                Keep deal active
              </Button>
              <Button
                variant="danger"
                onClick={confirmEndDeal}
                disabled={!endSummary || isCheckingClaims || isEnding}
              >
                {isEnding ? 'Ending deal…' : 'End deal now'}
              </Button>
            </div>
          </section>
        </Modal>
      )}
    </>
  )
}
