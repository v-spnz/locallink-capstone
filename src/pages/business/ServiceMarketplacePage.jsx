import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ActiveJobCard from '../../features/service-marketplace/components/ActiveJobCard'
import BusinessQuoteCard from '../../features/service-marketplace/components/BusinessQuoteCard'
import LeadCard from '../../features/service-marketplace/components/LeadCard'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { LEAD_SORT_OPTIONS } from '../../features/service-marketplace/leadFilters'
import '../../features/service-marketplace/ServiceMarketplace.css'

export default function ServiceMarketplacePage({ type }) {
  const marketplace = useBusinessMarketplace(type)

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">{marketplace.content.eyebrow}</div>
        <h2>{marketplace.content.title}</h2>
        <p>{marketplace.content.description}</p>
      </div>
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
          aria-label="Job lead filters"
        >
          <label className="service-marketplace-search">
            <span>Search jobs</span>
            <input
              type="search"
              value={marketplace.search}
              onChange={(event) => marketplace.setSearch(event.target.value)}
              placeholder="Search by service or suburb"
            />
          </label>
          <label>
            <span>Category</span>
            <select
              value={marketplace.category}
              onChange={(event) => marketplace.setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {marketplace.categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Order</span>
            <select
              value={marketplace.sort}
              onChange={(event) => marketplace.setSort(event.target.value)}
            >
              {Object.entries(LEAD_SORT_OPTIONS).map(([value, label]) => (
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
              {type === 'leads' && marketplace.totalItems > 0
                ? 'No job leads match your search and filters.'
                : marketplace.content.empty}
            </div>
          )}
        {!marketplace.isLoading &&
          marketplace.items.map((item) => {
            if (type === 'leads') {
              return (
                <LeadCard
                  key={item.job_request_id}
                  item={item}
                  isSelected={marketplace.selectedLead === item.job_request_id}
                  quoteAmount={marketplace.quoteAmount}
                  quoteMessage={marketplace.quoteMessage}
                  isSaving={marketplace.isSaving}
                  onToggle={() => marketplace.toggleLead(item.job_request_id)}
                  onAmountChange={marketplace.setQuoteAmount}
                  onMessageChange={marketplace.setQuoteMessage}
                  onSubmit={marketplace.handleQuoteSubmit}
                />
              )
            }
            if (type === 'quotes') {
              return <BusinessQuoteCard key={item.quote_id} item={item} />
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
