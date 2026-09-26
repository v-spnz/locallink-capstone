import { CalendarDays, CheckCircle2, Eye, Gift, Stamp } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { getProgrammeAvailability } from '../businessLoyaltyTemplates'
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
    <div className="loyalty-review-row">
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
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
  const availability = getProgrammeAvailability({
    ...programme,
    status: 'published',
  })
  const [isConfirming, setIsConfirming] = useState(false)

  function handleDeclinePublication() {
    if (isSaving) return
    setIsConfirming(false)
  }

  async function handleConfirmPublication() {
    const published = await onConfirm()
    if (!published) setIsConfirming(false)
  }

  return (
    <section
      className="placeholder-section deal-review loyalty-review"
      aria-labelledby="loyalty-review-title"
    >
      <div className="loyalty-review-heading">
        <div>
          <span className="loyalty-review-status">
            <CheckCircle2 aria-hidden="true" />
            Ready for review
          </span>
          <h2 id="loyalty-review-title">Review before publishing</h2>
          <p>
            Check how customers earn and use this reward. Publishing makes the
            programme visible to customers.
          </p>
        </div>
        <span className="loyalty-review-type">
          <Stamp aria-hidden="true" />
          {getProgrammeTypeLabel(programme.programmeType)}
        </span>
      </div>

      {requestError && (
        <div className="auth-error loyalty-request-error" role="alert">
          {requestError}
        </div>
      )}

      <div className="loyalty-review-layout">
        <div className="loyalty-review-details">
          <section aria-labelledby="loyalty-review-programme-heading">
            <div className="loyalty-review-section-heading">
              <Gift aria-hidden="true" />
              <div>
                <h3 id="loyalty-review-programme-heading">
                  Customer-facing programme
                </h3>
                <p>The information customers use to understand the reward.</p>
              </div>
            </div>
            <dl className="loyalty-review-rows">
              <ReviewRow label="Programme name" value={programme.name} />
              <ReviewRow
                label="Programme type"
                value={getProgrammeTypeLabel(programme.programmeType)}
              />
              <ReviewRow
                label="Reward target"
                value={getRewardTarget(programme)}
              />
              <ReviewRow
                label="Customer reward"
                value={getCustomerReward(programme)}
              />
            </dl>
          </section>

          <section aria-labelledby="loyalty-review-rules-heading">
            <div className="loyalty-review-section-heading">
              <Eye aria-hidden="true" />
              <div>
                <h3 id="loyalty-review-rules-heading">Earning and use</h3>
                <p>The rules customers should know before taking part.</p>
              </div>
            </div>
            <dl className="loyalty-review-rows">
              <ReviewRow
                label="How customers earn"
                value={getEarningRules(programme)}
              />
              <ReviewRow
                label="Terms and conditions"
                value={programme.terms || 'No additional terms'}
              />
              <ReviewRow
                label="Redemption method"
                value={LOYALTY_REDEMPTION_METHOD}
              />
            </dl>
          </section>

          <section aria-labelledby="loyalty-review-availability-heading">
            <div className="loyalty-review-section-heading">
              <CalendarDays aria-hidden="true" />
              <div>
                <h3 id="loyalty-review-availability-heading">Availability</h3>
                <p>When customers can earn and use the reward.</p>
              </div>
            </div>
            <dl className="loyalty-review-rows">
              <ReviewRow
                label="Programme period"
                value={getAvailability(programme)}
              />
              <ReviewRow
                label="Once published"
                value={`${availability.label} - ${availability.description}`}
              />
            </dl>
          </section>
        </div>
        
        <aside className="loyalty-publish-note">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>Once published: {availability.label}</strong>
            <p>{availability.description}</p>
          </div>
        </aside>
      </div>

      <div className="loyalty-review-actions">
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
              Customers will be able to join and earn rewards once the
              programme is live. You can continue editing if anything needs
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
