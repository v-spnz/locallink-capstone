import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Gift,
  MapPin,
  NotebookPen,
} from 'lucide-react'
import localBusinessNeighbourhood from '../../assets/images/local-business-neighbourhood.jpg'

export default function CreateLoyalty() {
  return (
    <div className="business-loyalty-page">
      <header className="page-header">
        <h1>Loyalty programmes</h1>
      </header>

      <section className="business-loyalty-coming-soon">
        <div className="business-loyalty-intro">
          <span className="business-loyalty-icon" aria-hidden="true">
            <Gift />
          </span>
          <span className="business-feature-status">In development</span>
          <h2>A clearer way to reward regulars</h2>
          <p>
            Loyalty programme creation is not available yet. This workspace will
            support digital rewards without paper cards or extra apps.
          </p>
          <button type="button" className="btn-primary" disabled>
            Programme builder coming soon
          </button>
        </div>

        <figure className="business-loyalty-art">
          <img
            src={localBusinessNeighbourhood}
            alt="A local cafe owner welcoming a returning customer"
          />
        </figure>

        <aside className="business-loyalty-plan" aria-label="Planned features">
          <h3>Planned for this workspace</h3>
          <ul>
            <li>
              <CheckCircle2 aria-hidden="true" />
              Stamp and points-based rewards
            </li>
            <li>
              <MapPin aria-hidden="true" />
              Rewards linked to participating locations
            </li>
            <li>
              <Bell aria-hidden="true" />
              Clear customer progress and notifications
            </li>
          </ul>

          <div className="business-loyalty-flow">
            <h3>Planned merchant flow</h3>
            <ol>
              <li>
                <span>Choose the reward</span>
                <ArrowRight aria-hidden="true" />
              </li>
              <li>
                <span>Set earning and redemption rules</span>
                <ArrowRight aria-hidden="true" />
              </li>
              <li>
                <span>Publish to participating locations</span>
              </li>
            </ol>
          </div>
        </aside>
      </section>

      <section className="business-loyalty-preparation">
        <span aria-hidden="true">
          <NotebookPen />
        </span>
        <div>
          <h2>What you can prepare now</h2>
          <p>
            Decide the customer action that earns a reward, the reward itself,
            participating locations and any redemption exclusions.
          </p>
        </div>
        <dl>
          <div>
            <dt>Earn rule</dt>
            <dd>Purchase, visit or points threshold</dd>
          </div>
          <div>
            <dt>Reward</dt>
            <dd>Discount, free item or custom benefit</dd>
          </div>
          <div>
            <dt>Terms</dt>
            <dd>Locations, expiry and exclusions</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
