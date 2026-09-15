import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Bookmark,
  Calendar,
  Check,
  Clock,
  MapPin,
  Tag,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Modal from '../../../components/ui/Modal'
import { formatCountdown } from '../countdown'
import {
  formatRedemptionCode,
  getRedemptionCodePayload,
} from '../redemptionCode'

function formatDate(value) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatMoney(cents) {
  return (cents / 100).toLocaleString('en-NZ', {
    style: 'currency',
    currency: 'NZD',
  })
}
function getOfferSummary(deal) {
  switch (deal.offer_type) {
    case 'percentage_discount':
      return `${deal.discount_percentage}% off`
    case 'fixed_discount':
      return deal.discount_amount_cents
        ? `${formatMoney(deal.discount_amount_cents)} off`
        : 'Discount'
    case 'special_price':
      return deal.original_price_cents && deal.deal_price_cents
        ? `Was ${formatMoney(deal.original_price_cents)}, now ${formatMoney(deal.deal_price_cents)}`
        : 'Special price'
    case 'buy_one_get_one':
    case 'other':
    default:
      return deal.offer_details || 'Special offer'
  }
}

export default function DealDetailModal({
  deal,
  businessName,
  address,
  categoryEmoji,
  distanceKm,
  suburb,
  onClose,
  isSaved,
  isClaimed,
  isClaiming,
  claimError,
  claimExpiresAt,
  claimRedeemedAt,
  claimReference,
  redemptionCode,
  onClaim,
  onToggleSave,
}) {
  const [showQrCode, setShowQrCode] = useState(() => Boolean(isClaimed))
  const [showConfirm, setShowConfirm] = useState(false)

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!claimExpiresAt) return undefined
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [claimExpiresAt])

  if (!deal) return null
  const msRemaining = claimExpiresAt
    ? new Date(claimExpiresAt).getTime() - now
    : null
  const endedEarly = deal.status === 'ended_early'
  const windowExpired = msRemaining != null && msRemaining <= 0
  const isRedeemed = Boolean(claimRedeemedAt)
  const claimsRemaining =
    deal.claim_limit != null
      ? Math.max(0, deal.claim_limit - (deal.claims_used ?? 0))
      : null
  const isSoldOut = claimsRemaining === 0 && !isClaimed

  function handleClaim() {
    if (isClaimed) {
      setShowQrCode(true)
      return
    }
    setShowConfirm(true)
  }

  async function confirmClaim() {
    setShowConfirm(false)
    const claimed = await onClaim(deal.id)
    if (claimed) setShowQrCode(true)
  }

  return (
    <Modal onClose={onClose} maxWidthClassName="max-w-xl">
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden rounded-t-2xl"
        style={
          deal.image_url
            ? undefined
            : { background: 'linear-gradient(135deg, #6d7dc9, #3f4f9e)' }
        }
      >
        {deal.image_url ? (
          <>
            <img
              src={deal.image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/10" aria-hidden="true" />
          </>
        ) : (
          <span className="text-4xl" aria-hidden="true">
            {categoryEmoji}
          </span>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[var(--amber-light)] px-3 py-1 text-xs font-bold text-[#7a5c00]">
          {getOfferSummary(deal)}
        </span>
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-[#202a3a] px-6 py-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-white/70">
          {businessName}
        </div>
        <h2 className="mt-0.5 text-lg font-extrabold text-white">
          {deal.title}
        </h2>
      </div>

      <div className="px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {deal.category && (
            <span className="rounded-full bg-[var(--blue-light)] px-3 py-1 text-xs font-semibold text-[var(--blue)]">
              {deal.category}
            </span>
          )}
          {suburb && (
            <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
              {suburb}
              {distanceKm != null && ` · ${Number(distanceKm).toFixed(1)} km`}
            </span>
          )}
          {deal.end_date && (
            <span className="rounded-full bg-[#fff5f5] px-3 py-1 text-xs font-semibold text-[var(--danger)]">
              {endedEarly
                ? `Ended early ${formatDate(deal.ended_at)}`
                : `Expires ${formatDate(deal.end_date)}`}
            </span>
          )}
        </div>

        {endedEarly && isClaimed && !isRedeemed && (
          <div className="mb-4 rounded-md border border-[#f1c7c7] bg-[#fff5f5] p-3 text-sm text-[var(--text)]">
            <strong className="block text-[var(--danger)]">
              Claim protected
            </strong>
            This deal ended early, but your existing claim remains redeemable
            under the original terms.
          </div>
        )}

        {deal.description && (
          <p className="mb-4 text-sm text-[var(--text)]">{deal.description}</p>
        )}

        {address && (
          <div className="mb-4 flex items-start gap-2 text-sm text-[var(--text-muted)]">
            <MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{address}</span>
          </div>
        )}

        {claimsRemaining !== null && (
          <div
            className={
              'mb-4 flex items-center gap-1.5 text-sm ' +
              (claimsRemaining === 0
                ? 'font-semibold text-[var(--danger)]'
                : 'text-[var(--text-muted)]')
            }
          >
            {claimsRemaining === 0 && <Ban size={14} aria-hidden="true" />}
            {claimsRemaining === 0
              ? 'No claims remaining. This deal is fully claimed'
              : `${claimsRemaining} claim${claimsRemaining === 1 ? '' : 's'} remaining`}
          </div>
        )}

        {deal.redemption_instructions && (
          <div className="mb-4 flex items-start gap-2 rounded-md bg-[var(--blue-light)] p-3">
            <Tag
              size={15}
              className="mt-0.5 shrink-0 text-[var(--blue)]"
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">
                How to redeem
              </div>
              <p className="whitespace-pre-line text-sm text-[var(--text)]">
                {deal.redemption_instructions}
              </p>
            </div>
          </div>
        )}

        {deal.exclusions && (
          <div className="mb-4 rounded-md bg-[var(--bg)] p-3">
            <div className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-[var(--text-muted)]">
              <Ban size={15} aria-hidden="true" />
              Exclusions
            </div>
            <p className="whitespace-pre-line text-sm text-[var(--text-muted)]">
              {deal.exclusions}
            </p>
          </div>
        )}

        {deal.conditions && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              <Check size={13} aria-hidden="true" />
              Conditions
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-[var(--text-muted)]">
              {deal.conditions}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)]">
          <Calendar size={15} aria-hidden="true" />
          <span>Valid:</span>
          <strong className="text-[var(--text)]">
            {formatDate(deal.start_date)} to {formatDate(deal.end_date)}
          </strong>
        </div>
      </div>

      {showConfirm && (
        <div className="border-t border-[var(--border)] bg-[#fff8e6] px-6 py-5">
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-[#92700a]"
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-semibold text-[#7a5c00]">
                Only claim when you're ready to use this
              </div>
              <p className="mt-1 text-sm text-[#7a5c00]">
                Claiming starts a 15-minute redemption window. Once it starts,
                it can't be paused or restarted. Make sure you're at the
                business before confirming.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="rounded-md border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] hover:border-[var(--blue)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmClaim}
              disabled={isClaiming}
              className="flex-1 rounded-md bg-[var(--blue)] py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClaiming ? 'Claiming…' : 'Yes, start the 15-minute window'}
            </button>
          </div>
        </div>
      )}

      {showQrCode && isRedeemed && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--border)] bg-[#effaf3] px-6 py-6">
          <BadgeCheck size={40} className="text-[#087f5b]" aria-hidden="true" />
          <p className="text-sm font-bold text-[#087f5b]">
            Deal has been Redeemed
          </p>
          <p className="text-center text-xs text-[var(--text-muted)]">
            Recorded {new Date(claimRedeemedAt).toLocaleString('en-NZ')}.
          </p>
          {claimReference && (
            <p className="font-mono text-sm font-bold tracking-wide text-[var(--text)]">
              Claim ref: {claimReference}
            </p>
          )}
        </div>
      )}

      {showQrCode && !isRedeemed && windowExpired && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--border)] bg-[#fff5f5] px-6 py-6">
          <Clock
            size={40}
            className="text-[var(--danger)]"
            aria-hidden="true"
          />
          <p className="text-sm font-bold text-[var(--danger)]">
            This deal has expired
          </p>
          <p className="text-center text-xs text-[var(--text-muted)]">
            Your 15-minute redemption window has closed and this claim can no
            longer be redeemed.
          </p>
          {claimReference && (
            <p className="font-mono text-sm font-bold tracking-wide text-[var(--text)]">
              Claim ref: {claimReference}
            </p>
          )}
        </div>
      )}

      {showQrCode && !isRedeemed && !windowExpired && (
        <div className="flex flex-col items-center gap-2 border-t border-[var(--border)] bg-[var(--bg)] px-6 py-6">
          <div
            className="flex h-40 w-40 items-center justify-center rounded-lg border border-[var(--border)] bg-white"
            role="img"
            aria-label="Deal redemption QR code"
          >
            {redemptionCode ? (
              <QRCodeSVG
                value={getRedemptionCodePayload(redemptionCode)}
                size={132}
                level="M"
              />
            ) : (
              <Clock size={32} className="text-[var(--text-muted)]" />
            )}
          </div>
          {claimReference && (
            <strong className="font-mono text-sm tracking-wide text-[var(--text)]">
              Claim ref: {claimReference}
            </strong>
          )}
          {redemptionCode && (
            <div className="text-center">
              <span className="block text-[11px] font-semibold text-[var(--text-muted)]">
                Manual redemption code
              </span>
              <strong className="mt-0.5 block font-mono text-base tracking-[0.14em] text-[var(--text)]">
                {formatRedemptionCode(redemptionCode)}
              </strong>
            </div>
          )}
          {msRemaining != null && (
            <p className="text-sm font-bold text-[var(--text)]">
              {formatCountdown(msRemaining)} remaining
            </p>
          )}
          <p className="text-center text-xs text-[var(--text-muted)]">
            Show the QR code to staff. Keep the claim reference for any
            follow-up.
          </p>
        </div>
      )}

      <div className="border-t border-[var(--border)] px-6 py-5">
        {claimError && (
          <p className="auth-error mb-3" role="alert">
            {claimError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleSave(deal.id)}
            className={
              'flex items-center gap-1.5 rounded-md border px-5 py-2 text-sm font-semibold transition ' +
              (isSaved
                ? 'border-[var(--blue)] bg-[var(--blue-light)] text-[var(--blue)]'
                : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--blue)]')
            }
          >
            <Bookmark
              size={16}
              aria-hidden="true"
              fill={isSaved ? 'currentColor' : 'none'}
            />
            {isSaved ? 'Saved' : 'Save'}
          </button>
          <button
            type="button"
            onClick={handleClaim}
            disabled={isClaiming || showQrCode || showConfirm || isSoldOut}
            className="flex-1 rounded-md bg-[var(--blue)] py-2 text-sm font-semibold text-white hover:bg-[var(--blue-dark)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[var(--blue)]"
          >
            {isClaiming
              ? 'Claiming…'
              : isRedeemed
                ? 'Deal has been Redeemed'
                : showQrCode
                  ? 'Claim ready'
                  : isClaimed
                    ? 'View claim'
                    : isSoldOut
                      ? 'Fully claimed'
                      : 'Claim deal'}
          </button>
        </div>
        {!isSaved && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            You can save up to 3 deals at a time.
          </p>
        )}
      </div>
    </Modal>
  )
}
