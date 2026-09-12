import { CalendarDays, CheckCircle2, Eye, Gift, Stamp } from 'lucide-react'
import Button from '../../../components/ui/Button'

function getProgrammeTypeLabel(type) {
  if (type === 'stamp') return 'Stamp programme'
  if (type === 'points') return 'Points programme'
  return 'Not set'
}

function getRewardTarget(programme) {
  const unit = programme.programmeType === 'points' ? 'points' : 'stamps'
  return `${programme.rewardThreshold} ${unit}`
}

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
  return (
    <section className="loyalty-review" aria-labelledby="loyalty-review-title">
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
                value={programme.rewardDescription}
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
                value={programme.earningRules}
              />
              <ReviewRow
                label="Terms and conditions"
                value={programme.terms || 'No additional terms'}
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
            </dl>
          </section>
        </div>

        <aside className="loyalty-publish-note">
          <CheckCircle2 aria-hidden="true" />
          <div>
            <strong>Ready to publish?</strong>
            <p>
              The programme will move from Draft to Published and become visible
              to customers.
            </p>
          </div>
        </aside>
      </div>

      <div className="loyalty-review-actions">
        <Button variant="secondary" onClick={onBack} disabled={isSaving}>
          Back to edit
        </Button>
        <Button onClick={onConfirm} disabled={isSaving}>
          {isSaving ? 'Publishing...' : 'Confirm and publish'}
        </Button>
      </div>
    </section>
  )
}
