import { MapPin } from 'lucide-react'
import Button from '../../../components/ui/Button'
import ActiveJobProgressTimeline from './ActiveJobProgressTimeline'
import { formatMoney } from '../formatters'
import { formatJobProgressStage, getNextJobProgressStage } from '../jobTracking'

export default function ActiveJobCard({ item, isUpdating, onAdvanceStatus }) {
  const nextStatus = getNextJobProgressStage(item.job_status)

  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <h3>{item.title}</h3>
        </div>
      </div>
      {item.description && <p>{item.description}</p>}
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {item.suburb}, {item.city}
        </span>
        {item.created_at && (
          <span>{new Date(item.created_at).toLocaleDateString('en-NZ')}</span>
        )}
      </div>
      <ActiveJobProgressTimeline job={item} />
      <div className="service-quote-summary">
        <strong>{formatMoney(item.amount_cents)}</strong>
        {item.message && <span>{item.message}</span>}
      </div>
      {nextStatus && (
        <Button
          variant="success"
          onClick={onAdvanceStatus}
          disabled={isUpdating}
        >
          {isUpdating
            ? 'Updating…'
            : nextStatus === 'pending_completion'
              ? 'Mark work complete'
              : `Mark as ${formatJobProgressStage(nextStatus)}`}
        </Button>
      )}
    </article>
  )
}
