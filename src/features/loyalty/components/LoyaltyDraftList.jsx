import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Gift,
  LockKeyhole,
  PencilLine,
  Plus,
} from 'lucide-react'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import Button from '../../../components/ui/Button'
import BusinessPageLoader from '../../../components/ui/BusinessPageLoader'
import useBusiness from '../../../business/useBusiness'
import { recordBusinessLoyaltyActivity } from '../api/businessLoyalty'
import {
  getCustomerReward,
  getEarningRules,
  getProgrammeAvailability,
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

function formatDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

function DetailRow({ label, value }) {
  return (
    <div className="loyalty-detail-row">
      <dt>{label}</dt>
      <dd>{value || 'Not set'}</dd>
    </div>
  )
}

function RecordActivityForm({ programmeId }) {
  const { business } = useBusiness()
  const [customerLabel, setCustomerLabel] = useState('')
  const [detail, setDetail] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    if (!customerLabel.trim()) {
      setError('Enter a customer name or reference.')
      return
    }
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await recordBusinessLoyaltyActivity({
        businessId: business.id,
        programmeId,
        customerLabel,
        detail,
      })
      setCustomerLabel('')
      setDetail('')
      setSuccess('Activity recorded.')
    } catch {
      setError(
        'Unable to record this activity. The programme may no longer be accepting activity.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="loyalty-record-activity" onSubmit={handleSubmit}>
      <h4>Record customer activity</h4>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {success && <p className="loyalty-record-success">{success}</p>}
      <div className="loyalty-record-activity-grid">
        <label>
          <span>Customer</span>
          <input
            type="text"
            value={customerLabel}
            onChange={(event) => setCustomerLabel(event.target.value)}
            placeholder="Name, phone, or reference"
            disabled={isSaving}
          />
        </label>
        <label>
          <span>Note (optional)</span>
          <input
            type="text"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            placeholder="e.g. Stamp 3 of 8"
            disabled={isSaving}
          />
        </label>
      </div>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Recording…' : 'Record activity'}
      </Button>
    </form>
  )
}

function ProgrammeDetails({ id, programme, availability }) {
  return (
    <section
      className="loyalty-programme-details"
      id={id}
      aria-label={`Details for ${programme.name || 'loyalty programme'}`}
    >
      <div className={`loyalty-availability-banner is-${availability.value}`}>
        <strong>{availability.label}</strong>
        <span>{availability.description}</span>
      </div>
      <dl className="loyalty-detail-rows">
        <DetailRow
          label="Programme type"
          value={getProgrammeTypeLabel(programme.programmeType)}
        />
        <DetailRow
          label="Reward target"
          value={programme.rewardThreshold ? getRewardTarget(programme) : ''}
        />
        <DetailRow
          label="Customer reward"
          value={getCustomerReward(programme)}
        />
        <DetailRow
          label="How customers earn"
          value={getEarningRules(programme)}
        />
        <DetailRow label="Starts" value={formatDate(programme.startDate)} />
        <DetailRow
          label="Stops accepting activity"
          value={
            programme.endDate ? formatDate(programme.endDate) : 'No end date'
          }
        />
        <DetailRow
          label="Terms and conditions"
          value={programme.terms || 'No additional terms'}
        />
      </dl>
      {availability.value === 'active' && (
        <RecordActivityForm programmeId={programme.id} />
      )}
    </section>
  )
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
  const [selectedId, setSelectedId] = useState(null)

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

      {totalProgrammes === 0 ? (
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
          {programmes.map((programme) => {
            const availability = getProgrammeAvailability(programme)
            const isSelected = selectedId === programme.id
            const detailsId = `loyalty-details-${programme.id}`

            return (
              <article
                className={`loyalty-draft-card${isSelected ? ' is-expanded' : ''}`}
                key={programme.id}
              >
                <div className="loyalty-draft-card-heading">
                  <span
                    className={`loyalty-draft-status is-${availability.value}`}
                  >
                    {availability.value !== 'draft' ? (
                      <CheckCircle2 aria-hidden="true" />
                    ) : (
                      <LockKeyhole aria-hidden="true" />
                    )}
                    {availability.label}
                  </span>
                  <span>Updated {formatUpdatedAt(programme.updatedAt)}</span>
                </div>
                <div className="loyalty-draft-card-copy">
                  <small>
                    {getProgrammeTypeLabel(programme.programmeType)}
                  </small>
                  <h3>{programme.name || 'Untitled loyalty programme'}</h3>
                  <p>
                    {getCustomerReward(programme) ||
                      'Add the reward customers can work towards.'}
                  </p>
                </div>
                <dl className="loyalty-draft-summary">
                  <div>
                    <dt>Target</dt>
                    <dd>
                      {programme.rewardThreshold
                        ? getRewardTarget(programme)
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
                      {availability.value === 'active'
                        ? 'Visible to customers'
                        : availability.value === 'scheduled'
                          ? 'Visible from start date'
                          : availability.value === 'expired'
                            ? 'No longer visible'
                            : 'Private'}
                    </dd>
                  </div>
                </dl>
                <div className="loyalty-card-actions">
                  <Button
                    variant="secondary"
                    className="loyalty-card-toggle"
                    aria-expanded={isSelected}
                    aria-controls={detailsId}
                    onClick={() =>
                      setSelectedId(isSelected ? null : programme.id)
                    }
                  >
                    {isSelected ? 'Hide details' : 'View details'}
                    <ChevronDown aria-hidden="true" />
                  </Button>
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
                </div>
                {isSelected && (
                  <ProgrammeDetails
                    id={detailsId}
                    programme={programme}
                    availability={availability}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
