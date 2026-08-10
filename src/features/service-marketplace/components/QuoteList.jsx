import Button from '../../../components/ui/Button'
import { formatMoney, formatStatus } from '../formatters'
import { QUOTE_PRICE_TYPES } from '../constants'

export default function QuoteList({
  jobStatus,
  quotes,
  respondingQuoteId,
  onRespond,
}) {
  return (
    <section className="customer-job-quotes">
      <h4>
        {quotes.length} quote{quotes.length === 1 ? '' : 's'} received
      </h4>
      {quotes.length === 0 && (
        <p className="customer-job-no-quotes">
          Local businesses can view this request when its category and area
          match their services.
        </p>
      )}
      {quotes.map((quote) => {
        const priceType = QUOTE_PRICE_TYPES.find(
          ({ value }) => value === quote.price_type,
        )?.label

        return (
          <div className="customer-quote" key={quote.quote_id}>
            <div className="customer-quote-head">
              <div>
                <strong>{quote.business_name}</strong>
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
            {jobStatus === 'open' &&
              ['awaiting_response', 'submitted'].includes(
                quote.quote_status,
              ) && (
                <div className="customer-quote-actions">
                  <Button
                    onClick={() => onRespond(quote.quote_id, true)}
                    disabled={respondingQuoteId !== null}
                  >
                    {respondingQuoteId === quote.quote_id
                      ? 'Saving…'
                      : 'Accept quote'}
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
    </section>
  )
}
