import { Gift } from 'lucide-react'
import {
  getCustomerReward,
  isCountBasedLoyaltyType,
} from '../businessLoyaltyTemplates'
import BusinessAvatar from './BusinessAvatar'
import StampRow, { MAX_STAMP_CIRCLES } from './StampRow'

export default function LoyaltyTicket({
  program,
  progress,
  businessName,
  isJoined,
  isEnded,
  titleId,
}) {
  const isCountBasedProgramme = isCountBasedLoyaltyType(program.programmeType)
  const showStamps =
    isCountBasedProgramme &&
    progress.target >= 1 &&
    progress.target <= MAX_STAMP_CIRCLES
  const isReady = Boolean(program.rewardEligible) && !isEnded
  const earned = Math.floor(progress.progress)

  let stateClass = ''
  if (isEnded) stateClass = ' is-ended'
  else if (isReady) stateClass = ' is-ready'

  let topRight = null
  if (isEnded) {
    topRight = <span className="ly-tag">Ended</span>
  } else if (isReady) {
    topRight = <span className="ly-tag">Reward ready</span>
  } else if (isJoined && showStamps) {
    topRight = (
      <div className="ly-count">
        {earned}
        <small>/{progress.target}</small>
      </div>
    )
  }

  const reward = getCustomerReward(program) || program.rewardDescription || ''

  let chip = null
  let chipClass = 'ly-chip'
  if (isReady) {
    chip = 'Show QR in store'
  } else if (!isJoined) {
    chip = 'Join'
    chipClass = 'ly-chip ly-chip--solid'
  } else if (!isEnded) {
    chip = progress.remainingLabel
  }

  return (
    <div className={`ly-ticket${stateClass}`}>
      <div className="ly-ticket-top">
        <BusinessAvatar name={businessName} />
        <div className="loyalty-program-business">
          <strong id={titleId}>{businessName}</strong>
          <span>{program.programmeName}</span>
        </div>
        {topRight}
      </div>

      {showStamps ? (
        <StampRow
          earned={earned}
          required={progress.target}
          initial={businessName.charAt(0)}
          showNext={isJoined && !isEnded}
        />
      ) : (
        <div className="ly-ticket-progress">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill ly-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span>{progress.progressLabel}</span>
        </div>
      )}

      <div className="ly-perf" />

      <div className="ly-stub">
        <span className="ly-gift" aria-hidden="true">
          <Gift />
        </span>
        <div className="ly-stub-reward">
          <span>Reward</span>
          <strong>{reward}</strong>
        </div>
        {chip && <span className={chipClass}>{chip}</span>}
      </div>
    </div>
  )
}
