import { useState } from 'react'
import { MapPin, Play, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import BusinessQuoteTimeline from './BusinessQuoteTimeline'
import { formatMoney } from '../formatters'
import { QUOTE_PRICE_TYPES } from '../constants'
import { getLeadMedia } from '../media'

function JobRequestMediaGrid({ media, onSelect }) {
  if (media.length === 0) {
    return (
      <p className="service-opportunity-empty-media">
        No photos or videos were supplied.
      </p>
    )
  }

  return (
    <div className="service-opportunity-media-grid">
      {media.map((asset, index) => (
        <button
          type="button"
          key={asset.url}
          onClick={() =>
            onSelect({
              ...asset,
              label: `Job attachment ${index + 1}`,
            })
          }
          aria-label={`Enlarge job ${asset.type} ${index + 1}`}
        >
          {asset.type === 'video' ? (
            <>
              <video muted preload="metadata">
                <source src={asset.url} />
              </video>
              <span className="service-media-play" aria-hidden="true">
                <Play />
              </span>
            </>
          ) : (
            <img
              src={asset.url}
              alt={`Job attachment ${index + 1}`}
              loading="lazy"
            />
          )}
        </button>
      ))}
    </div>
  )
}

export default function BusinessQuoteCard({
  item,
  isDetailsOpen,
  isWithdrawalConfirming,
  isWithdrawing,
  onToggleDetails,
  onRequestWithdraw,
  onCancelWithdraw,
  onConfirmWithdraw,
}) {
  const [selectedMedia, setSelectedMedia] = useState(null)
  const priceType = QUOTE_PRICE_TYPES.find(
    ({ value }) => value === item.price_type,
  )?.label
  const media = getLeadMedia(item.image_urls)
  const originalQuoteDeadline = new Date(item.quote_deadline)
  const hasOriginalQuoteDeadline =
    item.quote_deadline && !Number.isNaN(originalQuoteDeadline.getTime())

  return (
    <article
      id={`service-item-quotes-${item.quote_id}`}
      className={`service-marketplace-card service-quote-card${
        isDetailsOpen ? ' is-expanded' : ''
      }`}
    >
      <div className="service-quote-card-summary">
        <div className="service-quote-card-copy">
          <div className="service-marketplace-card-head">
            <div>
              <h3>{item.title}</h3>
            </div>
          </div>
          {item.description && (
            <p className="service-quote-description">{item.description}</p>
          )}
          <div className="service-marketplace-meta">
            <span>
              <MapPin aria-hidden="true" />
              {item.suburb}, {item.city}
            </span>
            {item.created_at && (
              <span className="service-marketplace-timestamp">
                Submitted{' '}
                {new Date(item.created_at).toLocaleDateString('en-NZ')}
              </span>
            )}
          </div>
        </div>
        <div className="service-quote-card-actions">
          <Button variant="secondary" onClick={onToggleDetails}>
            {isDetailsOpen ? 'Hide details' : 'View details'}
          </Button>
        </div>
      </div>

      {isDetailsOpen && (
        <section
          className="service-quote-details"
          aria-label={`Quote details for ${item.title}`}
        >
          <BusinessQuoteTimeline quote={item} />

          <section className="service-quote-request-review">
            <h4>Original job request</h4>
            <dl className="service-opportunity-facts">
              <div>
                <dt>Category</dt>
                <dd>{item.category}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {item.suburb}, {item.city}
                </dd>
              </div>
              <div>
                <dt>Urgency</dt>
                <dd>{item.urgency}</dd>
              </div>
              {hasOriginalQuoteDeadline && (
                <div>
                  <dt>Quotes close</dt>
                  <dd>
                    {originalQuoteDeadline.toLocaleDateString('en-NZ', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </dl>
            <div className="service-opportunity-copy">
              <h5>Description</h5>
              <p>{item.description}</p>
            </div>
            <div className="service-opportunity-media">
              <h5>Photos and videos</h5>
              <JobRequestMediaGrid media={media} onSelect={setSelectedMedia} />
            </div>
            <p className="service-opportunity-privacy">
              <ShieldCheck aria-hidden="true" />
              The consumer’s exact address and contact details stay private
              until a quote is accepted.
            </p>
          </section>

          <section className="service-submitted-quote-review">
            <h4>Your submitted quote</h4>
            <div className="service-quote-summary">
              <strong className="business-structured-data">
                {formatMoney(item.amount_cents)} {priceType && `· ${priceType}`}
              </strong>
              <span className="business-structured-data">
                Available {item.availability_date}
              </span>
              <span className="business-structured-data">
                Arrival: {item.arrival_window}
              </span>
              <span className="business-structured-data">
                Duration: {item.expected_duration}
              </span>
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
            {item.quote_status === 'awaiting_response' &&
              !isWithdrawalConfirming && (
                <Button variant="secondary" onClick={onRequestWithdraw}>
                  Withdraw quote
                </Button>
              )}
            {item.quote_status === 'awaiting_response' &&
              isWithdrawalConfirming && (
                <div className="service-withdraw-confirmation" role="alert">
                  <strong>Withdraw this quote?</strong>
                  <p>
                    The consumer will no longer be able to accept it, and the
                    quote cannot be edited or resubmitted.
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
          </section>
        </section>
      )}

      {selectedMedia && (
        <Modal
          onClose={() => setSelectedMedia(null)}
          maxWidthClassName="max-w-[calc(100vw-2rem)]"
          widthClassName="w-fit"
        >
          <section
            className="service-image-lightbox"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quote-job-media-preview-${item.quote_id}`}
          >
            <h2
              className="service-media-preview-title"
              id={`quote-job-media-preview-${item.quote_id}`}
            >
              Job {selectedMedia.type} preview
            </h2>
            <button
              className="service-media-preview-close"
              type="button"
              onClick={() => setSelectedMedia(null)}
              aria-label="Close media preview"
            >
              <X aria-hidden="true" />
            </button>
            <div>
              {selectedMedia.type === 'video' ? (
                <video controls preload="metadata">
                  <source src={selectedMedia.url} />
                  Your browser cannot play this video.
                </video>
              ) : (
                <img src={selectedMedia.url} alt={selectedMedia.label} />
              )}
            </div>
          </section>
        </Modal>
      )}
    </article>
  )
}
