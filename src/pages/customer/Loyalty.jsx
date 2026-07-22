import { useState } from 'react'

export default function Loyalty() {
  const [tab, setTab] = useState('inprogress')
  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your stamp cards and points across local businesses.</p>
      </div>
      <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total Points</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--blue)' }}>—</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Placeholder</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>Gold Member</div>
          <div className="progress-bar-track" style={{ width: 160 }}>
            <div className="progress-bar-fill" style={{ width: '64%' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>180 pts to Platinum</div>
        </div>
      </div>
      <div className="tab-row">
        <button className={`tab-btn${tab === 'inprogress' ? ' active' : ''}`} onClick={() => setTab('inprogress')}>In Progress</button>
        <button className={`tab-btn${tab === 'completed' ? ' active' : ''}`} onClick={() => setTab('completed')}>Completed</button>
      </div>
      {tab === 'inprogress' ? (
        <div className="placeholder-section">
          <div className="placeholder-section-title">In Progress</div>
          <div className="placeholder-grid">
            {[1, 2, 3].map(i => (
              <div className="placeholder-card" key={i}>
                <div className="placeholder-icon" />
                <div className="placeholder-bar short" style={{ margin: 0 }} />
                <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${30 + i * 20}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="placeholder-section">
          <div className="placeholder-section-title">Completed</div>
          <div className="placeholder-box">Completed programmes list — component TBD</div>
        </div>
      )}
    </>
  )
}
