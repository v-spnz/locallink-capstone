import { Bookmark, MapPin, Clock3, BadgeCheck } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  fetchBusinessesInSavedSuburb,
  fetchCustomerLocation,
} from '../../features/location/api/locations'
import {
  claimDeal,
  fetchDealClaim,
  fetchDealClaimCount,
  fetchCustomerDealClaims,
  fetchMySavedDeals,
  fetchPublishedDealById,
  saveDeal,
  unsaveDeal,
} from '../../features/deals/api/customerDeals'
import DealDetailModal from '../../features/deals/components/DealDetailModal'
import Modal from '../../components/ui/Modal'
import useAuth from '../../auth/useAuth'
import { isClaimActive } from '../../features/deals/claimStatus'
import '../../features/location/discovery.css'
import '../../features/service-marketplace/ServiceMarketplace.css'

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
  const routerLocation = useLocation()
  const [activeFilter, setActiveFilter] = useState('All')
  const [discoverySearch, setDiscoverySearch] = useState('')
  const [activeTab, setActiveTab] = useState('discover')
  const [location, setLocation] = useState(null)
  const [businesses, setBusinesses] = useState([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const [savedDeals, setSavedDeals] = useState([])
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
    fetchMySavedDeals()
      .then((deals) => {
        if (active) setSavedDeals(deals)
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
        if (active) setCustomerClaims(claims)
      })
      .catch((claimsError) => {
        console.error('Unable to load customer deal claims.', claimsError)
      })

    return () => {
      active = false
    }
  }, [user?.id])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const historicalClaims = customerClaims.filter(
    (claim) => !isClaimActive(claim, now),
  )
  const savedDealIds = savedDeals.map((deal) => deal.deal_id)
  const hasRedeemableClaims = customerClaims.some(
    (claim) =>
      !claim.redeemed_at &&
      claim.expires_at &&
      new Date(claim.expires_at) > now,
  )

  useEffect(() => {
    if (!user?.id || !hasRedeemableClaims) return undefined
    let active = true

    async function refreshClaims() {
      try {
        const claims = await fetchCustomerDealClaims()
        if (!active) return
        setCustomerClaims(claims)
        setSelectedClaim((current) => {
          if (!current) return current
          const updated = claims.find((claim) => claim.claim_id === current.id)
          if (!updated || updated.redeemed_at === current.redeemed_at)
            return current
          return { ...current, redeemed_at: updated.redeemed_at }
        })
      } catch (refreshError) {
        console.error('Unable to refresh deal claims.', refreshError)
      }
    }

    const interval = window.setInterval(refreshClaims, 5000)
    window.addEventListener('focus', refreshClaims)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshClaims)
    }
  }, [hasRedeemableClaims, user?.id])

  const openDeal = useCallback(
    async (business) => {
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
    },
    [user],
  )

  useEffect(() => {
    if (!user?.id) return
    const requestedDealId = new URLSearchParams(window.location.search).get(
      'deal',
    )
    if (!requestedDealId) return
    const businessFromState = routerLocation.state?.openDeal

    const timer = window.setTimeout(() => {
      openDeal(businessFromState ?? { deal_id: requestedDealId })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [openDeal, routerLocation.state?.openDeal, user?.id])

  async function openClaimedDeal(claim) {
    setSelectedDeal(claim)
    setSelectedClaim({
      id: claim.claim_id,
      deal_id: claim.deal_id,
      claim_reference: claim.claim_reference,
      redemption_code: claim.redemption_code,
      claimed_at: claim.claimed_at,
      expires_at: claim.expires_at,
      redeemed_at: claim.redeemed_at,
    })
    setSelectedBusinessRow({
      business_name: claim.business_name,
      formatted_address: claim.formatted_address,
      category: claim.category,
      suburb: claim.suburb,
      distance_km: null,
    })
    setClaimError('')

    try {
      const claimsUsed = await fetchDealClaimCount(claim.deal_id)
      setSelectedDeal((current) =>
        current?.deal_id === claim.deal_id
          ? { ...current, claims_used: claimsUsed }
          : current,
      )
    } catch (claimCountError) {
      console.error('Unable to load claim count.', claimCountError)
    }
  }

  // Reacts to the URL's ?claim= param on every navigation, not just mount —
  // so clicking the global ActiveClaimBanner while already on this page
  // still reopens the modal, since the route itself doesn't change.
  useEffect(() => {
    if (!user?.id) return
    const requestedDealId = new URLSearchParams(routerLocation.search).get(
      'claim',
    )
    if (!requestedDealId) return
    const requestedClaim = customerClaims.find(
      (claim) => claim.deal_id === requestedDealId,
    )
    if (!requestedClaim) return

    const timer = window.setTimeout(() => {
      openClaimedDeal(requestedClaim)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [routerLocation.search, customerClaims, user?.id])

  function closeDeal() {
    setSelectedDeal(null)
    setSelectedBusinessRow(null)
    setSelectedClaim(null)
    setClaimError('')
    const url = new URL(window.location.href)
    let changed = false
    if (url.searchParams.has('claim')) {
      url.searchParams.delete('claim')
      changed = true
    }
    if (url.searchParams.has('deal')) {
      url.searchParams.delete('deal')
      changed = true
    }
    if (changed) window.history.replaceState(window.history.state, '', url)
  }

  async function openSavedDeal(savedDeal) {
    setSelectedBusinessRow({
      business_name: savedDeal.business_name,
      formatted_address: savedDeal.formatted_address,
      category: savedDeal.category,
      suburb: null,
      distance_km: savedDeal.distance_km,
    })
    setIsDealLoading(true)
    setClaimError('')
    try {
      const [fullDeal, existingClaim] = await Promise.all([
        fetchPublishedDealById(savedDeal.deal_id),
        fetchDealClaim(user.id, savedDeal.deal_id),
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

  async function handleClaimDeal(dealId) {
    setIsClaiming(true)
    setClaimError('')
    try {
      const claim = await claimDeal(dealId)
      setSelectedClaim(claim)

      try {
        const refreshedClaims = await fetchCustomerDealClaims()
        setCustomerClaims(refreshedClaims)
      } catch (refreshError) {
        console.error('Unable to refresh deal claims.', refreshError)
      }
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
    try {
      if (wasSaved) await unsaveDeal(user.id, dealId)
      else await saveDeal(user.id, dealId)
      setError('')
      const refreshed = await fetchMySavedDeals()
      setSavedDeals(refreshed)
    } catch (saveError) {
      console.error('Unable to update saved deal.', saveError)
      setError(
        saveError.message?.includes('up to 3 deals')
          ? 'You can only save up to 3 deals at a time. Remove one to save another.'
          : 'Unable to update saved deal. Please try again.',
      )
    }
  }

  const searchedBusinesses = discoverySearch.trim()
    ? businesses.filter((business) => {
        const query = discoverySearch.trim().toLowerCase()
        return (
          business.business_name?.toLowerCase().includes(query) ||
          business.deal_title?.toLowerCase().includes(query) ||
          business.deal_description?.toLowerCase().includes(query)
        )
      })
    : businesses

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

      <div className="sm-tabs">
        <button
          type="button"
          className={`sm-tab${activeTab === 'discover' ? ' sm-tab--active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Discover
        </button>
        <button
          type="button"
          className={`sm-tab${activeTab === 'wallet' ? ' sm-tab--active' : ''}`}
          onClick={() => setActiveTab('wallet')}
        >
          Wallet
        </button>
      </div>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      {activeTab === 'discover' && (
        <>
          <input
            type="text"
            className="discovery-search-input"
            placeholder="Search businesses or deals..."
            value={discoverySearch}
            onChange={(event) => setDiscoverySearch(event.target.value)}
            aria-label="Search businesses or deals"
          />

          <div
            className="pill-filter-row"
            aria-label="Business category filters"
          >
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

          {location ? (
            <Suspense
              fallback={<div className="discovery-map-empty">Loading map…</div>}
            >
              <DiscoveryMap
                location={location}
                businesses={searchedBusinesses}
              />
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
                {location
                  ? `Businesses in ${location.suburb}`
                  : 'Local businesses'}
              </span>
              <span style={resultCountStyles}>
                {isSearching
                  ? 'Searching…'
                  : `${searchedBusinesses.length} result${searchedBusinesses.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            {!location ? (
              <div className="empty-state">
                Add your suburb in Profile to discover local businesses.
              </div>
            ) : !isSearching && searchedBusinesses.length === 0 ? (
              <div className="empty-state">
                {discoverySearch.trim()
                  ? `No businesses or deals match "${discoverySearch.trim()}".`
                  : `No businesses or deals are available in ${location.suburb} right now.`}
              </div>
            ) : (
              <div className="discovery-category-sections">
                {groupBusinessesByCategory(searchedBusinesses).map(
                  ({ category, items }) => (
                    <section
                      className="discovery-category-section"
                      key={category}
                    >
                      <h3 className="discovery-category-heading">
                        <span aria-hidden="true">
                          {getCategoryEmoji(category)}
                        </span>
                        {category}
                        <span className="discovery-category-count">
                          {items.length}
                        </span>
                      </h3>
                      <div className="business-grid discovery-grid discovery-card-grid">
                        {items.map((business) => (
                          <div
                            className={`business-card discovery-business-card${business.deal_id ? ' business-card-clickable' : ''}`}
                            key={business.business_id}
                            onClick={() => openDeal(business)}
                            role={business.deal_id ? 'button' : undefined}
                            tabIndex={business.deal_id ? 0 : undefined}
                          >
                            <div className="discovery-card-media">
                              {business.deal_image_url ? (
                                <img
                                  src={business.deal_image_url}
                                  alt=""
                                  className="discovery-card-photo"
                                />
                              ) : (
                                <span
                                  className="discovery-card-icon"
                                  aria-hidden="true"
                                >
                                  {getCategoryEmoji(business.category)}
                                </span>
                              )}
                              {business.deal_is_sold_out && (
                                <span className="discovery-sold-out-badge">
                                  Sold out
                                </span>
                              )}
                              {business.deal_id && (
                                <button
                                  type="button"
                                  className={`discovery-save-btn${savedDealIds.includes(business.deal_id) ? ' is-saved' : ''}`}
                                  aria-label={
                                    savedDealIds.includes(business.deal_id)
                                      ? 'Remove from wallet'
                                      : 'Save to wallet'
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
                                {business.deal_description ||
                                  business.description}
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
                    </section>
                  ),
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'wallet' && (
        <section className="wallet-section" aria-label="Your wallet">
          <div className="wallet-section-block">
            <h3 className="wallet-section-title">Saved deals</h3>
            {savedDeals.length === 0 ? (
              <div className="empty-state">
                No saved deals yet. Tap the bookmark icon on a deal to save it
                here.
              </div>
            ) : (
              <div className="wallet-saved-grid">
                {savedDeals.map((saved) => (
                  <div className="wallet-saved-card" key={saved.deal_id}>
                    <button
                      type="button"
                      className="wallet-saved-media"
                      onClick={() => openSavedDeal(saved)}
                      aria-label={`View ${saved.deal_title}`}
                    >
                      {saved.deal_image_url ? (
                        <img src={saved.deal_image_url} alt="" />
                      ) : (
                        <span aria-hidden="true">
                          {getCategoryEmoji(saved.category)}
                        </span>
                      )}
                    </button>
                    <div className="wallet-saved-body">
                      <div className="wallet-saved-business">
                        {saved.business_name}
                      </div>
                      <div className="wallet-saved-title">
                        {saved.deal_title}
                      </div>
                      {saved.distance_km != null && (
                        <div className="wallet-saved-distance">
                          {Number(saved.distance_km).toFixed(1)} km
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="wallet-saved-remove"
                      aria-label="Remove from wallet"
                      onClick={() => toggleSaveDeal(saved.deal_id)}
                    >
                      <Bookmark aria-hidden="true" fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="wallet-section-block">
            <h3 className="wallet-section-title">Claim history</h3>
            {historicalClaims.length === 0 ? (
              <div className="empty-state">
                No past claims yet. Claims move here once they're redeemed,
                expire, or the deal ends early.
              </div>
            ) : (
              <details className="sm-past-jobs">
                <summary>
                  <span className="sm-past-chev">▶</span> Past deals
                </summary>
                <div className="sm-past-jobs-body">
                  {historicalClaims.map((claim) => {
                    const endedEarly = claim.status === 'ended_early'
                    return (
                      <div
                        className="sm-past-row"
                        key={claim.claim_id}
                        onClick={() => openClaimedDeal(claim)}
                      >
                        <span
                          className="sm-past-icon sm-past-icon--default"
                          aria-hidden="true"
                        >
                          {getCategoryEmoji(claim.category)}
                        </span>
                        <div className="sm-past-row-text">
                          <div className="sm-past-row-title">{claim.title}</div>
                          <div className="sm-past-row-sub">
                            {claim.redeemed_at
                              ? 'Redeemed'
                              : endedEarly
                                ? 'Claim remains redeemable'
                                : 'Expired'}
                            {' · '}
                            {claim.business_name}
                          </div>
                        </div>
                        <span className="sm-past-row-cat">
                          {claim.category}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </details>
            )}
          </div>
        </section>
      )}

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
          claimExpiresAt={selectedClaim?.expires_at}
          claimRedeemedAt={selectedClaim?.redeemed_at}
          claimReference={selectedClaim?.claim_reference}
          redemptionCode={selectedClaim?.redemption_code}
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

function groupBusinessesByCategory(businesses) {
  const groups = new Map()
  businesses.forEach((business) => {
    const category = business.category || 'Other'
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category).push(business)
  })

  const ordered = []
  FILTERS.filter((filter) => filter !== 'All').forEach((category) => {
    if (groups.has(category)) {
      ordered.push({ category, items: groups.get(category) })
      groups.delete(category)
    }
  })
  groups.forEach((items, category) => ordered.push({ category, items }))
  return ordered
}
