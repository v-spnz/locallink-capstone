import { ArrowRight } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { QUOTE_PRICE_TYPES } from '../constants'

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <span className="form-error" id={id} role="alert">
      {message}
    </span>
  )
}

function fieldErrorProps(field, errors) {
  return errors[field]
    ? { 'aria-invalid': true, 'aria-describedby': `quote-${field}-error` }
    : {}
}

export default function QuoteForm({
  quote,
  errors,
  isSaving,
  onChange,
  onReview,
}) {
  const today = new Date()
  const minAvailability = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')

  return (
    <form className="service-quote-form" onSubmit={onReview} noValidate>
      <div className="service-quote-form-grid">
        <label>
          <span>Price type</span>
          <select
            value={quote.priceType}
            onChange={(event) => onChange('priceType', event.target.value)}
            disabled={isSaving}
            {...fieldErrorProps('priceType', errors)}
          >
            <option value="">Select a price type</option>
            {QUOTE_PRICE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError id="quote-priceType-error" message={errors.priceType} />
        </label>
        <label>
          <span>Price (NZD)</span>
          <input
            type="number"
            min="1"
            max="1000000"
            step="0.01"
            value={quote.amount}
            onChange={(event) => onChange('amount', event.target.value)}
            placeholder="e.g. 185.00"
            disabled={isSaving}
            {...fieldErrorProps('amount', errors)}
          />
          <FieldError id="quote-amount-error" message={errors.amount} />
        </label>
        <label>
          <span>Available date</span>
          <input
            type="date"
            min={minAvailability}
            value={quote.availability}
            onChange={(event) => onChange('availability', event.target.value)}
            disabled={isSaving}
            {...fieldErrorProps('availability', errors)}
          />
          <FieldError
            id="quote-availability-error"
            message={errors.availability}
          />
        </label>
        <label>
          <span>Arrival window</span>
          <input
            value={quote.arrivalWindow}
            onChange={(event) => onChange('arrivalWindow', event.target.value)}
            placeholder="e.g. 8:00–10:00 AM"
            maxLength="120"
            disabled={isSaving}
            {...fieldErrorProps('arrivalWindow', errors)}
          />
          <FieldError
            id="quote-arrivalWindow-error"
            message={errors.arrivalWindow}
          />
        </label>
        <label>
          <span>Expected duration</span>
          <input
            value={quote.expectedDuration}
            onChange={(event) =>
              onChange('expectedDuration', event.target.value)
            }
            placeholder="e.g. Around 2 hours"
            maxLength="120"
            disabled={isSaving}
            {...fieldErrorProps('expectedDuration', errors)}
          />
          <FieldError
            id="quote-expectedDuration-error"
            message={errors.expectedDuration}
          />
        </label>
      </div>
      <label>
        <span>Included work</span>
        <textarea
          value={quote.includedWork}
          onChange={(event) => onChange('includedWork', event.target.value)}
          placeholder="Describe the labour, materials and other work included"
          maxLength="1000"
          rows="3"
          disabled={isSaving}
          {...fieldErrorProps('includedWork', errors)}
        />
        <FieldError
          id="quote-includedWork-error"
          message={errors.includedWork}
        />
      </label>
      <label>
        <span>Conditions</span>
        <textarea
          value={quote.conditions}
          onChange={(event) => onChange('conditions', event.target.value)}
          placeholder="List assumptions or conditions, or enter ‘None’"
          maxLength="1000"
          rows="2"
          disabled={isSaving}
          {...fieldErrorProps('conditions', errors)}
        />
        <FieldError id="quote-conditions-error" message={errors.conditions} />
      </label>
      <label>
        <span>Message to customer (optional)</span>
        <textarea
          value={quote.message}
          onChange={(event) => onChange('message', event.target.value)}
          placeholder="Add a personal note for the customer"
          maxLength="1000"
          rows="3"
          disabled={isSaving}
          {...fieldErrorProps('message', errors)}
        />
        <FieldError id="quote-message-error" message={errors.message} />
      </label>
      <Button type="submit" disabled={isSaving}>
        Review quote
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  )
}
