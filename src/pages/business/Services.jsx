import {
  BriefcaseBusiness,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Tags,
  UsersRound,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { ServiceMarketplaceContent } from './ServiceMarketplacePage'

const SERVICE_TABS = [
  { value: 'leads', label: 'Leads' },
  { value: 'quotes', label: 'Quotes' },
  { value: 'jobs', label: 'Jobs' },
]

const VALID_TAB_VALUES = [...SERVICE_TABS.map(({ value }) => value), 'history']

export default function Services() {
  const { business, serviceProfile, serviceCategories, serviceAreas } =
    useBusiness()
  const [searchParams, setSearchParams] = useSearchParams()
  const handledNotificationTargetRef = useRef('')
  const leads = useBusinessMarketplace('leads')
  const quotes = useBusinessMarketplace('quotes')
  const jobs = useBusinessMarketplace('jobs')
  const history = useBusinessMarketplace('history')
  const requestedTab = searchParams.get('tab')
  const activeTab = VALID_TAB_VALUES.includes(requestedTab)
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
      const itemId =
        activeTab === 'quotes' ? item.quote_id : item.job_request_id
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
  }, [activeMarketplace, activeTab, focusedItemId, notificationId])

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
          <h1>Services</h1>
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
                  <strong>{marketplace.isLoading ? '…' : summary.value}</strong>
                  <small>{summary.description}</small>
                </span>
              </article>
            )
          })}
        </div>

        <dl className="service-profile-context" aria-label="Service profile">
          <div>
            <dt>
              <ShieldCheck aria-hidden="true" />
              Verification
            </dt>
            <dd>{business.verification_status.replaceAll('_', ' ')}</dd>
          </div>
          <div>
            <dt>
              <Tags aria-hidden="true" />
              Categories
            </dt>
            <dd>
              {serviceCategories.length > 0
                ? serviceCategories
                    .map(({ service_category }) => service_category)
                    .join(', ')
                : 'Not set'}
            </dd>
          </div>
          <div>
            <dt>
              <MapPin aria-hidden="true" />
              Service areas
            </dt>
            <dd>
              {serviceAreas.length > 0
                ? serviceAreas
                    .map(({ service_area }) => service_area)
                    .join(', ')
                : 'Not set'}
            </dd>
          </div>
          <div>
            <dt>
              <Clock3 aria-hidden="true" />
              Availability
            </dt>
            <dd>{serviceProfile?.availability || 'Not set'}</dd>
          </div>
        </dl>
      </div>

      <div className="service-tabs" role="tablist" aria-label="Services">
        {SERVICE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            className={activeTab === value ? 'active' : ''}
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

      <section role="tabpanel" aria-label={activeMarketplace.content.title}>
        <ServiceMarketplaceContent
          type={activeTab}
          marketplace={activeMarketplace}
          onViewHistory={() => selectTab('history')}
        />
      </section>
    </div>
  )
}
