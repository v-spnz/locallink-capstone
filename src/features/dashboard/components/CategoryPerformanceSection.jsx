import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  formatDashboardCount,
  formatDashboardDateRange,
  formatDashboardPercentage,
} from '../dashboardPresentation'
import {
  formatCategoryConversion,
  groupDealsByCategory,
} from '../categoryPerformance'

function CategoryDonut({ groups, totalDeals, openCategory, onToggle }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const segments = groups.map((group, index) => {
    const length = (group.deals.length / totalDeals) * circumference
    const previousDeals = groups
      .slice(0, index)
      .reduce((sum, previous) => sum + previous.deals.length, 0)
    return {
      group,
      length,
      offset: (previousDeals / totalDeals) * circumference,
    }
  })

  return (
    <svg
      className="business-category-donut"
      viewBox="0 0 100 100"
      role="group"
      aria-label="Published deals by category. Select a segment to see its deals."
    >
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#edf0f5"
        strokeWidth="14"
      />
      {segments.map(({ group, length, offset }) => (
        <circle
          key={group.category}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={group.colour}
          strokeWidth="14"
          strokeDasharray={`${length} ${circumference}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 50 50)"
          className={
            openCategory === group.category ? 'is-selected' : undefined
          }
          role="button"
          tabIndex={0}
          aria-label={`${group.category}: ${group.deals.length} ${group.deals.length === 1 ? 'deal' : 'deals'}, ${formatDashboardPercentage((group.deals.length / totalDeals) * 100)}`}
          aria-expanded={openCategory === group.category}
          onClick={() => onToggle(group.category)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggle(group.category)
            }
          }}
        />
      ))}
      <text
        x="50"
        y="49"
        textAnchor="middle"
        className="business-category-donut-total"
      >
        {formatDashboardCount(totalDeals)}
      </text>
      <text
        x="50"
        y="61"
        textAnchor="middle"
        className="business-category-donut-label"
      >
        {totalDeals === 1 ? 'deal' : 'deals'}
      </text>
    </svg>
  )
}

export default function CategoryPerformanceSection({
  deals,
  period,
  onSelect,
}) {
  const [openCategory, setOpenCategory] = useState(null)
  const groups = groupDealsByCategory(deals)
  const periodLabel = formatDashboardDateRange(period)
  const totalDeals = groups.reduce((sum, group) => sum + group.deals.length, 0)
  const categoryDeals =
    groups.length === 1
      ? groups[0].deals.toSorted(
          (a, b) => b.claims - a.claims || b.redemptions - a.redemptions,
        )
      : []
  const hasDealActivity = categoryDeals.some(
    (deal) => deal.claims > 0 || deal.redemptions > 0,
  )
  const largestCount = categoryDeals.reduce(
    (largest, deal) => Math.max(largest, deal.claims, deal.redemptions),
    1,
  )

  function toggleCategory(category) {
    setOpenCategory((current) => (current === category ? null : category))
  }

  return (
    <section
      className="business-dashboard-section business-category-perf"
      aria-labelledby="business-category-perf-title"
    >
      <div className="business-section-heading business-performance-heading">
        <div>
          <span>Category performance</span>
          <h2 id="business-category-perf-title">
            {groups.length === 1
              ? 'How your deals are performing'
              : 'Performance by category'}
          </h2>
          <p>
            {groups.length === 1
              ? `${groups[0].category} deals · ${periodLabel}. Select a deal to see its full breakdown.`
              : 'Current published deals by category.'}
            {groups.length > 1 && ' Select a category to see its deals.'}
          </p>
        </div>
      </div>

      {totalDeals === 0 ? (
        <p className="business-category-single">
          No published deals to compare yet.
        </p>
      ) : groups.length === 1 ? (
        <>
          {hasDealActivity ? (
            <div
              className={`business-category-deal-bars${totalDeals === 1 ? ' is-single' : ''}`}
              role="group"
              aria-label="Claims and redemptions by deal"
            >
              {categoryDeals.map((deal) => (
                <button
                  type="button"
                  key={deal.dealId}
                  className="business-category-row business-category-deal-bar"
                  onClick={() => onSelect(deal.dealId)}
                >
                  <strong>{deal.dealName}</strong>
                  {[
                    { label: 'Claims', value: deal.claims, style: 'is-claims' },
                    {
                      label: 'Redemptions',
                      value: deal.redemptions,
                      style: 'is-redemptions',
                    },
                  ].map(({ label, value, style }) => (
                    <span
                      key={label}
                      className={`business-category-bar-measure ${style}`}
                    >
                      <span>{label}</span>
                      <span
                        className="business-category-bar-track"
                        aria-hidden="true"
                      >
                        <span
                          style={{ width: `${(value / largestCount) * 100}%` }}
                        />
                      </span>
                      <b>{formatDashboardCount(value)}</b>
                    </span>
                  ))}
                </button>
              ))}
            </div>
          ) : (
            <>
              <p className="business-category-single">
                No claims or redemptions were recorded for these deals in this
                period.
              </p>
              <ul className="business-category-deals is-empty">
                {categoryDeals.map((deal) => (
                  <li key={deal.dealId}>
                    <button type="button" onClick={() => onSelect(deal.dealId)}>
                      <strong>{deal.dealName}</strong>
                      <span>View deal details</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="business-category-period-note">
            Claims and redemptions are separate counts for {periodLabel}. A
            redemption may belong to a claim made earlier.
          </p>
        </>
      ) : (
        <>
          <div className="business-category-layout">
            <div className="business-category-chart">
              <CategoryDonut
                groups={groups}
                totalDeals={totalDeals}
                openCategory={openCategory}
                onToggle={toggleCategory}
              />
            </div>

            <ul className="business-category-list">
              {groups.map((group) => {
                const isOpen = openCategory === group.category
                const panelId = `business-category-deals-${group.category.replace(/\W+/g, '-')}`

                return (
                  <li key={group.category}>
                    <button
                      type="button"
                      className="business-category-row"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleCategory(group.category)}
                    >
                      <span className="business-category-name">
                        <i
                          style={{ background: group.colour }}
                          aria-hidden="true"
                        />
                        <span>
                          <strong>{group.category}</strong>
                          <small>
                            {formatDashboardCount(group.deals.length)}{' '}
                            {group.deals.length === 1 ? 'deal' : 'deals'} ·{' '}
                            {formatDashboardPercentage(
                              (group.deals.length / totalDeals) * 100,
                            )}{' '}
                            of published deals
                          </small>
                          <small>
                            {formatDashboardCount(group.claims)} claims ·{' '}
                            {formatDashboardCount(group.redemptions)}{' '}
                            redemptions · Claim conversion:{' '}
                            {formatCategoryConversion(group.conversion)}
                          </small>
                        </span>
                      </span>
                      <ChevronDown
                        className={isOpen ? 'is-open' : ''}
                        aria-hidden="true"
                      />
                    </button>

                    {isOpen && (
                      <ul className="business-category-deals" id={panelId}>
                        {group.deals.map((deal) => (
                          <li key={deal.dealId}>
                            <button
                              type="button"
                              onClick={() => onSelect(deal.dealId)}
                            >
                              <strong>{deal.dealName}</strong>
                              <span>
                                {formatDashboardCount(deal.claims)} claims ·{' '}
                                {formatDashboardCount(deal.redemptions)}{' '}
                                redemptions
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <p className="business-category-period-note">
            Deal counts show your current published deals. Claims and
            redemptions use {periodLabel}; conversion shows how many claims from
            that period have been redeemed so far.
          </p>
        </>
      )}
    </section>
  )
}
