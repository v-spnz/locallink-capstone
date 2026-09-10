import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Tag,
  Wrench,
} from 'lucide-react'
import localNeighbourhoodStreet from '../assets/images/local-neighbourhood-street.jpg'
import LocalLinkLogo from '../components/branding/LocalLinkLogo'
import './LandingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <Link
          className="landing-brand"
          to="/"
          viewTransition
          aria-label="LocalLink home"
        >
          <LocalLinkLogo className="landing-brand-wordmark" />
        </Link>

        <nav className="landing-auth" aria-label="Account actions">
          <Link className="landing-login" to="/login" viewTransition>
            Log in
          </Link>
          <Link className="landing-create" to="/register" viewTransition>
            Create account
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <Eyebrow>Your neighbourhood, connected</Eyebrow>
            <h1>
              Local help,
              <br />
              <span>closer</span> to
              <br />
              home.
            </h1>
            <p className="landing-intro">
              LocalLink makes it easier to solve everyday problems, discover
              nearby businesses, and keep your local community moving.
            </p>

            <div className="landing-hero-actions">
              <Link
                className="landing-button landing-button-primary"
                to="/loyalty"
              >
                Explore nearby rewards <ExternalLink aria-hidden="true" />
              </Link>
              <Link
                className="landing-button landing-button-outline"
                to="/jobs"
              >
                Choose what you need.
              </Link>
            </div>

            <div className="landing-microcopy">
              <span className="landing-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>For the things you need, close to home.</span>
            </div>
          </div>

          <div
            className="landing-visual"
            aria-label="Local business image placeholders"
          >
            <div className="landing-photo-main">
              <img
                src={localNeighbourhoodStreet}
                alt="People gathering among cafés and local businesses on a lively neighbourhood street"
              />
            </div>

            <div className="landing-journey-card">
              <small>Example journey</small>
              <strong>
                Find a trusted
                <br />
                plumber nearby
              </strong>
              <span>
                <i /> 3 providers found&nbsp;&nbsp; within 5 km
              </span>
            </div>
          </div>
        </section>

        <section className="landing-benefits" aria-label="LocalLink benefits">
          <Benefit icon={<MapPin />} tone="soft">
            Nearby by design
          </Benefit>
          <Benefit icon={<Tag />} tone="amber">
            Relevant, useful offers
          </Benefit>
          <Benefit icon={<ShieldCheck />} tone="blue">
            Made for confident choices
          </Benefit>
        </section>

        <section className="landing-paths">
          <div className="landing-paths-heading">
            <Eyebrow>Start with what you need</Eyebrow>
            <h2>
              What brings you to
              <br />
              LocalLink?
            </h2>
            <p>
              Choose a starting point. Each path is built around a real task, so
              you always know what to do next.
            </p>
          </div>

          <div className="landing-path-grid">
            <PathCard
              icon={<Wrench />}
              title="I need a local problem sorted."
              description="Describe what needs doing and choose relevant local providers for your request."
              linkText="See the journey"
              to="/jobs"
            />
            <PathCard
              className="landing-path-card-light"
              icon={<MapPin />}
              title="I want a nearby coffee deal."
              description="Find useful local offers and businesses for the thing you are already trying to do today."
              linkText="Explore nearby"
              to="/deals"
            />
            <PathCard
              className="landing-path-card-dark"
              icon={<Tag />}
              title="Find and redeem local rewards."
              description="See what is available, understand how it works, and take a clear voucher to the business."
              linkText="View rewards"
              to="/loyalty"
            />
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <LocalLinkLogo className="landing-footer-wordmark" tone="light" />
        <span>© 2026 LocalLink</span>
        <span>Helping local feel a little closer.</span>
      </footer>
    </div>
  )
}

function Eyebrow({ children }) {
  return (
    <div className="landing-eyebrow">
      <span aria-hidden="true" />
      {children}
    </div>
  )
}

function Benefit({ icon, tone, children }) {
  return (
    <div className="landing-benefit">
      <span className={`landing-icon landing-icon-${tone}`}>{icon}</span>
      <span>{children}</span>
    </div>
  )
}

function PathCard({ icon, title, description, linkText, to, className = '' }) {
  return (
    <article className={`landing-path-card ${className}`}>
      <span className="landing-path-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <Link to={to}>
        {linkText} <ArrowRight aria-hidden="true" />
      </Link>
    </article>
  )
}
