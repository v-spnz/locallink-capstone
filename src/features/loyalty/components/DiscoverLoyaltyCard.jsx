import { CheckCircle2, Gift, MapPin, UserPlus } from 'lucide-react'
import { useState } from 'react'
import Button from '../../../components/ui/Button'
import { getCustomerReward, getProgrammeTypeLabel } from '../businessLoyaltyTemplates'

export default function DiscoverLoyaltyCard({ business, onJoin }) {
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  async function handleJoin() {
    setIsJoining(true)
    setJoinError('')
    const result = await onJoin(business.joinCode)
    if (result !== true) setJoinError(result)
    setIsJoining(false)
  }

  return (
    <article className="ly-discover-card card">
      <div className="ly-discover-card-heading">
        <span className="ly-discover-card-icon" aria-hidden="true">
          <Gift />
        </span>
        <div>
          <small>{getProgrammeTypeLabel(business.programmeType)}</small>
          <strong>{business.businessName}</strong>
          <span>{business.programmeName}</span>
        </div>
      </div>

      <div className="ly-discover-card-reward">
        <span>Reward</span>
        <strong>{getCustomerReward(business)}</strong>
      </div>

      <p className="ly-discover-card-earning">{business.earningRules}</p>

      <div className="ly-discover-card-location">
        <MapPin aria-hidden="true" size={13} />
        <span>{business.formattedAddress}</span>
        {business.distanceKm != null && (
          <strong>{business.distanceKm.toFixed(1)} km</strong>
        )}
      </div>

      {business.isJoined ? (
        <div className="ly-discover-card-joined">
          <CheckCircle2 aria-hidden="true" />
          Joined — {business.currentProgress ?? 0}/{business.rewardThreshold}{' '}
          progress
        </div>
      ) : (
        <>
          <Button onClick={handleJoin} disabled={isJoining}>
            <UserPlus aria-hidden="true" />
            {isJoining ? 'Joining…' : 'Join'}
          </Button>
          {joinError && (
            <p className="auth-error" role="alert">
              {joinError}
            </p>
          )}
        </>
      )}
    </article>
  )
}
