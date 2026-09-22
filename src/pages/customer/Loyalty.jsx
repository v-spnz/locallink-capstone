import ProgramCard from '../../features/loyalty/components/ProgramCard'
import useLoyaltyPrograms from '../../features/loyalty/hooks/useLoyaltyPrograms'
import '../../features/loyalty/Loyalty.css'

export default function Loyalty() {
  const loyalty = useLoyaltyPrograms()

  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your rewards and show your loyalty QR when you visit.</p>
      </div>

      <input
        type="text"
        className="ly-search"
        placeholder="Search your loyalty programmes..."
        value={loyalty.search}
        onChange={(event) => loyalty.setSearch(event.target.value)}
      />

      <div className="tab-row">
        <button
          className={`tab-btn${loyalty.tab === 'inprogress' ? ' active' : ''}`}
          onClick={() => loyalty.setTab('inprogress')}
        >
          In Progress ({loyalty.inProgress.length})
        </button>
        <button
          className={`tab-btn${loyalty.tab === 'ready' ? ' active' : ''}`}
          onClick={() => loyalty.setTab('ready')}
        >
          Reward ready ({loyalty.rewardReady.length})
        </button>
      </div>

      {loyalty.error && (
        <div className="auth-error loyalty-error" role="alert">
          {loyalty.error}
        </div>
      )}

      {loyalty.isLoading ? (
        <div className="loyalty-empty-state">Loading your programmes…</div>
      ) : loyalty.list.length > 0 ? (
        <div className="loyalty-program-grid">
          {loyalty.list.map((program, index) => (
            <ProgramCard key={program.id} program={program} index={index} />
          ))}
        </div>
      ) : (
        <div className="loyalty-empty-state">
          <div aria-hidden="true">
            {loyalty.tab === 'inprogress' ? '☕' : '🎉'}
          </div>
          {loyalty.tab === 'inprogress'
            ? loyalty.search
              ? 'No active programmes match your search.'
              : 'No active programmes yet — start collecting!'
            : 'No rewards are ready yet — keep going!'}
        </div>
      )}
    </>
  )
}
