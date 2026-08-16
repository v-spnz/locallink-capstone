import { getJobBadge, getActiveQuoteCount } from '../formatters'

// Left column on the Quotes tab (US0054) -- lets the customer switch
// which job's quotes they're comparing. Past (completed) jobs collapse
// into a dropdown below, same pattern as the My Jobs page.
export default function QuoteJobSidebar({
  jobs,
  pastJobs = [],
  quotesByJob,
  selectedJobId,
  onSelect,
}) {
  function renderItem(job, { isPast = false } = {}) {
    const quotes = quotesByJob[job.id] ?? []
    // Active jobs count only quotes still awaiting a response (US081).
    // Past jobs are already resolved -- the total ever received is the
    // more honest number here, since "active" doesn't mean anything
    // once the job is completed.
    const quoteCount = isPast ? quotes.length : getActiveQuoteCount(quotes)
    const badge = getJobBadge(job, quoteCount)
    const selected = job.id === selectedJobId
    return (
      <div
        key={job.id}
        className={`sm-quote-sidebar-item${selected ? ' sm-quote-sidebar-item--selected' : ''}${isPast ? ' sm-quote-sidebar-item--past' : ''}`}
        onClick={() => onSelect(job.id)}
      >
        <div className="sm-quote-sidebar-title">{job.title}</div>
        <div className="sm-quote-sidebar-sub">
          {badge.label} &middot; {quoteCount} quote
          {quoteCount === 1 ? '' : 's'}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm-field-label" style={{ marginBottom: 8 }}>
        Your Jobs
      </div>
      {jobs.map((job) => renderItem(job))}

      {pastJobs.length > 0 && (
        <details className="sm-past-jobs">
          <summary>
            <span className="sm-past-chev">▶</span> Past jobs
          </summary>
          <div className="sm-past-jobs-body">
            {pastJobs.map((job) => renderItem(job, { isPast: true }))}
          </div>
        </details>
      )}
    </div>
  )
}