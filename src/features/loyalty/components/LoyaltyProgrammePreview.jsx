import { CalendarDays, LockKeyhole } from 'lucide-react'
import { getLoyaltyProgressPresentation } from '../loyaltyProgress'
import { MAX_COUNT_BASED_REWARD_THRESHOLD } from '../businessLoyaltyValidation'
import {
  getEarningRules,
  isCountBasedLoyaltyType,
} from '../businessLoyaltyTemplates'
import LoyaltyTicket from './LoyaltyTicket'

function formatAvailability(programme) {
  if (!programme.startDate) return 'Choose when the programme starts'
  if (!programme.endDate) return `Starts ${programme.startDate}`
  return `${programme.startDate} to ${programme.endDate}`
}

export default function LoyaltyProgrammePreview({ programme, businessName }) {
  const filledFields = [
    programme.name,
    programme.programmeType,
    programme.rewardThreshold,
    programme.programmeType === 'spend_and_save'
      ? programme.rewardValue
      : programme.programmeType === 'spend_and_reward'
        ? programme.rewardDescription
        : isCountBasedLoyaltyType(programme.programmeType),
    programme.startDate,
  ].filter(Boolean).length
  const previewRewardThreshold =
    isCountBasedLoyaltyType(programme.programmeType) &&
    Number(programme.rewardThreshold) > MAX_COUNT_BASED_REWARD_THRESHOLD
      ? String(MAX_COUNT_BASED_REWARD_THRESHOLD)
      : programme.rewardThreshold
  const previewProgram = {
    ...programme,
    rewardThreshold: previewRewardThreshold,
    programmeName: programme.name || 'Untitled programme',
    rewardDescription: programme.rewardDescription || 'Add reward details',
    currentProgress: 0,
    rewardEligible: false,
    programmeStatus: 'active',
  }
  const previewProgress = getLoyaltyProgressPresentation(previewProgram)
  if (!programme.rewardThreshold) {
    previewProgress.progressLabel = 'Add a reward target'
    previewProgress.remainingLabel = 'Set target'
  }

  return (
    <aside
      className="deal-draft-rail loyalty-draft-preview deal-live-preview"
      aria-label="Draft summary"
    >
      <div className="deal-live-preview-heading">
        <strong>Customer Preview</strong>
      </div>
      <div className="loyalty-preview-heading">
        <span>
          <LockKeyhole aria-hidden="true" />
          Draft summary
        </span>
        <strong>{filledFields} of 5 details added</strong>
      </div>
      <div
        className="loyalty-preview-ticket"
        aria-label="Customer loyalty card preview"
      >
        <LoyaltyTicket
          program={previewProgram}
          progress={previewProgress}
          businessName={businessName || 'Your business'}
          isJoined
          isEnded={false}
          titleId="loyalty-preview-ticket-title"
        />
      </div>
      <div className="loyalty-preview-details">
        <p className="loyalty-field-helper">
          {getEarningRules(previewProgram) ||
            'Complete the template details to preview the rules.'}
        </p>
        <p className="loyalty-preview-availability">
          <CalendarDays aria-hidden="true" />
          {formatAvailability(programme)}
        </p>
      </div>
    </aside>
  )
}
