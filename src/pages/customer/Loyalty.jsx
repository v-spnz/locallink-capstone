import { useEffect, useState, useMemo } from 'react'
import mockLoyaltyPrograms from '../../data/mockLoyaltyPrograms'
import useAuth from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'
import './Loyalty.css'

function getPercent(p) {
  if (p.type === 'stamp')
    return Math.round((p.stampsEarned / p.stampsRequired) * 100)
  return Math.round((p.points / p.pointsRequired) * 100)
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

function ProgramCard({ program, onRedeem, index, isRedeeming }) {
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
              disabled={isRedeeming}
            >
              {isRedeeming ? 'Redeeming…' : 'Redeem Reward'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Loyalty() {
  const { user } = useAuth()
  const [tab, setTab] = useState('inprogress')
  const [search, setSearch] = useState('')
  const [programs, setPrograms] = useState(mockLoyaltyPrograms)
  const [error, setError] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(null)

  useEffect(() => {
    let active = true

    async function loadRedemptions() {
      const { data, error: queryError } = await supabase
        .from('reward_redemptions')
        .select('mock_programme_id, redeemed_at')
        .eq('user_id', user.id)

      if (!active) return
      if (queryError) {
        setError('Unable to load your saved redemptions right now.')
        return
      }

      const redemptionByProgramme = new Map(
        (data ?? []).map((item) => [item.mock_programme_id, item.redeemed_at]),
      )
      setPrograms(
        mockLoyaltyPrograms.map((program) => {
          const redeemedAt = redemptionByProgramme.get(program.id)
          return redeemedAt
            ? { ...program, redeemed: true, completedOn: redeemedAt }
            : program
        }),
      )
    }

    loadRedemptions()
    return () => {
      active = false
    }
  }, [user.id])

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

  async function handleRedeem(id) {
    setError('')
    setIsRedeeming(id)
    const { data, error: redeemError } = await supabase.rpc(
      'redeem_mock_loyalty_reward',
      { p_mock_programme_id: id },
    )

    if (redeemError) {
      setError('Unable to redeem this reward. Please try again.')
    } else {
      const redemption = Array.isArray(data) ? data[0] : data
      setPrograms((previous) =>
        previous.map((program) =>
          program.id === id
            ? {
                ...program,
                redeemed: true,
                completedOn: redemption.redeemed_at,
              }
            : program,
        ),
      )
    }
    setIsRedeeming(null)
  }

  const list = tab === 'inprogress' ? inProgress : completed
  return (
    <>
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

      {error && (
        <div className="auth-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}

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
              isRedeeming={isRedeeming === p.id}
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
