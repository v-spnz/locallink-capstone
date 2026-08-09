import { ArrowRight } from 'lucide-react'
import Button from '../../../components/ui/Button'

export default function QuoteForm({
  amount,
  message,
  isSaving,
  onAmountChange,
  onMessageChange,
  onSubmit,
}) {
  return (
    <form className="service-quote-form" onSubmit={onSubmit}>
      <label>
        <span>Quote amount (NZD)</span>
        <input
          type="number"
          min="1"
          step="0.01"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="e.g. 185.00"
          disabled={isSaving}
        />
      </label>
      <label>
        <span>Message to customer</span>
        <textarea
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          placeholder="Explain what is included in your quote"
          maxLength="1000"
          rows="3"
          disabled={isSaving}
        />
      </label>
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Submitting…' : 'Submit quote'}
        {!isSaving && <ArrowRight aria-hidden="true" />}
      </Button>
    </form>
  )
}
