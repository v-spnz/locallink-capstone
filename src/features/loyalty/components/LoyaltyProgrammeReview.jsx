import { CalendarDays, CheckCircle2, Eye, Gift } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import {
  getCustomerReward,
  getEarningRules,
  getProgrammeTypeLabel,
  getRewardTarget,
} from '../businessLoyaltyTemplates'

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function getAvailability(programme) {
  const start = formatDate(programme.startDate)
  const end = formatDate(programme.endDate)
  return end ? `${start} to ${end}` : `${start} onward`
}

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <div className="review-row-label">{label}</div>
      <div>{value || 'Not provided'}</div>
    </div>
  )
}

export default function LoyaltyProgrammeReview({
  programme,
  isSaving,
  requestError,
  onBack,
  onConfirm,
}) {
  const [isConfirming, setIsConfirming] = useState(false)

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
    <section
      className="placeholder-section deal-review"
      aria-labelledby="loyalty-review-title"
    >
      <div className="deal-review-heading">
        <div>
          <span className="deal-review-status">
            <CheckCircle2 aria-hidden="true" />
            Ready for review
          </span>
          <h2 id="loyalty-review-title">Review before publishing</h2>
          <p className="review-introduction">
            Check how customers earn and use this reward. Publishing makes the
            programme visible to customers.
          </p>
        </div>
        <span className="deal-review-offer loyalty-review-programme-type">
          <small>Programme type</small>
          <strong>{getProgrammeTypeLabel(programme.programmeType)}</strong>
        </span>
      </div>

      {requestError && (
        <div className="auth-error loyalty-request-error" role="alert">
          {requestError}
        </div>
      )}

      <section
        className="deal-review-section"
        aria-labelledby="loyalty-review-programme-heading"
      >
        <div className="deal-review-section-heading">
          <Gift aria-hidden="true" />
          <div>
            <h3 id="loyalty-review-programme-heading">
              Customer-facing programme
            </h3>
            <p>The information customers use to understand the reward.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow label="Programme name" value={programme.name} />
          <ReviewRow
            label="Programme type"
            value={getProgrammeTypeLabel(programme.programmeType)}
          />
          <ReviewRow label="Reward target" value={getRewardTarget(programme)} />
          <ReviewRow
            label="Customer reward"
            value={getCustomerReward(programme)}
          />
        </div>
      </section>

      <section
        className="deal-review-section"
        aria-labelledby="loyalty-review-rules-heading"
      >
        <div className="deal-review-section-heading">
          <Eye aria-hidden="true" />
          <div>
            <h3 id="loyalty-review-rules-heading">Earning and use</h3>
            <p>The rules customers should know before taking part.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow
            label="How customers earn"
            value={getEarningRules(programme)}
          />
          <ReviewRow
            label="Terms and conditions"
            value={programme.terms || 'No additional terms'}
          />
        </div>
      </section>

      <section
        className="deal-review-section"
        aria-labelledby="loyalty-review-availability-heading"
      >
        <div className="deal-review-section-heading">
          <CalendarDays aria-hidden="true" />
          <div>
            <h3 id="loyalty-review-availability-heading">Availability</h3>
            <p>When customers can earn and use the reward.</p>
          </div>
        </div>
        <div className="deal-review-rows">
          <ReviewRow
            label="Programme period"
            value={getAvailability(programme)}
          />
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
            aria-labelledby="loyalty-publish-confirmation-title"
          >
            <span className="deal-publish-confirmation-icon">
              <CheckCircle2 aria-hidden="true" />
            </span>
            <h2 id="loyalty-publish-confirmation-title">
              Publish this loyalty programme?
            </h2>
            <p>
              Customers will be able to join and show their loyalty QR when the
              start date is reached. You can continue editing if anything needs
              changing.
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
                {isSaving ? 'Publishing…' : 'Publish programme'}
              </Button>
            </div>
          </section>
        </Modal>
      )}
    </section>
  )
}
