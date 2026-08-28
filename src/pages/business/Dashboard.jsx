import {
  ArrowUpRight,
  BadgePercent,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Gift,
  MapPin,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import localBusinessNeighbourhood from '../../assets/images/local-business-neighbourhood.jpg'
import useBusiness from '../../business/useBusiness'

export default function Dashboard() {
  const {
    business,
    capabilities,
    membership,
    serviceProfile,
    serviceCategories,
    serviceAreas,
  } = useBusiness()
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
      detail: 'Programme builder in development',
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

  return (
    <div className="business-dashboard">
      <header className="page-header business-dashboard-header">
        <div className="business-dashboard-header-copy">
          <h1>{business.business_name}</h1>
          <span className="business-role-badge">
            <CheckCircle2 aria-hidden="true" />
            {membership.role} access
          </span>
        </div>
        <figure className="business-dashboard-hero-art">
          <img
            src={localBusinessNeighbourhood}
            alt="Local shops, a cafe and a service business in a connected neighbourhood"
          />
        </figure>
      </header>

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
