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
          {job.urgency === 'Urgent' && (
            <span className="sm-badge sm-badge--urgent">Urgent</span>
          )}
        </div>
        <strong className="sm-job-title">{job.title}</strong>
        <p className="customer-job-description">{job.description}</p>
        <div className="customer-job-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {job.suburb ? `${job.suburb}, ` : ''}
            {job.city}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="3" x2="8" y2="7" />
              <line x1="16" y1="3" x2="16" y2="7" />
            </svg>
            Posted {new Date(job.created_at).toLocaleDateString('en-NZ')}
          </span>
          {job.budget && (
            <span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="2" x2="12" y2="22" />
                <path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.6-5 3.5 2.2 3 5 3.5 5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5" />
              </svg>
              Budget: <strong>{job.budget}</strong>
            </span>
          )}
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            Within {job.postedDistance}
          </span>
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
