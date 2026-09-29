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
  getProgrammeTypeLabel,
  LOYALTY_REDEMPTION_METHOD,
  isEarlyEndGracePeriodActive,
} from '../businessLoyaltyTemplates'
import {
  formatLoyaltyLookupCode,
  getLoyaltyIdentifierPayload,
} from '../loyaltyIdentifier'
import { getLoyaltyProgressPresentation } from '../loyaltyProgress'
import { createMyLoyaltyScanCode } from '../api/loyaltyApi'
import LoyaltyTicket from './LoyaltyTicket'

export default function ProgramCard({ program, index, onJoin, autoOpen }) {
  const isJoined = program.isJoined ?? true
  const [view, setView] = useState(() => (autoOpen ? 'details' : null))
  const [scanSession, setScanSession] = useState(null)
  const [isCreatingCode, setIsCreatingCode] = useState(false)
  const [qrError, setQrError] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const progress = getLoyaltyProgressPresentation(program)
  const businessName = program.business ?? program.businessName
  const isInEarlyEndGracePeriod = isEarlyEndGracePeriodActive(program)
  const isEnded =
    isJoined &&
    Boolean(program.programmeStatus) &&
    program.programmeStatus !== 'active' &&
    !isInEarlyEndGracePeriod

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
        className="ly-card ly-card--ticket"
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
        <LoyaltyTicket
          program={program}
          progress={progress}
          businessName={businessName}
          isJoined={isJoined}
          isEnded={isEnded}
        />
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

            <LoyaltyTicket
              program={program}
              progress={progress}
              businessName={businessName}
              isJoined={isJoined}
              isEnded={isEnded}
              titleId={`loyalty-details-title-${program.id}`}
            />

            <dl className="loyalty-details-list">
              {isInEarlyEndGracePeriod && (
                <div className="loyalty-early-end-notice">
                  <dt>Programme ended early</dt>
                  <dd>
                    You can keep earning and redeeming until{' '}
                    {new Date(
                      `${program.earlyEndCompletionDeadline}T00:00:00`,
                    ).toLocaleDateString('en-NZ', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    .
                  </dd>
                </div>
              )}
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

            {!isJoined ? (
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
            ) : program.programmeStatus === 'active' ||
              isInEarlyEndGracePeriod ? (
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
              <p className="loyalty-ended-note">
                This programme has ended and can no longer be used.
              </p>
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
