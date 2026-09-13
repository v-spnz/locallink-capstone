import {
  ArrowUpRight,
  BadgeCheck,
  Camera,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../../components/ui/Button'

function formatDateTime(value) {
  if (!value) return 'Not recorded'
  return new Date(value).toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatMoney(cents) {
  return (Number(cents) / 100).toLocaleString('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  })
}

function formatOffer(claim) {
  switch (claim.offerType) {
    case 'percentage_discount':
      return `${claim.discountPercentage}% off`
    case 'fixed_discount':
      return `${formatMoney(claim.discountAmountCents)} off`
    case 'special_price':
      return `${formatMoney(claim.dealPriceCents)} (usually ${formatMoney(claim.originalPriceCents)})`
    default:
      return claim.offerDetails || 'Deal offer'
  }
}

function ClaimDetail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function CodeScanner({ onCodeScanned, onClose }) {
  const videoRef = useRef(null)
  const onCodeScannedRef = useRef(onCodeScanned)
  const [scannerError, setScannerError] = useState('')

  useEffect(() => {
    onCodeScannedRef.current = onCodeScanned
  }, [onCodeScanned])

  useEffect(() => {
    let stream
    let animationFrame
    let isActive = true
    const videoElement = videoRef.current

    async function beginScanning() {
      if (!window.BarcodeDetector || !navigator.mediaDevices?.getUserMedia) {
        setScannerError(
          'QR scanning is not available in this browser. Enter the code instead.',
        )
        return
      }

      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (!isActive || !videoElement) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        videoElement.srcObject = stream
        await videoElement.play()

        async function detectCode() {
          if (!isActive) return

          try {
            const codes = await detector.detect(videoElement)
            if (codes[0]?.rawValue) {
              await onCodeScannedRef.current(codes[0].rawValue)
              if (isActive) onClose()
              return
            }
          } catch {
            // A frame can fail while the camera is starting. The next frame retries.
          }

          animationFrame = window.requestAnimationFrame(detectCode)
        }

        animationFrame = window.requestAnimationFrame(detectCode)
      } catch {
        if (isActive) {
          setScannerError(
            'Camera access was unavailable. Enter the redemption code instead.',
          )
        }
      }
    }

    beginScanning()

    return () => {
      isActive = false
      if (animationFrame) window.cancelAnimationFrame(animationFrame)
      stream?.getTracks().forEach((track) => track.stop())
      if (videoElement) videoElement.srcObject = null
    }
  }, [onClose])

  return (
    <div className="deal-code-scanner">
      <div className="deal-code-scanner-heading">
        <div>
          <strong>Scan customer QR code</strong>
          <span>Hold the code inside the camera frame.</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close scanner">
          <X aria-hidden="true" />
        </button>
      </div>
      {scannerError ? (
        <div className="deal-code-scanner-error" role="alert">
          <Camera aria-hidden="true" />
          <p>{scannerError}</p>
        </div>
      ) : (
        <div className="deal-code-camera-frame">
          <video ref={videoRef} muted playsInline aria-label="QR code camera" />
          <span aria-hidden="true">
            <ScanLine />
          </span>
        </div>
      )}
    </div>
  )
}

export default function DealRedemptionPanel({
  redemption,
  openScannerOnLoad = false,
}) {
  const [isScannerOpen, setIsScannerOpen] = useState(() => openScannerOnLoad)
  const claim = redemption.validatedClaim
  const closeScanner = useCallback(() => setIsScannerOpen(false), [])

  return (
    <section className="deal-redemption-workspace" aria-label="Deal redemption">
      <div className="deal-redemption-entry">
        {!redemption.completedRedemption && (
          <form
            className="deal-redemption-form"
            onSubmit={redemption.handleValidate}
            noValidate
          >
            <label htmlFor="deal-redemption-code">Redemption code</label>
            <div className="deal-redemption-controls">
              <input
                id="deal-redemption-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                spellCheck="false"
                placeholder="XXXX XXXX XXXX"
                value={redemption.code}
                onChange={(event) => redemption.updateCode(event.target.value)}
                aria-describedby={
                  redemption.error ? 'deal-redemption-error' : undefined
                }
                aria-invalid={Boolean(redemption.error)}
                disabled={redemption.isValidating || redemption.isRedeeming}
              />
              <Button
                variant="secondary"
                onClick={() => setIsScannerOpen(true)}
                disabled={redemption.isValidating || redemption.isRedeeming}
              >
                <ScanLine aria-hidden="true" />
                Scan code
              </Button>
              <Button
                type="submit"
                disabled={redemption.isValidating || redemption.isRedeeming}
              >
                {redemption.isValidating ? 'Checking...' : 'Check code'}
              </Button>
            </div>
          </form>
        )}

        {redemption.error && (
          <div
            className="auth-error deal-redemption-error"
            id="deal-redemption-error"
            role="alert"
          >
            {redemption.error}
          </div>
        )}

        {isScannerOpen && (
          <CodeScanner
            onCodeScanned={redemption.handleScannedCode}
            onClose={closeScanner}
          />
        )}

        {claim && !redemption.completedRedemption && (
          <div className="deal-redemption-review" aria-live="polite">
            <div className="deal-redemption-review-heading">
              <span aria-hidden="true">
                <ShieldCheck />
              </span>
              <div>
                <strong>Valid claim</strong>
                <p>Review the details before completing the redemption.</p>
              </div>
            </div>
            <dl>
              <ClaimDetail label="Deal" value={claim.dealTitle} />
              <ClaimDetail label="Offer" value={formatOffer(claim)} />
              <ClaimDetail label="Customer" value={claim.customerDisplayName} />
              <ClaimDetail
                label="Claimed"
                value={formatDateTime(claim.claimedAt)}
              />
              <ClaimDetail
                label="Redeem before"
                value={formatDateTime(claim.expiresAt)}
              />
              <ClaimDetail
                label="Claim reference"
                value={claim.claimReference}
              />
            </dl>
            {claim.redemptionInstructions && (
              <p className="deal-redemption-instructions">
                <strong>Redemption instructions</strong>
                {claim.redemptionInstructions}
              </p>
            )}
            <div className="deal-redemption-review-actions">
              <Button
                variant="secondary"
                onClick={redemption.resetRedemption}
                disabled={redemption.isRedeeming}
              >
                Cancel
              </Button>
              <Button
                onClick={redemption.handleConfirmRedemption}
                disabled={redemption.isRedeeming}
              >
                <BadgeCheck aria-hidden="true" />
                {redemption.isRedeeming ? 'Redeeming...' : 'Confirm redemption'}
              </Button>
            </div>
          </div>
        )}

        {claim && redemption.completedRedemption && (
          <div className="deal-redemption-success" role="status">
            <span aria-hidden="true">
              <BadgeCheck />
            </span>
            <div>
              <strong>Redemption complete</strong>
              <p>
                {claim.dealTitle} was redeemed for customer{' '}
                {claim.customerDisplayName} at{' '}
                {formatDateTime(redemption.completedRedemption.redeemedAt)}.
                {' Claim reference: '}
                {claim.claimReference}.
              </p>
            </div>
            <Button variant="secondary" onClick={redemption.resetRedemption}>
              <RotateCcw aria-hidden="true" />
              Redeem another
            </Button>
          </div>
        )}

        <div className="deal-redemption-records-link">
          <span>
            {redemption.claimLookupResult
              ? 'This claim was already redeemed.'
              : 'Looking into an earlier claim?'}
          </span>
          <Link
            to={
              redemption.claimLookupResult
                ? `/business/settings/claim-records?ref=${encodeURIComponent(redemption.claimLookupResult.claimReference)}`
                : '/business/settings/claim-records'
            }
          >
            {redemption.claimLookupResult
              ? 'Open claim record'
              : 'View claim records'}
            <ArrowUpRight aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}
