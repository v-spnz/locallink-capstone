import { useState } from 'react'
import Button from '../../../components/ui/Button'
import {
  formatMoney,
  formatStatus,
  getInitials,
  getAvatarColor,
} from '../formatters'
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
  const [pendingAction, setPendingAction] = useState(null) // { quote, type: 'accept' | 'decline' }

  async function confirmPendingAction() {
    await onRespond(
      pendingAction.quote.quote_id,
      pendingAction.type === 'accept',
    )
    setPendingAction(null)
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
          <div className="sm-quote-card" key={quote.quote_id}>
            <div className="sm-quote-card-head">
              <div className="sm-quote-biz">
                <span
                  className="sm-quote-avatar"
                  style={{ background: getAvatarColor(quote.business_id) }}
                >
                  {getInitials(quote.business_name)}
                </span>
                <div>
                  <div className="sm-quote-biz-name">{quote.business_name}</div>
                  {repeatBusinessIds.has(quote.business_id) && (
                    <span className="sm-repeat-tag">Previously Hired</span>
                  )}
                </div>
              </div>
              <div className="sm-quote-price-block">
                <span className="sm-quote-price">
                  {formatMoney(quote.amount_cents)}
                </span>
                {priceType && (
                  <span className="sm-quote-price-type">{priceType}</span>
                )}
                <div>
                  <span
                    className={`customer-quote-status ${quote.quote_status}`}
                  >
                    {formatStatus(quote.quote_status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="sm-quote-facts">
              <div>
                <div className="sm-quote-fact-label">Available</div>
                <div className="sm-quote-fact-value">
                  {quote.availability_date}
                </div>
              </div>
              <div>
                <div className="sm-quote-fact-label">Arrival</div>
                <div className="sm-quote-fact-value">
                  {quote.arrival_window}
                </div>
              </div>
              <div>
                <div className="sm-quote-fact-label">Duration</div>
                <div className="sm-quote-fact-value">
                  {quote.expected_duration}
                </div>
              </div>
              <div>
                <div className="sm-quote-fact-label">Included work</div>
                <div className="sm-quote-fact-value">{quote.included_work}</div>
              </div>
              <div className="sm-quote-fact-full">
                <div className="sm-quote-fact-label">Conditions</div>
                <div className="sm-quote-fact-value">{quote.conditions}</div>
              </div>
            </div>

            {quote.message && (
              <p className="sm-quote-message">{quote.message}</p>
            )}

            {canAct && (
              <>
                <hr className="sm-quote-divider" />
                <div className="sm-quote-actions">
                  <Button
                    className="sm-quote-accept-btn"
                    onClick={() => setPendingAction({ quote, type: 'accept' })}
                    disabled={respondingQuoteId !== null}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Accept quote
                  </Button>
                  <Button
                    variant="secondary"
                    className="sm-quote-decline-btn"
                    onClick={() => setPendingAction({ quote, type: 'decline' })}
                    disabled={respondingQuoteId !== null}
                  >
                    Decline
                  </Button>
                </div>
              </>
            )}
          </div>
        )
      })}

      {pendingAction && (
        <QuoteActionModal
          action={pendingAction.type}
          businessName={pendingAction.quote.business_name}
          onCancel={() => setPendingAction(null)}
          onConfirm={confirmPendingAction}
          isSaving={respondingQuoteId === pendingAction.quote.quote_id}
        />
      )}
    </section>
  )
}
