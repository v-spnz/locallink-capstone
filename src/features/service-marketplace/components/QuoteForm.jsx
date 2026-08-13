import { ArrowRight } from 'lucide-react'
import Button from '../../../components/ui/Button'
import {
  QUOTE_ARRIVAL_TIMES,
  QUOTE_DURATION_OPTIONS,
  QUOTE_PRICE_TYPES,
} from '../constants'
import { sanitizeQuoteAmount } from '../validation'

const AMOUNT_CONTROL_KEYS = new Set([
  'Backspace',
  'Delete',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'Tab',
  'Enter',
])

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

  function handleAmountKeyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (AMOUNT_CONTROL_KEYS.has(event.key) || /^\d$/.test(event.key)) return
    if (event.key === '.' && !String(quote.amount ?? '').includes('.')) return
    event.preventDefault()
  }

  return (
    <form className="service-quote-form" onSubmit={onReview} noValidate>
      <div className="service-quote-form-grid">
        <label>
          <span>
            Price type <span className="service-required-mark">*</span>
          </span>
          <select
            required
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
          <span>
            Price (NZD) <span className="service-required-mark">*</span>
          </span>
          <span className="service-price-input">
            <span className="service-price-prefix" aria-hidden="true">
              $
            </span>
            <input
              required
              type="text"
              inputMode="decimal"
              pattern="\d+(\.\d{1,2})?"
              maxLength="10"
              value={quote.amount}
              onKeyDown={handleAmountKeyDown}
              onChange={(event) =>
                onChange('amount', sanitizeQuoteAmount(event.target.value))
              }
              placeholder="185.00"
              autoComplete="off"
              disabled={isSaving}
              {...fieldErrorProps('amount', errors)}
            />
          </span>
          <FieldError id="quote-amount-error" message={errors.amount} />
        </label>
        <label>
          <span>
            Available date <span className="service-required-mark">*</span>
          </span>
          <input
            required
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
        <fieldset className="service-arrival-window">
          <legend>
            Arrival window <span className="service-required-mark">*</span>
          </legend>
          <div className="service-arrival-window-selects">
            <label>
              <span>From</span>
              <select
                required
                value={quote.arrivalStart}
                onChange={(event) =>
                  onChange('arrivalStart', event.target.value)
                }
                disabled={isSaving}
                {...fieldErrorProps('arrivalWindow', errors)}
              >
                <option value="">Start time</option>
                {QUOTE_ARRIVAL_TIMES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>To</span>
              <select
                required
                value={quote.arrivalEnd}
                onChange={(event) => onChange('arrivalEnd', event.target.value)}
                disabled={isSaving}
                {...fieldErrorProps('arrivalWindow', errors)}
              >
                <option value="">End time</option>
                {QUOTE_ARRIVAL_TIMES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <FieldError
            id="quote-arrivalWindow-error"
            message={errors.arrivalWindow}
          />
        </fieldset>
        <label>
          <span>
            Expected duration <span className="service-required-mark">*</span>
          </span>
          <select
            required
            value={quote.expectedDuration}
            onChange={(event) =>
              onChange('expectedDuration', event.target.value)
            }
            disabled={isSaving}
            {...fieldErrorProps('expectedDuration', errors)}
          >
            <option value="">Select a duration</option>
            {QUOTE_DURATION_OPTIONS.map((duration) => (
              <option key={duration} value={duration}>
                {duration}
              </option>
            ))}
          </select>
          <FieldError
            id="quote-expectedDuration-error"
            message={errors.expectedDuration}
          />
        </label>
      </div>
      <label>
        <span>
          Included work <span className="service-required-mark">*</span>
        </span>
        <textarea
          required
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
        <span>
          Conditions <span className="service-required-mark">*</span>
        </span>
        <textarea
          required
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
