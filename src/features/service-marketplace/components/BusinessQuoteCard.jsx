import { MapPin } from 'lucide-react'
import { formatMoney, formatStatus } from '../formatters'

export default function BusinessQuoteCard({ item }) {
  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <span>{item.category}</span>
          <h3>{item.title}</h3>
        </div>
        <span className={`service-status ${item.quote_status}`}>
          {formatStatus(item.quote_status)}
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
    </article>
  )
}
