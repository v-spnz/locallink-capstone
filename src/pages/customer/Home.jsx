import { Clock3 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import { supabase } from '../../lib/supabase'
import { fetchCustomerLocation } from '../../features/location/api/locations'
import {
  fetchCustomerDealClaims,
  fetchMySavedDeals,
} from '../../features/deals/api/customerDeals'
import { isClaimActive } from '../../features/deals/claimStatus'
import { formatCountdown } from '../../features/deals/countdown'
import '../../features/location/discovery.css'

const DEAL_DISPLAY_COUNT = 3

const loyaltyCard = {
  businessName: 'Britomart Espresso Bar',
  stampsTotal: 5,
  stampsFilled: 4,
}

const previewJobs = [
  { id: 1, name: 'Kitchen tap repair', quotes: 3, posted: 'Posted 2 days ago' },
  { id: 2, name: 'Car wash needed', quotes: 0, posted: 'Posted 5 days ago' },
]

const recentActivity = [
  {
    id: 1,
    text: 'You redeemed a deal at',
    business: 'Parnell Village Bakery',
    time: '2 hours ago',
  },
  {
    id: 2,
    text: 'You picked up a stamp at',
    business: 'Britomart Espresso Bar',
    time: 'Yesterday',
  },
  {
    id: 3,
    text: 'You posted a job —',
    business: 'Kitchen tap repair',
    time: '2 days ago',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [accountJobs, setAccountJobs] = useState([])
  const [customerLocation, setCustomerLocation] = useState(null)
  const [suburbResults, setSuburbResults] = useState([])

  useEffect(() => {
    let active = true
    if (!user)
      return () => {
        active = false
      }

    async function loadJobs() {
      const [jobsResult, quotesResult] = await Promise.all([
        supabase
          .from('job_requests')
          .select('id, title, status, created_at')
          .eq('customer_id', user.id)
          .in('status', ['open', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.rpc('get_customer_job_quotes'),
      ])

      if (active) {
        const quoteCounts = (quotesResult.data ?? []).reduce(
          (counts, quote) => ({
            ...counts,
            [quote.job_request_id]: (counts[quote.job_request_id] ?? 0) + 1,
          }),
          {},
        )

        setAccountJobs(
          (jobsResult.data ?? []).map((job) => ({
            id: job.id,
            name: job.title,
            status: job.status,
            quotes: quoteCounts[job.id] ?? 0,
            posted: new Date(job.created_at).toLocaleDateString('en-NZ'),
          })),
        )
      }
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    let active = true
    async function loadSavedDeals() {
      try {
        const savedLocation = await fetchCustomerLocation()
        if (active) setCustomerLocation(savedLocation)
        const results = await fetchMySavedDeals()
        if (active) setSuburbResults(results)
      } catch (error) {
        console.error('Unable to load saved deals.', error)
      }
    }
    loadSavedDeals()

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

  const displayedJobs = user ? accountJobs : previewJobs

  const suburbBusinesses = suburbResults
    .filter((business) => {
      const query = search.trim().toLowerCase()
      return (
        query === '' ||
        business.business_name.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query)
      )
    })
    .slice(0, DEAL_DISPLAY_COUNT)

  const featuredBusiness = suburbBusinesses[0]
  const otherBusinesses = suburbBusinesses.slice(1)

  const stampsRemaining = loyaltyCard.stampsTotal - loyaltyCard.stampsFilled

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
            placeholder="Search businesses, deals, or services"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className="home-two-col">
        <div>
          {/* Deals Near You - everything here goes to Deals & Discovery */}
          <div className="home-section-head">
            <h3>Your saved deals</h3>
            <button
              className="section-link-btn"
              onClick={() => navigate('/deals')}
            >
              View all →
            </button>
          </div>
          <p className="home-section-note">
            Deals you've saved, most recent first.
          </p>

          {suburbBusinesses.length === 0 ? (
            <div className="empty-state">
              {search
                ? `No saved deals match "${search}".`
                : "You haven't saved any deals yet — browse Deals & Discovery to find some."}
            </div>
          ) : (
            <>
              <div
                className="featured-deal"
                onClick={() =>
                  navigate(`/deals?deal=${featuredBusiness.deal_id}`, {
                    state: { openDeal: featuredBusiness },
                  })
                }
              >
                <div className="featured-deal-photo">
                  {featuredBusiness.deal_image_url ? (
                    <img
                      src={featuredBusiness.deal_image_url}
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
                  <span className="deal-tag">{featuredBusiness.category}</span>
                  <h4 className="featured-deal-name">
                    {featuredBusiness.business_name}
                  </h4>
                  <p className="featured-deal-desc">
                    {featuredBusiness.deal_description ||
                      featuredBusiness.description}
                  </p>
                  <div className="featured-deal-foot">
                    {featuredBusiness.distance_km != null ? (
                      <>
                        <strong>
                          {Number(featuredBusiness.distance_km).toFixed(1)} km
                        </strong>{' '}
                        away
                      </>
                    ) : (
                      'Saved deal'
                    )}
                  </div>
                </div>
              </div>

              {otherBusinesses.length > 0 && (
                <div className="deal-list">
                  {otherBusinesses.map((business) => (
                    <div
                      className="deal-row"
                      key={business.business_id}
                      onClick={() =>
                        navigate(`/deals?deal=${business.deal_id}`, {
                          state: { openDeal: business },
                        })
                      }
                    >
                      <div className="deal-row-body">
                        <div className="deal-row-name">
                          {business.business_name}
                        </div>
                        <div className="deal-row-sub">
                          {business.category} · {business.description}
                        </div>
                      </div>
                      <div className="deal-row-dist">
                        {business.distance_km != null
                          ? `${Number(business.distance_km).toFixed(1)} km`
                          : 'Saved'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Recent Activity - everything here goes to Profile */}
          <div className="home-section-head block-gap">
            <h3>Recent activity</h3>
            <button
              className="section-link-btn"
              onClick={() => navigate('/profile')}
            >
              View all →
            </button>
          </div>
          <p className="home-section-note">
            Deals you've used, stamps you've collected, jobs you've posted.
          </p>
          {recentActivity.map((item) => (
            <div
              className="home-activity-row"
              key={item.id}
              onClick={() => navigate('/profile')}
            >
              <span className="what">
                {item.text} <b>{item.business}</b>
              </span>
              <span className="when">{item.time}</span>
            </div>
          ))}
        </div>

        <aside>
          {/* Loyalty - mock display, every button goes to the Loyalty page */}
          <div className="home-side-card">
            <p className="home-side-label">
              Loyalty · {loyaltyCard.businessName}
            </p>
            <h3 className="home-side-title">Coffee Card</h3>
            <div className="stamp-row">
              {Array.from({ length: loyaltyCard.stampsTotal }).map(
                (_, index) => (
                  <span
                    key={index}
                    className={`stamp${index < loyaltyCard.stampsFilled ? ' filled' : ''}`}
                  />
                ),
              )}
            </div>
            <p className="stamp-note">
              {stampsRemaining === 1
                ? 'One more coffee and the next one is on us!'
                : `${stampsRemaining} more coffees and the next one is on us!`}
            </p>
            <button
              className="btn-outline"
              onClick={() => navigate('/loyalty')}
            >
              View all loyalty cards
            </button>
          </div>

          {/* Service Marketplace - account jobs and quotes from Supabase */}
          <div className="home-side-card block-gap">
            <p className="home-side-label">Service Marketplace</p>
            <h3 className="home-side-title">
              {displayedJobs.length} job{displayedJobs.length !== 1 ? 's' : ''}{' '}
              active
            </h3>
            {displayedJobs.map((job) => (
              <button
                className="job-row"
                key={job.id}
                onClick={() => navigate('/jobs')}
              >
                <div className="job-top">
                  <span className="job-name">{job.name}</span>
                  <span className="job-quotes">
                    {job.quotes > 0 ? `${job.quotes} quotes` : 'No quotes yet'}
                  </span>
                </div>
                <div className="job-meta">{job.posted}</div>
              </button>
            ))}
            <button className="btn-outline" onClick={() => navigate('/jobs')}>
              View Job List →
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
