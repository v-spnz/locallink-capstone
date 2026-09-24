import { useCallback, useEffect, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import { fetchCustomerDealClaims } from '../api/customerDeals'
import { isClaimActive } from '../claimStatus'

const CLAIMS_REFRESH_INTERVAL = 30_000

export default function useActiveDealClaims() {
  const { user } = useAuth()
  const [claims, setClaims] = useState([])
  const [now, setNow] = useState(() => new Date())
  const customerId = user?.id

  const refresh = useCallback(async () => {
    if (!customerId) {
      setClaims([])
      return
    }
    try {
      const allClaims = await fetchCustomerDealClaims()
      setClaims(allClaims)
    } catch (error) {
      console.error('Unable to load deal claims.', error)
    }
  }, [customerId])

  useEffect(() => {
    const initialTimer = window.setTimeout(refresh, 0)
    if (!customerId) return () => window.clearTimeout(initialTimer)

    const refreshTimer = window.setInterval(refresh, CLAIMS_REFRESH_INTERVAL)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(refreshTimer)
    }
  }, [customerId, refresh])

  useEffect(() => {
    const tickTimer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(tickTimer)
  }, [])

  const activeClaims = claims
    .filter((claim) => isClaimActive(claim, now))
    .sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at))

  return { activeClaims, now }
}
