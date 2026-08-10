import { CalendarClock, Clock, MapPin, MessageSquareText } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { getLeadDisplayDetails, isUrgentLead } from '../leadFilters'
import QuoteForm from './QuoteForm'
import QuoteReview from './QuoteReview'

export default function LeadCard({
  item,
  isSelected,
  quote,
  quoteErrors,
  quoteStep,
  isSaving,
  onToggle,
  onQuoteChange,
  onReview,
  onEdit,
  onSubmit,
}) {
  const details = getLeadDisplayDetails(item)
  const deadline = new Date(details.quoteDeadline)
  const isUrgent = isUrgentLead(item)

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
        <span
          className={isUrgent ? 'service-marketplace-deadline is-urgent' : ''}
        >
          <CalendarClock aria-hidden="true" />
          {isUrgent ? 'Closing soon: ' : 'Quotes close '}
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
      {isSelected &&
        (quoteStep === 'review' ? (
          <QuoteReview
            quote={quote}
            isSaving={isSaving}
            onEdit={onEdit}
            onSubmit={onSubmit}
          />
        ) : (
          <QuoteForm
            quote={quote}
            errors={quoteErrors}
            isSaving={isSaving}
            onChange={onQuoteChange}
            onReview={onReview}
          />
        ))}
    </article>
  )
}
