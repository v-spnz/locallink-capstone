import { ArrowRight } from 'lucide-react'
import Button from '../../../components/ui/Button'
import GstIncluded from '../../../components/ui/GstIncluded'
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

  function openAvailabilityPicker(event) {
    if (isSaving || typeof event.currentTarget.showPicker !== 'function') return

    try {
      event.currentTarget.showPicker()
    } catch {
      // Browsers without an available native picker still retain normal input
      // focus and keyboard behaviour.
    }
  }

  return (
    <form className="service-quote-form" onSubmit={onReview} noValidate>
      <div className="service-quote-form-grid">
        <div className="service-quote-field">
          <span
            className="service-quote-field-title"
            id="quote-price-type-label"
          >
            Price type <span className="service-required-mark">*</span>
          </span>
          <select
            aria-labelledby="quote-price-type-label"
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
        </div>
        <div className="service-quote-field service-quote-price-field">
          <span className="service-quote-field-title" id="quote-amount-label">
            Price (NZD) <span className="service-required-mark">*</span>
          </span>
          <span className="service-price-input">
            <span className="service-price-prefix" aria-hidden="true">
              $
            </span>
            <input
              aria-labelledby="quote-amount-label"
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
          <GstIncluded block />
          <FieldError id="quote-amount-error" message={errors.amount} />
        </div>
        <div className="service-quote-field service-quote-availability-field">
          <span
            className="service-quote-field-title"
            id="quote-availability-label"
          >
            Available date <span className="service-required-mark">*</span>
          </span>
          <input
            aria-labelledby="quote-availability-label"
            required
            type="date"
            min={minAvailability}
            value={quote.availability}
            onClick={openAvailabilityPicker}
            onChange={(event) => onChange('availability', event.target.value)}
            disabled={isSaving}
            {...fieldErrorProps('availability', errors)}
          />
          <FieldError
            id="quote-availability-error"
            message={errors.availability}
          />
        </div>
        <fieldset className="service-arrival-window">
          <legend id="quote-arrival-window-label">
            Arrival window <span className="service-required-mark">*</span>
          </legend>
          <div className="service-arrival-window-selects">
            <div className="service-arrival-window-field">
              <span
                className="service-quote-field-title"
                id="quote-arrival-start-label"
              >
                From
              </span>
              <select
                aria-labelledby="quote-arrival-window-label quote-arrival-start-label"
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
            </div>
            <div className="service-arrival-window-field">
              <span
                className="service-quote-field-title"
                id="quote-arrival-end-label"
              >
                To
              </span>
              <select
                aria-labelledby="quote-arrival-window-label quote-arrival-end-label"
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
            </div>
          </div>
          <FieldError
            id="quote-arrivalWindow-error"
            message={errors.arrivalWindow}
          />
        </fieldset>
        <div className="service-quote-field">
          <span
            className="service-quote-field-title"
            id="quote-expected-duration-label"
          >
            Expected duration <span className="service-required-mark">*</span>
          </span>
          <select
            aria-labelledby="quote-expected-duration-label"
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
        </div>
      </div>
      <div className="service-quote-field">
        <span
          className="service-quote-field-title"
          id="quote-included-work-label"
        >
          Included work <span className="service-required-mark">*</span>
        </span>
        <textarea
          aria-labelledby="quote-included-work-label"
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
      </div>
      <div className="service-quote-field">
        <span className="service-quote-field-title" id="quote-conditions-label">
          Conditions <span className="service-required-mark">*</span>
        </span>
        <textarea
          aria-labelledby="quote-conditions-label"
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
      </div>
      <div className="service-quote-field">
        <span className="service-quote-field-title" id="quote-message-label">
          Message to customer (optional)
        </span>
        <textarea
          aria-labelledby="quote-message-label"
          value={quote.message}
          onChange={(event) => onChange('message', event.target.value)}
          placeholder="Add a personal note for the customer"
          maxLength="1000"
          rows="3"
          disabled={isSaving}
          {...fieldErrorProps('message', errors)}
        />
        <FieldError id="quote-message-error" message={errors.message} />
      </div>
      <Button type="submit" disabled={isSaving}>
        Review quote
        <ArrowRight aria-hidden="true" />
      </Button>
    </form>
  )
}
