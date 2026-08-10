import { CheckCircle2, MapPin } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { formatMoney, formatStatus } from '../formatters'

export default function ActiveJobCard({ item, isSaving, onComplete }) {
  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <h3>{item.title}</h3>
        </div>
        <span className={`service-status ${item.job_status}`}>
          {formatStatus(item.job_status)}
        </span>
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
      <div className="service-quote-summary">
        <strong>{formatMoney(item.amount_cents)}</strong>
        {item.message && <span>{item.message}</span>}
      </div>
      {item.job_status === 'in_progress' && (
        <Button
          variant="success"
          onClick={() => onComplete(item.job_request_id)}
          disabled={isSaving}
        >
          <CheckCircle2 aria-hidden="true" />
          {isSaving ? 'Updating…' : 'Mark completed'}
        </Button>
      )}
    </article>
  )
}
