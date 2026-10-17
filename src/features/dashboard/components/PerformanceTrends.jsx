import { useState } from 'react'
import {
  formatDashboardCount,
  formatRecordedCurrency,
  groupDashboardTrends,
} from '../dashboardPresentation'

const dateFormatter = new Intl.DateTimeFormat('en-NZ', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

function dateLabel(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`))
}

function linePaths(points, key, x, y) {
  const paths = []
  let path = ''
  points.forEach((point, index) => {
    if (point[key] == null) {
      if (path) paths.push(path)
      path = ''
    } else {
      path += `${path ? ' L' : 'M'} ${x(index)} ${y(point[key])}`
    }
  })
  if (path) paths.push(path)
  return paths
}

function TrendChart({ title, points, sales = false }) {
  const [selected, setSelected] = useState(null)
  const active =
    selected == null ? null : points[Math.min(selected, points.length - 1)]
  const max = Math.max(
    sales ? 100 : 1,
    ...points.map((point) =>
      sales
        ? (point.recordedValueCents ?? 0)
        : Math.max(point.claims, point.redemptions),
    ),
  )
  const x = (index) =>
    48 + (points.length === 1 ? 260 : (index * 520) / (points.length - 1))
  const y = (value) => 178 - (value / max) * 145
  const targetWidth = points.length === 1 ? 520 : 520 / (points.length - 1)
  const series = sales
    ? [
        {
          key: 'recordedValueCents',
          className: 'is-sales',
        },
      ]
    : [
        { key: 'claims', className: 'is-claims' },
        {
          key: 'redemptions',
          className: 'is-redemptions',
        },
      ]
  const formatValue = sales ? formatRecordedCurrency : formatDashboardCount
  const ticks =
    max < 2 && !sales
      ? [0, max]
      : [0, sales ? max / 2 : Math.ceil(max / 2), max]
  return (
    <article className="business-trend-card">
      <div className="business-trend-heading">
        <h3>{title}</h3>
        {!sales && (
          <span>
            <i className="is-claims" /> Claims <i className="is-redemptions" />{' '}
            Redemptions
          </span>
        )}
      </div>
      <div className="business-trend-scroll">
        <div
          className="business-trend-plot"
          onPointerLeave={(event) => {
            if (event.pointerType !== 'touch') setSelected(null)
          }}
        >
          <svg
            viewBox="0 0 600 220"
            role="group"
            aria-label={`${title}. Hover or focus a date to inspect its values.`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setSelected(null)
              }
            }}
          >
            {[...new Set(ticks)].map((value, index) => (
              <g key={index}>
                <line
                  x1="48"
                  x2="568"
                  y1={y(value)}
                  y2={y(value)}
                  className="business-trend-grid"
                />
                <text
                  x="42"
                  y={y(value) + 4}
                  textAnchor="end"
                  className="business-trend-axis"
                >
                  {formatValue(value)}
                </text>
              </g>
            ))}
            {series.map(({ key, className }) =>
              linePaths(points, key, x, y).map((path, index) => (
                <path
                  key={`${key}-${index}`}
                  d={path}
                  className={`business-trend-line ${className}`}
                />
              )),
            )}
            {points.map((point, index) => (
              <g key={point.date}>
                {series.map(({ key, className }) =>
                  point[key] == null || point[key] === 0 ? null : (
                    <circle
                      key={key}
                      cx={x(index)}
                      cy={y(point[key])}
                      r="3"
                      className={`business-trend-dot ${className}`}
                    />
                  ),
                )}
                <rect
                  x={index === 0 ? 48 : x(index) - targetWidth / 2}
                  y="20"
                  width={
                    points.length === 1
                      ? 520
                      : index === 0 || index === points.length - 1
                        ? targetWidth / 2
                        : targetWidth
                  }
                  height="170"
                  fill="transparent"
                  className="business-trend-target"
                  tabIndex={0}
                  role="button"
                  aria-label={`${dateLabel(point.date)}${point.date === point.endDate ? '' : ` to ${dateLabel(point.endDate)}`}: ${sales ? `${point.recordedValueCents == null ? 'no recorded sales value' : formatRecordedCurrency(point.recordedValueCents)}, ${point.valuedRedemptions} of ${point.redemptions} redemptions valued` : `${point.claims} claims, ${point.redemptions} redemptions`}`}
                  onFocus={() => setSelected(index)}
                  onPointerEnter={() => setSelected(index)}
                  onClick={() => setSelected(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelected(index)
                    }
                  }}
                />
                {(index === 0 ||
                  index === points.length - 1 ||
                  index % Math.ceil(points.length / 4) === 0) && (
                  <text
                    x={x(index)}
                    y="207"
                    textAnchor="middle"
                    className="business-trend-axis business-trend-date"
                  >
                    {dateLabel(point.date)}
                  </text>
                )}
              </g>
            ))}
          </svg>
          {active && (
            <div
              className="business-trend-tooltip"
              role="tooltip"
            >
              <strong>
                {dateLabel(active.date)}
                {active.date === active.endDate
                  ? ''
                  : ` – ${dateLabel(active.endDate)}`}
              </strong>
              {sales ? (
                <>
                  <span>
                    Sales:{' '}
                    {active.recordedValueCents == null
                      ? 'Not recorded'
                      : formatRecordedCurrency(active.recordedValueCents)}
                  </span>
                  {active.redemptions > 0 && (
                    <span>
                      {formatDashboardCount(active.valuedRedemptions)} of{' '}
                      {formatDashboardCount(active.redemptions)} redemptions
                      valued
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span>Claims: {formatDashboardCount(active.claims)}</span>
                  <span>
                    Redemptions: {formatDashboardCount(active.redemptions)}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function PerformanceTrends({ rows, period, error, reload }) {
  if (error)
    return (
      <div className="business-performance-error" role="alert">
        <p>Performance trends are unavailable.</p>
        <button type="button" onClick={reload}>
          Try again
        </button>
      </div>
    )

  const points = groupDashboardTrends(rows, period)
  return (
    <div
      className="business-trend-list"
      key={`${period.startDate}:${period.endDate}`}
    >
      <TrendChart
        key={`claims:${period.startDate}:${period.endDate}`}
        title="Deal claims and redemptions"
        points={points}
      />
      <TrendChart
        key={`sales:${period.startDate}:${period.endDate}`}
        title="Recorded sales value (NZD)"
        points={points}
        sales
      />
      <p>
        Claims use claim dates; redemptions and recorded sales use redemption
        dates. These are separate activity counts, not a customer cohort. Sales
        include recorded transaction amounts only; missing amounts are excluded.
      </p>
    </div>
  )
}
