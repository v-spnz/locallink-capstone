import { useCallback, useEffect, useState } from 'react'
import { isClaimActive } from '../../../features/deals/claimStatus'
import { fetchCustomerDealClaims } from '../../../features/deals/api/customerDeals'
import { fetchMyLoyaltyRecords } from '../../../features/loyalty/api/loyaltyApi'
import { supabase } from '../../../lib/supabase'

async function fetchCompletedJobs() {
  const { data, error } = await supabase
    .from('job_requests')
    .select('id, title, category, status, updated_at')
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export default function useAllHistory() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const now = new Date()
      const [jobs, claims, loyaltyRecords] = await Promise.all([
        fetchCompletedJobs(),
        fetchCustomerDealClaims(),
        fetchMyLoyaltyRecords(),
      ])

      const jobItems = jobs.map((job) => ({
        type: 'job',
        id: `job-${job.id}`,
        title: job.title,
        subtitle: job.category,
        date: job.updated_at,
        statusLabel: 'Completed',
      }))

      const dealItems = claims
        .filter((claim) => !isClaimActive(claim, now))
        .map((claim) => ({
          type: 'deal',
          id: `deal-${claim.claim_id}`,
          title: claim.title,
          subtitle: claim.business_name,
          date: claim.redeemed_at || claim.expires_at || claim.claimed_at,
          statusLabel: claim.redeemed_at
            ? 'Redeemed'
            : claim.status === 'ended_early'
              ? 'Ended early'
              : 'Expired',
        }))

      const loyaltyItems = loyaltyRecords
        .filter((record) => record.programmeStatus !== 'active')
        .map((record) => ({
          type: 'loyalty',
          id: `loyalty-${record.id}`,
          title: record.programmeName,
          subtitle: record.business,
          date: record.updatedAt,
          statusLabel: 'Programme ended',
        }))

      const combined = [...jobItems, ...dealItems, ...loyaltyItems].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      )

      setItems(combined)
    } catch (loadError) {
      console.error('Unable to load account history.', loadError)
      setError('Unable to load your history right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { items, isLoading, error, reload: load }
}
