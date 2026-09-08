import { useEffect, useRef, useState } from 'react'
import {
  Search,
  ChevronDown,
  SlidersHorizontal,
  X,
  Coffee,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  BookOpen,
  Pizza,
  Flower2,
  ShoppingBasket,
} from 'lucide-react'
import mockDeals from '../../data/mockDeals'
import DealCard from './DealCard'
import DealModal from './DealModal'
import './Deals.css'

const CATEGORIES = [
  'All Deals',
  'Food & Drink',
  'Shopping',
  'Health & Beauty',
  'Activities',
  'Home & Services',
]

// Gradient + icon per deal, used until real business photos exist.
// Shared by DealCard and DealModal — kept here and passed down as a
// prop so both stay in sync from one source, without either file
// importing back from this one.
const CATEGORY_VISUALS = {
  coffee: { icon: Coffee, gradient: 'linear-gradient(135deg, #c9a479, #7a5738)' },
  dining: { icon: UtensilsCrossed, gradient: 'linear-gradient(135deg, #d1927a, #93503d)' },
  fitness: { icon: Dumbbell, gradient: 'linear-gradient(135deg, #7c8db5, #47597c)' },
  beauty: { icon: Sparkles, gradient: 'linear-gradient(135deg, #cf9fb6, #8f5c7d)' },
  books: { icon: BookOpen, gradient: 'linear-gradient(135deg, #8fae9c, #52705f)' },
  pizza: { icon: Pizza, gradient: 'linear-gradient(135deg, #cf9678, #9a5642)' },
  wellness: { icon: Flower2, gradient: 'linear-gradient(135deg, #a993c4, #6d5589)' },
  market: { icon: ShoppingBasket, gradient: 'linear-gradient(135deg, #a3b98f, #6e8759)' },
}

export default function Deals() {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOption, setSortOption] = useState('Recommended')
  const [activeDealId, setActiveDealId] = useState(null)
  const [savedDealIds, setSavedDealIds] = useState(() => new Set())
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(toastTimeoutRef.current)
  }, [])

  function showToast(message) {
    clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2200)
  }

  const visibleDeals = mockDeals
    .filter(
      (deal) => activeCategory === 'All Deals' || deal.category === activeCategory,
    )
    .filter((deal) => {
      if (!searchTerm.trim()) return true
      const haystack = `${deal.businessName} ${deal.title}`.toLowerCase()
      return haystack.includes(searchTerm.trim().toLowerCase())
    })
    .sort((first, second) => {
      if (sortOption === 'Closest') return first.distanceKm - second.distanceKm
      if (sortOption === 'Ending soon') return first.daysLeft - second.daysLeft
      return 0
    })

  const activeDeal = mockDeals.find((deal) => deal.id === activeDealId) ?? null

  function toggleSaved(dealId) {
    setSavedDealIds((previous) => {
      const next = new Set(previous)
      const wasSaved = next.has(dealId)
      if (wasSaved) next.delete(dealId)
      else next.add(dealId)
      showToast(wasSaved ? 'Removed from saved deals' : 'Saved to your deals')
      return next
    })
  }

  function handleClaim() {
    showToast('Deal claimed — show this screen in-store to redeem.')
import { MapPin } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import {
  fetchBusinessesInSavedSuburb,
  fetchCustomerLocation,
} from '../../features/location/api/locations'
import {
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

  async function openDeal(business) {
    if (!business.deal_id) return
    setSelectedBusinessRow(business)
    setIsDealLoading(true)
    try {
      const fullDeal = await fetchPublishedDealById(business.deal_id)
      setSelectedDeal(fullDeal)
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
      <div className="dd-page-head">
        <div>
          <h2 className="dd-title">Deals & Discovery</h2>
          <p className="dd-subtitle">
            Explore offers near <strong>Ponsonby</strong>
          </p>
        </div>
        <span className="dd-result-count">
          {visibleDeals.length} deal{visibleDeals.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className="dd-toolbar">
        <div className="dd-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search deals or businesses..."
            aria-label="Search deals or businesses"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="dd-search-clear"
              aria-label="Clear search"
              onClick={() => setSearchTerm('')}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="dd-toolbar-actions">
          <div className="dd-select">
            <select
              aria-label="Sort deals"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
            >
              <option>Recommended</option>
              <option>Closest</option>
              <option>Ending soon</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </div>

          <button type="button" className="dd-filters-btn">
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filters
          </button>
        </div>
      </div>

      <div className="pill-filter-row">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`dd-pill${activeCategory === category ? ' active' : ''}`}
            onClick={() => setActiveCategory(category)}
      <div className="page-header">
        <p
          style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}
        >
          Deals &amp; Discovery
        </p>
        <h2>Discover Local</h2>
        <p>Find businesses and published deals in your registered suburb.</p>
        {location && (
          <div className="discovery-selected-location">
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
            className={`pill${activeFilter === filter ? ' active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {category}
          </button>
        ))}
      </div>

      {visibleDeals.length === 0 ? (
        <div className="empty-state">
          No deals match your search. Try a different category or search term.
        </div>
      ) : (
        <div className="dd-grid" key={`${activeCategory}-${sortOption}`}>
          {visibleDeals.map((deal, index) => (
            <DealCard
              key={deal.id}
              deal={deal}
              visual={CATEGORY_VISUALS[deal.iconKey]}
              isSaved={savedDealIds.has(deal.id)}
              onToggleSaved={() => toggleSaved(deal.id)}
              onView={() => setActiveDealId(deal.id)}
              animationDelay={index * 40}
            />
          ))}
        </div>
      )}

      {activeDeal && (
        <DealModal
          deal={activeDeal}
          visual={CATEGORY_VISUALS[activeDeal.iconKey]}
          isSaved={savedDealIds.has(activeDeal.id)}
          onToggleSaved={() => toggleSaved(activeDeal.id)}
          onClose={() => setActiveDealId(null)}
          onClaim={handleClaim}
        />
      )}

      {toast && (
        <div className="dd-toast" role="status">
          {toast}
        </div>
      )}
    </>
  )
}
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
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

      <div className="placeholder-section">
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
          <div className="business-grid">
            {businesses.map((business) => (
              <div
                className={`business-card${business.deal_id ? ' business-card-clickable' : ''}`}
                key={business.business_id}
                onClick={() => openDeal(business)}
                role={business.deal_id ? 'button' : undefined}
                tabIndex={business.deal_id ? 0 : undefined}
              >
                <div className="business-card-icon">
                  {getCategoryEmoji(business.category)}
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
                  <div className="business-card-address">
                    {business.formatted_address}
                  </div>
                </div>
                <div className="business-card-distance">
                  {Number(business.distance_km).toFixed(1)} km
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
          isSaved={savedDealIds.includes(selectedDeal.id)}
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
