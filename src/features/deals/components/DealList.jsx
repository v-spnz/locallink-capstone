import { useState } from 'react'
import Button from '../../../components/ui/Button'
import BusinessPageLoader from '../../../components/ui/BusinessPageLoader'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import {
  ArrowRight,
  BadgePercent,
  CircleAlert,
  MoreVertical as MoreHorizontal,
  Plus,
} from 'lucide-react'
import {
  DEAL_STATUS_FILTERS,
  getDealLifecycle,
  matchesDealStatusFilter,
} from '../constants'
import DealRow from './DealRow'
import { getExpiryDetail } from './dealListPresentation'
const PRIMARY_FILTER_VALUES = ['draft', 'active', 'scheduled']
const OVERFLOW_FILTER_VALUES = ['history', 'all']
const DEALS_PER_PAGE = 5

function getDealRecord(deal) {
  const lifecycle = getDealLifecycle(deal)
  const expiry =
    lifecycle.value === 'ended-early'
      ? {
          label: deal.endedAt
            ? `Ended ${new Date(deal.endedAt).toLocaleDateString('en-NZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}`
            : 'Ended early',
          tone: 'is-expired',
        }
      : getExpiryDetail(deal.endDate)

  return {
    deal,
    lifecycle,
    expiry,
    isEndingSoon: lifecycle.value === 'active' && expiry.tone === 'is-soon',
  }
}

export function DealListSkeleton() {
  return <BusinessPageLoader label="Loading deals…" />
}

export default function DealList({
  deals,
  selectedDealId,
  deleteConfirmationId,
  deletingDealId,
  cancelingDealId,
  onCreate,
  onSelect,
  onClose,
  onEdit,
  onRequestDelete,
  onCancelDeleteRequest,
  onConfirmDelete,
  onCancelScheduling,
  endingDealId,
  onRequestEnd,
  onEnd,
}) {
  const [activeFilter, setActiveFilter] = useState('draft')
  const [isOverflowOpen, setIsOverflowOpen] = useState(false)
  const [visibleDealCount, setVisibleDealCount] = useState(DEALS_PER_PAGE)

  const records = deals.map(getDealRecord)
  const endingSoonRecords = records.filter(({ isEndingSoon }) => isEndingSoon)
  const counts = Object.fromEntries(
    DEAL_STATUS_FILTERS.map(({ value }) => [
      value,
      records.filter(({ lifecycle }) =>
        matchesDealStatusFilter(lifecycle.value, value),
      ).length,
    ]),
  )
  const visibleRecords = records.filter(({ lifecycle }) =>
    matchesDealStatusFilter(lifecycle.value, activeFilter),
  )
  const displayedRecords = visibleRecords.slice(0, visibleDealCount)
  const hasMoreDeals = displayedRecords.length < visibleRecords.length
  const primaryFilters = DEAL_STATUS_FILTERS.filter(({ value }) =>
    PRIMARY_FILTER_VALUES.includes(value),
  )
  const overflowFilters = DEAL_STATUS_FILTERS.filter(({ value }) =>
    OVERFLOW_FILTER_VALUES.includes(value),
  )
  const activeFilterLabel =
    DEAL_STATUS_FILTERS.find(({ value }) => value === activeFilter)?.label ||
    'All'

  function selectFilter(value) {
    setActiveFilter(value)
    setVisibleDealCount(DEALS_PER_PAGE)
  }

  return (
    <section className="placeholder-section deal-list-panel">
      {deals.length > 0 && (
        <div className="deal-filter-bar">
          <div className="deal-filters" role="group" aria-label="Filter deals">
            {primaryFilters.map(({ value, label }) => (
              <button
                type="button"
                className={activeFilter === value ? 'is-active' : ''}
                aria-pressed={activeFilter === value}
                onClick={() => selectFilter(value)}
                key={value}
              >
                <span>{label}</span>
                <strong>{counts[value]}</strong>
              </button>
            ))}
            <span className="deal-filters-divider" aria-hidden="true" />
            <button
              type="button"
              className={`deal-filters-overflow-trigger${
                isOverflowOpen ? ' is-open' : ''
              }${
                overflowFilters.some(({ value }) => value === activeFilter)
                  ? ' is-active'
                  : ''
              }`}
              aria-expanded={isOverflowOpen}
              aria-label={
                isOverflowOpen ? 'Show fewer filters' : 'Show more filters'
              }
              onClick={() => setIsOverflowOpen((current) => !current)}
            >
              <MoreHorizontal aria-hidden="true" />
            </button>
            {isOverflowOpen &&
              overflowFilters.map(({ value, label }) => (
                <button
                  type="button"
                  className={activeFilter === value ? 'is-active' : ''}
                  aria-pressed={activeFilter === value}
                  onClick={() => selectFilter(value)}
                  key={value}
                >
                  <span>{label}</span>
                  <strong>{counts[value]}</strong>
                </button>
              ))}
          </div>
          <div className="deal-filter-actions">
            <Button onClick={onCreate}>
              <Plus aria-hidden="true" />
              New deal
            </Button>
          </div>
        </div>
      )}

      {endingSoonRecords.length > 0 && activeFilter === 'all' && (
        <section
          className="deal-attention"
          aria-labelledby="deal-attention-title"
        >
          <div className="deal-attention-heading">
            <span aria-hidden="true">
              <CircleAlert />
            </span>
            <div>
              <h3 id="deal-attention-title">Ending soon</h3>
              <p>
                {endingSoonRecords.length}{' '}
                {endingSoonRecords.length === 1
                  ? 'live deal ends'
                  : 'live deals end'}{' '}
                within seven days.
              </p>
            </div>
          </div>
          <div className="deal-attention-list">
            {endingSoonRecords.slice(0, 3).map(({ deal, expiry }) => (
              <button
                type="button"
                onClick={() => onSelect(deal.id)}
                key={deal.id}
              >
                <span>
                  <strong>{deal.title || 'Untitled deal'}</strong>
                  <small>{expiry.label}</small>
                </span>
                <span>
                  Review
                  <ArrowRight aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
        </section>
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
            <strong>Create your first local offer</strong>
            <p>
              Publish a clear, time-sensitive deal for customers near your
              business.
            </p>
            <Button onClick={onCreate}>Create deal</Button>
          </div>
        </div>
      )}

      {deals.length > 0 && visibleRecords.length === 0 && (
        <div className="deal-filter-empty" role="status">
          <BadgePercent aria-hidden="true" />
          <strong>No {activeFilterLabel.toLowerCase()} deals</strong>
          <p>Choose another filter to see the rest of your deals.</p>
          <Button variant="secondary" onClick={() => selectFilter('all')}>
            View all deals
          </Button>
        </div>
      )}

      {visibleRecords.length > 0 && (
        <div className="deal-campaign-table">
          <div className="deal-table-heading" aria-hidden="true">
            <span />
            <span>Deal</span>
            <span>Offer</span>
            <span>Status and dates</span>
            <span />
          </div>
          <div className="deal-card-list">
            {displayedRecords.map((record) => (
              <DealRow
                record={record}
                selected={selectedDealId === record.deal.id}
                deleteConfirmationId={deleteConfirmationId}
                deletingDealId={deletingDealId}
                cancelingDealId={cancelingDealId}
                isEnding={endingDealId === record.deal.id}
                onSelect={(dealId) => {
                  if (selectedDealId === dealId) onClose()
                  else onSelect(dealId)
                }}
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
                onCancelDeleteRequest={onCancelDeleteRequest}
                onConfirmDelete={onConfirmDelete}
                onCancelScheduling={onCancelScheduling}
                onRequestEnd={onRequestEnd}
                onEnd={onEnd}
                key={record.deal.id}
              />
            ))}
          </div>
          <div className="deal-list-pagination">
            <p aria-live="polite">
              Showing {displayedRecords.length} of {visibleRecords.length}
            </p>
            {hasMoreDeals && (
              <Button
                variant="secondary"
                onClick={() =>
                  setVisibleDealCount(
                    (currentCount) => currentCount + DEALS_PER_PAGE,
                  )
                }
              >
                Show more
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
