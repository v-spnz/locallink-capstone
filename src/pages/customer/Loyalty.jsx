import { useState, useMemo } from 'react'

const mockPrograms = [
  {
    id: 1,
    business: 'Ponsonby Cafe',
    category: 'Cafe',
    type: 'stamp',
    stampsEarned: 7,
    stampsRequired: 10,
    reward: 'Free coffee of your choice',
    status: 'active',
  },
  {
    id: 2,
    business: 'Kingsland Blooms',
    category: 'Florist',
    type: 'points',
    points: 320,
    pointsRequired: 500,
    reward: '20% off your next bouquet',
    status: 'active',
  },
  {
    id: 3,
    business: 'Mount Eden Pizza',
    category: 'Restaurant',
    type: 'stamp',
    stampsEarned: 6,
    stampsRequired: 8,
    reward: 'Free medium pizza',
    status: 'active',
  },
  {
    id: 4,
    business: 'Devonport Carwash',
    category: 'Auto',
    type: 'stamp',
    stampsEarned: 10,
    stampsRequired: 10,
    reward: 'Free  premium car wash',
    status: 'completed',
    completedOn: '2026-06-27',
    redeemed: true,
  },
  {
    id: 5,
    business: 'Grey Lynn Bookstore',
    category: 'Bookstore',
    type: 'points',
    points: 500,
    pointsRequired: 500,
    reward: '$15 voucher',
    status: 'completed',
    completedOn: '2026-08-06',
    redeemed: false,
  },
  {
    id: 6,
    business: 'Parnell Bakery',
    category: 'Bakery',
    type: 'stamp',
    stampsEarned: 3,
    stampsRequired: 6,
    reward: 'Free loaf of bread',
    status: 'active',
  },
]

function getPercent(p) {
  if (p.type === 'stamp')
    return Math.round((p.stampsEarned / p.stampsRequired) * 100)
  return Math.round((p.points / p.pointsRequired) * 100)
}

function LoyaltyStyles() {
  return (
    <style>{`
      .ly-card { transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease; border: 1px solid transparent; animation: ly-rise .35s ease backwards; }
      .ly-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px -12px rgba(0,0,0,0.18); border-color: rgba(0,0,0,0.06); }
      @keyframes ly-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .ly-bar-fill { transition: width .6s cubic-bezier(.22,1,.36,1); }
      .ly-ring-fill { transition: stroke-dashoffset .6s cubic-bezier(.22,1,.36,1); }
      .ly-redeem-btn { transition: transform .12s ease, box-shadow .12s ease, filter .12s ease; }
      .ly-redeem-btn:hover { filter: brightness(1.06); box-shadow: 0 6px 16px -6px rgba(59,130,246,0.5); }
      .ly-redeem-btn:active { transform: scale(0.97); }
      .ly-search { transition: border-color .15s ease, box-shadow .15s ease; }
      .ly-search:focus { outline: none; border-color: var(--blue); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
      .ly-badge-pulse { animation: ly-pulse 1.8s ease-in-out infinite; }
      @keyframes ly-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
      @media (prefers-reduced-motion: reduce) {
        .ly-card, .ly-bar-fill, .ly-ring-fill, .ly-redeem-btn, .ly-badge-pulse { animation: none !important; transition: none !important; }
      }
    `}</style>
  )
}

function BusinessAvatar({ name }) {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        background: 'linear-gradient(135deg, var(--blue), #2563eb)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 16,
        flexShrink: 0,
        boxShadow: '0 4px 10px -4px rgba(59,130,246,0.5)',
      }}
    >
      {name.charAt(0)}
    </div>
  )
}

function StampRing({ earned, required }) {
  const size = 64
  const stroke = 6
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const percent = earned / required
  const offset = circumference * (1 - percent)
  const done = earned >= required

  return (
    <div
      style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={stroke}
        />
        <circle
          className="ly-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? 'var(--emerald)' : 'var(--blue)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          color: done ? 'var(--emerald)' : 'var(--blue)',
        }}
      >
        {earned}/{required}
      </div>
    </div>
  )
}

function ProgramCard({ program, onRedeem, index }) {
  const percent = getPercent(program)
  const isDone = program.status === 'completed'
  const almostThere = !isDone && percent >= 80

  return (
    <div
      className="ly-card card"
      style={{ padding: 18, animationDelay: `${index * 40}ms` }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        {program.type === 'stamp' ? (
          <StampRing
            earned={program.stampsEarned}
            required={program.stampsRequired}
          />
        ) : (
          <BusinessAvatar name={program.business} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>
            {program.business}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {program.category}
          </div>
        </div>
        {almostThere && (
          <span
            className="ly-badge-pulse"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--emerald)',
              background: 'rgba(16,185,129,0.12)',
              padding: '4px 9px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}
          >
            Almost there
          </span>
        )}
      </div>

      {program.type === 'points' && (
        <div style={{ margin: '4px 0 12px' }}>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill ly-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div
            style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}
          >
            {program.points} / {program.pointsRequired} pts
          </div>
        </div>
      )}

      <div
        style={{
          padding: '10px 12px',
          background: 'rgba(59,130,246,0.06)',
          borderLeft: '3px solid var(--blue)',
          borderRadius: '6px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            color: 'var(--blue)',
            marginBottom: 2,
          }}
        >
          Reward
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--text, #1a1a1a)',
          }}
        >
          {program.reward}
        </div>
      </div>

      {isDone && (
        <div style={{ marginTop: 12 }}>
          {program.redeemed ? (
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              Redeemed{' '}
              {new Date(program.completedOn).toLocaleDateString('en-NZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          ) : (
            <button
              className="ly-redeem-btn tab-btn active"
              style={{ width: '100%', border: 'none', cursor: 'pointer' }}
              onClick={() => onRedeem(program.id)}
            >
              Redeem Reward
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Loyalty() {
  const [tab, setTab] = useState('inprogress')
  const [search, setSearch] = useState('')
  const [programs, setPrograms] = useState(mockPrograms)

  const totalPoints = useMemo(
    () =>
      programs.reduce(
        (sum, p) => sum + (p.type === 'points' ? p.points : 0),
        0,
      ),
    [programs],
  )

  const filtered = programs.filter((p) =>
    p.business.toLowerCase().includes(search.toLowerCase()),
  )

  const inProgress = filtered
    .filter((p) => p.status === 'active')
    .sort((a, b) => getPercent(b) - getPercent(a))

  const completed = filtered
    .filter((p) => p.status === 'completed')
    .sort((a, b) => new Date(b.completedOn) - new Date(a.completedOn))

  function handleRedeem(id) {
    setPrograms((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, redeemed: true, completedOn: new Date().toISOString() }
          : p,
      ),
    )
  }

  const list = tab === 'inprogress' ? inProgress : completed
  return (
    <>
      <LoyaltyStyles />
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your stamp cards and points across local businesses.</p>
      </div>
      <div
        className="card"
        style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Total Points
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--blue)',
              lineHeight: 1.1,
            }}
          >
            {totalPoints.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Across {programs.filter((p) => p.type === 'points').length} points
            programmes
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}
          >
            Gold Member
          </div>
          <div className="progress-bar-track" style={{ width: 160 }}>
            <div className="progress-bar-fill" style={{ width: '64%' }} />
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}
          >
            180 pts to Platinum
          </div>
        </div>
      </div>

      <input
        type="text"
        className="ly-search"
        placeholder="Search your loyalty programmes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: 10,
          border: '1px solid rgba(0,0,0,0.1)',
          marginBottom: 16,
          fontSize: 14,
        }}
      />

      <div className="tab-row">
        <button
          className={`tab-btn${tab === 'inprogress' ? ' active' : ''}`}
          onClick={() => setTab('inprogress')}
        >
          In Progress ({inProgress.length})
        </button>
        <button
          className={`tab-btn${tab === 'completed' ? ' active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed ({completed.length})
        </button>
      </div>

      {list.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: 14,
            marginTop: 16,
          }}
        >
          {list.map((p, i) => (
            <ProgramCard
              key={p.id}
              program={p}
              onRedeem={handleRedeem}
              index={i}
            />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            padding: '48px 16px',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>
            {tab === 'inprogress' ? '☕' : '🎉'}
          </div>
          {tab === 'inprogress'
            ? search
              ? 'No active programmes match your search.'
              : 'No active programmes yet — start collecting!'
            : 'No completed programmes yet — keep going!'}
        </div>
      )}
    </>
  )
}
