import LoyaltySummary from '../../features/loyalty/components/LoyaltySummary'
import ProgramCard from '../../features/loyalty/components/ProgramCard'
import useLoyaltyPrograms from '../../features/loyalty/hooks/useLoyaltyPrograms'
import '../../features/loyalty/Loyalty.css'

export default function Loyalty() {
  const loyalty = useLoyaltyPrograms()
  const pointsProgramCount = loyalty.programs.filter(
    (program) => program.type === 'points',
  ).length

  return (
    <>
      <div className="page-header">
        <h2>Loyalty Programmes</h2>
        <p>Track your stamp cards and points across local businesses.</p>
      </div>
      <LoyaltySummary
        totalPoints={loyalty.totalPoints}
        pointsProgramCount={pointsProgramCount}
      />

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
          className={`tab-btn${loyalty.tab === 'completed' ? ' active' : ''}`}
          onClick={() => loyalty.setTab('completed')}
        >
          Completed ({loyalty.completed.length})
        </button>
      </div>

      {loyalty.error && (
        <div className="auth-error loyalty-error" role="alert">
          {loyalty.error}
        </div>
      )}

      {loyalty.list.length > 0 ? (
        <div className="loyalty-program-grid">
          {loyalty.list.map((program, index) => (
            <ProgramCard
              key={program.id}
              program={program}
              onRedeem={loyalty.handleRedeem}
              index={index}
              isRedeeming={loyalty.isRedeeming === program.id}
            />
          ))}
        </div>
      ) : (
        <div className="loyalty-empty-state">
          <div>{loyalty.tab === 'inprogress' ? '☕' : '🎉'}</div>
          {loyalty.tab === 'inprogress'
            ? loyalty.search
              ? 'No active programmes match your search.'
              : 'No active programmes yet — start collecting!'
            : 'No completed programmes yet — keep going!'}
        </div>
      )}
    </>
  )
}
