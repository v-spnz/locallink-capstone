import { BadgePercent, BriefcaseBusiness, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'

export default function Dashboard() {
  const { business, capabilities, membership } = useBusiness()
  const modules = [
    capabilities.deals_enabled && {
      title: 'Deals',
      description: 'Create and manage offers for nearby customers.',
      to: '/business/create-deal',
      icon: BadgePercent,
    },
    capabilities.loyalty_enabled && {
      title: 'Loyalty',
      description: 'Build programmes that reward repeat visits.',
      to: '/business/create-loyalty',
      icon: Gift,
    },
    capabilities.service_marketplace_enabled && {
      title: 'Service Marketplace',
      description: 'Review matched job leads, quotes and active work.',
      to: '/business/job-leads',
      icon: BriefcaseBusiness,
    },
  ].filter(Boolean)

  return (
    <>
      <div className="page-header">
        <div className="page-header-eyebrow">Business dashboard</div>
        <h2>{business.business_name}</h2>
        <p>
          Your enabled LocalLink tools are collected here. You are signed in as
          {` ${membership.role}`}.
        </p>
      </div>

      <div className="business-module-grid">
        {modules.map((module) => {
          const Icon = module.icon

          return (
            <Link
              className="business-module-card"
              to={module.to}
              key={module.to}
            >
              <span>
                <Icon aria-hidden="true" />
              </span>
              <strong>{module.title}</strong>
              <p>{module.description}</p>
            </Link>
          )
        })}
      </div>

      {capabilities.service_marketplace_enabled && (
        <section className="placeholder-section">
          <div className="placeholder-section-title">
            Service Marketplace performance
          </div>
          <div className="stat-strip">
            {['Matched leads', 'Quote conversion', 'Revenue'].map((label) => (
              <div className="stat-tile" key={label}>
                <div className="stat-label">{label}</div>
                <div className="stat-value">—</div>
                <div className="stat-sub">No activity yet</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
