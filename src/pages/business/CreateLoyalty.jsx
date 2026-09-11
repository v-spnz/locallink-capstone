import { useState } from 'react'
import {
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
} from 'lucide-react'
import './CreateLoyalty.css'

const PROGRAMME_TYPES = [
  { value: 'stamp', label: 'Stamp card' },
  { value: 'points', label: 'Points' },
]

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const [, m, d] = dateStr.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

const emptyForm = {
  name: '',
  type: 'stamp',
  earningRule: '',
  rewardDescription: '',
  targetValue: '',
  startDate: '',
  endDate: '',
  outlets: 'all',
  exclusions: '',
  terms: '',
}

const requiredFieldsFor = (form) => [
  { key: 'name', label: 'Programme name' },
  { key: 'earningRule', label: 'Earning condition' },
  {
    key: 'targetValue',
    label: form.type === 'stamp' ? 'Stamps required' : 'Points required',
  },
  { key: 'rewardDescription', label: 'Reward' },
  { key: 'startDate', label: 'Start date' },
]

const STATUS_TABS = [
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
]

export default function CreateLoyalty() {
  const [programmes, setProgrammes] = useState([])
  const [view, setView] = useState('list') // 'list' | 'edit' | 'review'
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [attemptedPublish, setAttemptedPublish] = useState(false)
  const [activeTab, setActiveTab] = useState('draft')
  const [expandedId, setExpandedId] = useState(null)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const requiredFields = requiredFieldsFor(form)
  const missingFields = requiredFields.filter(
    (f) => !form[f.key] || !form[f.key].toString().trim(),
  )
  const isComplete = missingFields.length === 0
  const isMissing = (key) =>
    attemptedPublish && missingFields.some((f) => f.key === key)

  const openNewProgramme = () => {
    setForm(emptyForm)
    setEditingId(null)
    setAttemptedPublish(false)
    setView('edit')
  }

  const openEditProgramme = (programme) => {
    const { id, ...rest } = programme
    setForm(rest)
    setEditingId(id)
    setAttemptedPublish(false)
    setView('edit')
  }

  const backToList = () => setView('list')

  const upsertProgramme = (status) => {
    setProgrammes((prev) => {
      if (editingId) {
        return prev.map((p) =>
          p.id === editingId ? { ...p, ...form, status } : p,
        )
      }
      const newProgramme = { id: `p${Date.now()}`, ...form, status }
      return [newProgramme, ...prev]
    })
  }

  const handleSaveDraft = () => {
    upsertProgramme('draft')
    setActiveTab('draft')
    setView('list')
  }

  const handleReviewClick = () => {
    setAttemptedPublish(true)
    if (!isComplete) return
    setView('review')
  }

  const confirmPublish = () => {
    upsertProgramme('published')
    setActiveTab('published')
    setView('list')
  }

  const cancelReview = () => setView('edit')

  const visibleProgrammes = programmes.filter((p) => p.status === activeTab)
  const countFor = (status) =>
    programmes.filter((p) => p.status === status).length

  const typeLabel = (type) =>
    PROGRAMME_TYPES.find((t) => t.value === type)?.label

  return (
    <div className="business-loyalty-page">
      <header className="page-header loyalty-page-header">
        <h1>Loyalty programmes</h1>
      </header>

      {view === 'list' && (
        <div className="loyalty-list-card">
          <div className="loyalty-list-header">
            <div className="loyalty-tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`loyalty-tab ${activeTab === tab.key ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label} <strong>{countFor(tab.key)}</strong>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-primary loyalty-new-btn"
              onClick={openNewProgramme}
            >
              <Plus size={16} /> New programme
            </button>
          </div>

          {visibleProgrammes.length === 0 && (
            <p className="loyalty-empty-state">
              No {activeTab} programmes yet.
            </p>
          )}

          {visibleProgrammes.map((p) => (
            <div className="loyalty-list-row" key={p.id}>
              <div className="loyalty-list-row-main">
                <span className="loyalty-list-type">{typeLabel(p.type)}</span>
                <p className="loyalty-list-name">
                  {p.name || 'Untitled programme'}
                </p>
                <p className="loyalty-list-sub">
                  {p.earningRule || 'No earning condition set'}
                </p>
              </div>

              <div className="loyalty-list-offer">
                <span>Reward</span>
                <strong>{p.rewardDescription || '—'}</strong>
              </div>

              <div className="loyalty-list-meta">
                <span className={`loyalty-status is-${p.status}`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>

                <div className="loyalty-list-date-main">
                  <Calendar size={13} />
                  {p.endDate
                    ? `Ends ${formatDate(p.endDate)}`
                    : p.startDate
                      ? `From ${formatDate(p.startDate)}`
                      : 'No date set'}
                </div>

                {p.startDate && (
                  <small className="loyalty-list-date-range">
                    {formatDateShort(p.startDate)}
                    {p.endDate
                      ? ` to ${formatDateShort(p.endDate)}`
                      : ' onward'}
                  </small>
                )}

                <small className="loyalty-list-outlets">
                  <MapPin size={13} />
                  {p.outlets === 'all' ? 'All outlets' : 'Selected outlets'}
                </small>
              </div>

              <div className="loyalty-list-actions">
                <button
                  type="button"
                  className="loyalty-details-toggle"
                  onClick={() =>
                    setExpandedId(expandedId === p.id ? null : p.id)
                  }
                >
                  Details{' '}
                  {expandedId === p.id ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
                {p.status === 'draft' && (
                  <button
                    type="button"
                    className="loyalty-edit-link"
                    onClick={() => openEditProgramme(p)}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>

              {expandedId === p.id && (
                <div className="loyalty-list-expanded">
                  <div>
                    <span>
                      {p.type === 'stamp'
                        ? 'Stamps required'
                        : 'Points required'}
                    </span>
                    <strong>{p.targetValue || '—'}</strong>
                  </div>
                  <div>
                    <span>Outlets</span>
                    <strong>
                      {p.outlets === 'all' ? 'All outlets' : 'Selected outlets'}
                    </strong>
                  </div>
                  {p.exclusions && (
                    <div>
                      <span>Exclusions</span>
                      <strong>{p.exclusions}</strong>
                    </div>
                  )}
                  {p.terms && (
                    <div>
                      <span>Terms</span>
                      <strong>{p.terms}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {view === 'edit' && (
        <div className="loyalty-form">
          <button
            type="button"
            className="loyalty-back-link"
            onClick={backToList}
          >
            ← Back to programmes
          </button>

          <div className="loyalty-form-workspace">
            <section className="loyalty-form-content">
              {attemptedPublish && !isComplete && (
                <div className="loyalty-missing-banner" role="alert">
                  <strong>Missing required information</strong>
                  <p>
                    Fill in the highlighted fields before you can review and
                    publish.
                  </p>
                  <ul>
                    {missingFields.map((f) => (
                      <li key={f.key}>{f.label}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="loyalty-form-section">
                <div className="loyalty-form-section-heading">
                  <h3>Programme details</h3>
                  <p>Set out how customers earn and what they get.</p>
                </div>

                <label className="field">
                  <span>
                    Programme name
                    <span className="loyalty-required">Required</span>
                  </span>
                  <input
                    className={isMissing('name') ? 'has-error' : ''}
                    type="text"
                    value={form.name}
                    onChange={handleChange('name')}
                    placeholder="e.g. Coffee lovers card"
                  />
                  {isMissing('name') && (
                    <span className="field-error">
                      Programme name is required
                    </span>
                  )}
                </label>

                <div className="loyalty-field-grid">
                  <label className="field">
                    <span>Programme type</span>
                    <select value={form.type} onChange={handleChange('type')}>
                      {PROGRAMME_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>
                      {form.type === 'stamp'
                        ? 'Stamps required'
                        : 'Points required'}
                      <span className="loyalty-required">Required</span>
                    </span>
                    <input
                      className={isMissing('targetValue') ? 'has-error' : ''}
                      type="number"
                      min="1"
                      value={form.targetValue}
                      onChange={handleChange('targetValue')}
                      placeholder={
                        form.type === 'stamp' ? 'e.g. 8' : 'e.g. 500'
                      }
                    />
                    {isMissing('targetValue') && (
                      <span className="field-error">
                        This field is required
                      </span>
                    )}
                  </label>
                </div>

                <label className="field">
                  <span>
                    Earning condition
                    <span className="loyalty-required">Required</span>
                  </span>
                  <input
                    className={isMissing('earningRule') ? 'has-error' : ''}
                    type="text"
                    value={form.earningRule}
                    onChange={handleChange('earningRule')}
                    placeholder={
                      form.type === 'stamp'
                        ? 'e.g. 1 stamp per $10 spent'
                        : 'e.g. 10 points per $1 spent'
                    }
                  />
                  {isMissing('earningRule') && (
                    <span className="field-error">
                      Earning condition is required
                    </span>
                  )}
                </label>

                <label className="field">
                  <span>
                    Reward<span className="loyalty-required">Required</span>
                  </span>
                  <input
                    className={
                      isMissing('rewardDescription') ? 'has-error' : ''
                    }
                    type="text"
                    value={form.rewardDescription}
                    onChange={handleChange('rewardDescription')}
                    placeholder="e.g. Free medium pizza"
                  />
                  {isMissing('rewardDescription') && (
                    <span className="field-error">Reward is required</span>
                  )}
                </label>
              </div>

              <div className="loyalty-form-section">
                <div className="loyalty-form-section-heading">
                  <h3>Availability</h3>
                  <p>When the programme runs and where it's valid.</p>
                </div>

                <div className="loyalty-field-grid">
                  <label className="field">
                    <span>
                      Start date
                      <span className="loyalty-required">Required</span>
                    </span>
                    <input
                      className={isMissing('startDate') ? 'has-error' : ''}
                      type="date"
                      value={form.startDate}
                      onChange={handleChange('startDate')}
                    />
                    {isMissing('startDate') && (
                      <span className="field-error">
                        Start date is required
                      </span>
                    )}
                  </label>

                  <label className="field">
                    <span>End date (optional)</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={handleChange('endDate')}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>Outlets</span>
                  <select
                    value={form.outlets}
                    onChange={handleChange('outlets')}
                  >
                    <option value="all">All outlets</option>
                    <option value="select">Selected outlets only</option>
                  </select>
                </label>

                <label className="field">
                  <span>Exclusions (optional)</span>
                  <textarea
                    className="loyalty-textarea"
                    value={form.exclusions}
                    onChange={handleChange('exclusions')}
                    placeholder="e.g. Public holidays and delivery orders"
                    rows={3}
                  />
                </label>

                <label className="field">
                  <span>Terms (optional)</span>
                  <textarea
                    className="loyalty-textarea"
                    value={form.terms}
                    onChange={handleChange('terms')}
                    placeholder="Any extra conditions customers should know"
                    rows={3}
                  />
                </label>
              </div>
            </section>
          </div>

          <div className="loyalty-form-actions">
            <span className="loyalty-form-actions-note">
              Drafts stay private until you publish.
            </span>
            <div>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSaveDraft}
              >
                Save as Draft
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleReviewClick}
              >
                Review and publish
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'review' && (
        <div className="loyalty-review-screen">
          <button
            type="button"
            className="loyalty-back-link"
            onClick={cancelReview}
          >
            ← Back to edit
          </button>

          <div className="loyalty-review-card">
            <h2>Review your programme</h2>
            <p className="loyalty-review-subtitle">
              Check everything below is correct — this is what customers will
              see and how staff will redeem the reward.
            </p>

            <div className="loyalty-review-row">
              <span>Programme name</span>
              <strong>{form.name}</strong>
            </div>
            <div className="loyalty-review-row">
              <span>Programme type</span>
              <strong>{typeLabel(form.type)}</strong>
            </div>
            <div className="loyalty-review-row">
              <span>Earning condition</span>
              <strong>{form.earningRule}</strong>
            </div>
            <div className="loyalty-review-row">
              <span>
                {form.type === 'stamp' ? 'Stamps required' : 'Points required'}
              </span>
              <strong>{form.targetValue}</strong>
            </div>
            <div className="loyalty-review-row">
              <span>Reward</span>
              <strong>{form.rewardDescription}</strong>
            </div>
            <div className="loyalty-review-row">
              <span>Availability</span>
              <strong>
                {formatDate(form.startDate)}
                {form.endDate
                  ? ` → ${formatDate(form.endDate)}`
                  : ' (no end date)'}
              </strong>
            </div>
            <div className="loyalty-review-row">
              <span>Outlets</span>
              <strong>
                {form.outlets === 'all' ? 'All outlets' : 'Selected outlets'}
              </strong>
            </div>
            {form.exclusions && (
              <div className="loyalty-review-row">
                <span>Exclusions</span>
                <strong>{form.exclusions}</strong>
              </div>
            )}
            {form.terms && (
              <div className="loyalty-review-row">
                <span>Terms</span>
                <strong>{form.terms}</strong>
              </div>
            )}

            <div className="loyalty-review-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={cancelReview}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={confirmPublish}
              >
                Confirm & publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
