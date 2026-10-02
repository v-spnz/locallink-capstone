import { Search } from 'lucide-react'
import { LEAD_ORDER_OPTIONS, LEAD_URGENCY_FILTERS } from '../../leadFilters'
import {
  BUSINESS_JOB_ORDER_OPTIONS,
  BUSINESS_JOB_STATUS_OPTIONS,
} from '../../jobTracking'
import {
  BUSINESS_QUOTE_ORDER_OPTIONS,
  BUSINESS_QUOTE_STATUS_OPTIONS,
} from '../../quoteTracking'
import MarketplaceSelect from './MarketplaceSelect'

export default function MarketplaceToolbar({
  type,
  marketplace,
  onViewHistory,
}) {
  return (
    <>
      {type === 'leads' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar"
          aria-label="Job lead search and ordering"
        >
          <div className="service-marketplace-search">
            <Search className="marketplace-search-icon" aria-hidden="true" />
            <span id="service-leads-search-label">Search</span>
            <input
              aria-labelledby="service-leads-search-label"
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </div>
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
          <div className="service-marketplace-search">
            <Search className="marketplace-search-icon" aria-hidden="true" />
            <span id="service-quotes-search-label">Search</span>
            <input
              aria-labelledby="service-quotes-search-label"
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </div>
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
          <div className="service-marketplace-search">
            <Search className="marketplace-search-icon" aria-hidden="true" />
            <span id="service-jobs-search-label">Search</span>
            <input
              aria-labelledby="service-jobs-search-label"
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by keyword"
            />
          </div>
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

      {type === 'jobs' && onViewHistory && (
        <div className="service-history-link-row">
          <button
            type="button"
            className="service-history-link"
            onClick={onViewHistory}
          >
            View Job History
          </button>
        </div>
      )}

      {type === 'history' && !marketplace.isLoading && !marketplace.error && (
        <div
          className="service-marketplace-toolbar service-history-toolbar"
          aria-label="Search completed job history"
        >
          <div className="service-marketplace-search">
            <Search className="marketplace-search-icon" aria-hidden="true" />
            <span id="service-history-search-label">Search job history</span>
            <input
              aria-labelledby="service-history-search-label"
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search completed jobs"
            />
          </div>
        </div>
      )}
    </>
  )
}
