import Button from '../../../components/ui/Button'
import { getJobBadge } from '../formatters'
import ActiveJobProgressTimeline from './ActiveJobProgressTimeline'

export default function JobDetailPanel({
  job,
  quoteCount,
  isConfirmingCompletion,
  onBack,
  onEdit,
  onRepost,
  onDelete,
  onViewQuotes,
  onConfirmCompletion,
}) {
  const badge = getJobBadge(job, quoteCount)
  const canEdit = ['open', 'closed', 'cancelled'].includes(job.status)

  return (
    <div>
      <button type="button" className="sm-back-link" onClick={onBack}>
        &larr; Back to My Jobs
      </button>

      <div className="sm-detail-card">
        <div className="sm-detail-card-top">
          <div>
            <div className="sm-badge-row">
              <span className={`sm-badge sm-badge--${badge.tone}`}>
                {badge.label}
              </span>
              <span className="sm-badge sm-badge--category">
                {job.category}
              </span>
              {job.urgency === 'Urgent' && (
                <span className="sm-badge sm-badge--urgent">Urgent</span>
              )}
            </div>
            <h2 className="sm-detail-title">{job.title}</h2>
            <p className="sm-detail-description">{job.description}</p>
          </div>
          <div
            className={`sm-quote-count-box${quoteCount === 0 ? ' sm-quote-count-box--zero' : ''}`}
          >
            <div className="sm-quote-count-num">{quoteCount}</div>
            <div className="sm-quote-count-label">Quotes</div>
          </div>
        </div>

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
            <div className="sm-field-value">
              {job.budget || 'Not specified'}
            </div>
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

        <ActiveJobProgressTimeline job={job} />
      </div>

      <div className="sm-detail-actions">
        <Button
          variant="secondary"
          className="sm-view-quotes-btn"
          onClick={() => onViewQuotes(job.id)}
        >
          View {quoteCount} quote{quoteCount === 1 ? '' : 's'}
        </Button>

        {job.status === 'pending_completion' && (
          <Button
            variant="success"
            disabled={isConfirmingCompletion}
            onClick={() => onConfirmCompletion(job.id)}
          >
            {isConfirmingCompletion ? 'Confirming…' : 'Confirm work completed'}
          </Button>
        )}

        {canEdit && (
          <div className="sm-detail-actions-right">
            <Button variant="secondary" onClick={() => onEdit(job)}>
              Edit Job
            </Button>
            <Button variant="secondary" onClick={() => onRepost(job)}>
              Repost Job
            </Button>
            <Button
              variant="secondary"
              className="sm-delete-btn"
              onClick={() => {
                if (
                  window.confirm(
                    'Delete this job? This is for testing only and cannot be undone.',
                  )
                ) {
                  onDelete(job.id)
                }
              }}
            >
              Delete Job
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}