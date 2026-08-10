import { Check } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { QUOTE_PRICE_TYPES } from '../constants'
import { formatMoney } from '../formatters'

export default function QuoteReview({ quote, isSaving, onEdit, onSubmit }) {
  const priceType = QUOTE_PRICE_TYPES.find(
    ({ value }) => value === quote.priceType,
  )?.label

  return (
    <section
      className="service-quote-review"
      aria-labelledby="quote-review-title"
    >
      <h4 id="quote-review-title">Review your quote</h4>
      <p>Confirm these details before they are sent to the customer.</p>
      <dl>
        <div>
          <dt>Price</dt>
          <dd>
            {priceType} · {formatMoney(Math.round(Number(quote.amount) * 100))}
          </dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{quote.availability}</dd>
        </div>
        <div>
          <dt>Arrival window</dt>
          <dd>{quote.arrivalWindow}</dd>
        </div>
        <div>
          <dt>Expected duration</dt>
          <dd>{quote.expectedDuration}</dd>
        </div>
        <div>
          <dt>Included work</dt>
          <dd>{quote.includedWork}</dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>{quote.conditions}</dd>
        </div>
        <div>
          <dt>Message</dt>
          <dd>{quote.message || 'No message included'}</dd>
        </div>
      </dl>
      <div className="service-quote-review-actions">
        <Button variant="secondary" onClick={onEdit} disabled={isSaving}>
          Edit quote
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? 'Submitting…' : 'Confirm and submit'}
          {!isSaving && <Check aria-hidden="true" />}
        </Button>
      </div>
    </section>
  )
}
