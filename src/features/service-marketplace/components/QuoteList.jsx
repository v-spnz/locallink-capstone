import Button from '../../../components/ui/Button'
import { formatMoney, formatStatus } from '../formatters'

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
      {quotes.map((quote) => (
        <div className="customer-quote" key={quote.quote_id}>
          <div className="customer-quote-head">
            <div>
              <strong>{quote.business_name}</strong>
              <span>{formatMoney(quote.amount_cents)}</span>
            </div>
            <span className={`customer-quote-status ${quote.quote_status}`}>
              {formatStatus(quote.quote_status)}
            </span>
          </div>
          <p>{quote.message}</p>
          {jobStatus === 'open' && quote.quote_status === 'submitted' && (
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
      ))}
    </section>
  )
}
