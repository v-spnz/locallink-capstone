import { CheckCircle2, QrCode, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import {
  getCustomerReward,
  getProgrammeTypeLabel,
} from '../businessLoyaltyTemplates'
import {
  formatLoyaltyLookupCode,
  getLoyaltyIdentifierPayload,
} from '../loyaltyIdentifier'
import { getLoyaltyProgressPresentation } from '../loyaltyProgress'
import { createMyLoyaltyScanCode } from '../api/loyaltyApi'
import BusinessAvatar from './BusinessAvatar'
import StampRing from './StampRing'

export default function ProgramCard({ program, index }) {
  const [isQrOpen, setIsQrOpen] = useState(false)
  const [scanSession, setScanSession] = useState(null)
  const [isCreatingCode, setIsCreatingCode] = useState(false)
  const [qrError, setQrError] = useState('')
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const progress = getLoyaltyProgressPresentation(program)
  const isStampCard = program.programmeType === 'stamp_card'

  useEffect(() => {
    if (!scanSession?.expiresAt) return undefined

    function updateCountdown() {
      setSecondsRemaining(
        Math.max(
          0,
          Math.ceil(
            (new Date(scanSession.expiresAt).getTime() - Date.now()) / 1000,
          ),
        ),
      )
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [scanSession])

  async function handleShowQr() {
    setQrError('')
    setIsCreatingCode(true)
    try {
      const session = await createMyLoyaltyScanCode(program.id)
      setScanSession(session)
      setIsQrOpen(true)
    } catch (error) {
      console.error('Unable to create loyalty scan code.', error)
      setQrError(
        'Unable to create your loyalty QR right now. Please try again.',
      )
    } finally {
      setIsCreatingCode(false)
    }
  }

  function closeQr() {
    setIsQrOpen(false)
    setScanSession(null)
  }

  const countdownMinutes = Math.floor(secondsRemaining / 60)
  const countdownSeconds = String(secondsRemaining % 60).padStart(2, '0')

  return (
    <>
      <article
        className="ly-card card"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="loyalty-program-header">
          {isStampCard ? (
            <StampRing earned={progress.progress} required={progress.target} />
          ) : (
            <BusinessAvatar name={program.business} />
          )}
          <div className="loyalty-program-business">
            <strong>{program.business}</strong>
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
      </article>

      {isQrOpen && scanSession && (
        <Modal onClose={closeQr} maxWidthClassName="max-w-md">
          <section
            className="loyalty-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`loyalty-qr-title-${program.id}`}
          >
            <button
              className="loyalty-qr-close"
              type="button"
              onClick={closeQr}
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
              Show this code to {program.business}. They will scan it to find
              your programme and current progress.
            </p>
            <div className="loyalty-qr-code">
              <QRCodeSVG
                value={getLoyaltyIdentifierPayload(scanSession.scanCode)}
                size={220}
                level="M"
                marginSize={2}
                title={`${program.business} loyalty QR code`}
              />
            </div>
            <span className="loyalty-qr-manual-label">Or enter this code</span>
            <code>{formatLoyaltyLookupCode(scanSession.scanCode)}</code>
            <small>
              {secondsRemaining > 0
                ? `Code expires in ${countdownMinutes}:${countdownSeconds}`
                : 'This code has expired. Close it and create a new one.'}
            </small>
            <small>{getProgrammeTypeLabel(program.programmeType)}</small>
          </section>
        </Modal>
      )}
    </>
  )
}
