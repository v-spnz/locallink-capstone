import { useState } from 'react'
import Button from '../../../components/ui/Button'
import { formatMoney, formatStatus } from '../formatters'
import { QUOTE_PRICE_TYPES } from '../constants'
import QuoteActionModal from './QuoteActionModal'

export default function QuoteList({
  jobStatus,
  quotes,
  respondingQuoteId,
  onRespond,
  repeatBusinessIds = new Set(),
}) {
  // Quote pending the accept confirmation step, if any.
  const [pendingAccept, setPendingAccept] = useState(null)

  async function confirmAccept() {
    await onRespond(pendingAccept.quote_id, true)
    setPendingAccept(null)
  }

  if (quotes.length === 0) {
    return (
      <div className="sm-empty-state">
        <p className="sm-empty-title">No quotes yet</p>
        <p className="sm-empty-sub">
          Providers usually respond within 24-48 hours. We'll notify you as soon
          as the first quote arrives.
        </p>
      </div>
    )
  }

  return (
    <section className="customer-job-quotes">
      <h4>
        {quotes.length} quote{quotes.length === 1 ? '' : 's'} received
      </h4>
      {quotes.map((quote) => {
        const priceType = QUOTE_PRICE_TYPES.find(
          ({ value }) => value === quote.price_type,
        )?.label
        const canAct =
          jobStatus === 'open' &&
          ['awaiting_response', 'submitted'].includes(quote.quote_status)

        return (
          <div className="customer-quote" key={quote.quote_id}>
            <div className="customer-quote-head">
              <div>
                <strong>{quote.business_name}</strong>
                {repeatBusinessIds.has(quote.business_id) && (
                  <span className="sm-repeat-tag">You've used them before</span>
                )}
                <span>
                  {formatMoney(quote.amount_cents)}{' '}
                  {priceType && `· ${priceType}`}
                </span>
              </div>
              <span className={`customer-quote-status ${quote.quote_status}`}>
                {formatStatus(quote.quote_status)}
              </span>
            </div>
            <dl className="customer-quote-details">
              <div>
                <dt>Available</dt>
                <dd>{quote.availability_date}</dd>
              </div>
              <div>
                <dt>Arrival</dt>
                <dd>{quote.arrival_window}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{quote.expected_duration}</dd>
              </div>
              <div>
                <dt>Included work</dt>
                <dd>{quote.included_work}</dd>
              </div>
              <div>
                <dt>Conditions</dt>
                <dd>{quote.conditions}</dd>
              </div>
            </dl>
            {quote.message && <p>{quote.message}</p>}
            {canAct && (
              <div className="customer-quote-actions">
                <Button
                  onClick={() => setPendingAccept(quote)}
                  disabled={respondingQuoteId !== null}
                >
                  Accept quote
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => onRespond(quote.quote_id, false)}
                  disabled={respondingQuoteId !== null}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        )
      })}

      {pendingAccept && (
        <QuoteActionModal
          businessName={pendingAccept.business_name}
          onCancel={() => setPendingAccept(null)}
          onConfirm={confirmAccept}
          isSaving={respondingQuoteId === pendingAccept.quote_id}
        />
      )}
    </section>
  )
}
