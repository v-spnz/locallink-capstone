import { MapPin } from 'lucide-react'
import Button from '../../../components/ui/Button'
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
  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <span>{item.category}</span>
          <h3>{item.title}</h3>
        </div>
        <span className="service-status open">Open lead</span>
      </div>
      {item.description && <p>{item.description}</p>}
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {item.suburb}, {item.city}
        </span>
        {item.radius_km && <span>Within {item.radius_km} km</span>}
        {item.created_at && (
          <span>{new Date(item.created_at).toLocaleDateString('en-NZ')}</span>
        )}
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
