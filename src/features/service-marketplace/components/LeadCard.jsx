import { useState } from 'react'
import {
  CalendarClock,
  Clock,
  MapPin,
  MessageSquareText,
  Play,
  ShieldCheck,
  X,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { getLeadDisplayDetails, isUrgentLead } from '../leadFilters'
import { getLeadMedia } from '../media'
import QuoteForm from './QuoteForm'
import QuoteReview from './QuoteReview'

export default function LeadCard({
  item,
  isSelected,
  quote,
  quoteErrors,
  quoteStep,
  isSaving,
  onQuote,
  onDecline,
  onQuoteChange,
  onReview,
  onEdit,
  onSubmit,
}) {
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const details = getLeadDisplayDetails(item)
  const deadline = new Date(details.quoteDeadline)
  const isUrgent = isUrgentLead(item)
  const media = getLeadMedia(item.image_urls)

  function toggleReview() {
    if (isReviewOpen && isSelected) onQuote()
    setIsReviewOpen((current) => !current)
    setIsConfirmingDecline(false)
  }

  return (
    <article className="service-marketplace-card">
      <div className="service-marketplace-card-head">
        <div>
          <span>{details.category}</span>
          <h3>{details.title}</h3>
        </div>
        <span className="service-status open">Open lead</span>
      </div>
      <div className="service-marketplace-meta">
        <span>
          <MapPin aria-hidden="true" />
          {details.suburb}, {item.city}
        </span>
        <span>
          <Clock aria-hidden="true" />
          {details.urgency}
        </span>
        <span>
          <MessageSquareText aria-hidden="true" />
          {details.quoteCount} of {details.maxQuotes} quotes
        </span>
        <span
          className={isUrgent ? 'service-marketplace-deadline is-urgent' : ''}
        >
          <CalendarClock aria-hidden="true" />
          {isUrgent ? 'Closing soon: ' : 'Quotes close '}
          {deadline.toLocaleString('en-NZ', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
      </div>

      <Button variant="secondary" onClick={toggleReview}>
        {isReviewOpen ? 'Hide opportunity' : 'Review opportunity'}
      </Button>

      {isReviewOpen && (
        <section
          className="service-opportunity-review"
          aria-label={`Review ${details.title}`}
        >
          <h4>Job details</h4>
          <dl className="service-opportunity-facts">
            <div>
              <dt>Category</dt>
              <dd>{details.category}</dd>
            </div>
            <div>
              <dt>Suburb</dt>
              <dd>{details.suburb}</dd>
            </div>
            <div>
              <dt>Urgency</dt>
              <dd>{details.urgency}</dd>
            </div>
          </dl>
          <div className="service-opportunity-copy">
            <h5>Description</h5>
            <p>{item.description}</p>
          </div>
          <div className="service-opportunity-media">
            <h5>Photos and videos</h5>
            {media.length === 0 ? (
              <p className="service-opportunity-empty-media">
                No photos or videos were supplied.
              </p>
            ) : (
              <div className="service-opportunity-media-grid">
                {media.map((asset, index) => (
                  <button
                    type="button"
                    key={asset.url}
                    onClick={() =>
                      setSelectedMedia({
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
            )}
          </div>

          <p className="service-opportunity-privacy">
            <ShieldCheck aria-hidden="true" />
            The consumer’s exact address and contact details stay private until
            a quote is accepted.
          </p>

          <div className="service-opportunity-actions">
            <Button onClick={onQuote} disabled={isSaving}>
              {isSelected
                ? 'Close quote form'
                : item.has_quote
                  ? 'Update quote'
                  : 'Create quote'}
            </Button>
            {!item.has_quote && (
              <Button
                variant="secondary"
                onClick={() => setIsConfirmingDecline(true)}
                disabled={isSaving}
              >
                Decline opportunity
              </Button>
            )}
          </div>

          {isConfirmingDecline && (
            <div
              className="service-decline-confirmation"
              role="alertdialog"
              aria-labelledby={`decline-${item.job_request_id}`}
            >
              <strong id={`decline-${item.job_request_id}`}>
                Decline this opportunity?
              </strong>
              <p>
                It will leave your active leads but remain available to other
                eligible providers.
              </p>
              <div>
                <Button
                  variant="danger"
                  onClick={onDecline}
                  disabled={isSaving}
                >
                  {isSaving ? 'Declining…' : 'Confirm decline'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmingDecline(false)}
                  disabled={isSaving}
                >
                  Keep opportunity
                </Button>
              </div>
            </div>
          )}

          {isSelected &&
            (quoteStep === 'review' ? (
              <QuoteReview
                quote={quote}
                isSaving={isSaving}
                onEdit={onEdit}
                onSubmit={onSubmit}
              />
            ) : (
              <QuoteForm
                quote={quote}
                errors={quoteErrors}
                isSaving={isSaving}
                onChange={onQuoteChange}
                onReview={onReview}
              />
            ))}
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
            aria-labelledby="job-media-preview-title"
          >
            <h2
              className="service-media-preview-title"
              id="job-media-preview-title"
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
