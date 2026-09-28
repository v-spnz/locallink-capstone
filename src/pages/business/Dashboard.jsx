import { useMemo } from 'react'
import {
  Activity,
  ArrowUpRight,
  ArrowRight,
  BadgePercent,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Gift,
  MapPin,
  RefreshCw,
  ScanLine,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import localBusinessNeighbourhood from '../../assets/images/local-business-neighbourhood.jpg'
import useBusiness from '../../business/useBusiness'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  formatRecordedCurrency,
  DEAL_STATUS_ORDER,
  getDealStatusSummary,
  getDefaultDashboardDateRange,
  hasDealActivity,
  hasLoyaltyActivity,
  hasMarketplaceActivity,
} from '../../features/dashboard/dashboardPresentation'
import useBusinessDashboardAnalytics from '../../features/dashboard/hooks/useBusinessDashboardAnalytics'

function PerformanceMetric({ label, value, detail, unavailable = false }) {
  return (
    <div className={unavailable ? 'is-unavailable' : undefined}>
      <dt>{label}</dt>
      <dd>{value}</dd>
      {detail && <small>{detail}</small>}
    </div>
  )
}

function PerformanceSection({
  className,
  icon,
  title,
  description,
  to,
  actionLabel,
  children,
}) {
  const Icon = icon

  return (
    <article className={`business-performance-card ${className}`}>
      <div className="business-performance-card-heading">
        <span className="business-performance-card-icon">
          <Icon aria-hidden="true" />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <Link to={to}>
          {actionLabel}
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
      <dl className="business-performance-metrics">{children}</dl>
    </article>
  )
}

function PerformanceEmpty({ children }) {
  return (
    <div className="business-performance-empty">
      <dt>No recent activity</dt>
      <dd>{children}</dd>
    </div>
  )
}

const DEAL_STATE_LABELS = {
  draft: { label: 'Draft', empty: 'No drafts' },
  scheduled: { label: 'Scheduled', empty: 'None scheduled' },
  active: { label: 'Active', empty: 'None live' },
  expired: { label: 'Expired', empty: 'None expired' },
  ended_early: { label: 'Ended early', empty: 'None ended early' },
}

function DealStatusOverview({ summary }) {
  const endingSoonCount = summary.endingSoon.length

  return (
    <section
      className="business-dashboard-section business-deal-status"
      aria-labelledby="business-deal-status-title"
    >
      <div className="business-section-heading business-performance-heading">
        <div>
          <span>Deal status</span>
          <h2 id="business-deal-status-title">What you are offering</h2>
          <p>
            {summary.total === 0
              ? 'You have not created any deals yet.'
              : `${summary.total} ${summary.total === 1 ? 'deal' : 'deals'} in total.`}
          </p>
        </div>
        <Link
          className="business-performance-refresh"
          to="/business/create-deal"
        >
          Manage deals
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>

      <dl className="business-deal-status-grid">
        {DEAL_STATUS_ORDER.map((state) => {
          const count = summary.counts[state]
          return (
            <div
              className={`is-${state}${count === 0 ? ' is-empty' : ''}`}
              key={state}
            >
              <dt>
                {DEAL_STATE_LABELS[state].label}
                {state === 'active' && endingSoonCount > 0 && (
                  <span className="business-deal-ending-soon">
                    {endingSoonCount} {endingSoonCount === 1 ? 'deal' : 'deals'}{' '}
                    ending soon
                  </span>
                )}
              </dt>
              <dd>{formatDashboardCount(count)}</dd>
              <small>
                {count === 0
                  ? DEAL_STATE_LABELS[state].empty
                  : `${count === 1 ? 'deal' : 'deals'}`}
              </small>
            </div>
          )
        })}
      </dl>

      {summary.drafts.length > 0 && (
        <div className="business-deal-attention">
          <div className="business-deal-attention-group">
            <h3>Unfinished drafts</h3>
            {summary.drafts.slice(0, 5).map((draft) => (
              <Link to="/business/create-deal" key={draft.id}>
                <span>
                  <strong>{draft.title}</strong>
                  <small>
                    {draft.missingCount > 0
                      ? `${draft.missingCount} ${draft.missingCount === 1 ? 'detail' : 'details'} still needed`
                      : 'Ready to review and publish'}
                  </small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function PerformanceSkeleton({ capabilityCount }) {
  return (
    <div
      className="business-performance-skeleton"
      aria-label="Loading business performance"
      aria-busy="true"
    >
      {Array.from({ length: Math.max(capabilityCount, 1) }, (_, index) => (
        <span key={index} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const {
    business,
    capabilities,
    membership,
    serviceProfile,
    serviceCategories,
    serviceAreas,
  } = useBusiness()
  const analyticsPeriod = useMemo(() => getDefaultDashboardDateRange(), [])
  const {
    metrics,
    deals,
    dealsFailed,
    dealsLoading,
    isLoading,
    error,
    reload,
  } = useBusinessDashboardAnalytics(analyticsPeriod)
  const dealSummary = useMemo(() => getDealStatusSummary(deals), [deals])
  const verificationLabel = business.verification_status
    .replaceAll('_', ' ')
    .replace(/^\w/, (character) => character.toUpperCase())
  const modules = [
    capabilities.deals_enabled && {
      title: 'Deals',
      description: 'Create and manage offers for nearby customers.',
      detail: 'Location-based promotions',
      to: '/business/create-deal',
      icon: BadgePercent,
      className: 'is-deals',
    },
    capabilities.loyalty_enabled && {
      title: 'Loyalty',
      description: 'Build programmes that reward repeat visits.',
      detail: 'Private programme drafts',
      to: '/business/create-loyalty',
      icon: Gift,
      className: 'is-loyalty',
    },
    capabilities.service_marketplace_enabled && {
      title: 'Services',
      description: 'Review matched job leads, quotes and active work.',
      detail: `${serviceCategories.length} ${serviceCategories.length === 1 ? 'category' : 'categories'}, ${serviceAreas.length} ${serviceAreas.length === 1 ? 'area' : 'areas'}`,
      to: '/business/services',
      icon: BriefcaseBusiness,
      className: 'is-services',
    },
  ].filter(Boolean)
  const recordedTransactionValue = formatRecordedCurrency(
    metrics?.recordedTransactionValueCents,
  )
  const recordedCustomerSavings = formatRecordedCurrency(
    metrics?.recordedCustomerSavingsCents,
  )

  return (
    <div className="business-dashboard">
      <header className="page-header business-dashboard-header">
        <div className="business-dashboard-header-copy">
          <span className="business-dashboard-eyebrow">
            <BarChart3 aria-hidden="true" />
            Business performance
          </span>
          <h1>{business.business_name}</h1>
          <p>
            See how customers are using the LocalLink tools enabled for your
            business.
          </p>
          <div className="business-dashboard-header-meta">
            <span className="business-role-badge">
              <CheckCircle2 aria-hidden="true" />
              {membership.role} access
            </span>
            <span>
              <CalendarDays aria-hidden="true" />
              Last 30 days
            </span>
          </div>
        </div>
        <figure className="business-dashboard-hero-art">
          <img
            src={localBusinessNeighbourhood}
            alt="Local shops, a cafe and a service business in a connected neighbourhood"
          />
        </figure>
      </header>

      <section
        className="business-dashboard-section business-performance-section"
        aria-labelledby="business-performance-title"
      >
        <div className="business-section-heading business-performance-heading">
          <div>
            <span>Performance overview</span>
            <h2 id="business-performance-title">Your LocalLink activity</h2>
            <p>{formatDashboardDateRange(analyticsPeriod)}</p>
          </div>
          <button
            type="button"
            className="business-performance-refresh"
            onClick={reload}
            disabled={isLoading}
          >
            <RefreshCw aria-hidden="true" />
            Refresh
          </button>
        </div>

        {isLoading && <PerformanceSkeleton capabilityCount={modules.length} />}

        {!isLoading && error && (
          <div className="business-performance-error" role="alert">
            <div>
              <strong>Performance information is unavailable</strong>
              <p>{error}</p>
            </div>
            <button type="button" onClick={reload}>
              Try again
            </button>
          </div>
        )}

        {!isLoading && !error && metrics && (
          <div className="business-performance-list">
            {capabilities.deals_enabled && (
              <PerformanceSection
                className="is-deals"
                icon={BadgePercent}
                title="Deals & Discovery"
                description="Claims, in-store redemptions and recorded sales from your deals."
                to="/business/create-deal"
                actionLabel="View deals"
              >
                <PerformanceMetric
                  label="Claims"
                  value={formatDashboardCount(metrics.dealClaims)}
                />
                <PerformanceMetric
                  label="Redemptions"
                  value={formatDashboardCount(metrics.dealRedemptions)}
                />
                <PerformanceMetric
                  label="Claim conversion"
                  value={formatDashboardPercentage(
                    metrics.dealClaimToRedemptionRate,
                  )}
                />
                <PerformanceMetric
                  label="Recorded sales value"
                  value={recordedTransactionValue ?? 'Not recorded'}
                  detail={
                    metrics.dealRedemptions > 0
                      ? `${formatDashboardCount(metrics.redemptionsWithTransactionValue)} of ${formatDashboardCount(metrics.dealRedemptions)} redemptions valued`
                      : 'No valued redemptions'
                  }
                  unavailable={recordedTransactionValue == null}
                />
                <PerformanceMetric
                  label="Deal customers"
                  value={formatDashboardCount(metrics.uniqueDealCustomers)}
                />
                <PerformanceMetric
                  label="Recorded customer savings"
                  value={recordedCustomerSavings ?? 'Not recorded'}
                  unavailable={recordedCustomerSavings == null}
                />
                {!hasDealActivity(metrics) && (
                  <PerformanceEmpty>
                    No deal claims or redemptions were recorded in this period.
                  </PerformanceEmpty>
                )}
              </PerformanceSection>
            )}

            {capabilities.loyalty_enabled && (
              <PerformanceSection
                className="is-loyalty"
                icon={Gift}
                title="Loyalty"
                description="Customer participation and reward activity across your programmes."
                to="/business/create-loyalty"
                actionLabel="View loyalty"
              >
                <PerformanceMetric
                  label="Loyalty customers"
                  value={formatDashboardCount(metrics.loyaltyCustomers)}
                />
                <PerformanceMetric
                  label="Active customers"
                  value={formatDashboardCount(metrics.activeLoyaltyCustomers)}
                />
                <PerformanceMetric
                  label="Activity events"
                  value={formatDashboardCount(metrics.loyaltyActivityEvents)}
                />
                <PerformanceMetric
                  label="Rewards earned"
                  value={formatDashboardCount(metrics.loyaltyRewardsEarned)}
                />
                <PerformanceMetric
                  label="Rewards redeemed"
                  value={formatDashboardCount(metrics.loyaltyRewardsRedeemed)}
                />
                {!hasLoyaltyActivity(metrics) && (
                  <PerformanceEmpty>
                    No loyalty activity was recorded in this period.
                  </PerformanceEmpty>
                )}
              </PerformanceSection>
            )}

            {capabilities.service_marketplace_enabled && (
              <PerformanceSection
                className="is-services"
                icon={BriefcaseBusiness}
                title="Service Marketplace"
                description="Matched opportunities, quotes and jobs connected through LocalLink."
                to="/business/services"
                actionLabel="View services"
              >
                <PerformanceMetric
                  label="Matched leads"
                  value={formatDashboardCount(metrics.marketplaceMatchedLeads)}
                />
                <PerformanceMetric
                  label="Quotes submitted"
                  value={formatDashboardCount(
                    metrics.marketplaceQuotesSubmitted,
                  )}
                />
                <PerformanceMetric
                  label="Jobs won"
                  value={formatDashboardCount(metrics.marketplaceJobsWon)}
                />
                <PerformanceMetric
                  label="Completed jobs"
                  value={formatDashboardCount(metrics.marketplaceCompletedJobs)}
                />
                <PerformanceMetric
                  label="Lead to quote"
                  value={formatDashboardPercentage(
                    metrics.marketplaceLeadToQuoteRate,
                  )}
                />
                <PerformanceMetric
                  label="Lead to job"
                  value={formatDashboardPercentage(
                    metrics.marketplaceLeadToJobRate,
                  )}
                />
                {!hasMarketplaceActivity(metrics) && (
                  <PerformanceEmpty>
                    No marketplace leads, quotes or jobs were recorded in this
                    period.
                  </PerformanceEmpty>
                )}
              </PerformanceSection>
            )}

            {modules.length === 0 && (
              <div className="business-performance-no-capabilities">
                <Activity aria-hidden="true" />
                <div>
                  <strong>No business tools are enabled</strong>
                  <p>
                    Enable a LocalLink capability to begin collecting relevant
                    performance information.
                  </p>
                </div>
                <Link to="/business/settings/overview">Review settings</Link>
              </div>
            )}
          </div>
        )}
      </section>

      {capabilities.deals_enabled &&
        !dealsLoading &&
        (dealsFailed ? (
          <section className="business-dashboard-section">
            <div className="business-performance-error" role="alert">
              <div>
                <strong>Deal status is unavailable</strong>
                <p>Unable to load your deals. Please try again.</p>
              </div>
              <button type="button" onClick={reload}>
                Try again
              </button>
            </div>
          </section>
        ) : (
          <DealStatusOverview summary={dealSummary} />
        ))}

      {capabilities.deals_enabled && (
        <section
          className="business-redemption-cta"
          aria-labelledby="business-redemption-cta-title"
        >
          <div className="business-redemption-cta-copy">
            <span aria-hidden="true">
              <ScanLine />
            </span>
            <div>
              <h2 id="business-redemption-cta-title">Redeem a customer deal</h2>
              <p>
                Scan a customer QR code. Manual entry is available on the same
                screen.
              </p>
            </div>
          </div>
          <Link
            className="business-redemption-cta-action"
            to="/business/create-deal?redeem=scan"
          >
            Scan QR code
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      )}

      <section
        className="business-dashboard-section"
        aria-labelledby="tools-title"
      >
        <div className="business-section-heading">
          <div>
            <h2 id="tools-title">Your workspace</h2>
            <p>Open an enabled tool to manage that part of your business.</p>
          </div>
          <span>{modules.length} enabled</span>
        </div>

        <div className={`business-module-grid has-${modules.length}-modules`}>
          {modules.map((module) => {
            const Icon = module.icon

            return (
              <Link
                className={`business-module-card ${module.className}`}
                to={module.to}
                key={module.to}
              >
                <span className="business-module-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="business-module-copy">
                  <strong>{module.title}</strong>
                  <p>{module.description}</p>
                </span>
                <span className="business-module-detail">
                  <CheckCircle2 aria-hidden="true" />
                  {module.detail}
                </span>
                <span className="business-module-action">
                  Open {module.title}
                  <ArrowUpRight aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="business-dashboard-lower-grid">
        <section className="business-dashboard-panel business-presence-panel">
          <div className="business-panel-icon">
            <Building2 aria-hidden="true" />
          </div>
          <div>
            <h2>Profile snapshot</h2>
            <p>
              {business.description || 'No business description added yet.'}
            </p>
          </div>
          <dl className="business-presence-facts">
            <div>
              <dt>
                <ShieldCheck aria-hidden="true" />
                Verification
              </dt>
              <dd>{verificationLabel}</dd>
            </div>
            <div>
              <dt>
                <CheckCircle2 aria-hidden="true" />
                Enabled tools
              </dt>
              <dd>{modules.length}</dd>
            </div>
            {capabilities.service_marketplace_enabled && (
              <div>
                <dt>
                  <MapPin aria-hidden="true" />
                  Service coverage
                </dt>
                <dd>
                  {serviceAreas.length > 0
                    ? `${serviceAreas.length} ${serviceAreas.length === 1 ? 'area' : 'areas'}`
                    : 'Not set'}
                </dd>
              </div>
            )}
          </dl>
          {capabilities.service_marketplace_enabled && serviceProfile && (
            <p className="business-presence-availability">
              <strong>Availability</strong>
              {serviceProfile.availability || 'Not set'}
            </p>
          )}
          <Link to="/business/settings/profile">
            Review business details
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </section>

        <aside className="business-dashboard-panel business-quick-links">
          <div className="business-section-heading is-compact">
            <div>
              <h2>Quick links</h2>
              <p>Common account tasks.</p>
            </div>
          </div>
          <Link to="/business/settings/profile">
            <Building2 aria-hidden="true" />
            Business details
            <ArrowUpRight aria-hidden="true" />
          </Link>
          <Link to="/business/settings/overview">
            <Settings aria-hidden="true" />
            Account settings
            <ArrowUpRight aria-hidden="true" />
          </Link>
          {capabilities.service_marketplace_enabled && (
            <Link to="/business/services?tab=history">
              <BriefcaseBusiness aria-hidden="true" />
              Job history
              <ArrowUpRight aria-hidden="true" />
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}
