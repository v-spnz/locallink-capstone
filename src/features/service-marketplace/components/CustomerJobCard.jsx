import { getJobBadge } from '../formatters'

export default function CustomerJobCard({ job, quoteCount, onSelect }) {
  const badge = getJobBadge(job, quoteCount)

  return (
    <article className="sm-job-card" onClick={() => onSelect(job)}>
      <div className="sm-job-card-body">
        <div className="sm-badge-row">
          <span className={`sm-badge sm-badge--${badge.tone}`}>
            {badge.label}
          </span>
          <span className="sm-badge sm-badge--category">{job.category}</span>
        </div>
        <strong className="sm-job-title">{job.title}</strong>
        <p className="customer-job-description">{job.description}</p>
        <div className="customer-job-meta">
          <span>
            {job.suburb ? `${job.suburb}, ` : ''}
            {job.city}
          </span>
          <span>{job.postedDistance} radius</span>
          <span>Posted {new Date(job.created_at).toLocaleString('en-NZ')}</span>
        </div>
      </div>
      <div
        className={`sm-quote-count-box${quoteCount === 0 ? ' sm-quote-count-box--zero' : ''}`}
      >
        <div className="sm-quote-count-num">{quoteCount}</div>
        <div className="sm-quote-count-label">Quotes</div>
      </div>
    </article>
  )
}
