import {
  Clock3,
  FileSearch,
  ReceiptText,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import BusinessPageLoader from '../../components/ui/BusinessPageLoader'
import useBusinessDealRedemption from '../../features/deals/hooks/useBusinessDealRedemption'
import { formatClaimReference } from '../../features/deals/claimReference'
import '../../features/deals/DealRedemption.css'

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

function ClaimDetail({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

export default function ClaimRecords() {
  const [searchParams] = useSearchParams()
  const requestedReference = searchParams.get('ref')
  const requestedReferenceRef = useRef('')
  const records = useBusinessDealRedemption()
  const { lookupClaim } = records

  useEffect(() => {
    if (
      !requestedReference ||
      requestedReferenceRef.current === requestedReference
    ) {
      return undefined
    }

    requestedReferenceRef.current = requestedReference
    const lookupTimer = window.setTimeout(
      () => lookupClaim(requestedReference),
      0,
    )
    return () => window.clearTimeout(lookupTimer)
  }, [lookupClaim, requestedReference])

  return (
    <section className="business-settings-section business-claim-records-page">
      <header className="business-claim-records-heading">
        <span aria-hidden="true">
          <ReceiptText />
        </span>
        <div>
          <h2>Claim records</h2>
          <p>
            Search by claim reference and review completed deal redemptions.
          </p>
        </div>
      </header>

      <form
        className="deal-claim-lookup-form business-claim-records-search"
        onSubmit={records.handleClaimLookup}
        noValidate
      >
        <label htmlFor="deal-claim-reference">Claim reference</label>
        <div>
          <input
            id="deal-claim-reference"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            placeholder="LL-8E1B-42F7"
            value={records.claimLookupReference}
            onChange={(event) =>
              records.updateClaimLookupReference(event.target.value)
            }
            aria-describedby={
              records.claimLookupError ? 'deal-claim-lookup-error' : undefined
            }
            aria-invalid={Boolean(records.claimLookupError)}
            disabled={records.isLookingUpClaim}
          />
          <button type="submit" disabled={records.isLookingUpClaim}>
            <Search aria-hidden="true" />
            {records.isLookingUpClaim ? 'Searching...' : 'Search'}
          </button>
        </div>
        <p>Ask the customer for the reference shown below their QR code.</p>
      </form>

      {records.claimLookupError && (
        <p
          className="deal-claim-lookup-error"
          id="deal-claim-lookup-error"
          role="alert"
        >
          {records.claimLookupError}
        </p>
      )}

      <div className="business-claim-records-layout">
        <section
          className="business-claim-record-list"
          aria-labelledby="recent-claim-records-title"
        >
          <div className="business-claim-record-list-heading">
            <div>
              <h3 id="recent-claim-records-title">Recent redemptions</h3>
              <p>Recorded across all of your deals.</p>
            </div>
            {!records.isHistoryLoading && !records.historyError && (
              <span>{records.redemptions.length}</span>
            )}
          </div>

          {records.isHistoryLoading ? (
            <BusinessPageLoader contained label="Loading claim records…" />
          ) : records.historyError ? (
            <div className="deal-redemption-history-error" role="alert">
              <p>{records.historyError}</p>
              <button type="button" onClick={records.reloadRedemptions}>
                Try again
              </button>
            </div>
          ) : records.redemptions.length === 0 ? (
            <div className="deal-redemption-history-empty">
              <Clock3 aria-hidden="true" />
              <p>Completed redemptions will appear here.</p>
            </div>
          ) : (
            <ol className="deal-redemption-history-list">
              {records.redemptions.map((item) => (
                <li key={item.claimReference}>
                  <button
                    type="button"
                    className={
                      records.claimLookupResult?.claimReference ===
                      item.claimReference
                        ? 'is-selected'
                        : undefined
                    }
                    onClick={() => records.selectClaimRecord(item)}
                    aria-label={`Open claim ${item.claimReference} for ${item.customerDisplayName}`}
                  >
                    <span aria-hidden="true">
                      <UserRound />
                    </span>
                    <span>
                      <strong>{item.customerDisplayName}</strong>
                      <small>{item.claimReference}</small>
                    </span>
                    <time dateTime={item.redeemedAt}>
                      {formatDateTime(item.redeemedAt)}
                    </time>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <aside className="business-claim-record-detail">
          {records.claimLookupResult ? (
            <div className="deal-claim-lookup-result" aria-live="polite">
              <div className="deal-claim-lookup-result-heading">
                <div>
                  <strong>
                    {records.claimLookupResult.customerDisplayName}
                  </strong>
                  <code>
                    {formatClaimReference(
                      records.claimLookupResult.claimReference,
                    )}
                  </code>
                </div>
                <div>
                  <span
                    className={`deal-claim-status is-${records.claimLookupResult.redemptionStatus}`}
                  >
                    {records.claimLookupResult.redemptionStatus === 'redeemed'
                      ? 'Redeemed'
                      : 'Not redeemed'}
                  </span>
                  <button
                    type="button"
                    onClick={records.clearClaimLookup}
                    aria-label="Close claim record"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              </div>
              <dl>
                <ClaimDetail
                  label="Deal"
                  value={records.claimLookupResult.dealTitle}
                />
                <ClaimDetail
                  label="Claimed"
                  value={formatDateTime(records.claimLookupResult.claimedAt)}
                />
                <ClaimDetail
                  label="Redemption"
                  value={
                    records.claimLookupResult.redeemedAt
                      ? formatDateTime(records.claimLookupResult.redeemedAt)
                      : 'No redemption recorded'
                  }
                />
              </dl>
            </div>
          ) : (
            <div className="business-claim-record-detail-empty">
              <FileSearch aria-hidden="true" />
              <strong>Open a claim record</strong>
              <p>Select a recent redemption or search by claim reference.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
