import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  formatDashboardCount,
  formatDashboardDateRange,
} from '../dashboardPresentation'
import { groupDealsByCategory } from '../categoryPerformance'

function CategoryDonut({ groups, totalRedemptions }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const hasGaps = groups.filter((group) => group.redemptions > 0).length > 1
  const gap = hasGaps ? 1.5 : 0
  const visibleGroups = groups.filter((group) => group.redemptions > 0)
  const segments = visibleGroups.map((group, index) => {
    const lengthOf = (item) =>
      (item.redemptions / totalRedemptions) * circumference
    const offset = visibleGroups
      .slice(0, index)
      .reduce((sum, previous) => sum + lengthOf(previous), 0)
    return { group, length: lengthOf(group), offset }
  })

  return (
    <svg
      className="business-category-donut"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Share of redemptions by deal category"
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
          strokeDasharray={`${Math.max(length - gap, 0.5)} ${circumference}`}
          strokeDashoffset={-offset}
          transform="rotate(-90 50 50)"
        >
          <title>{`${group.category}: ${group.redemptions} redemptions`}</title>
        </circle>
      ))}
      <text
        x="50"
        y="49"
        textAnchor="middle"
        className="business-category-donut-total"
      >
        {formatDashboardCount(totalRedemptions)}
      </text>
      <text
        x="50"
        y="61"
        textAnchor="middle"
        className="business-category-donut-label"
      >
        redemptions
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
  const totalRedemptions = groups.reduce(
    (sum, group) => sum + group.redemptions,
    0,
  )

  if (groups.length === 0) return null

  if (groups.length === 1) {
    return (
      <section
        className="business-dashboard-section business-category-perf"
        aria-labelledby="business-category-perf-title"
      >
        <div className="business-section-heading business-performance-heading">
          <div>
            <span>Category performance</span>
            <h2 id="business-category-perf-title">Performance by category</h2>
            <p>{periodLabel}</p>
          </div>
        </div>
        <p className="business-category-single">
          All your deals are in {groups[0].category}, so there is nothing to
          compare yet. Create a deal in another category to see how different
          kinds of offers perform.
        </p>
      </section>
    )
  }

  return (
    <section
      className="business-dashboard-section business-category-perf"
      aria-labelledby="business-category-perf-title"
    >
      <div className="business-section-heading business-performance-heading">
        <div>
          <span>Category performance</span>
          <h2 id="business-category-perf-title">Performance by category</h2>
          <p>
            {periodLabel}. Select a category to see the deals behind its
            numbers.
          </p>
        </div>
      </div>

      <div className="business-category-layout">
        <div className="business-category-chart">
          {totalRedemptions > 0 ? (
            <CategoryDonut
              groups={groups}
              totalRedemptions={totalRedemptions}
            />
          ) : (
            <p className="business-category-no-redemptions">
              No redemptions were recorded in this period, so there is no share
              to show yet.
            </p>
          )}
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
                  onClick={() =>
                    setOpenCategory(isOpen ? null : group.category)
                  }
                >
                  <span className="business-category-name">
                    <i
                      style={{ background: group.colour }}
                      aria-hidden="true"
                    />
                    <span>
                      <strong>{group.category}</strong>
                      <small>
                        {group.deals.length}{' '}
                        {group.deals.length === 1 ? 'deal' : 'deals'}
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
                            {formatDashboardCount(deal.redemptions)} redemptions
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
    </section>
  )
}
