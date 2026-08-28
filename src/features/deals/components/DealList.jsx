import Button from '../../../components/ui/Button'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import {
  BadgePercent,
  CalendarDays,
  ChevronDown,
  Clock3,
  ImageIcon,
  Info,
  MapPin,
  Plus,
} from 'lucide-react'
import { formatDealOffer } from '../constants'
import DealDetails from './DealDetails'

function parseDealDate(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDealDate(value) {
  const date = parseDealDate(value)
  return date
    ? date.toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Date not set'
}

function getExpiryDetail(endDate) {
  const expiry = parseDealDate(endDate)
  if (!expiry) return { label: 'Expiry not set', tone: 'is-unset' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const difference = Math.ceil((expiry - today) / 86_400_000)

  if (difference < 0) {
    return { label: `Expired ${formatDealDate(endDate)}`, tone: 'is-expired' }
  }
  if (difference === 0) return { label: 'Expires today', tone: 'is-soon' }
  if (difference <= 7) {
    return {
      label: `Expires in ${difference} ${difference === 1 ? 'day' : 'days'}`,
      tone: 'is-soon',
    }
  }
  return { label: `Expires ${formatDealDate(endDate)}`, tone: '' }
}

export default function DealList({
  deals,
  locations,
  selectedDealId,
  successMessage,
  onCreate,
  onSelect,
  onClose,
  onEdit,
}) {
  const publishedCount = deals.filter(
    ({ status }) => status === 'published',
  ).length
  const draftCount = deals.length - publishedCount
  const endingSoonCount = deals.filter((deal) => {
    const expiry = getExpiryDetail(deal.endDate)
    return deal.status === 'published' && expiry.tone === 'is-soon'
  }).length

  return (
    <section className="placeholder-section deal-list-panel">
      <div className="deal-list-header">
        <div>
          <h2>All deals</h2>
          <p>Published offers and private drafts.</p>
        </div>
        <Button onClick={onCreate}>
          <Plus aria-hidden="true" />
          New deal
        </Button>
      </div>
      {successMessage && <p className="form-success">{successMessage}</p>}
      {deals.length > 0 && (
        <dl className="deal-list-summary" aria-label="Deal summary">
          <div>
            <dt>Total deals</dt>
            <dd>{deals.length}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{publishedCount}</dd>
          </div>
          <div>
            <dt>Private drafts</dt>
            <dd>{draftCount}</dd>
          </div>
          <div>
            <dt>Ending soon</dt>
            <dd>{endingSoonCount}</dd>
          </div>
        </dl>
      )}
      {deals.length === 0 && (
        <div className="deal-empty-state">
          <div className="deal-empty-visual">
            <img
              src={localBusinessNeighbourhood}
              alt="A local produce and flower shop welcoming a customer"
            />
          </div>
          <div className="deal-empty-copy">
            <span aria-hidden="true">
              <BadgePercent />
            </span>
            <strong>Your first local offer starts here</strong>
            <p>
              Turn a quiet afternoon, seasonal product or customer favourite
              into a clear offer people nearby can discover.
            </p>
            <Button onClick={onCreate}>Create your first deal</Button>
          </div>
        </div>
      )}
      {deals.length > 0 && (
        <div className="deal-card-list">
          {deals.map((deal) => {
            const selected = selectedDealId === deal.id
            const expiry = getExpiryDetail(deal.endDate)
            const locationCount = deal.locationIds.length

            return (
              <article
                className={`deal-management-card${selected ? ' is-expanded' : ''}`}
                key={deal.id}
              >
                <button
                  type="button"
                  className="deal-list-row"
                  onClick={() => onSelect(deal.id)}
                  aria-expanded={selected}
                >
                  <span className="deal-card-media">
                    {deal.imageUrl ? (
                      <img
                        src={deal.imageUrl}
                        alt={`Promotion for ${deal.title || 'deal draft'}`}
                      />
                    ) : (
                      <span aria-label="No deal image">
                        <ImageIcon aria-hidden="true" />
                      </span>
                    )}
                  </span>

                  <span className="deal-card-copy">
                    <span className="deal-card-heading">
                      <span>
                        <small>{deal.category || 'Uncategorised deal'}</small>
                        <strong>{deal.title || 'Untitled deal draft'}</strong>
                      </span>
                      <span
                        className={`deal-status ${
                          deal.status === 'draft' ? 'is-draft' : ''
                        }`}
                      >
                        {deal.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </span>

                    <span className="deal-card-offer">
                      {formatDealOffer(deal) || 'Offer details not set'}
                    </span>
                    <span className="deal-card-description">
                      {deal.description ||
                        'Add a short description to explain what customers receive.'}
                    </span>

                    <span className="deal-card-meta">
                      <span className={expiry.tone}>
                        <Clock3 aria-hidden="true" />
                        {expiry.label}
                      </span>
                      <span>
                        <CalendarDays aria-hidden="true" />
                        {deal.startDate
                          ? `Starts ${formatDealDate(deal.startDate)}`
                          : 'Start date not set'}
                      </span>
                      <span>
                        <MapPin aria-hidden="true" />
                        {locationCount > 0
                          ? `${locationCount} ${locationCount === 1 ? 'location' : 'locations'}`
                          : 'No locations selected'}
                      </span>
                    </span>

                    <span className="deal-card-condition">
                      <Info aria-hidden="true" />
                      <span>
                        <strong>Conditions</strong>
                        {deal.conditions || 'No conditions added yet.'}
                      </span>
                    </span>
                  </span>

                  <span className="deal-card-disclosure" aria-hidden="true">
                    <ChevronDown />
                  </span>
                </button>
                {selected && (
                  <DealDetails
                    deal={deal}
                    locations={locations}
                    onClose={onClose}
                    onEdit={() => onEdit(deal.id)}
                  />
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
