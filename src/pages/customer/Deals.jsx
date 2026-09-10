import { BadgeCheck, Bookmark, Clock3, MapPin, TicketCheck } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import {
  fetchBusinessesInSavedSuburb,
  fetchCustomerLocation,
} from '../../features/location/api/locations'
import {
  claimDeal,
  fetchDealClaim,
  fetchCustomerDealClaims,
  fetchPublishedDealById,
  fetchSavedDealIds,
  saveDeal,
  unsaveDeal,
} from '../../features/deals/api/customerDeals'
import DealDetailModal from '../../features/deals/components/DealDetailModal'
import Modal from '../../components/ui/Modal'
import useAuth from '../../auth/useAuth'
import '../../features/location/discovery.css'

const DiscoveryMap = lazy(
  () => import('../../features/location/components/DiscoveryMap'),
)

const FILTERS = [
  'All',
  'Food & Drink',
  'Retail',
  'Services',
  'Health & Wellness',
  'Trades',
  'Entertainment',
  'Other',
]

export default function Deals() {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState('All')
  const [location, setLocation] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [savedDealIds, setSavedDealIds] = useState([])
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedBusinessRow, setSelectedBusinessRow] = useState(null)
  const [isDealLoading, setIsDealLoading] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState(null)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimError, setClaimError] = useState('')
  const [customerClaims, setCustomerClaims] = useState([])

  useEffect(() => {
    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const savedLocation = await fetchCustomerLocation()
        if (active) setLocation(savedLocation)
      } catch (loadError) {
        console.error('Unable to load saved location.', loadError)
        if (active) setError('Unable to load your saved location.')
      } finally {
        if (active) setIsLoadingLocation(false)
      }
    }, 0)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!location) return undefined
    let active = true
    const timer = window.setTimeout(async () => {
      setIsSearching(true)
      setError('')
      try {
        const results = await fetchBusinessesInSavedSuburb(activeFilter)
        if (active) setBusinesses(results)
      } catch (searchError) {
        console.error('Unable to load businesses in your suburb.', searchError)
        if (active)
          setError(
            'Unable to load businesses in your suburb. Please try again.',
          )
      } finally {
        if (active) setIsSearching(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [activeFilter, location])

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined
    fetchSavedDealIds(user.id)
      .then((ids) => {
        if (active) setSavedDealIds(ids)
      })
      .catch((savedError) => {
        console.error('Unable to load saved deals.', savedError)
      })
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    let active = true
    if (!user?.id) return undefined

    fetchCustomerDealClaims()
      .then((claims) => {
        if (!active) return
        setCustomerClaims(claims)

        const requestedDealId = new URLSearchParams(window.location.search).get(
          'claim',
        )
        const requestedClaim = claims.find(
          (claim) => claim.deal_id === requestedDealId,
        )
        if (requestedClaim) {
          setSelectedDeal(requestedClaim)
          setSelectedClaim({
            id: requestedClaim.claim_id,
            deal_id: requestedClaim.deal_id,
            claimed_at: requestedClaim.claimed_at,
          })
          setSelectedBusinessRow({
            business_name: requestedClaim.business_name,
            formatted_address: requestedClaim.formatted_address,
            category: requestedClaim.category,
            suburb: requestedClaim.suburb,
            distance_km: null,
          })
        }
      })
      .catch((claimsError) => {
        console.error('Unable to load customer deal claims.', claimsError)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  async function openDeal(business) {
    if (!business.deal_id) return
    setSelectedBusinessRow(business)
    setIsDealLoading(true)
    setClaimError('')
    try {
      const [fullDeal, existingClaim] = await Promise.all([
        fetchPublishedDealById(business.deal_id),
        fetchDealClaim(user.id, business.deal_id),
      ])
      setSelectedDeal(fullDeal)
      setSelectedClaim(existingClaim)
    } catch (dealError) {
      console.error('Unable to load deal details.', dealError)
      setError('Unable to load this deal right now.')
      setSelectedBusinessRow(null)
    } finally {
      setIsDealLoading(false)
    }
  }

  function closeDeal() {
    setSelectedDeal(null)
    setSelectedBusinessRow(null)
    setSelectedClaim(null)
    setClaimError('')
    const url = new URL(window.location.href)
    if (url.searchParams.has('claim')) {
      url.searchParams.delete('claim')
      window.history.replaceState(window.history.state, '', url)
    }
  }

  function openClaimedDeal(claim) {
    setSelectedDeal(claim)
    setSelectedClaim({
      id: claim.claim_id,
      deal_id: claim.deal_id,
      claimed_at: claim.claimed_at,
    })
    setSelectedBusinessRow({
      business_name: claim.business_name,
      formatted_address: claim.formatted_address,
      category: claim.category,
      suburb: claim.suburb,
      distance_km: null,
    })
    setClaimError('')
  }

  async function handleClaimDeal(dealId) {
    setIsClaiming(true)
    setClaimError('')
    try {
      const claim = await claimDeal(dealId)
      setSelectedClaim(claim)
      return true
    } catch (claimRequestError) {
      console.error('Unable to claim deal.', claimRequestError)
      setClaimError(
        claimRequestError.message?.includes('claim limit')
          ? 'This deal has reached its claim limit.'
          : 'This deal is no longer available to claim.',
      )
      return false
    } finally {
      setIsClaiming(false)
    }
  }

  async function toggleSaveDeal(dealId) {
    if (!user?.id) return
    const wasSaved = savedDealIds.includes(dealId)
    setSavedDealIds((current) =>
      wasSaved ? current.filter((id) => id !== dealId) : [...current, dealId],
    )
    try {
      if (wasSaved) await unsaveDeal(user.id, dealId)
      else await saveDeal(user.id, dealId)
    } catch (saveError) {
      console.error('Unable to update saved deal.', saveError)
      setSavedDealIds((current) =>
        wasSaved ? [...current, dealId] : current.filter((id) => id !== dealId),
      )
    }
  }

  return (
    <>
      <div className="page-header discovery-page-header">
        <p
          style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}
        >
          Deals & Discovery
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses and published deals in your registered suburb.</p>
        {location && (
          <div className="discovery-selected-location is-chip">
            <MapPin aria-hidden="true" size={17} />
            Showing {location.suburb}
          </div>
        )}
      </div>

      <div className="pill-filter-row" aria-label="Business category filters">
        {FILTERS.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`pill discovery-pill${activeFilter === filter ? ' active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {customerClaims.length > 0 && (
        <section
          className="customer-deal-claims"
          aria-labelledby="customer-deal-claims-title"
        >
          <div className="customer-deal-claims-heading">
            <span aria-hidden="true">
              <TicketCheck />
            </span>
            <div>
              <h3 id="customer-deal-claims-title">Your claimed deals</h3>
              <p>Claims and redemption records stay available here.</p>
            </div>
          </div>
          <div className="customer-deal-claim-list">
            {customerClaims.map((claim) => {
              const endedEarly = claim.status === 'ended_early'
              return (
                <button
                  type="button"
                  className={`customer-deal-claim${endedEarly ? ' is-ended-early' : ''}`}
                  onClick={() => openClaimedDeal(claim)}
                  key={claim.claim_id}
                >
                  <span className="customer-deal-claim-icon" aria-hidden="true">
                    {claim.redeemed_at ? <BadgeCheck /> : <Clock3 />}
                  </span>
                  <span>
                    <strong>{claim.title}</strong>
                    <small>{claim.business_name}</small>
                  </span>
                  <span className="customer-deal-claim-status">
                    {claim.redeemed_at
                      ? 'Redeemed'
                      : endedEarly
                        ? 'Claim remains redeemable'
                        : 'Ready to redeem'}
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {location ? (
        <Suspense
          fallback={<div className="discovery-map-empty">Loading map…</div>}
        >
          <DiscoveryMap location={location} businesses={businesses} />
        </Suspense>
      ) : (
        <div className="discovery-map-empty">
          {isLoadingLocation
            ? 'Loading your registered suburb...'
            : 'Add your suburb in Profile to discover local businesses.'}
        </div>
      )}

      <div className="placeholder-section discovery-results-panel">
        <div
          className="placeholder-section-title is-complete"
          style={{ justifyContent: 'space-between' }}
        >
          <span>
            {location ? `Businesses in ${location.suburb}` : 'Local businesses'}
          </span>
          <span style={resultCountStyles}>
            {isSearching
              ? 'Searching…'
              : `${businesses.length} result${businesses.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        {!location ? (
          <div className="empty-state">
            Add your suburb in Profile to discover local businesses.
          </div>
        ) : !isSearching && businesses.length === 0 ? (
          <div className="empty-state">
            No businesses or deals are available in {location.suburb} right now.
          </div>
        ) : (
          <div className="business-grid discovery-grid discovery-card-grid">
            {businesses.map((business) => (
              <div
                className={`business-card discovery-business-card${business.deal_id ? ' business-card-clickable' : ''}`}
                key={business.business_id}
                onClick={() => openDeal(business)}
                role={business.deal_id ? 'button' : undefined}
                tabIndex={business.deal_id ? 0 : undefined}
              >
                <div className="discovery-card-media">
                  <span className="discovery-card-icon" aria-hidden="true">
                    {getCategoryEmoji(business.category)}
                  </span>
                  {business.deal_id && (
                    <button
                      type="button"
                      className={`discovery-save-btn${savedDealIds.includes(business.deal_id) ? ' is-saved' : ''}`}
                      aria-label={
                        savedDealIds.includes(business.deal_id)
                          ? 'Remove from saved deals'
                          : 'Save this deal'
                      }
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleSaveDeal(business.deal_id)
                      }}
                    >
                      <Bookmark
                        aria-hidden="true"
                        fill={
                          savedDealIds.includes(business.deal_id)
                            ? 'currentColor'
                            : 'none'
                        }
                      />
                    </button>
                  )}
                </div>

                <div className="business-card-body">
                  <div className="business-card-name">
                    {business.business_name}
                  </div>
                  <div className="business-card-category">
                    {business.category}
                  </div>
                  <div className="business-card-desc">
                    {business.deal_description || business.description}
                  </div>
                  {business.deal_title && (
                    <div className="business-card-deal">
                      Deal: {business.deal_title}
                    </div>
                  )}

                  <div className="discovery-card-footer">
                    <span className="business-card-address">
                      {business.formatted_address}
                    </span>
                    <span className="business-card-distance discovery-distance-badge">
                      {Number(business.distance_km).toFixed(1)} km
                    </span>
                  </div>

                  {business.deal_id && (
                    <button
                      type="button"
                      className="discovery-view-deal-btn"
                      onClick={(event) => {
                        event.stopPropagation()
                        openDeal(business)
                      }}
                    >
                      View Deal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isDealLoading && !selectedDeal && (
        <Modal onClose={closeDeal} maxWidthClassName="max-w-sm">
          <div className="px-6 py-10 text-center text-sm text-[var(--text-muted)]">
            Loading deal…
          </div>
        </Modal>
      )}

      {selectedDeal && selectedBusinessRow && (
        <DealDetailModal
          deal={selectedDeal}
          businessName={selectedBusinessRow.business_name}
          address={selectedBusinessRow.formatted_address}
          categoryEmoji={getCategoryEmoji(selectedBusinessRow.category)}
          distanceKm={selectedBusinessRow.distance_km}
          suburb={selectedBusinessRow.suburb ?? location?.suburb}
          isSaved={savedDealIds.includes(selectedDeal.id)}
          isClaimed={Boolean(selectedClaim)}
          isClaiming={isClaiming}
          claimError={claimError}
          onClaim={handleClaimDeal}
          onToggleSave={toggleSaveDeal}
          onClose={closeDeal}
        />
      )}
    </>
  )
}

const resultCountStyles = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--text-muted)',
  textTransform: 'none',
  letterSpacing: 'normal',
}

function getCategoryEmoji(category) {
  const categoryIcons = {
    'Food & Drink': '🍔',
    Retail: '🛍️',
    Services: '✂️',
    'Health & Wellness': '🏥',
    Trades: '🔧',
    Entertainment: '🎟️',
  }
  return categoryIcons[category] || '📍'
}
