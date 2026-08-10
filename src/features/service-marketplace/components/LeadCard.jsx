import { useState } from 'react'
import {
  CalendarClock,
  Image as ImageIcon,
  MapPin,
  Play,
  ShieldCheck,
  Zap,
  X,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { getLeadDisplayDetails } from '../leadFilters'
import { getLeadMedia } from '../media'
import QuoteForm from './QuoteForm'
import QuoteReview from './QuoteReview'

function LeadMediaGrid({ media, onSelect }) {
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

export default function LeadCard({
  item,
  isReviewOpen,
  isSelected,
  quote,
  quoteErrors,
  quoteStep,
  isSaving,
  onQuote,
  onToggleReview,
  onShowReview,
  onDecline,
  onQuoteChange,
  onReview,
  onEdit,
  onSubmit,
}) {
  const [isConfirmingDecline, setIsConfirmingDecline] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const details = getLeadDisplayDetails(item)
  const deadline = new Date(details.quoteDeadline)
  const media = getLeadMedia(item.image_urls)
  const photoCount = media.filter(({ type }) => type === 'image').length
  const videoCount = media.filter(({ type }) => type === 'video').length
  const mediaSummary = `${photoCount} image${photoCount === 1 ? '' : 's'} · ${videoCount} video${videoCount === 1 ? '' : 's'}`

  function toggleReview() {
    onToggleReview()
    setIsConfirmingDecline(false)
  }

  function toggleQuoteForm() {
    setIsConfirmingDecline(false)
    onQuote()
  }

  function requestDecline() {
    if (isSelected) onQuote()
    onShowReview()
    setIsConfirmingDecline(true)
  }

  return (
    <article
      className={`service-marketplace-card service-lead-card${
        isReviewOpen ? ' is-expanded' : ''
      }`}
    >
      <div className="service-lead-summary">
        <div className="service-lead-copy">
          <div className="service-marketplace-card-head">
            <div>
              <h3>{details.title}</h3>
            </div>
          </div>
          <div className="service-marketplace-meta">
            <span>
              <MapPin aria-hidden="true" />
              {details.suburb}, {item.city}
            </span>
            <span className="service-lead-divider" aria-hidden="true">
              |
            </span>
            <span className="service-marketplace-deadline">
              <CalendarClock aria-hidden="true" />
              Quotes close{' '}
              {deadline.toLocaleDateString('en-NZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="service-lead-divider" aria-hidden="true">
              |
            </span>
            <span
              className={`service-lead-urgency is-${details.urgency.toLowerCase()}`}
            >
              {details.urgency === 'Urgent' ? (
                <Zap aria-hidden="true" />
              ) : (
                <span className="service-lead-urgency-dot" aria-hidden="true" />
              )}
              {details.urgency}
            </span>
          </div>
          <p className="service-lead-description">{item.description}</p>
        </div>
        <div className="service-lead-actions">
          <span className="service-lead-attachment-count">
            <ImageIcon aria-hidden="true" />
            {mediaSummary}
          </span>
          <div>
            <Button variant="secondary" onClick={toggleReview}>
              {isReviewOpen ? 'Hide details' : 'View details'}
            </Button>
            <Button onClick={toggleQuoteForm} disabled={isSaving}>
              {isSelected ? 'Close quote form' : 'Submit quote'}
            </Button>
          </div>
          <button
            className="service-lead-decline"
            type="button"
            onClick={requestDecline}
            disabled={isSaving}
          >
            Decline
          </button>
        </div>
      </div>

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
            <LeadMediaGrid media={media} onSelect={setSelectedMedia} />
          </div>

          <p className="service-opportunity-privacy">
            <ShieldCheck aria-hidden="true" />
            The consumer’s exact address and contact details stay private until
            a quote is accepted.
          </p>

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
        </section>
      )}

      {isSelected && (
        <Modal onClose={onQuote} maxWidthClassName="max-w-6xl">
          <section
            className="service-quote-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`quote-modal-${item.job_request_id}`}
          >
            <header>
              <div>
                <span>Submit a quote</span>
                <h2 id={`quote-modal-${item.job_request_id}`}>
                  {details.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onQuote}
                disabled={isSaving}
                aria-label="Close quote form"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <div className="service-quote-workspace">
              <aside className="service-quote-job-context">
                <h3>Job details</h3>
                <dl>
                  <div>
                    <dt>Location</dt>
                    <dd>
                      {details.suburb}, {item.city}
                    </dd>
                  </div>
                  <div>
                    <dt>Urgency</dt>
                    <dd>{details.urgency}</dd>
                  </div>
                  <div>
                    <dt>Quotes close</dt>
                    <dd>
                      {deadline.toLocaleDateString('en-NZ', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                </dl>
                <div className="service-quote-job-description">
                  <h4>Description</h4>
                  <p>{item.description}</p>
                </div>
                <div className="service-opportunity-media">
                  <h4>Attachments</h4>
                  <p className="service-quote-attachment-summary">
                    {mediaSummary}
                  </p>
                  <LeadMediaGrid media={media} onSelect={setSelectedMedia} />
                </div>
                <p className="service-opportunity-privacy">
                  <ShieldCheck aria-hidden="true" />
                  Exact address and contact details remain private until a quote
                  is accepted.
                </p>
              </aside>
              <div className="service-quote-modal-content">
                {quoteStep === 'review' ? (
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
                )}
              </div>
            </div>
          </section>
        </Modal>
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
