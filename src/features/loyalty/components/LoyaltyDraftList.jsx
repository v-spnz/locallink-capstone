import {
  ArrowRight,
  CheckCircle2,
  Gift,
  LockKeyhole,
  PencilLine,
  Plus,
} from 'lucide-react'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import Button from '../../../components/ui/Button'

function formatUpdatedAt(value) {
  if (!value) return 'Not saved yet'

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getProgrammeTypeLabel(type) {
  if (type === 'stamp') return 'Stamp programme'
  if (type === 'points') return 'Points programme'
  return 'Programme type not set'
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
  return (
    <section
      className="loyalty-draft-list loyalty-draft-list-skeleton"
      role="status"
      aria-label="Loading loyalty programme drafts"
    >
      <div className="loyalty-list-toolbar" aria-hidden="true">
        <span className="loyalty-skeleton-line is-heading" />
        <span className="loyalty-skeleton-button" />
      </div>
      <div className="loyalty-draft-grid" aria-hidden="true">
        {[0, 1].map((item) => (
          <span className="loyalty-skeleton-card" key={item}>
            <span className="loyalty-skeleton-line is-label" />
            <span className="loyalty-skeleton-line is-title" />
            <span className="loyalty-skeleton-line is-copy" />
          </span>
        ))}
      </div>
      <span className="sr-only">Loading loyalty programme drafts</span>
    </section>
  )
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
    <section
      className="loyalty-draft-list"
      aria-labelledby="loyalty-list-title"
    >
      <div className="loyalty-list-toolbar">
        <div>
          <h2 id="loyalty-list-title">Your loyalty programmes</h2>
          <p>Prepare private drafts and publish when they are ready.</p>
        </div>
        {totalProgrammes > 0 && (
          <Button onClick={onCreate}>
            <Plus aria-hidden="true" />
            New programme
          </Button>
        )}
      </div>

      <div
        className="loyalty-status-tabs"
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
            {tab.label}
            <span>{programmeCounts[tab.key]}</span>
          </button>
        ))}
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
          className="loyalty-draft-grid"
          id="loyalty-programme-panel"
          role="tabpanel"
        >
          {programmes.map((programme) => (
            <article className="loyalty-draft-card" key={programme.id}>
              <div className="loyalty-draft-card-heading">
                <span className={`loyalty-draft-status is-${programme.status}`}>
                  {programme.status !== 'draft' ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <LockKeyhole aria-hidden="true" />
                  )}
                  {getStatusLabel(programme.status)}
                </span>
                <span>Updated {formatUpdatedAt(programme.updatedAt)}</span>
              </div>
              <div className="loyalty-draft-card-copy">
                <small>{getProgrammeTypeLabel(programme.programmeType)}</small>
                <h3>{programme.name || 'Untitled loyalty programme'}</h3>
                <p>
                  {programme.rewardDescription ||
                    'Add the reward customers can work towards.'}
                </p>
              </div>
              <dl className="loyalty-draft-summary">
                <div>
                  <dt>Target</dt>
                  <dd>
                    {programme.rewardThreshold
                      ? `${programme.rewardThreshold} ${programme.programmeType === 'points' ? 'points' : 'stamps'}`
                      : 'Not set'}
                  </dd>
                </div>
                <div>
                  <dt>Availability</dt>
                  <dd>{getAvailabilityLabel(programme)}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>
                    {programme.status === 'active'
                      ? 'Visible to customers'
                      : programme.status === 'scheduled'
                        ? 'Visible from start date'
                        : programme.status === 'expired'
                          ? 'No longer visible'
                          : 'Private'}
                  </dd>
                </div>
              </dl>
              {programme.status === 'draft' && (
                <Button
                  variant="secondary"
                  className="loyalty-edit-draft"
                  onClick={() => onEdit(programme.id)}
                >
                  <PencilLine aria-hidden="true" />
                  Continue editing
                </Button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
