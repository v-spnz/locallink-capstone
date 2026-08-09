import { CalendarClock, Clock, MapPin, MessageSquareText } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { getLeadDisplayDetails } from '../leadFilters'
import QuoteForm from './QuoteForm'

export default function LeadCard({
  item,
  isSelected,
  quoteAmount,
  quoteMessage,
  isSaving,
  onToggle,
  onAmountChange,
  onMessageChange,
  onSubmit,
}) {
  const details = getLeadDisplayDetails(item)
  const deadline = new Date(details.quoteDeadline)

  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <span>{details.category}</span>
          <h3>{details.title}</h3>
        </div>
        <span className="service-status open">Open lead</span>
      </div>
      {item.description && <p>{item.description}</p>}
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {details.suburb}, {item.city}
        </span>
        {item.radius_km && <span>Within {item.radius_km} km</span>}
        <span>
          <Clock aria-hidden="true" />
          {details.requestedTiming}
        </span>
        <span>
          <MessageSquareText aria-hidden="true" />
          {details.quoteCount} of {details.maxQuotes} quotes
        </span>
        <span>
          <CalendarClock aria-hidden="true" />
          Quotes close{' '}
          {deadline.toLocaleString('en-NZ', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>
      <Button
        variant={item.has_quote ? 'secondary' : 'primary'}
        onClick={onToggle}
      >
        {item.has_quote ? 'Update quote' : 'Send quote'}
      </Button>
      {isSelected && (
        <QuoteForm
          amount={quoteAmount}
          message={quoteMessage}
          isSaving={isSaving}
          onAmountChange={onAmountChange}
          onMessageChange={onMessageChange}
          onSubmit={onSubmit}
        />
      )}
    </article>
  )
}
