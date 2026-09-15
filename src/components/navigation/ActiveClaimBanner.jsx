import { Clock3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useActiveDealClaims from '../../features/deals/hooks/useActiveDealClaims'
import { formatCountdown } from '../../features/deals/countdown'
import './ActiveClaimBanner.css'

export default function ActiveClaimBanner() {
  const navigate = useNavigate()
  const { activeClaims, now } = useActiveDealClaims()

  if (activeClaims.length === 0) return null

  const claim = activeClaims[0]
  const msRemaining = new Date(claim.expires_at).getTime() - now.getTime()

  return (
    <button
      type="button"
      className="active-claim-banner"
      onClick={() => navigate(`/deals?claim=${claim.deal_id}`)}
    >
      <span className="active-claim-banner-group">
        <Clock3 size={13} aria-hidden="true" />
        <span className="active-claim-banner-text">
          Redeeming <strong>{claim.title}</strong> at {claim.business_name}
        </span>
      </span>
      <span className="active-claim-banner-divider" aria-hidden="true" />
      <span className="active-claim-banner-cta">Claim now</span>
      <span className="active-claim-banner-divider" aria-hidden="true" />
      <span className="active-claim-banner-timer">
        <span className="active-claim-banner-timer-label">
          Time remaining
        </span>
        <span className="active-claim-banner-countdown">
          {formatCountdown(msRemaining)}
        </span>
      </span>
    </button>
  )
}