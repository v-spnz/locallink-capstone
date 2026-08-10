import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import BusinessQuoteTimeline from './BusinessQuoteTimeline'
import { formatMoney } from '../formatters'
import { QUOTE_PRICE_TYPES } from '../constants'

export default function BusinessQuoteCard({
  item,
  isWithdrawalConfirming,
  isWithdrawing,
  onRequestWithdraw,
  onCancelWithdraw,
  onConfirmWithdraw,
}) {
  const priceType = QUOTE_PRICE_TYPES.find(
    ({ value }) => value === item.price_type,
  )?.label

  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <h3>{item.title}</h3>
        </div>
      </div>
      {item.description && <p>{item.description}</p>}
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {item.suburb}, {item.city}
        </span>
        {item.created_at && (
          <span>{new Date(item.created_at).toLocaleDateString('en-NZ')}</span>
        )}
      </div>
      <BusinessQuoteTimeline quote={item} />
      <div className="service-quote-summary">
        <strong>
          {formatMoney(item.amount_cents)} {priceType && `· ${priceType}`}
        </strong>
        <span>Available {item.availability_date}</span>
        <span>Arrival: {item.arrival_window}</span>
        <span>Duration: {item.expected_duration}</span>
        <span>Included: {item.included_work}</span>
        <span>Conditions: {item.conditions}</span>
        {item.message && <span>Message: {item.message}</span>}
      </div>
      {item.quote_status === 'accepted' && (
        <Link
          className="btn-primary service-active-job-link"
          to="/business/services?tab=jobs"
        >
          View active job
        </Link>
      )}
      {item.quote_status === 'awaiting_response' && !isWithdrawalConfirming && (
        <Button variant="secondary" onClick={onRequestWithdraw}>
          Withdraw quote
        </Button>
      )}
      {item.quote_status === 'awaiting_response' && isWithdrawalConfirming && (
        <div className="service-withdraw-confirmation" role="alert">
          <strong>Withdraw this quote?</strong>
          <p>
            The consumer will no longer be able to accept it, and the quote
            cannot be edited or resubmitted.
          </p>
          <div>
            <Button
              variant="danger"
              onClick={onConfirmWithdraw}
              disabled={isWithdrawing}
            >
              {isWithdrawing ? 'Withdrawing…' : 'Confirm withdrawal'}
            </Button>
            <Button
              variant="secondary"
              onClick={onCancelWithdraw}
              disabled={isWithdrawing}
            >
              Keep quote
            </Button>
          </div>
        </div>
      )}
    </article>
  )
}
