import Button from '../../../components/ui/Button'
import BusinessAvatar from './BusinessAvatar'
import StampRing from './StampRing'

function getPercent(program) {
  if (program.type === 'stamp')
    return Math.round((program.stampsEarned / program.stampsRequired) * 100)
  return Math.round((program.points / program.pointsRequired) * 100)
}

export default function ProgramCard({ program, onRedeem, index, isRedeeming }) {
  const percent = getPercent(program)
  const isDone = program.status === 'completed'
  const almostThere = !isDone && percent >= 80

  return (
    <div className="ly-card card" style={{ animationDelay: `${index * 40}ms` }}>
      <div className="loyalty-program-header">
        {program.type === 'stamp' ? (
          <StampRing
            earned={program.stampsEarned}
            required={program.stampsRequired}
          />
        ) : (
          <BusinessAvatar name={program.business} />
        )}
        <div className="loyalty-program-business">
          <strong>{program.business}</strong>
          <span>{program.category}</span>
        </div>
        {almostThere && <span className="ly-badge-pulse">Almost there</span>}
      </div>

      {program.type === 'points' && (
        <div className="loyalty-points-progress">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill ly-bar-fill"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span>
            {program.points} / {program.pointsRequired} pts
          </span>
        </div>
      )}

      <div className="loyalty-reward">
        <span>Reward</span>
        <strong>{program.reward}</strong>
      </div>

      {isDone && (
        <div className="loyalty-redemption">
          {program.redeemed ? (
            <span>
              Redeemed{' '}
              {new Date(program.completedOn).toLocaleDateString('en-NZ', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          ) : (
            <Button
              className="ly-redeem-btn"
              onClick={() => onRedeem(program.id)}
              disabled={isRedeeming}
            >
              {isRedeeming ? 'Redeeming…' : 'Redeem Reward'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
