import { useState } from 'react'
import Button from '../../../components/ui/Button'
import localBusinessNeighbourhood from '../../../assets/images/local-business-neighbourhood.jpg'
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  ImageIcon,
  Plus,
} from 'lucide-react'
import {
  DEAL_STATUS_FILTERS,
  formatDealOffer,
  getDealLifecycle,
} from '../constants'
import DealDetails from './DealDetails'

function parseDealDate(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDealDate(value, includeYear = true) {
  const date = parseDealDate(value)
  return date
    ? date.toLocaleDateString('en-NZ', {
        day: 'numeric',
        month: 'short',
        ...(includeYear ? { year: 'numeric' } : {}),
      })
    : 'Not set'
}

function getExpiryDetail(endDate) {
  const expiry = parseDealDate(endDate)
  if (!expiry) return { label: 'End date not set', tone: 'is-unset' }

  expiry.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const difference = Math.ceil((expiry - today) / 86_400_000)

  if (difference < 0) {
    return { label: `Ended ${formatDealDate(endDate)}`, tone: 'is-expired' }
  }
  if (difference === 0) return { label: 'Ends today', tone: 'is-soon' }
  if (difference <= 7) {
    return {
      label: `Ends in ${difference} ${difference === 1 ? 'day' : 'days'}`,
      tone: 'is-soon',
    }
  }
  return { label: `Ends ${formatDealDate(endDate)}`, tone: '' }
}

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

function DealImage({ deal }) {
  return (
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
  )
}

function DealRow({
  record,
  selected,
  deleteConfirmationId,
  deletingDealId,
  cancelingDealId,
  onSelect,
  onEdit,
  onRequestDelete,
  onCancelDeleteRequest,
  onConfirmDelete,
  onCancelScheduling,
  isEnding,
  onRequestEnd,
  onEnd,
}) {
  const { deal, expiry, lifecycle } = record
  const detailId = `deal-details-${deal.id}`

  return (
    <article
      className={`deal-management-card${selected ? ' is-expanded' : ''}`}
    >
      <button
        type="button"
        className="deal-list-row"
        onClick={() => onSelect(deal.id)}
        aria-expanded={selected}
        aria-controls={detailId}
      >
        <DealImage deal={deal} />

        <span className="deal-card-copy">
          <small>{deal.category || 'Uncategorised deal'}</small>
          <strong className="deal-card-title">
            {deal.title || 'Untitled deal draft'}
          </strong>
          <span className="deal-card-description">
            {deal.description ||
              'Add a short description to explain what customers receive.'}
          </span>
        </span>

        <span className="deal-card-offer">
          <small>Offer</small>
          <strong>{formatDealOffer(deal) || 'Not set'}</strong>
        </span>

        <span className="deal-card-timing">
          <span className={`deal-status is-${lifecycle.value}`}>
            {lifecycle.label}
          </span>
          <span className={`deal-card-expiry ${expiry.tone}`}>
            <CalendarDays aria-hidden="true" />
            {expiry.label}
          </span>
          <small>
            {deal.startDate
              ? `${formatDealDate(deal.startDate, false)} to ${formatDealDate(deal.endDate, false)}`
              : 'Dates not set'}
          </small>
        </span>

        <span className="deal-card-disclosure" aria-hidden="true">
          <span>{selected ? 'Close' : 'Details'}</span>
          <ChevronDown />
        </span>
      </button>

      {selected && (
        <DealDetails
          id={detailId}
          deal={deal}
          lifecycle={lifecycle}
          isDeleteConfirming={deleteConfirmationId === deal.id}
          isDeleting={deletingDealId === deal.id}
          isCanceling={cancelingDealId === deal.id}
          onClose={() => onSelect(deal.id)}
          onEdit={() => onEdit(deal.id)}
          onRequestDelete={onRequestDelete}
          onCancelDeleteRequest={onCancelDeleteRequest}
          onConfirmDelete={onConfirmDelete}
          onCancelScheduling={onCancelScheduling}
          canEnd={lifecycle.value === 'active'}
          isEnding={isEnding}
          onRequestEnd={() => onRequestEnd(deal.id)}
          onEnd={() => onEnd(deal.id)}
        />
      )}
    </article>
  )
}

export function DealListSkeleton() {
  return (
    <section
      className="placeholder-section deal-list-panel deal-list-skeleton"
      role="status"
      aria-label="Loading deals"
    >
      <div className="deal-list-header" aria-hidden="true">
        <div>
          <span className="deal-skeleton-line is-heading" />
          <span className="deal-skeleton-line is-copy" />
        </div>
        <span className="deal-skeleton-button" />
      </div>
      <div className="deal-filter-bar" aria-hidden="true">
        <div className="deal-filters deal-skeleton-filters">
          {DEAL_STATUS_FILTERS.map(({ value }) => (
            <span className="deal-skeleton-filter" key={value} />
          ))}
        </div>
      </div>
      <div className="deal-card-list" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <span className="deal-skeleton-row" key={item}>
            <span className="deal-skeleton-image" />
            <span className="deal-skeleton-copy">
              <span className="deal-skeleton-line is-label" />
              <span className="deal-skeleton-line is-title" />
              <span className="deal-skeleton-line is-copy" />
            </span>
            <span className="deal-skeleton-line is-offer" />
            <span className="deal-skeleton-line is-status" />
          </span>
        ))}
      </div>
    </section>
  )
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
  const [activeFilter, setActiveFilter] = useState('all')
  const records = deals.map(getDealRecord)
  const endingSoonRecords = records.filter(({ isEndingSoon }) => isEndingSoon)
  const counts = {
    all: records.length,
    draft: records.filter(({ lifecycle }) => lifecycle.value === 'draft')
      .length,
    scheduled: records.filter(
      ({ lifecycle }) => lifecycle.value === 'scheduled',
    ).length,
    active: records.filter(({ lifecycle }) => lifecycle.value === 'active')
      .length,
    expired: records.filter(({ lifecycle }) => lifecycle.value === 'expired')
      .length,
    ended_early: records.filter(
      ({ lifecycle }) => lifecycle.value === 'ended_early',
    ).length,
  }
  const visibleRecords = records.filter(
    (record) =>
      activeFilter === 'all' || record.lifecycle.value === activeFilter,
  )
  const activeFilterLabel =
    DEAL_STATUS_FILTERS.find(({ value }) => value === activeFilter)?.label ||
    'All'

  return (
    <section className="placeholder-section deal-list-panel">
      <div className="deal-list-header">
        <Button onClick={onCreate}>
          <Plus aria-hidden="true" />
          New deal
        </Button>
      </div>

      {deals.length > 0 && (
        <div className="deal-filter-bar">
          <div className="deal-filters" role="group" aria-label="Filter deals">
            {DEAL_STATUS_FILTERS.map(({ value, label }) => (
              <button
                type="button"
                className={activeFilter === value ? 'is-active' : ''}
                aria-pressed={activeFilter === value}
                onClick={() => setActiveFilter(value)}
                key={value}
              >
                <span>{label}</span>
                <strong>{counts[value]}</strong>
              </button>
            ))}
          </div>
          <p aria-live="polite">
            Showing {visibleRecords.length} of {records.length}
          </p>
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
          <Button variant="secondary" onClick={() => setActiveFilter('all')}>
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
            {visibleRecords.map((record) => (
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
        </div>
      )}
    </section>
  )
}
