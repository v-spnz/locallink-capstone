import {
  getCustomerReward,
  getProgrammeAvailability,
  getProgrammeTypeLabel,
  getRewardTarget,
} from '../businessLoyaltyTemplates'
import {
  formatUpdatedAt,
  getAvailabilityLabel,
  getProgrammeTheme,
  formatMetric,
} from './loyaltyListPresentation'

export default function LoyaltyProgrammeRow({
  programme,
  copiedProgrammeId,
  copyJoinCode,
  openActionConfirmation,
  onEdit,
  openEndConfirmation,
}) {
  const availability = getProgrammeAvailability(programme)
  const isDraft = programme.status === 'draft'
  const isScheduled = availability.value === 'scheduled'
  const isActive = availability.value === 'active'
  const customerReward = getCustomerReward(programme)
  const programmeTitle = programme.name || 'Untitled loyalty programme'
  const hasCustomerMetrics =
    programme.customerCount != null || programme.rewardsRedeemed != null

  return (
    <article
      className={`deal-management-card loyalty-programme-row ${getProgrammeTheme(programme)}`}
    >
      <div className="deal-list-row">
        <section
          className={`loyalty-programme-visual${programme.imageUrl ? ' has-background-image' : ''}`}
          aria-labelledby={`loyalty-programme-title-${programme.id}`}
        >
          {programme.imageUrl && (
            <img
              className="loyalty-programme-background"
              src={programme.imageUrl}
              alt=""
            />
          )}
          <div className="loyalty-programme-visual-heading">
            <span
              className={`loyalty-programme-status is-${availability.value}`}
            >
              <span aria-hidden="true" />
              {availability.label}
            </span>
          </div>
          <div className="loyalty-programme-identity">
            <small>{getProgrammeTypeLabel(programme.programmeType)}</small>
            <h3 id={`loyalty-programme-title-${programme.id}`}>
              {programmeTitle}
            </h3>
            <p>
              {customerReward || 'Add the reward customers can work towards.'}
            </p>
          </div>
        </section>

        <section
          className="loyalty-programme-info"
          aria-label={`${programmeTitle} programme details`}
        >
          <dl className="loyalty-programme-specs">
            <div>
              <dt>Target</dt>
              <dd>
                {programme.rewardThreshold
                  ? getRewardTarget(programme)
                  : 'Not set'}
              </dd>
            </div>
            <div>
              <dt>Reward</dt>
              <dd>{customerReward || 'Not set'}</dd>
            </div>
            <div className="loyalty-programme-period">
              <dt>Programme period</dt>
              <dd>{getAvailabilityLabel(programme)}</dd>
            </div>
          </dl>

          {!isDraft && programme.joinCode ? (
            <div className="loyalty-programme-code">
              <span className="loyalty-programme-code-copy">
                <small>Customer join code</small>
                <code>{programme.joinCode}</code>
              </span>
              <button
                type="button"
                className="loyalty-join-code"
                onClick={() => copyJoinCode(programme)}
                aria-label={`Copy customer join code ${programme.joinCode}`}
              >
                <span aria-live="polite">
                  {copiedProgrammeId === programme.id ? 'Copied' : 'Copy code'}
                </span>
              </button>
            </div>
          ) : (
            <div className="loyalty-programme-code is-draft">
              <span>
                <strong>Customer join code</strong>
                <small>Available after this programme is published.</small>
              </span>
            </div>
          )}
        </section>
      </div>

      <footer className="loyalty-programme-footer">
        <div className="loyalty-programme-footer-meta">
          {hasCustomerMetrics && (
            <span className="loyalty-programme-metrics">
              {programme.customerCount != null && (
                <span>
                  {formatMetric(
                    programme.customerCount,
                    'customer',
                    'customers',
                  )}
                </span>
              )}
              {programme.rewardsRedeemed != null && (
                <span>
                  {formatMetric(
                    programme.rewardsRedeemed,
                    'reward redeemed',
                    'rewards redeemed',
                  )}
                </span>
              )}
            </span>
          )}
          <span className="loyalty-programme-updated">
            Updated {formatUpdatedAt(programme.updatedAt)}
          </span>
        </div>
        <div className="loyalty-programme-actions">
          {isDraft && (
            <button
              type="button"
              className="loyalty-programme-action is-danger"
              onClick={() => openActionConfirmation('delete', programme)}
            >
              Delete draft
            </button>
          )}
          {isScheduled && (
            <button
              type="button"
              className="loyalty-programme-action is-danger"
              onClick={() => openActionConfirmation('cancel', programme)}
            >
              Cancel schedule
            </button>
          )}
          {(isDraft || isScheduled) && (
            <button
              type="button"
              className="loyalty-programme-action"
              onClick={() => onEdit(programme.id)}
            >
              {isDraft ? 'Continue draft' : 'Edit programme'}
            </button>
          )}
          {isActive && (
            <button
              type="button"
              className="loyalty-programme-action is-danger"
              onClick={() => openEndConfirmation(programme)}
            >
              End programme
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}
