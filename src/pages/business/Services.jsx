import { BriefcaseBusiness, FileText, History, UsersRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { ServiceMarketplaceContent } from './ServiceMarketplacePage'

const SERVICE_TABS = [
  { value: 'leads', label: 'Leads' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'jobs', label: 'Jobs' },
  { value: 'history', label: 'View Job History', icon: History },
]

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams()
  const handledNotificationTargetRef = useRef('')
  const leads = useBusinessMarketplace('leads')
  const quotes = useBusinessMarketplace('quotes')
  const jobs = useBusinessMarketplace('jobs')
  const history = useBusinessMarketplace('history')
  const requestedTab = searchParams.get('tab')
  const activeTab = SERVICE_TABS.some(({ value }) => value === requestedTab)
    ? requestedTab
    : 'leads'
  const marketplaces = { leads, quotes, jobs, history }
  const activeMarketplace = marketplaces[activeTab]
  const focusedItemId = searchParams.get('focus')
  const notificationId = searchParams.get('notification')

  useEffect(() => {
    if (!focusedItemId) {
      handledNotificationTargetRef.current = ''
      return
    }
    if (activeMarketplace.isLoading) return

    const targetExists = activeMarketplace.allItems.some((item) => {
      const itemId = activeTab === 'quotes' ? item.quote_id : item.job_request_id
      return itemId === focusedItemId
    })
    if (!targetExists) return

    const targetKey = `${activeTab}:${focusedItemId}:${notificationId ?? ''}`
    if (handledNotificationTargetRef.current === targetKey) return
    handledNotificationTargetRef.current = targetKey

    activeMarketplace.setSearch('')
    if (activeTab === 'leads') {
      activeMarketplace.setUrgencyFilter('all')
      activeMarketplace.showLeadReview(focusedItemId)
    } else if (activeTab === 'quotes') {
      activeMarketplace.setQuoteStatus('all')
      activeMarketplace.showQuoteReview(focusedItemId)
    } else if (activeTab === 'jobs') {
      activeMarketplace.setJobStatus('all')
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const target = document.getElementById(
          `service-item-${activeTab}-${focusedItemId}`,
        )
        if (!target) return

        const reduceMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches
        target.scrollIntoView({
          behavior: reduceMotion ? 'auto' : 'smooth',
          block: 'center',
        })
        target.classList.remove('is-notification-arrival')
        void target.offsetWidth
        target.classList.add('is-notification-arrival')
        window.setTimeout(
          () => target.classList.remove('is-notification-arrival'),
          1800,
        )
      })
    })
  }, [
    activeMarketplace,
    activeTab,
    focusedItemId,
    notificationId,
  ])

  const summaries = [
    {
      type: 'leads',
      label: 'Leads',
      value: leads.allItems.length,
      description: 'Leads waiting for your quote',
      icon: UsersRound,
    },
    {
      type: 'quotes',
      label: 'Quotes',
      value: quotes.allItems.length,
      description: 'Submitted quotes and outcomes',
      icon: FileText,
    },
    {
      type: 'jobs',
      label: 'Jobs',
      value: jobs.allItems.length,
      description: 'Accepted and active jobs',
      icon: BriefcaseBusiness,
    },
  ]

  function selectTab(type) {
    setSearchParams(type === 'leads' ? {} : { tab: type })
  }

  return (
    <div className="business-services-page">
      <div className="business-services-hero">
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
      </div>

      <div className="service-tabs" role="tablist" aria-label="Services">
        {SERVICE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            className={`${activeTab === value ? 'active' : ''}${value === 'history' ? ' service-history-tab' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => selectTab(value)}
            key={value}
          >
            {Icon && <Icon aria-hidden="true" />}
            {label}
          </button>
        ))}
      </div>

      <section
        role="tabpanel"
        aria-label={activeMarketplace.content.title}
      >
        <ServiceMarketplaceContent
          type={activeTab}
          marketplace={activeMarketplace}
        />
      </section>
    </div>
  )
}
