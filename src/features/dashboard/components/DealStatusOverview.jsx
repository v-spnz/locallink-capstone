import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  DEAL_STATUS_ORDER,
  formatDashboardCount,
} from '../dashboardPresentation'

const DEAL_STATE_LABELS = {
  draft: { label: 'Draft', empty: 'No drafts' },
  scheduled: { label: 'Scheduled', empty: 'None scheduled' },
  active: { label: 'Active', empty: 'None live' },
  expired: { label: 'Expired', empty: 'None expired' },
  ended_early: { label: 'Ended early', empty: 'None ended early' },
}

export default function DealStatusOverview({ summary }) {
  const endingSoonCount = summary.endingSoon.length

  return (
    <section
      className="business-dashboard-section business-deal-status"
      aria-labelledby="business-deal-status-title"
    >
      <div className="business-section-heading business-performance-heading">
        <div>
          <span>Deal status</span>
          <h2 id="business-deal-status-title">What you are offering</h2>
          <p>
            {summary.total === 0
              ? 'You have not created any deals yet.'
              : `${summary.total} ${summary.total === 1 ? 'deal' : 'deals'} in total.`}
          </p>
        </div>
        <Link
          className="business-performance-refresh"
          to="/business/create-deal"
        >
          Manage deals
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>

      <dl className="business-deal-status-grid">
        {DEAL_STATUS_ORDER.map((state) => {
          const count = summary.counts[state]
          return (
            <div
              className={`is-${state}${count === 0 ? ' is-empty' : ''}`}
              key={state}
            >
              <dt>
                {DEAL_STATE_LABELS[state].label}
                {state === 'active' && endingSoonCount > 0 && (
                  <span className="business-deal-ending-soon">
                    {endingSoonCount} {endingSoonCount === 1 ? 'deal' : 'deals'}{' '}
                    ending soon
                  </span>
                )}
              </dt>
              <dd>{formatDashboardCount(count)}</dd>
              <small>
                {count === 0
                  ? DEAL_STATE_LABELS[state].empty
                  : `${count === 1 ? 'deal' : 'deals'}`}
              </small>
            </div>
          )
        })}
      </dl>

      {summary.drafts.length > 0 && (
        <div className="business-deal-attention">
          <div className="business-deal-attention-group">
            <h3>Unfinished drafts</h3>
            {summary.drafts.slice(0, 5).map((draft) => (
              <Link to="/business/create-deal" key={draft.id}>
                <span>
                  <strong>{draft.title}</strong>
                  <small>
                    {draft.missingCount > 0
                      ? `${draft.missingCount} ${draft.missingCount === 1 ? 'detail' : 'details'} still needed`
                      : 'Ready to review and publish'}
                  </small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
