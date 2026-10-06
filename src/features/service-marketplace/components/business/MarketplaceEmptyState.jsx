import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import localBusinessNeighbourhood from '../../../../assets/images/local-business-neighbourhood.jpg'

const EMPTY_STATE_DETAILS = {
  leads: {
    title: 'New local work will land here',
    hint: 'LocalLink matches requests using your service categories and coverage areas.',
    action: 'Review service profile',
    to: '/business/settings/services',
  },
  quotes: {
    title: 'Your quote pipeline starts with a lead',
    hint: 'When you respond to a suitable request, the quote and customer response will stay together here.',
    action: 'View available leads',
    to: '/business/services',
  },
  jobs: {
    title: 'Accepted work becomes a clear plan',
    hint: 'Accepted quotes move here so you can track each job from arrival through customer confirmation.',
    action: 'Review submitted quotes',
    to: '/business/services?tab=quotes',
  },
  history: {
    title: 'Completed work builds your record',
    hint: 'Finished and customer-confirmed jobs will remain available here for future reference.',
    action: 'View active jobs',
    to: '/business/services?tab=jobs',
  },
}

export default function MarketplaceEmptyState({
  type,
  totalItems,
  message,
  onReset,
}) {
  const filtered = totalItems > 0
  const details = EMPTY_STATE_DETAILS[type]

  return (
    <div className={`empty-state service-empty-state is-${type}`}>
      <div className="service-empty-state-visual">
        <img
          src={localBusinessNeighbourhood}
          alt="A local service professional speaking with a customer in their neighbourhood"
        />
      </div>
      <div className="service-empty-state-copy">
        <h3>{filtered ? 'Nothing matches those filters' : details.title}</h3>
        <p>{message}</p>
        <small>
          {filtered
            ? 'Try a broader search or choose a different status.'
            : details.hint}
        </small>
        {!filtered && (
          <Link className="service-empty-state-link" to={details.to}>
            {details.action}
            <ArrowRight aria-hidden="true" />
          </Link>
        )}
        {filtered && (
          <button className="btn-secondary" type="button" onClick={onReset}>
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
