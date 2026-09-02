import { CheckCircle2, MapPin } from 'lucide-react'
import Button from '../../../components/ui/Button'
import GstIncluded from '../../../components/ui/GstIncluded'
import AcceptedJobContactDetails from './AcceptedJobContactDetails'
import ActiveJobProgressTimeline from './ActiveJobProgressTimeline'
import { formatMoney } from '../formatters'
import { formatJobProgressStage, getNextJobProgressStage } from '../jobTracking'

export default function ActiveJobCard({
  item,
  isHistory = false,
  isUpdating,
  onAdvanceStatus,
}) {
  const nextStatus = getNextJobProgressStage(item.job_status)

  return (
    <article
      id={`service-item-${isHistory ? 'history' : 'jobs'}-${item.job_request_id}`}
      className="service-marketplace-card"
    >
      <div className="service-marketplace-card-head">
        <div>
          <h3>{item.title}</h3>
        </div>
        {isHistory && (
          <span className="service-history-status">
            <CheckCircle2 aria-hidden="true" />
            Completed
          </span>
        )}
      </div>
      {item.description && <p>{item.description}</p>}
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {item.suburb}, {item.city}
        </span>
        {item.created_at && (
          <span className="service-marketplace-timestamp">
            {new Date(item.created_at).toLocaleDateString('en-NZ')}
          </span>
        )}
      </div>
      <ActiveJobProgressTimeline job={item} />
      <AcceptedJobContactDetails
        contactDetails={item.contact_details}
        viewer="provider"
      />
      {isHistory && item.status_updated_at && (
        <p className="service-history-completed-at">
          Completed{' '}
          {new Date(item.status_updated_at).toLocaleDateString('en-NZ', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
      <div className="service-quote-summary">
        <strong className="business-structured-data">
          {formatMoney(item.amount_cents)}
        </strong>
        <GstIncluded block />
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
