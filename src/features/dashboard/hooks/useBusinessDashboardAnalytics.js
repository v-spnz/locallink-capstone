import { useCallback, useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  fetchBusinessDashboardMetrics,
  fetchBusinessDealPerformance,
  fetchBusinessLoyaltyProgrammePerformance,
} from '../api/businessDashboard'

export default function useBusinessDashboardAnalytics({ startDate, endDate }) {
  const { business } = useBusiness()
  const [metrics, setMetrics] = useState(null)
  const [dealPerformance, setDealPerformance] = useState([])
  const [loyaltyProgrammePerformance, setLoyaltyProgrammePerformance] =
    useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const loadAnalytics = useCallback(async () => {
    if (!startDate || !endDate) return null

    const options = {
      businessId: business.id,
      startDate,
      endDate,
    }
    return Promise.all([
      fetchBusinessDashboardMetrics(options),
      fetchBusinessDealPerformance(options),
      fetchBusinessLoyaltyProgrammePerformance(options),
    ])
  }, [business.id, endDate, startDate])

  useEffect(() => {
    let active = true

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const result = await loadAnalytics()
        if (!active) return

        if (!result) {
          setMetrics(null)
          setDealPerformance([])
          setLoyaltyProgrammePerformance([])
          return
        }

        const [nextMetrics, nextDeals, nextLoyaltyProgrammes] = result
        setMetrics(nextMetrics)
        setDealPerformance(nextDeals)
        setLoyaltyProgrammePerformance(nextLoyaltyProgrammes)
      } catch (loadError) {
        if (!active) return
        console.error('Unable to load business dashboard analytics.', loadError)
        setError('Unable to load dashboard analytics. Please try again.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [loadAnalytics, reloadKey])

  return {
    metrics,
    dealPerformance,
    loyaltyProgrammePerformance,
    isLoading,
    error,
    reload: () => setReloadKey((current) => current + 1),
  }
}
