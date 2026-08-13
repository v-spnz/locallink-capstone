import { getJobBadge } from '../formatters'

// Left column on the Quotes tab (US0054) -- lets the customer switch
// which job's quotes they're comparing.
export default function QuoteJobSidebar({ jobs, quotesByJob, selectedJobId, onSelect }) {
  return (
    <div>
      <div className="sm-field-label" style={{ marginBottom: 8 }}>
        Your Jobs
      </div>
      {jobs.map((job) => {
        const quotes = quotesByJob[job.id] ?? []
        const badge = getJobBadge(job, quotes.length)
        const selected = job.id === selectedJobId
        return (
          <div
            key={job.id}
            className={`sm-quote-sidebar-item${selected ? ' sm-quote-sidebar-item--selected' : ''}`}
            onClick={() => onSelect(job.id)}
          >
            <div className="sm-quote-sidebar-title">{job.title}</div>
            <div className="sm-quote-sidebar-sub">
              {badge.label} &middot; {quotes.length} quote{quotes.length === 1 ? '' : 's'}
            </div>
          </div>
        )
      })}
    </div>
  )
}