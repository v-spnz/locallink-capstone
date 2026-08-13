import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Funnel } from 'lucide-react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ActiveJobCard from '../../features/service-marketplace/components/ActiveJobCard'
import BusinessQuoteCard from '../../features/service-marketplace/components/BusinessQuoteCard'
import LeadCard from '../../features/service-marketplace/components/LeadCard'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { getMarketplaceEmptyMessage } from '../../features/service-marketplace/constants'
import {
  LEAD_ORDER_OPTIONS,
  LEAD_URGENCY_FILTERS,
} from '../../features/service-marketplace/leadFilters'
import {
  BUSINESS_JOB_ORDER_OPTIONS,
  BUSINESS_JOB_STATUS_OPTIONS,
} from '../../features/service-marketplace/jobTracking'
import {
  BUSINESS_QUOTE_ORDER_OPTIONS,
  BUSINESS_QUOTE_STATUS_OPTIONS,
} from '../../features/service-marketplace/quoteTracking'
import '../../features/service-marketplace/ServiceMarketplace.css'

function MarketplaceSelect({
  label,
  value,
  options,
  onChange,
  variant,
  useLabelForAll = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selectedLabel = options.find((option) => option.value === value)?.label
  const displayLabel = useLabelForAll && value === 'all' ? label : selectedLabel

  useEffect(() => {
    if (!isOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div
      className={`service-toolbar-select is-${variant}${isOpen ? ' is-open' : ''}`}
      ref={dropdownRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <button
        type="button"
        className="service-toolbar-select-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {variant === 'filter' && <Funnel aria-hidden="true" />}
        <span>{displayLabel || label}</span>
        {variant !== 'filter' && (
          <ChevronDown className="service-toolbar-chevron" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <div className="service-toolbar-menu" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              type="button"
              className={option.value === value ? 'is-selected' : ''}
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ServiceMarketplacePage({ type }) {
  const marketplace = useBusinessMarketplace(type)

  return <ServiceMarketplaceContent type={type} marketplace={marketplace} />
}

export function ServiceMarketplaceContent({ type, marketplace }) {
  return (
    <>
      {marketplace.error && (
        <div className="auth-error service-marketplace-message" role="alert">
          {marketplace.error}
        </div>
      )}
      {marketplace.success && (
        <div className="auth-success service-marketplace-message" role="status">
          {marketplace.success}
        </div>
      )}

      {type === 'leads' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar"
          aria-label="Job lead search and ordering"
        >
          <label className="service-marketplace-search">
            <span>Search</span>
            <input
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </label>
          <div className="service-toolbar-controls">
            <MarketplaceSelect
              label="Filter"
              variant="filter"
              value={marketplace.urgencyFilter}
              options={Object.entries(LEAD_URGENCY_FILTERS).map(
                ([value, label]) => ({ value, label }),
              )}
              onChange={marketplace.setUrgencyFilter}
              useLabelForAll
            />
            <MarketplaceSelect
              label="Order"
              variant="order"
              value={marketplace.leadOrder}
              options={Object.entries(LEAD_ORDER_OPTIONS).map(
                ([value, label]) => ({ value, label }),
              )}
              onChange={marketplace.setLeadOrder}
            />
          </div>
        </div>
      )}

      {type === 'quotes' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar service-quote-toolbar"
          aria-label="Search, filter, and order submitted quotes"
        >
          <label className="service-marketplace-search">
            <span>Search</span>
            <input
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </label>
          <div className="service-toolbar-controls">
            <MarketplaceSelect
              label="Filter"
              variant="filter"
              value={marketplace.quoteStatus}
              options={BUSINESS_QUOTE_STATUS_OPTIONS}
              onChange={marketplace.setQuoteStatus}
              useLabelForAll
            />
            <MarketplaceSelect
              label="Order"
              variant="order"
              value={marketplace.quoteOrder}
              options={BUSINESS_QUOTE_ORDER_OPTIONS}
              onChange={marketplace.setQuoteOrder}
            />
          </div>
        </div>
      )}

      {type === 'jobs' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar service-quote-toolbar"
          aria-label="Search, filter, and order jobs"
        >
          <label className="service-marketplace-search">
            <span>Search</span>
            <input
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </label>
          <div className="service-toolbar-controls">
            <MarketplaceSelect
              label="Filter"
              variant="filter"
              value={marketplace.jobStatus}
              options={BUSINESS_JOB_STATUS_OPTIONS}
              onChange={marketplace.setJobStatus}
              useLabelForAll
            />
            <MarketplaceSelect
              label="Order"
              variant="order"
              value={marketplace.jobOrder}
              options={BUSINESS_JOB_ORDER_OPTIONS}
              onChange={marketplace.setJobOrder}
            />
          </div>
        </div>
      )}

      {type === 'history' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar service-history-toolbar"
          aria-label="Search completed job history"
        >
          <label className="service-marketplace-search">
            <span>Search job history</span>
            <input
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search completed jobs"
            />
          </label>
        </div>
      )}

      <div className="service-marketplace-list">
        {marketplace.isLoading && <LoadingSpinner />}
        {!marketplace.isLoading &&
          !marketplace.error &&
          marketplace.items.length === 0 && (
            <div className="empty-state">
              {getMarketplaceEmptyMessage(type, marketplace.totalItems)}
            </div>
          )}
        {!marketplace.isLoading &&
          marketplace.items.map((item) => {
            if (type === 'leads') {
              return (
                <LeadCard
                  key={item.job_request_id}
                  item={item}
                  isReviewOpen={
                    marketplace.reviewedLead === item.job_request_id
                  }
                  isSelected={marketplace.selectedLead === item.job_request_id}
                  quote={marketplace.quote}
                  quoteErrors={marketplace.quoteErrors}
                  quoteStep={marketplace.quoteStep}
                  isSaving={marketplace.isSaving}
                  onQuote={() => marketplace.toggleLead(item.job_request_id)}
                  onToggleReview={() =>
                    marketplace.toggleLeadReview(item.job_request_id)
                  }
                  onShowReview={() =>
                    marketplace.showLeadReview(item.job_request_id)
                  }
                  onDecline={() =>
                    marketplace.handleDeclineOpportunity(item.job_request_id)
                  }
                  onQuoteChange={marketplace.setQuoteField}
                  onReview={marketplace.handleQuoteReview}
                  onEdit={marketplace.handleQuoteEdit}
                  onSubmit={marketplace.handleQuoteSubmit}
                />
              )
            }
            if (type === 'quotes') {
              return (
                <BusinessQuoteCard
                  key={item.quote_id}
                  item={item}
                  isWithdrawalConfirming={
                    marketplace.withdrawConfirmationId === item.quote_id
                  }
                  isWithdrawing={
                    marketplace.withdrawingQuoteId === item.quote_id
                  }
                  onRequestWithdraw={() =>
                    marketplace.setWithdrawConfirmationId(item.quote_id)
                  }
                  onCancelWithdraw={() =>
                    marketplace.setWithdrawConfirmationId(null)
                  }
                  onConfirmWithdraw={() =>
                    marketplace.handleWithdrawQuote(item.quote_id)
                  }
                />
              )
            }
            return (
              <ActiveJobCard
                key={item.quote_id ?? item.job_request_id}
                item={item}
                isHistory={type === 'history'}
                isUpdating={marketplace.updatingJobId === item.job_request_id}
                onAdvanceStatus={() =>
                  marketplace.handleAdvanceJobStatus(
                    item.job_request_id,
                    item.job_status,
                  )
                }
              />
            )
          })}
      </div>
    </>
  )
}
