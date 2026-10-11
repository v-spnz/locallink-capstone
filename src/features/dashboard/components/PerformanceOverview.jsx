import {
  Activity,
  ArrowUpRight,
  BadgePercent,
  BriefcaseBusiness,
  Gift,
  RefreshCw,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  hasDealActivity,
  hasLoyaltyActivity,
  hasMarketplaceActivity,
} from '../dashboardPresentation'

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
  note,
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
      {note && <p className="business-performance-note">{note}</p>}
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

export default function PerformanceOverview({
  analyticsPeriod,
  onPeriodChange,
  metrics,
  capabilities,
  moduleCount,
  isLoading,
  error,
  reload,
  recordedTransactionValue,
  recordedCustomerSavings,
  recordedAverageTransaction,
}) {
  const [periodError, setPeriodError] = useState('')

  function applyPeriod(event) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const startDate = values.get('startDate')
    const endDate = values.get('endDate')
    if (startDate > endDate) {
      setPeriodError('Start date must be on or before end date.')
      return
    }
    setPeriodError('')
    onPeriodChange({ startDate, endDate })
  }

  return (
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

      <form
        key={`${analyticsPeriod.startDate}:${analyticsPeriod.endDate}`}
        className="business-performance-period"
        onSubmit={applyPeriod}
        onChange={() => setPeriodError('')}
      >
        <label>
          From
          <input
            type="date"
            name="startDate"
            required
            defaultValue={analyticsPeriod.startDate}
          />
        </label>
        <label>
          To
          <input
            type="date"
            name="endDate"
            required
            defaultValue={analyticsPeriod.endDate}
          />
        </label>
        <button type="submit" className="business-performance-refresh">
          Apply period
        </button>
        {periodError && <p role="alert">{periodError}</p>}
      </form>

      {isLoading && <PerformanceSkeleton capabilityCount={moduleCount} />}

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
              note="Sales value and average value use only redemptions with a recorded transaction amount. Customer savings uses only recorded savings amounts. These figures are not total revenue, profit, ROI, or guaranteed additional revenue."
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
                label="Average transaction value"
                value={recordedAverageTransaction ?? 'Not recorded'}
                detail={
                  metrics.redemptionsWithTransactionValue > 0
                    ? `From ${formatDashboardCount(metrics.redemptionsWithTransactionValue)} valued ${metrics.redemptionsWithTransactionValue === 1 ? 'redemption' : 'redemptions'}`
                    : 'No valued redemptions'
                }
                unavailable={recordedAverageTransaction == null}
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
                value={formatDashboardCount(metrics.marketplaceQuotesSubmitted)}
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

          {moduleCount === 0 && (
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
  )
}
