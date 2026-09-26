import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Copy,
  Gift,
  LockKeyhole,
  Plus,
} from 'lucide-react'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import Button from '../../../components/ui/Button'
import BusinessPageLoader from '../../../components/ui/BusinessPageLoader'
import {
  getCustomerReward,
  getProgrammeTypeLabel,
  getRewardTarget,
} from '../businessLoyaltyTemplates'

function formatUpdatedAt(value) {
  if (!value) return 'Not saved yet'

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getStatusLabel(status) {
  if (status === 'scheduled') return 'Scheduled'
  if (status === 'active') return 'Active'
  if (status === 'expired') return 'Expired'
  return 'Draft'
}

function getAvailabilityLabel(programme) {
  if (!programme.startDate) return 'Not set'
  if (programme.endDate) {
    return `${programme.startDate} to ${programme.endDate}`
  }
  return `From ${programme.startDate}`
}

export function LoyaltyDraftListSkeleton() {
  return <BusinessPageLoader label="Loading loyalty programmes…" />
}

const STATUS_TABS = [
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
]

export default function LoyaltyDraftList({
  programmes,
  programmeCounts,
  activeStatus,
  onStatusChange,
  onCreate,
  onEdit,
}) {
  const totalProgrammes = programmeCounts.draft + programmeCounts.published

  function handleTabKeyDown(event, currentIndex) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return

    event.preventDefault()
    let nextIndex = currentIndex
    if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + STATUS_TABS.length) % STATUS_TABS.length
    } else if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % STATUS_TABS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = STATUS_TABS.length - 1
    }

    onStatusChange(STATUS_TABS[nextIndex].key)
    const tabButtons =
      event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')
    tabButtons?.[nextIndex]?.focus()
  }

  return (
    <section className="loyalty-draft-list" aria-label="Loyalty programmes">
      <div className="loyalty-list-toolbar">
        <div
          className="deal-filters loyalty-programme-filters"
          role="tablist"
          aria-label="Programme status"
        >
          {STATUS_TABS.map((tab, index) => (
            <button
              aria-controls="loyalty-programme-panel"
              aria-selected={activeStatus === tab.key}
              className={activeStatus === tab.key ? 'is-active' : ''}
              id={`loyalty-${tab.key}-tab`}
              key={tab.key}
              onClick={() => onStatusChange(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              role="tab"
              tabIndex={activeStatus === tab.key ? 0 : -1}
              type="button"
            >
              <span>{tab.label}</span>
              <strong>{programmeCounts[tab.key]}</strong>
            </button>
          ))}
        </div>
        <div className="loyalty-list-actions">
          {totalProgrammes > 0 && (
            <Button onClick={onCreate}>
              <Plus aria-hidden="true" />
              New programme
            </Button>
          )}
        </div>
      </div>

      {totalProgrammes === 0 && activeStatus === 'draft' ? (
        <div
          aria-labelledby={`loyalty-${activeStatus}-tab`}
          className="loyalty-draft-empty"
          id="loyalty-programme-panel"
          role="tabpanel"
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
          aria-labelledby={`loyalty-${activeStatus}-tab`}
          className="loyalty-status-empty"
          id="loyalty-programme-panel"
          role="tabpanel"
        >
          {activeStatus === 'published' ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <LockKeyhole aria-hidden="true" />
          )}
          <h3>No {activeStatus} programmes yet</h3>
          <p>
            {activeStatus === 'published'
              ? 'Completed programmes will appear here after you review and publish them.'
              : 'Start a private draft whenever you are ready.'}
          </p>
        </div>
      ) : (
        <div
          aria-labelledby={`loyalty-${activeStatus}-tab`}
          className="deal-campaign-table loyalty-programme-table"
          id="loyalty-programme-panel"
          role="tabpanel"
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
              const isDraft = programme.status === 'draft'
              const Row = isDraft ? 'button' : 'div'

              return (
                <article
                  className="deal-management-card loyalty-programme-row"
                  key={programme.id}
                >
                  <Row
                    className="deal-list-row"
                    {...(isDraft
                      ? {
                          type: 'button',
                          onClick: () => onEdit(programme.id),
                          'aria-label': `Continue editing ${programme.name || 'untitled loyalty programme'}`,
                        }
                      : {})}
                  >
                    <span className="deal-card-media" aria-hidden="true">
                      <Gift />
                    </span>

                    <span className="deal-card-copy">
                      <small>
                        {getProgrammeTypeLabel(programme.programmeType)}
                      </small>
                      <strong className="deal-card-title">
                        {programme.name || 'Untitled loyalty programme'}
                      </strong>
                      <span className="deal-card-description">
                        {getCustomerReward(programme) ||
                          'Add the reward customers can work towards.'}
                      </span>
                    </span>

                    <span className="deal-card-offer">
                      <small>Target</small>
                      <strong>
                        {programme.rewardThreshold
                          ? getRewardTarget(programme)
                          : 'Not set'}
                      </strong>
                    </span>

                    <span className="deal-card-timing">
                      <span className={`deal-status is-${programme.status}`}>
                        {getStatusLabel(programme.status)}
                      </span>
                      <span className="deal-card-expiry">
                        <CalendarDays aria-hidden="true" />
                        {getAvailabilityLabel(programme)}
                      </span>
                      <small>
                        Updated {formatUpdatedAt(programme.updatedAt)}
                      </small>
                      {!isDraft && programme.joinCode && (
                        <button
                          type="button"
                          className="loyalty-join-code"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            navigator.clipboard?.writeText(programme.joinCode)
                          }}
                          title="Copy join code — give this to customers so they can join"
                        >
                          <Copy aria-hidden="true" />
                          {programme.joinCode}
                        </button>
                      )}
                    </span>

                    <span className="deal-card-disclosure" aria-hidden="true">
                      <span>{isDraft ? 'Edit' : 'Published'}</span>
                      {isDraft ? <ChevronRight /> : <CheckCircle2 />}
                    </span>
                  </Row>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
