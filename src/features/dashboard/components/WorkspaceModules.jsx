import { ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function WorkspaceModules({ modules }) {
  return (
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
  )
}
