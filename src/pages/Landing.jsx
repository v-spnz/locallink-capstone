import { LINKS } from '../config/links'

/**
 * Landing — public-facing home page
 * Links out to Business Portal and Customer Portal.
 * Swap LINKS values in config/links.js when client provides real URLs.
 */
export default function Landing() {
  return (
    <>
      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="nav">
        <span className="nav-logo">Local<span>Link</span></span>
        <div className="nav-links">
          <a className="nav-btn active" href={LINKS.landing}>Home</a>
          <a className="nav-btn" href={LINKS.businessPortal}>Business Portal</a>
          <a className="nav-btn" href={LINKS.customerPortal}>Customer Portal</a>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={styles.hero}>
        <span style={styles.eyebrow}>Locals Helping Locals through Technology</span>
        <h1 style={styles.h1}>
          Connecting your <em style={styles.em}>community</em>,<br />
          one business at a time.
        </h1>
        <p style={styles.sub}>
          LocalLink brings together local consumers and nearby businesses through
          loyalty rewards, curated deals, and a tradesperson marketplace —
          all in one regionally-based platform.
        </p>
        <div style={styles.cta}>
          <a className="btn-primary" href={LINKS.customerPortal}>I'm a Customer</a>
          <a className="btn-outline" href={LINKS.businessPortal}>I'm a Business</a>
        </div>
      </section>

      {/* ── Portal cards ──────────────────────────────────────── */}
      <section style={styles.cards}>
        <PortalCard
          type="business"
          icon="🏢"
          title="Business Portal"
          description="Manage your deals, loyalty programmes, and job listings. Track customer engagement through your analytics dashboard."
          chips={['Create Deals', 'Loyalty', 'Analytics', 'Settings']}
          href={LINKS.businessPortal}
          accent="var(--green-mid)"
        />
        <PortalCard
          type="customer"
          icon="📍"
          title="Customer Portal"
          description="Discover nearby businesses, track your loyalty rewards, browse local deals, and post jobs to local tradespeople."
          chips={['Discover', 'Loyalty', 'Jobs', 'Profile']}
          href={LINKS.customerPortal}
          accent="var(--amber)"
        />
      </section>

      <div className="skeleton-badge">v1 Skeleton</div>
    </>
  )
}

function PortalCard({ icon, title, description, chips, href, accent }) {
  return (
    <a href={href} style={{ ...styles.card, '--card-accent': accent }} className="portal-card-link">
      <div style={{ ...styles.cardAccentBar, background: accent }} />
      <div style={styles.cardIcon}>{icon}</div>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDesc}>{description}</p>
      <div style={styles.chipRow}>
        {chips.map(c => <span key={c} style={styles.chip}>{c}</span>)}
      </div>
    </a>
  )
}

/* ── Inline styles (layout only — colours from CSS vars) ─────────── */
const styles = {
  hero: {
    background: 'var(--green-dark)',
    padding: '72px 32px 64px',
    textAlign: 'center',
  },
  eyebrow: {
    display: 'inline-block',
    background: 'var(--amber)',
    color: 'var(--green-dark)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.1em',
    textTransform: 'uppercase',
    padding: '4px 14px',
    borderRadius: 20,
    marginBottom: 24,
  },
  h1: {
    fontFamily: "'Fraunces', serif",
    fontWeight: 800,
    fontSize: 'clamp(36px, 6vw, 62px)',
    color: 'var(--cream)',
    lineHeight: 1.1,
    maxWidth: 680,
    margin: '0 auto 20px',
  },
  em: { fontStyle: 'italic', color: 'var(--green-light)', fontWeight: 300 },
  sub: {
    color: 'rgba(245,240,232,0.70)',
    fontSize: 17,
    maxWidth: 520,
    margin: '0 auto 40px',
    lineHeight: 1.65,
  },
  cta: { display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
    padding: '48px 32px',
    maxWidth: 900,
    margin: '0 auto',
  },
  card: {
    background: 'var(--white)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px 30px',
    border: '1.5px solid var(--cream-dark)',
    boxShadow: 'var(--shadow)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
    position: 'relative',
    overflow: 'hidden',
    transition: 'var(--transition)',
  },
  cardAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 4 },
  cardIcon: { fontSize: 36, marginBottom: 14 },
  cardTitle: {
    fontFamily: "'Fraunces', serif",
    fontSize: 22,
    fontWeight: 600,
    marginBottom: 8,
    color: 'var(--green-dark)',
  },
  cardDesc: { fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip: {
    background: 'var(--skeleton-bg)',
    color: 'var(--text-muted)',
    fontSize: 11.5,
    fontWeight: 500,
    padding: '4px 10px',
    borderRadius: 20,
    border: '1px solid var(--skeleton-bd)',
  },
}