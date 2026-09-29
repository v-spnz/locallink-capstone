import {
  ArrowRight,
  CheckCircle2,
  Gift,
  LockKeyhole,
  MoreVertical as MoreHorizontal,
  Plus,
} from 'lucide-react'
import { useRef, useState } from 'react'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import Button from '../../../components/ui/Button'
import BusinessPageLoader from '../../../components/ui/BusinessPageLoader'
import Modal from '../../../components/ui/Modal'
import {
  getCustomerReward,
  getProgrammeAvailability,
  getProgrammeTypeLabel,
  getRewardTarget,
  LOYALTY_STATUS_FILTERS,
} from '../businessLoyaltyTemplates'

const PRIMARY_FILTER_VALUES = ['draft', 'active', 'scheduled']
const OVERFLOW_FILTER_VALUES = ['history', 'all']

function formatUpdatedAt(value) {
  if (!value) return 'Not saved yet'

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getAvailabilityLabel(programme) {
  if (!programme.startDate) return 'Not set'
  if (programme.endDate) {
    return `${formatProgrammeDate(programme.startDate)} – ${formatProgrammeDate(programme.endDate)}`
  }
  return `From ${formatProgrammeDate(programme.startDate)}`
}

function formatProgrammeDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

function getProgrammeTheme(programme) {
  const name = programme.name?.toLowerCase() || ''

  if (/flower|floral|garden|botanical|bloom|plant/.test(name)) {
    return 'loyalty-theme-emerald'
  }
  if (/coffee|cafe|café|bakery|brunch|roast/.test(name)) {
    return 'loyalty-theme-coffee'
  }
  if (
    ['spend_and_save', 'spend_and_reward'].includes(programme.programmeType)
  ) {
    return 'loyalty-theme-emerald'
  }
  if (programme.programmeType === 'purchase_card') {
    return 'loyalty-theme-coffee'
  }
  return 'loyalty-theme-blue'
}

function formatMetric(value, singular, plural) {
  return `${value} ${Number(value) === 1 ? singular : plural}`
}

export function LoyaltyDraftListSkeleton() {
  return <BusinessPageLoader label="Loading loyalty programmes…" />
}

const EMPTY_FILTER_STATES = {
  draft: {
    title: 'No draft programmes yet',
    description: 'Start a private draft whenever you are ready.',
  },
  active: {
    title: 'No active programmes',
    description:
      'Published programmes appear here while customers can use them.',
  },
  scheduled: {
    title: 'No scheduled programmes',
    description: 'Programmes with a future start date appear here.',
  },
  history: {
    title: 'No programme history',
    description: 'Expired programmes appear here after they finish.',
  },
  all: {
    title: 'No loyalty programmes yet',
    description: 'Create a programme to start building customer loyalty.',
  },
}

export default function LoyaltyDraftList({
  programmes,
  programmeCounts,
  activeStatus,
  onStatusChange,
  onCreate,
  onEdit,
  onDeleteDraft,
  onCancelSchedule,
  onGetEndSummary,
  onEndProgramme,
  busyProgrammeId,
}) {
  const totalProgrammes = programmeCounts.all
  const [copiedProgrammeId, setCopiedProgrammeId] = useState(null)
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)
  const [actionConfirmation, setActionConfirmation] = useState(null)
  const [isConfirmingAction, setIsConfirmingAction] = useState(false)
  const [actionError, setActionError] = useState('')
  const [endConfirmation, setEndConfirmation] = useState(null)
  const [endSummary, setEndSummary] = useState(null)
  const [endError, setEndError] = useState('')
  const [isCheckingEnd, setIsCheckingEnd] = useState(false)
  const actionInProgressRef = useRef(false)
  const primaryFilters = LOYALTY_STATUS_FILTERS.filter(({ value }) =>
    PRIMARY_FILTER_VALUES.includes(value),
  )
  const overflowFilters = LOYALTY_STATUS_FILTERS.filter(({ value }) =>
    OVERFLOW_FILTER_VALUES.includes(value),
  )
  const activeFilterLabel =
    LOYALTY_STATUS_FILTERS.find(({ value }) => value === activeStatus)?.label ||
    'All'
  const emptyFilterState =
    EMPTY_FILTER_STATES[activeStatus] || EMPTY_FILTER_STATES.all

  async function copyJoinCode(programme) {
    if (!programme.joinCode || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(programme.joinCode)
      setCopiedProgrammeId(programme.id)
    } catch {
      setCopiedProgrammeId(null)
    }
  }

  async function openEndConfirmation(programme) {
    setEndConfirmation(programme)
    setEndSummary(null)
    setEndError('')
    setIsCheckingEnd(true)
    try {
      setEndSummary(await onGetEndSummary(programme.id))
    } catch {
      setEndError('Unable to check affected customers. Please try again.')
    } finally {
      setIsCheckingEnd(false)
    }
  }

  async function confirmEndProgramme() {
    const ended = await onEndProgramme(endConfirmation.id)
    if (ended) {
      setEndConfirmation(null)
      setEndSummary(null)
    }
  }

  function openActionConfirmation(kind, programme) {
    setActionConfirmation({ kind, programme })
    setActionError('')
  }

  function closeActionConfirmation() {
    if (actionInProgressRef.current) return
    setActionConfirmation(null)
    setActionError('')
  }

  async function confirmLifecycleAction() {
    if (!actionConfirmation || actionInProgressRef.current) return
    actionInProgressRef.current = true
    setIsConfirmingAction(true)
    setActionError('')
    const { kind, programme } = actionConfirmation
    const completed =
      kind === 'delete'
        ? await onDeleteDraft(programme.id)
        : await onCancelSchedule(programme.id)
    if (completed) setActionConfirmation(null)
    else
      setActionError(
        kind === 'delete'
          ? 'The draft could not be deleted. Please try again.'
          : 'The scheduled publication could not be cancelled. Please try again.',
      )
    actionInProgressRef.current = false
    setIsConfirmingAction(false)
  }

  return (
    <section className="loyalty-draft-list" aria-label="Loyalty programmes">
      <div className="deal-filter-bar loyalty-list-toolbar">
        <div
          className="deal-filters loyalty-programme-filters"
          role="group"
          aria-label="Filter loyalty programmes"
        >
          {primaryFilters.map(({ value, label }) => (
            <button
              aria-controls="loyalty-programme-panel"
              aria-pressed={activeStatus === value}
              className={activeStatus === value ? 'is-active' : ''}
              key={value}
              onClick={() => onStatusChange(value)}
              type="button"
            >
              <span>{label}</span>
              <strong>{programmeCounts[value]}</strong>
            </button>
          ))}
          <span className="deal-filters-divider" aria-hidden="true" />
          <button
            type="button"
            className={`deal-filters-overflow-trigger${
              isOverflowOpen ? ' is-open' : ''
            }${
              overflowFilters.some(({ value }) => value === activeStatus)
                ? ' is-active'
                : ''
            }`}
            aria-expanded={isOverflowOpen}
            aria-label={
              isOverflowOpen ? 'Show fewer filters' : 'Show more filters'
            }
            onClick={() => setIsOverflowOpen((current) => !current)}
          >
            <MoreHorizontal aria-hidden="true" />
          </button>
          {isOverflowOpen &&
            overflowFilters.map(({ value, label }) => (
              <button
                type="button"
                aria-controls="loyalty-programme-panel"
                aria-pressed={activeStatus === value}
                className={activeStatus === value ? 'is-active' : ''}
                key={value}
                onClick={() => onStatusChange(value)}
              >
                <span>{label}</span>
                <strong>{programmeCounts[value]}</strong>
              </button>
            ))}
        </div>
        <div className="deal-filter-actions loyalty-list-actions">
          {totalProgrammes > 0 && (
            <Button onClick={onCreate}>
              <Plus aria-hidden="true" />
              New programme
            </Button>
          )}
        </div>
      </div>

      {totalProgrammes === 0 ? (
        <div
          aria-label={`${activeFilterLabel} loyalty programmes`}
          className="loyalty-draft-empty"
          id="loyalty-programme-panel"
          role="region"
        >
          <figure>
            <img
              src={localBusinessNeighbourhood}
              alt="A local cafe and neighbourhood shops"
            />
          </figure>
          <div>
            <span className="loyalty-empty-icon" aria-hidden="true">
              <Gift />
            </span>
            <h3>Prepare your first loyalty programme</h3>
            <p>
              Save an idea as a private draft, then return when you are ready to
              finish the details.
            </p>
            <Button onClick={onCreate}>
              Start a draft
              <ArrowRight aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : programmes.length === 0 ? (
        <div
          aria-label={`${activeFilterLabel} loyalty programmes`}
          className="loyalty-status-empty"
          id="loyalty-programme-panel"
          role="region"
        >
          {activeStatus === 'draft' ? (
            <LockKeyhole aria-hidden="true" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          <h3>{emptyFilterState.title}</h3>
          <p>{emptyFilterState.description}</p>
        </div>
      ) : (
        <div
          aria-label={`${activeFilterLabel} loyalty programmes`}
          className="deal-campaign-table loyalty-programme-table"
          id="loyalty-programme-panel"
          role="region"
        >
          <div className="deal-table-heading" aria-hidden="true">
            <span />
            <span>Programme</span>
            <span>Reward target</span>
            <span>Status and dates</span>
            <span />
          </div>
          <div className="deal-card-list">
            {programmes.map((programme) => {
              const availability = getProgrammeAvailability(programme)
              const isDraft = programme.status === 'draft'
              const isScheduled = availability.value === 'scheduled'
              const isActive = availability.value === 'active'
              const customerReward = getCustomerReward(programme)
              const programmeTitle =
                programme.name || 'Untitled loyalty programme'
              const hasCustomerMetrics =
                programme.customerCount != null ||
                programme.rewardsRedeemed != null

              return (
                <article
                  className={`deal-management-card loyalty-programme-row ${getProgrammeTheme(programme)}`}
                  key={programme.id}
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
                        <small>
                          {getProgrammeTypeLabel(programme.programmeType)}
                        </small>
                        <h3 id={`loyalty-programme-title-${programme.id}`}>
                          {programmeTitle}
                        </h3>
                        <p>
                          {customerReward ||
                            'Add the reward customers can work towards.'}
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
                              {copiedProgrammeId === programme.id
                                ? 'Copied'
                                : 'Copy code'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="loyalty-programme-code is-draft">
                          <span>
                            <strong>Customer join code</strong>
                            <small>
                              Available after this programme is published.
                            </small>
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
                          onClick={() =>
                            openActionConfirmation('delete', programme)
                          }
                        >
                          Delete draft
                        </button>
                      )}
                      {isScheduled && (
                        <button
                          type="button"
                          className="loyalty-programme-action is-danger"
                          onClick={() =>
                            openActionConfirmation('cancel', programme)
                          }
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
            })}
          </div>
        </div>
      )}
      {actionConfirmation && (
        <Modal maxWidthClassName="max-w-lg" onClose={closeActionConfirmation}>
          <section
            className="deal-publish-confirmation loyalty-action-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loyalty-action-confirmation-title"
          >
            <h2 id="loyalty-action-confirmation-title">
              {actionConfirmation.kind === 'delete'
                ? 'Delete this draft?'
                : 'Cancel this scheduled programme?'}
            </h2>
            <p>
              {actionConfirmation.kind === 'delete'
                ? `This permanently removes “${actionConfirmation.programme.name || 'Untitled loyalty programme'}”. It was never published, so customers will not be notified.`
                : `“${actionConfirmation.programme.name || 'Untitled loyalty programme'}” will return to Draft and will not go live automatically. You can edit and publish it again later.`}
            </p>
            {actionError && (
              <p
                className="auth-error loyalty-action-confirmation-error"
                role="alert"
              >
                {actionError}
              </p>
            )}
            <div className="deal-publish-confirmation-actions">
              <Button
                variant="secondary"
                className="loyalty-confirm-danger"
                disabled={isConfirmingAction}
                onClick={confirmLifecycleAction}
              >
                {isConfirmingAction
                  ? actionConfirmation.kind === 'delete'
                    ? 'Deleting…'
                    : 'Cancelling…'
                  : actionConfirmation.kind === 'delete'
                    ? 'Delete draft'
                    : 'Confirm cancellation'}
              </Button>
              <Button
                disabled={isConfirmingAction}
                onClick={closeActionConfirmation}
              >
                {actionConfirmation.kind === 'delete'
                  ? 'Keep draft'
                  : 'Keep scheduled'}
              </Button>
            </div>
          </section>
        </Modal>
      )}
      {endConfirmation && (
        <Modal
          maxWidthClassName="max-w-lg"
          onClose={() => {
            if (busyProgrammeId !== endConfirmation.id) setEndConfirmation(null)
          }}
        >
          <section
            className="loyalty-end-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="loyalty-end-title"
          >
            <h2 id="loyalty-end-title">End this programme early?</h2>
            <p>This takes effect immediately and cannot be undone.</p>
            {isCheckingEnd && (
              <p role="status">Checking affected customersâ€¦</p>
            )}
            {endSummary && (
              <div className="loyalty-end-impact">
                <strong>No new customers will be able to join.</strong>
                <p>
                  {endSummary.customerCount === 0
                    ? 'There are no existing customers to notify.'
                    : `${endSummary.customerCount} existing ${endSummary.customerCount === 1 ? 'customer has' : 'customers have'} until ${formatProgrammeDate(endSummary.completionDeadline)} to complete or redeem this loyalty programme. Each affected customer will be notified.`}
                </p>
                <small>
                  The deadline is the earlier of 15 business days from today or
                  the programme's original expiry date.
                </small>
              </div>
            )}
            {endError && <p className="auth-error">{endError}</p>}
            <div className="loyalty-end-actions">
              <Button
                variant="secondary"
                className="loyalty-confirm-danger"
                disabled={!endSummary || busyProgrammeId === endConfirmation.id}
                onClick={confirmEndProgramme}
              >
                {busyProgrammeId === endConfirmation.id
                  ? 'Endingâ€¦'
                  : 'End programme now'}
              </Button>
              <Button
                disabled={busyProgrammeId === endConfirmation.id}
                onClick={() => setEndConfirmation(null)}
              >
                Keep programme active
              </Button>
            </div>
          </section>
        </Modal>
      )}
    </section>
  )
}
