import {
  BriefcaseBusiness,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Tags,
  UsersRound,
  ArrowUpRight,
  ChevronDown,
  History,
  SlidersHorizontal,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import useBusinessMarketplace from '../../features/service-marketplace/hooks/useBusinessMarketplace'
import { ServiceMarketplaceContent } from './ServiceMarketplacePage'

const SERVICE_TABS = [
  { value: 'leads', label: 'Leads', icon: UsersRound },
  { value: 'quotes', label: 'Quotes', icon: FileText },
  { value: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
  { value: 'history', label: 'History', icon: History },
]

const VALID_TAB_VALUES = SERVICE_TABS.map(({ value }) => value)

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
        <header className="marketplace-heading">
          <div className="page-header">
            <h1>Service Marketplace</h1>
            <p>
              Find your next job. Keep every quote and every commitment in view.
            </p>
          </div>
          <Link
            className="btn-secondary marketplace-profile-link"
            to="/business/settings/services"
          >
            <SlidersHorizontal aria-hidden="true" /> Service profile
          </Link>
        </header>

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
                  <strong>
                    {marketplace.isLoading
                      ? '…'
                      : marketplace.error
                        ? '–'
                        : summary.value}
                  </strong>
                  <small>{summary.description}</small>
                </span>
                <button
                  type="button"
                  className="marketplace-overview-link"
                  aria-label={`View ${summary.label.toLowerCase()}`}
                  onClick={() => selectTab(summary.type)}
                >
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </article>
            )
          })}
        </div>

        <details className="marketplace-profile">
          <summary>
            <span>
              <MapPin aria-hidden="true" /> Your service coverage
            </span>
            <span>
              Profile details <ChevronDown aria-hidden="true" />
            </span>
          </summary>
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
        </details>
      </div>

      <div className="service-tabs" role="tablist" aria-label="Services">
        {SERVICE_TABS.map(({ value, label, icon: Icon }) => (
          <button
            className={activeTab === value ? 'active' : ''}
            type="button"
            role="tab"
            id={`marketplace-tab-${value}`}
            aria-controls={`marketplace-panel-${value}`}
            aria-selected={activeTab === value}
            tabIndex={activeTab === value ? 0 : -1}
            onKeyDown={(event) => {
              const index = SERVICE_TABS.findIndex((tab) => tab.value === value)
              const nextIndex =
                event.key === 'ArrowRight'
                  ? (index + 1) % SERVICE_TABS.length
                  : event.key === 'ArrowLeft'
                    ? (index + SERVICE_TABS.length - 1) % SERVICE_TABS.length
                    : event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? SERVICE_TABS.length - 1
                        : null
              if (nextIndex === null) return
              event.preventDefault()
              const nextTab = SERVICE_TABS[nextIndex].value
              selectTab(nextTab)
              document.getElementById(`marketplace-tab-${nextTab}`)?.focus()
            }}
            onClick={() => selectTab(value)}
            key={value}
          >
            {Icon && <Icon aria-hidden="true" />}
            {label}
            <span className="marketplace-tab-count">
              {marketplaces[value].isLoading
                ? '…'
                : marketplaces[value].error
                  ? '–'
                  : marketplaces[value].allItems.length}
            </span>
          </button>
        ))}
      </div>

      <section
        className="marketplace-workspace"
        role="tabpanel"
        id={`marketplace-panel-${activeTab}`}
        aria-labelledby={`marketplace-tab-${activeTab}`}
        tabIndex={0}
      >
        <div className="marketplace-section-heading">
          <h2>
            {
              {
                leads: 'Available leads',
                quotes: 'Your quotes',
                jobs: 'Active jobs',
                history: 'Job history',
              }[activeTab]
            }
          </h2>
          <p>
            {
              {
                leads: 'Local requests matched to your services and coverage.',
                quotes: 'Track customer responses and review what you offered.',
                jobs: 'Coordinate accepted work and keep customers up to date.',
                history: 'Your completed and customer-confirmed work.',
              }[activeTab]
            }
          </p>
        </div>
        <ServiceMarketplaceContent
          type={activeTab}
          marketplace={activeMarketplace}
          onViewHistory={() => selectTab('history')}
        />
      </section>
    </div>
  )
}
