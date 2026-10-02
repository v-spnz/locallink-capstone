import ActionToast from '../../../../components/ui/ActionToast'
import BusinessPageLoader from '../../../../components/ui/BusinessPageLoader'
import ActiveJobCard from '../ActiveJobCard'
import BusinessQuoteCard from '../BusinessQuoteCard'
import LeadCard from '../LeadCard'
import { getMarketplaceEmptyMessage } from '../../constants'
import MarketplaceEmptyState from './MarketplaceEmptyState'
import MarketplaceToolbar from './MarketplaceToolbar'
import '../../ServiceMarketplace.css'

export default function BusinessMarketplaceContent({
  type,
  marketplace,
  onViewHistory,
}) {
  const hasFilters =
    Boolean(marketplace.search.trim()) ||
    (type === 'leads' && marketplace.urgencyFilter !== 'all') ||
    (type === 'quotes' && marketplace.quoteStatus !== 'all') ||
    (type === 'jobs' && marketplace.jobStatus !== 'all')

  function resetFilters() {
    marketplace.setSearch('')
    if (type === 'leads') marketplace.setUrgencyFilter('all')
    if (type === 'quotes') marketplace.setQuoteStatus('all')
    if (type === 'jobs') marketplace.setJobStatus('all')
  }

  return (
    <>
      {marketplace.error && marketplace.feedback?.variant !== 'error' && (
        <div className="auth-error service-marketplace-message" role="alert">
          {marketplace.error}
        </div>
      )}
      {marketplace.feedback && (
        <ActionToast
          message={marketplace.feedback.message}
          variant={marketplace.feedback.variant}
          onDismiss={marketplace.dismissFeedback}
        />
      )}

      <MarketplaceToolbar
        type={type}
        marketplace={marketplace}
        onViewHistory={onViewHistory}
      />

      {!marketplace.isLoading && !marketplace.error && (
        <div className="marketplace-results">
          <span role="status">
            {marketplace.items.length}{' '}
            {hasFilters ? `of ${marketplace.totalItems} ` : ''}
            {type === 'history' ? 'completed jobs' : type}
          </span>
          {hasFilters && (
            <button type="button" onClick={resetFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}
      <div
        className="service-marketplace-list"
        aria-busy={marketplace.isLoading}
      >
        {marketplace.isLoading && (
          <BusinessPageLoader
            contained
            label={`Loading ${type === 'history' ? 'job history' : type}…`}
          />
        )}
        {!marketplace.isLoading &&
          !marketplace.error &&
          marketplace.items.length === 0 && (
            <MarketplaceEmptyState
              type={type}
              totalItems={marketplace.totalItems}
              message={getMarketplaceEmptyMessage(type, marketplace.totalItems)}
              onReset={resetFilters}
            />
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
                  isDetailsOpen={marketplace.reviewedQuote === item.quote_id}
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
                  onToggleDetails={() =>
                    marketplace.toggleQuoteReview(item.quote_id)
                  }
                />
              )
            } else {
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
            }
          })}
      </div>
    </>
  )
}
