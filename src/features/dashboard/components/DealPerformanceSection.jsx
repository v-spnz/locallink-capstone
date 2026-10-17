import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
  formatRecordedCurrency,
  getDealMoneyCoverage,
  getDealPerformanceSummary,
  getPerformanceDeals,
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

export default function DealPerformanceSection({
  deals,
  period,
  selectedDealId,
  onSelect,
  onBack,
}) {
  const [showAll, setShowAll] = useState(false)
  const performanceDeals = getPerformanceDeals(deals)
  const rankedDeals = performanceDeals.toSorted(
    (a, b) =>
      b.redemptions - a.redemptions ||
      b.claims - a.claims ||
      b.claimToRedemptionRate - a.claimToRedemptionRate,
  )
  const visibleDeals = showAll ? rankedDeals : rankedDeals.slice(0, 3)
  const largestCount = rankedDeals.reduce(
    (maximum, deal) => Math.max(maximum, deal.claims, deal.redemptions),
    1,
  )
  const selected = performanceDeals.find((deal) => deal.dealId === selectedDealId)
  const periodLabel = formatDashboardDateRange(period)

  if (selected) {
    const coverage = getDealMoneyCoverage(selected)
    const sales = formatRecordedCurrency(selected.recordedTransactionValueCents)
    const average = formatRecordedCurrency(
      selected.averageRecordedTransactionCents,
    )
    const savings = formatRecordedCurrency(
      selected.recordedCustomerSavingsCents,
    )

    return (
      <section
        className="business-dashboard-section business-deal-perf"
        aria-labelledby="business-deal-perf-title"
      >
        <article className="business-performance-card is-deals">
          <div className="business-section-heading business-performance-heading business-deal-perf-heading business-deal-perf-detail-heading">
            <div>
              <span>Deal performance</span>
              <h2 id="business-deal-perf-title">{selected.dealName}</h2>
              <p>
                {selected.category || 'Uncategorised'} ·{' '}
                {selected.status.replaceAll('_', ' ')} · {periodLabel}
              </p>
            </div>
            <button
              type="button"
              className="business-performance-refresh"
              aria-label="Back to dashboard"
              onClick={onBack}
            >
              <ArrowLeft aria-hidden="true" />
            </button>
          </div>
          <p className="business-deal-perf-summary">
            {getDealPerformanceSummary(selected)}
          </p>
          <dl className="business-performance-metrics">
            <PerformanceMetric
              label="Claims"
              value={formatDashboardCount(selected.claims)}
            />
            <PerformanceMetric
              label="Redemptions"
              value={formatDashboardCount(selected.redemptions)}
            />
            <PerformanceMetric
              label="Claim conversion"
              value={formatDashboardPercentage(selected.claimToRedemptionRate)}
              detail={`${formatDashboardCount(selected.claimCohortRedemptions)} of ${formatDashboardCount(selected.claims)} claims redeemed`}
            />
            <PerformanceMetric
              label="Recorded sales value"
              value={sales ?? 'Not recorded'}
              detail={
                selected.redemptions > 0
                  ? `${formatDashboardCount(selected.redemptionsWithTransactionValue)} of ${formatDashboardCount(selected.redemptions)} redemptions valued`
                  : 'No redemptions'
              }
              unavailable={sales == null}
            />
            <PerformanceMetric
              label="Average transaction value"
              value={average ?? 'Not recorded'}
              unavailable={average == null}
            />
            <PerformanceMetric
              label="Recorded customer savings"
              value={savings ?? 'Not recorded'}
              detail={
                savings != null
                  ? 'Only redemptions with recorded savings'
                  : undefined
              }
              unavailable={savings == null}
            />
            <PerformanceMetric
              label="Unique customers"
              value={formatDashboardCount(selected.uniqueCustomers)}
            />
          </dl>
          <p
            className={`business-performance-note business-deal-perf-coverage is-${coverage.state}`}
          >
            {coverage.message} These figures are not total revenue, profit or
            ROI.
          </p>
        </article>
      </section>
    )
  }

  return (
    <section
      className="business-dashboard-section business-deal-perf"
      aria-labelledby="business-deal-perf-title"
    >
      <div className="business-section-heading business-performance-heading business-deal-perf-heading">
        <div>
          <span>Deal performance</span>
          <h2 id="business-deal-perf-title">How each deal performed</h2>
          <p>
            {periodLabel}.{' '}
            {rankedDeals.length > 3 && !showAll
              ? 'Showing your top 3 deals. '
              : ''}
            Select a deal to see its full breakdown.
          </p>
        </div>
        {rankedDeals.length > 3 && (
          <button
            type="button"
            className="business-performance-refresh"
            aria-expanded={showAll}
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? 'Back' : `View all (${rankedDeals.length})`}
          </button>
        )}
      </div>

      {rankedDeals.length === 0 ? (
        <div className="business-performance-empty">
          <dt>No deal activity</dt>
          <dd>No active or past deals have performance information yet.</dd>
        </div>
      ) : (
        <div className="business-deal-perf-list">
          {visibleDeals.map((deal) => (
            <button
              type="button"
              key={deal.dealId}
              onClick={() => onSelect(deal.dealId)}
            >
              <span className="business-deal-perf-name">
                <strong>{deal.dealName}</strong>
                <small>
                  {deal.category || 'Uncategorised'} ·{' '}
                  {deal.status.replaceAll('_', ' ')}
                </small>
              </span>
              <span className="business-deal-perf-bars">
                <span className="business-deal-perf-measure">
                  <small>Claims</small>
                  <strong>{formatDashboardCount(deal.claims)}</strong>
                  <span className="business-deal-perf-track" aria-hidden="true">
                    <span
                      className="is-claims"
                      style={{ width: `${(deal.claims / largestCount) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="business-deal-perf-measure">
                  <small>Redemptions</small>
                  <strong>{formatDashboardCount(deal.redemptions)}</strong>
                  <span className="business-deal-perf-track" aria-hidden="true">
                    <span
                      className="is-redemptions"
                      style={{ width: `${(deal.redemptions / largestCount) * 100}%` }}
                    />
                  </span>
                </span>
              </span>
              <span className="business-deal-perf-conversion">
                <small>Conversion</small>
                <strong>
                  {formatDashboardPercentage(deal.claimToRedemptionRate)}
                </strong>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
