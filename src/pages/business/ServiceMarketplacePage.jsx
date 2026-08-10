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
          <label>
            <span>Filter</span>
            <select
              value={marketplace.urgencyFilter}
              onChange={(event) =>
                marketplace.setUrgencyFilter(event.target.value)
              }
            >
              {Object.entries(LEAD_URGENCY_FILTERS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Order</span>
            <select
              value={marketplace.leadOrder}
              onChange={(event) => marketplace.setLeadOrder(event.target.value)}
            >
              {Object.entries(LEAD_ORDER_OPTIONS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
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
          <label>
            <span>Status</span>
            <select
              value={marketplace.quoteStatus}
              onChange={(event) =>
                marketplace.setQuoteStatus(event.target.value)
              }
            >
              {BUSINESS_QUOTE_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Order</span>
            <select
              value={marketplace.quoteOrder}
              onChange={(event) =>
                marketplace.setQuoteOrder(event.target.value)
              }
            >
              {BUSINESS_QUOTE_ORDER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
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
          <label>
            <span>Status</span>
            <select
              value={marketplace.jobStatus}
              onChange={(event) => marketplace.setJobStatus(event.target.value)}
            >
              {BUSINESS_JOB_STATUS_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Order</span>
            <select
              value={marketplace.jobOrder}
              onChange={(event) => marketplace.setJobOrder(event.target.value)}
            >
              {BUSINESS_JOB_ORDER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
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
                isSaving={marketplace.isSaving}
                onComplete={marketplace.handleCompleteJob}
              />
            )
          })}
      </div>
    </>
  )
}
