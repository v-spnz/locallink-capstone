import {
  CheckCircle2,
  Gift,
  PlusCircle,
  ScanLine,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Button from '../../components/ui/Button'
import QrCodeScanner from '../../components/ui/QrCodeScanner'
import { getProgrammeTypeLabel } from '../../features/loyalty/businessLoyaltyTemplates'
import useLoyaltyCustomerLookup from '../../features/loyalty/hooks/useLoyaltyCustomerLookup'
import {
  getLoyaltyEligibilityLabel,
  getLoyaltyProgressPresentation,
} from '../../features/loyalty/loyaltyProgress'
import '../../features/loyalty/LoyaltyCustomerLookup.css'
import '../../features/deals/DealRedemption.css'

function formatUpdatedAt(value) {
  if (!value) return 'Not recorded'
  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function LoyaltyRecord({
  record,
  onClear,
  onAddStamp,
  isAddingStamp,
  stampError,
  stampSuccess,
  onRedeem,
  isRedeeming,
  redeemError,
  redeemSuccess,
}) {
  const progress = getLoyaltyProgressPresentation(record)
  const eligibilityLabel = getLoyaltyEligibilityLabel(record)
  // Fixed: this previously checked for 'points', a value that no longer
  // exists — the app uses stamp_card/spend_and_save/spend_and_reward, so
  // every dollar-based programme was silently always treated as a stamp
  // card, always adding a flat 1 instead of a dollar amount.
  const isPoints = record.programmeType !== 'stamp_card'
  const [pointsAmount, setPointsAmount] = useState('1')

  return (
    <article
      className="loyalty-customer-result deal-redemption-review"
      aria-live="polite"
    >
      <header className="loyalty-customer-result-heading">
        <span className="loyalty-customer-avatar" aria-hidden="true">
          <UserRound />
        </span>
        <div>
          <small>Customer loyalty record</small>
          <h2>{record.customerDisplayName}</h2>
          <code>{record.loyaltyIdentifier}</code>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Close loyalty record"
        >
          <X aria-hidden="true" />
        </button>
      </header>

      <section className="loyalty-customer-programme">
        <div>
          <span aria-hidden="true">
            <Gift />
          </span>
          <div>
            <small>{getProgrammeTypeLabel(record.programmeType)}</small>
            <h3>{record.programmeName}</h3>
          </div>
        </div>
        <span
          className={`loyalty-customer-eligibility${record.rewardEligible ? ' is-ready' : ''}`}
        >
          {record.rewardEligible ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
          {eligibilityLabel}
        </span>
      </section>

      <section
        className="loyalty-customer-progress"
        aria-labelledby="loyalty-progress-title"
      >
        <div>
          <h3 id="loyalty-progress-title">Current progress</h3>
          <strong>{progress.progressLabel}</strong>
        </div>
        <progress
          value={progress.progress}
          max={progress.target}
          aria-label={`${record.programmeName} progress`}
        >
          {Math.round(progress.percentage)}%
        </progress>
        <p>
          {record.rewardEligible
            ? 'The customer has reached the reward target.'
            : progress.remainingLabel}
        </p>
      </section>

      <dl className="loyalty-customer-details">
        <div>
          <dt>How customers earn</dt>
          <dd>{record.earningRules}</dd>
        </div>
        <div>
          <dt>Customer reward</dt>
          <dd>{record.rewardDescription}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatUpdatedAt(record.updatedAt)}</dd>
        </div>
      </dl>

      <section className="loyalty-customer-add-progress">
        {record.rewardEligible && (
          <>
            <Button
              variant="success"
              className="loyalty-customer-redeem-btn"
              onClick={onRedeem}
              disabled={isRedeeming}
            >
              <Gift aria-hidden="true" />
              {isRedeeming ? 'Redeeming…' : 'Redeem reward'}
            </Button>
            {redeemError && (
              <p className="auth-error loyalty-stamp-error" role="alert">
                {redeemError}
              </p>
            )}
            {redeemSuccess && !redeemError && (
              <p className="loyalty-stamp-success" role="status">
                Reward redeemed.
              </p>
            )}
          </>
        )}

        {isPoints ? (
          <div className="loyalty-customer-points-row">
            <label htmlFor="loyalty-points-amount">Points to add</label>
            <input
              id="loyalty-points-amount"
              type="number"
              min="1"
              step="1"
              value={pointsAmount}
              onChange={(event) => setPointsAmount(event.target.value)}
              disabled={isAddingStamp}
            />
            <Button
              onClick={() => onAddStamp(Number(pointsAmount) || 1)}
              disabled={isAddingStamp || !Number(pointsAmount)}
            >
              <PlusCircle aria-hidden="true" />
              {isAddingStamp ? 'Adding…' : 'Add points'}
            </Button>
          </div>
        ) : (
          <Button onClick={() => onAddStamp(1)} disabled={isAddingStamp}>
            <PlusCircle aria-hidden="true" />
            {isAddingStamp ? 'Adding…' : 'Add stamp'}
          </Button>
        )}
        {stampError && (
          <p className="auth-error loyalty-stamp-error" role="alert">
            {stampError}
          </p>
        )}
        {stampSuccess && !stampError && (
          <p className="loyalty-stamp-success" role="status">
            {isPoints ? 'Points added.' : 'Stamp added.'}
          </p>
        )}
      </section>
    </article>
  )
}

export default function LoyaltyCustomerLookup() {
  const [searchParams] = useSearchParams()
  const lookup = useLoyaltyCustomerLookup()
  const [isScannerOpen, setIsScannerOpen] = useState(
    () => searchParams.get('identify') === 'scan',
  )
  const closeScanner = useCallback(() => setIsScannerOpen(false), [])

  return (
    <section
      className="deal-redemption-workspace loyalty-identification-workspace"
      aria-label="Loyalty customer identification"
    >
      <div className="deal-redemption-entry">
        <form
          className="deal-redemption-form"
          onSubmit={lookup.handleLookup}
          noValidate
        >
          <label htmlFor="customer-loyalty-identifier">Loyalty code</label>
          <div className="deal-redemption-controls">
            <input
              id="customer-loyalty-identifier"
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
              placeholder="LL-XXXX-XXXX"
              value={lookup.identifier}
              onChange={(event) => lookup.updateIdentifier(event.target.value)}
              aria-describedby={
                lookup.error ? 'loyalty-customer-error' : undefined
              }
              aria-invalid={Boolean(lookup.error)}
              disabled={lookup.isLookingUp}
            />
            <Button
              variant="secondary"
              onClick={() => setIsScannerOpen(true)}
              disabled={lookup.isLookingUp}
            >
              <ScanLine aria-hidden="true" />
              Scan code
            </Button>
            <Button type="submit" disabled={lookup.isLookingUp}>
              <Search aria-hidden="true" />
              {lookup.isLookingUp ? 'Checking...' : 'Check code'}
            </Button>
          </div>
        </form>

        {lookup.error && (
          <div
            id="loyalty-customer-error"
            className="auth-error deal-redemption-error"
            role="alert"
          >
            {lookup.error}
          </div>
        )}

        {isScannerOpen && (
          <QrCodeScanner
            onCodeScanned={lookup.handleScannedCode}
            onClose={closeScanner}
            title="Scan customer loyalty QR code"
            instructions="Hold the customer's loyalty code inside the camera frame."
            cameraErrorMessage="Camera access was unavailable. Enter the loyalty code instead."
          />
        )}

        {lookup.record && (
          <LoyaltyRecord
            record={lookup.record}
            onClear={lookup.clearLookup}
            onAddStamp={lookup.addStamp}
            isAddingStamp={lookup.isAddingStamp}
            stampError={lookup.stampError}
            stampSuccess={lookup.stampSuccess}
            onRedeem={lookup.redeemReward}
            isRedeeming={lookup.isRedeeming}
            redeemError={lookup.redeemError}
            redeemSuccess={lookup.redeemSuccess}
          />
        )}

        <div className="loyalty-customer-privacy-note">
          <ShieldCheck aria-hidden="true" />
          <p>
            Only loyalty records for programmes operated by your business can be
            opened here.
          </p>
        </div>
      </div>
    </section>
  )
}
