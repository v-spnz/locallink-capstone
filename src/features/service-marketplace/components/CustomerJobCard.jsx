import Button from '../../../components/ui/Button'
import { formatStatus } from '../formatters'
import QuoteList from './QuoteList'

export default function CustomerJobCard({
  job,
  quotes,
  respondingQuoteId,
  onEdit,
  onRepost,
  onQuoteResponse,
}) {
  const canEdit = ['open', 'closed', 'cancelled'].includes(job.status)

  return (
    <article className="customer-job-card">
      <div className="customer-job-card-head">
        <div>
          <strong>{job.title}</strong>
          <span>{job.category}</span>
        </div>
        <span className={`customer-job-status ${job.status}`}>
          {formatStatus(job.status)}
        </span>
      </div>
      <p className="customer-job-description">{job.description}</p>
      <div className="customer-job-meta">
        <span>
          {job.suburb ? `${job.suburb}, ` : ''}
          {job.city}
        </span>
        <span>{job.postedDistance} radius</span>
        <span>Posted {new Date(job.created_at).toLocaleString('en-NZ')}</span>
      </div>
      <QuoteList
        jobStatus={job.status}
        quotes={quotes}
        respondingQuoteId={respondingQuoteId}
        onRespond={onQuoteResponse}
      />
      {canEdit && (
        <div className="customer-job-actions">
          <Button variant="secondary" onClick={() => onRepost(job)}>
            Repost Job
          </Button>
          <Button variant="secondary" onClick={() => onEdit(job)}>
            Edit Job
          </Button>
        </div>
      )}
    </article>
  )
}
