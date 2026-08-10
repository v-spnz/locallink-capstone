import Button from '../../../components/ui/Button'
import { getJobBadge } from '../formatters'
import QuoteList from './QuoteList'

// Full-panel job detail view (US0053). Replaces the My Jobs grid when
// a job is selected -- "closing" means going back to the grid (full
// panel swap), not an overlay popup.
export default function JobDetailPanel({
  job,
  quotes,
  respondingQuoteId,
  onBack,
  onEdit,
  onRepost,
  onQuoteResponse,
}) {
  const badge = getJobBadge(job, quotes.length)
  const canEdit = ['open', 'closed', 'cancelled'].includes(job.status)

  return (
    <div>
      <button type="button" className="sm-back-link" onClick={onBack}>
        &larr; Back to My Jobs
      </button>

      <div className="sm-detail-card">
        <div className="sm-badge-row">
          <span className={`sm-badge sm-badge--${badge.tone}`}>
            {badge.label}
          </span>
          <span className="sm-badge sm-badge--category">{job.category}</span>
        </div>
        <h2 className="sm-detail-title">{job.title}</h2>
        <p className="sm-detail-description">{job.description}</p>

        <div className="sm-field-grid">
          <div>
            <div className="sm-field-label">Location</div>
            <div className="sm-field-value">
              {job.suburb ? `${job.suburb}, ` : ''}
              {job.city}
            </div>
          </div>
          <div>
            <div className="sm-field-label">Posted</div>
            <div className="sm-field-value">
              {new Date(job.created_at).toLocaleDateString('en-NZ')}
            </div>
          </div>
          <div>
            <div className="sm-field-label">Preferred date</div>
            <div className="sm-field-value">
              {job.job_date
                ? new Date(job.job_date).toLocaleDateString('en-NZ')
                : 'Not set'}
            </div>
          </div>
          <div>
            <div className="sm-field-label">Budget</div>
            <div className="sm-field-value">{job.budget || 'Not specified'}</div>
          </div>
          <div>
            <div className="sm-field-label">Search distance</div>
            <div className="sm-field-value">{job.postedDistance}</div>
          </div>
          <div>
            <div className="sm-field-label">Category</div>
            <div className="sm-field-value">{job.category}</div>
          </div>
        </div>
      </div>

      <QuoteList
        jobStatus={job.status}
        quotes={quotes}
        respondingQuoteId={respondingQuoteId}
        onRespond={onQuoteResponse}
      />

      {canEdit && (
        <div className="sm-detail-actions">
          <div className="sm-detail-actions-right">
            <Button variant="secondary" onClick={() => onEdit(job)}>
              Edit Job
            </Button>
            <Button variant="secondary" onClick={() => onRepost(job)}>
              Repost Job
            </Button>
            <Button variant="secondary" disabled>
              Delete Job
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}