import {
  BriefcaseBusiness,
  FileText,
  UsersRound,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { ServiceMarketplaceContent } from './ServiceMarketplacePage'

const SERVICE_TABS = [
  { value: 'leads', label: 'Job Leads' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'jobs', label: 'Active Jobs' },
]

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const leads = useBusinessMarketplace('leads')
  const quotes = useBusinessMarketplace('quotes')
  const jobs = useBusinessMarketplace('jobs')
  const requestedTab = searchParams.get('tab')
  const activeTab = SERVICE_TABS.some(({ value }) => value === requestedTab)
    ? requestedTab
    : 'leads'
  const marketplaces = { leads, quotes, jobs }

  const summaries = [
    {
      type: 'leads',
      label: 'New Leads',
      value: leads.allItems.length,
      description: 'Leads waiting for your quote',
      icon: UsersRound,
    },
    {
      type: 'quotes',
      label: 'Open Quotes',
      value: quotes.allItems.filter(
        ({ quote_status: status }) => status === 'awaiting_response',
      ).length,
      description: 'Quotes sent, awaiting response',
      icon: FileText,
    },
    {
      type: 'jobs',
      label: 'Active Jobs',
      value: jobs.allItems.filter(
        ({ job_status: status }) => status === 'in_progress',
      ).length,
      description: 'Jobs in progress',
      icon: BriefcaseBusiness,
    },
  ]

  function selectTab(type) {
    setSearchParams(type === 'leads' ? {} : { tab: type })
  }

  return (
    <div className="business-services-page">
      <div className="page-header">
        <div className="page-header-eyebrow">Service Marketplace</div>
        <h2>Services</h2>
        <p>Manage new leads, sent quotes, and accepted jobs in one place.</p>
      </div>

      <div className="service-overview" aria-label="Service overview">
        {summaries.map((summary) => {
          const Icon = summary.icon
          const marketplace = marketplaces[summary.type]

          return (
            <article
              className={`service-overview-card is-${summary.type}`}
              key={summary.type}
            >
              <span className="service-overview-icon">
                <Icon aria-hidden="true" />
              </span>
              <span className="service-overview-copy">
                <span>{summary.label}</span>
                <strong>{marketplace.isLoading ? '—' : summary.value}</strong>
                <small>{summary.description}</small>
              </span>
            </article>
          )
        })}
      </div>

      <div className="service-tabs" role="tablist" aria-label="Services">
        {SERVICE_TABS.map(({ value, label }) => (
          <button
            className={activeTab === value ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => selectTab(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      <section
        role="tabpanel"
        aria-label={marketplaces[activeTab].content.title}
      >
        <ServiceMarketplaceContent
          type={activeTab}
          marketplace={marketplaces[activeTab]}
        />
      </section>
    </div>
  )
}
