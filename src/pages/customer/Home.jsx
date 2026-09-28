import { Clock3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import { fetchCustomerLocation } from '../../features/location/api/locations'
import {
  fetchCustomerDealClaims,
  fetchMySavedDeals,
} from '../../features/deals/api/customerDeals'
import { isClaimActive } from '../../features/deals/claimStatus'
import { formatCountdown } from '../../features/deals/countdown'
import useLoyaltyDiscovery from '../../features/loyalty/hooks/useLoyaltyDiscovery'
import useLoyaltyPrograms from '../../features/loyalty/hooks/useLoyaltyPrograms'
import { getLoyaltyProgressPresentation } from '../../features/loyalty/loyaltyProgress'
import '../../features/location/discovery.css'
import useAllHistory from './hooks/useAllHistory'
import useHomeJobs from './hooks/useHomeJobs'
import useSuburbDeals from './hooks/useSuburbDeals'
import { buildHomeSearchResults } from './homeSearch'

const MAX_STAMP_CIRCLES = 12

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [customerLocation, setCustomerLocation] = useState(null)
  const [savedDeals, setSavedDeals] = useState(null)

  const homeJobs = useHomeJobs()
  const loyalty = useLoyaltyPrograms()
  const loyaltyDiscovery = useLoyaltyDiscovery()
  const suburbDeals = useSuburbDeals()
  const history = useAllHistory()

  useEffect(() => {
    let active = true

    fetchCustomerLocation()
      .then((savedLocation) => {
        if (active) setCustomerLocation(savedLocation)
      })
      .catch((error) => {
        console.error('Unable to load your location.', error)
      })

    fetchMySavedDeals()
      .then((deals) => {
        if (active) setSavedDeals(deals)
      })
      .catch((error) => {
        console.error('Unable to load saved deals.', error)
        if (active) setSavedDeals([])
      })

    return () => {
      active = false
    }
  }, [])

  const [customerClaims, setCustomerClaims] = useState([])
  useEffect(() => {
    let active = true
    if (!user) return undefined

    fetchCustomerDealClaims()
      .then((claims) => {
        if (active) setCustomerClaims(claims)
      })
      .catch((error) => {
        console.error('Unable to load deal claims.', error)
      })

    return () => {
      active = false
    }
  }, [user])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const activeClaims = customerClaims.filter((claim) =>
    isClaimActive(claim, now),
  )

  useEffect(() => {
    if (!user?.id || activeClaims.length === 0) return undefined
    let active = true

    async function refreshClaims() {
      try {
        const claims = await fetchCustomerDealClaims()
        if (active) setCustomerClaims(claims)
      } catch (error) {
        console.error('Unable to refresh deal claims.', error)
      }
    }

    const interval = window.setInterval(refreshClaims, 5000)
    window.addEventListener('focus', refreshClaims)
    return () => {
      active = false
      window.clearInterval(interval)
      window.removeEventListener('focus', refreshClaims)
    }
  }, [activeClaims.length, user?.id])

  const latestSavedDeal = savedDeals?.[0] ?? null

  function openLatestSavedDeal() {
    navigate(`/deals?tab=wallet&deal=${latestSavedDeal.deal_id}`, {
      state: { openDeal: latestSavedDeal },
    })
  }

  const recentActivity = history.items.slice(0, 3).map(toActivity)

  const closestLoyalty = useMemo(
    () => getClosestToCompletion(loyalty.programs),
    [loyalty.programs],
  )
  const loyaltyProgress = closestLoyalty
    ? getLoyaltyProgressPresentation(closestLoyalty)
    : null
  const showStamps =
    loyaltyProgress !== null &&
    closestLoyalty.programmeType === 'stamp_card' &&
    loyaltyProgress.target > 0 &&
    loyaltyProgress.target <= MAX_STAMP_CIRCLES

  const activeJobCount = homeJobs.activeJobs.length
  const latestJob = homeJobs.latestJob
  const latestJobQuotes = homeJobs.latestJobQuoteCount

  const searchGroups = useMemo(
    () =>
      buildHomeSearchResults(search, {
        deals: suburbDeals,
        loyaltyRecords: loyalty.programs,
        loyaltyDiscovery: loyaltyDiscovery.businesses,
        jobs: homeJobs.jobs,
      }),
    [
      search,
      suburbDeals,
      loyalty.programs,
      loyaltyDiscovery.businesses,
      homeJobs.jobs,
    ],
  )
  const isSearching = search.trim() !== ''

  return (
    <>
      {activeClaims.length > 0 && (
        <section
          className="active-claim-strip"
          aria-label="Deals you're currently redeeming"
        >
          {activeClaims.map((claim) => {
            const msRemaining =
              new Date(claim.expires_at).getTime() - now.getTime()
            return (
              <button
                type="button"
                className="active-claim-row"
                key={claim.claim_id}
                onClick={() => navigate(`/deals?claim=${claim.deal_id}`)}
              >
                <Clock3 size={16} aria-hidden="true" />
                <span className="active-claim-text">
                  Active claim: <strong>{claim.title}</strong>
                </span>
                <span className="active-claim-countdown">
                  {formatCountdown(msRemaining)} remaining
                </span>
              </button>
            )
          })}
        </section>
      )}

      <div className="home-header-row">
        <div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginBottom: 3,
            }}
          >
            {getGreeting()}, {user?.user_metadata?.first_name ?? 'Neighbour'}
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>My LocalLink</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 7 }}>
            {customerLocation?.suburb ||
              customerLocation?.city ||
              'Set your location in Profile'}
          </p>
        </div>
        <div className="home-search">
          <input
            type="text"
            placeholder="Search deals, loyalty, or jobs"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setSearch('')
            }}
          />
          {isSearching && (
            <div className="home-search-results">
              {searchGroups.length === 0 ? (
                <p className="home-search-empty">
                  {`No results for "${search.trim()}".`}
                </p>
              ) : (
                searchGroups.map((group) => (
                  <div className="home-search-group" key={group.key}>
                    <p className="home-search-group-label">{group.label}</p>
                    {group.items.map((item) => (
                      <button
                        type="button"
                        className="home-search-result"
                        key={item.id}
                        onClick={() =>
                          navigate(item.to, { state: item.state })
                        }
                      >
                        <span className="home-search-result-title">
                          {item.title}
                        </span>
                        <span className="home-search-result-sub">
                          {item.subtitle}
                        </span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="home-two-col">
        <div>
          <div className="home-section-head">
            <h3>Your saved deals</h3>
            <button
              className="section-link-btn"
              onClick={() => navigate('/deals?tab=wallet')}
            >
              View all →
            </button>
          </div>
          <p className="home-section-note">Your most recently saved deal.</p>

          {savedDeals === null ? (
            <div className="empty-state">Loading your saved deals…</div>
          ) : !latestSavedDeal ? (
            <div className="empty-state">
              You haven't saved any deals yet. Browse Deals & Discovery to find
              some.
            </div>
          ) : (
            <div
              className="featured-deal"
              role="button"
              tabIndex={0}
              onClick={openLatestSavedDeal}
              onKeyDown={(event) => {
                if (event.key === 'Enter') openLatestSavedDeal()
              }}
            >
              <div className="featured-deal-photo">
                {latestSavedDeal.deal_image_url ? (
                  <img
                    src={latestSavedDeal.deal_image_url}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <>
                    Business photo
                    <br />
                    (TBD)
                  </>
                )}
              </div>
              <div className="featured-deal-body">
                <span className="deal-tag">{latestSavedDeal.category}</span>
                <h4 className="featured-deal-name">
                  {latestSavedDeal.business_name}
                </h4>
                <p className="featured-deal-desc">
                  {latestSavedDeal.deal_description ||
                    latestSavedDeal.description}
                </p>
                <div className="featured-deal-foot">
                  {latestSavedDeal.distance_km != null ? (
                    <>
                      <strong>
                        {Number(latestSavedDeal.distance_km).toFixed(1)} km
                      </strong>{' '}
                      away
                    </>
                  ) : (
                    'Saved deal'
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="home-section-head block-gap">
            <h3>Recent activity</h3>
            <button
              className="section-link-btn"
              onClick={() => navigate('/profile/history')}
            >
              View all →
            </button>
          </div>
          <p className="home-section-note">Your latest history.</p>

          {history.isLoading ? (
            <div className="empty-state">Loading your activity…</div>
          ) : history.error ? (
            <div className="empty-state">{history.error}</div>
          ) : recentActivity.length === 0 ? (
            <div className="empty-state">
              Nothing here yet. Redeem a deal or complete a job and it will show
              up here.
            </div>
          ) : (
            recentActivity.map((item) => (
              <div className="home-activity-row" key={item.id}>
                <span className="what">
                  {item.text} <b>{item.subject}</b>
                </span>
                <span className="when">{formatTimeAgo(item.date)}</span>
              </div>
            ))
          )}
        </div>

        <aside>
          <div className="home-side-card">
            <p className="home-side-label">
              Loyalty{closestLoyalty ? ` · ${closestLoyalty.business}` : ''}
            </p>
            {closestLoyalty ? (
              <>
                <h3 className="home-side-title">
                  {closestLoyalty.programmeName}
                </h3>
                {showStamps && (
                  <div className="stamp-row">
                    {Array.from({ length: loyaltyProgress.target }).map(
                      (_, index) => (
                        <span
                          key={index}
                          className={`stamp${index < Math.floor(loyaltyProgress.progress) ? ' filled' : ''}`}
                        />
                      ),
                    )}
                  </div>
                )}
                <p className="stamp-note">
                  {closestLoyalty.rewardEligible
                    ? 'Reward ready to redeem'
                    : `${loyaltyProgress.progressLabel}, ${loyaltyProgress.remainingLabel}`}
                </p>
                {closestLoyalty.rewardDescription && (
                  <p className="stamp-note">
                    Reward: {closestLoyalty.rewardDescription}
                  </p>
                )}
              </>
            ) : (
              <p className="stamp-note">
                {loyalty.isLoading
                  ? 'Loading your loyalty cards…'
                  : "You haven't joined a loyalty programme yet."}
              </p>
            )}
            <button
              className="btn-outline"
              onClick={() => navigate('/loyalty')}
            >
              View Your Loyalties
            </button>
          </div>

          <div className="home-side-card block-gap">
            <p className="home-side-label">Your Active Jobs</p>
            <h3 className="home-side-title">
              {homeJobs.isLoading
                ? 'Loading…'
                : `${activeJobCount} job${activeJobCount !== 1 ? 's' : ''} active`}
            </h3>
            {latestJob && (
              <button
                className="job-row"
                onClick={() => navigate(`/jobs?job=${latestJob.id}`)}
              >
                <div className="job-top">
                  <span className="job-name">{latestJob.title}</span>
                  <span className="job-quotes">
                    {latestJobQuotes > 0
                      ? `${latestJobQuotes} quote${latestJobQuotes === 1 ? '' : 's'}`
                      : 'No quotes yet'}
                  </span>
                </div>
                <div className="job-meta">
                  {new Date(latestJob.created_at).toLocaleDateString('en-NZ')}
                </div>
              </button>
            )}
            <button className="btn-outline" onClick={() => navigate('/jobs')}>
              View all jobs
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}


function toActivity(item) {
  const base = { id: item.id, date: item.date }

  if (item.type === 'job') {
    return { ...base, text: 'You completed a job:', subject: item.title }
  }

  if (item.type === 'deal') {
    const text =
      item.statusLabel === 'Redeemed'
        ? 'You redeemed a deal at'
        : item.statusLabel === 'Ended early'
          ? 'A deal ended early at'
          : 'Your deal expired at'
    return { ...base, text, subject: item.subtitle }
  }

  return {
    ...base,
    text: 'Your loyalty programme ended at',
    subject: item.subtitle,
  }
}

function getClosestToCompletion(programs) {
  const active = programs.filter(
    (program) => program.programmeStatus === 'active',
  )
  const inProgress = active.filter((program) => !program.rewardEligible)
  const pool = inProgress.length > 0 ? inProgress : active

  return pool.reduce((best, program) => {
    if (!best) return program
    const bestPercentage = getLoyaltyProgressPresentation(best).percentage
    const percentage = getLoyaltyProgressPresentation(program).percentage
    return percentage > bestPercentage ? program : best
  }, null)
}

function formatTimeAgo(value) {
  if (!value) return ''
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000)
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  const formatter = new Intl.RelativeTimeFormat('en-NZ', { numeric: 'auto' })

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit)
    }
  }
  return 'Just now'
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}