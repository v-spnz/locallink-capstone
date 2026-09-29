import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  MapPin,
  QrCode,
  ShieldCheck,
  Tag,
  UserPlus,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import {
  getCustomerReward,
  getProgrammeTypeLabel,
  LOYALTY_REDEMPTION_METHOD,
} from '../businessLoyaltyTemplates'
import {
  formatLoyaltyLookupCode,
  getLoyaltyIdentifierPayload,
} from '../loyaltyIdentifier'
import { getLoyaltyProgressPresentation } from '../loyaltyProgress'
import { createMyLoyaltyScanCode } from '../api/loyaltyApi'
import BusinessAvatar from './BusinessAvatar'
import StampRing from './StampRing'

export default function ProgramCard({ program, index, onJoin, autoOpen }) {
  const isJoined = program.isJoined ?? true
  const [view, setView] = useState(() => (autoOpen ? 'details' : null))
  const [scanSession, setScanSession] = useState(null)
  const [isCreatingCode, setIsCreatingCode] = useState(false)
  const [qrError, setQrError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const progress = getLoyaltyProgressPresentation(program)
  const isStampCard = program.programmeType === 'stamp_card'
  const businessName = program.business ?? program.businessName

  async function handleShowQr() {
    setQrError('')
    setIsCreatingCode(true)
    try {
      const session = await createMyLoyaltyScanCode(program.id)
      setScanSession(session)
      setView('qr')
    } catch (error) {
      console.error('Unable to create loyalty scan code.', error)
      setQrError(
        'Unable to create your loyalty QR right now. Please try again.',
      )
    } finally {
      setIsCreatingCode(false)
    }
  }

  async function handleJoin() {
    setJoinError('')
    setIsJoining(true)
    const result = await onJoin(program.joinCode)
    if (result !== true) setJoinError(result)
    setIsJoining(false)
  }

  function closeModal() {
    setView(null)
    setScanSession(null)
    setQrError('')
    setJoinError('')
  }

  return (
    <>
      <article
        className="ly-card card"
        style={{ animationDelay: `${index * 40}ms`, cursor: 'pointer' }}
        onClick={() => setView('details')}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setView('details')
          }
        }}
      >
        <div className="loyalty-program-header">
          {isStampCard ? (
            <StampRing earned={progress.progress} required={progress.target} />
          ) : (
            <BusinessAvatar name={businessName} />
          )}
          <div className="loyalty-program-business">
            <strong>{businessName}</strong>
            <span>{program.programmeName}</span>
          </div>
          {program.rewardEligible && (
            <span className="ly-badge-pulse">Reward ready</span>
          )}
        </div>

        {!isStampCard && (
          <div className="loyalty-points-progress">
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill ly-bar-fill"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span>{progress.progressLabel}</span>
          </div>
        )}

        <div className="loyalty-reward">
          <span>Reward</span>
          <strong>{getCustomerReward(program)}</strong>
        </div>
      </article>

      {view === 'details' && (
        <Modal onClose={closeModal} maxWidthClassName="max-w-md">
          <section
            className="loyalty-details-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`loyalty-details-title-${program.id}`}
          >
            <button
              className="loyalty-qr-close"
              type="button"
              onClick={closeModal}
              aria-label="Close loyalty programme details"
            >
              <X aria-hidden="true" />
            </button>

            <div className="loyalty-details-header">
              {isStampCard ? (
                <StampRing
                  earned={progress.progress}
                  required={progress.target}
                />
              ) : (
                <BusinessAvatar name={businessName} />
              )}
              <div className="loyalty-program-business">
                <strong id={`loyalty-details-title-${program.id}`}>
                  {businessName}
                </strong>
                <span>{program.programmeName}</span>
              </div>
            </div>

            {!isStampCard && (
              <div className="loyalty-points-progress">
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill ly-bar-fill"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <span>{progress.progressLabel}</span>
              </div>
            )}

            {program.rewardEligible && (
              <span className="ly-badge-pulse loyalty-details-badge">
                <CheckCircle2 aria-hidden="true" />
                Reward ready
              </span>
            )}

            <div className="loyalty-reward">
              <span>Reward</span>
              <strong>{getCustomerReward(program)}</strong>
            </div>

            <dl className="loyalty-details-list">
              <div>
                <dt>
                  <ClipboardList aria-hidden="true" size={14} />
                  How you earn
                </dt>
                <dd>{program.earningRules}</dd>
              </div>
              <div>
                <dt>
                  <Tag aria-hidden="true" size={14} />
                  Redemption method
                </dt>
                <dd>{LOYALTY_REDEMPTION_METHOD}</dd>
              </div>
              {!isJoined && program.formattedAddress && (
                <div>
                  <dt>
                    <MapPin aria-hidden="true" size={14} />
                    Location
                  </dt>
                  <dd>
                    {program.formattedAddress}
                    {program.distanceKm != null &&
                      ` · ${program.distanceKm.toFixed(1)} km away`}
                  </dd>
                </div>
              )}
            </dl>

            {isJoined ? (
              <>
                <Button
                  className="ly-redeem-btn"
                  onClick={handleShowQr}
                  disabled={isCreatingCode}
                >
                  <QrCode aria-hidden="true" />
                  {isCreatingCode ? 'Creating QR…' : 'Show loyalty QR'}
                </Button>
                {qrError && (
                  <p className="loyalty-qr-error" role="alert">
                    {qrError}
                  </p>
                )}
              </>
            ) : (
              <>
                <Button
                  className="ly-redeem-btn"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  <UserPlus aria-hidden="true" />
                  {isJoining ? 'Joining…' : 'Join'}
                </Button>
                {joinError && (
                  <p className="loyalty-qr-error" role="alert">
                    {joinError}
                  </p>
                )}
              </>
            )}
          </section>
        </Modal>
      )}

      {view === 'qr' && scanSession && (
        <Modal onClose={closeModal} maxWidthClassName="max-w-md">
          <section
            className="loyalty-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`loyalty-qr-title-${program.id}`}
          >
            <button
              className="loyalty-qr-back"
              type="button"
              onClick={() => setView('details')}
              aria-label="Back to programme details"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            <button
              className="loyalty-qr-close"
              type="button"
              onClick={closeModal}
              aria-label="Close loyalty QR code"
            >
              <X aria-hidden="true" />
            </button>
            <span className="loyalty-qr-status">
              {program.rewardEligible ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              {program.rewardEligible
                ? 'Reward ready'
                : progress.remainingLabel}
            </span>
            <h2 id={`loyalty-qr-title-${program.id}`}>
              {program.programmeName}
            </h2>
            <p>
              Show this code to {businessName}. They will scan it to find your
              programme and current progress.
            </p>
            <div className="loyalty-qr-code">
              <QRCodeSVG
                value={getLoyaltyIdentifierPayload(scanSession.scanCode)}
                size={220}
                level="M"
                marginSize={2}
                title={`${businessName} loyalty QR code`}
              />
            </div>
            <span className="loyalty-qr-manual-label">Or enter this code</span>
            <code>{formatLoyaltyLookupCode(scanSession.scanCode)}</code>
            <small>{getProgrammeTypeLabel(program.programmeType)}</small>
          </section>
        </Modal>
      )}
    </>
  )
}
