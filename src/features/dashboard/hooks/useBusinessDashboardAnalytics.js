import { useCallback, useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  fetchBusinessDashboardMetrics,
  fetchBusinessDealPerformance,
  fetchBusinessLoyaltyProgrammePerformance,
} from '../api/businessDashboard'
import { fetchBusinessDeals } from '../../deals/api/businessDeals'

export default function useBusinessDashboardAnalytics({ startDate, endDate }) {
  const { business } = useBusiness()
  const [metrics, setMetrics] = useState(null)
  const [dealPerformance, setDealPerformance] = useState([])
  const [deals, setDeals] = useState([])
  const [dealsFailed, setDealsFailed] = useState(false)
  const [dealsLoading, setDealsLoading] = useState(true)
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

    async function loadDeals() {
      setDealsLoading(true)
      setDealsFailed(false)
      try {
        const data = await fetchBusinessDeals(business.id)
        if (active) setDeals(data.deals)
      } catch (dealError) {
        if (!active) return
        console.error('Unable to load deals for the dashboard.', dealError)
        setDeals([])
        setDealsFailed(true)
      } finally {
        if (active) setDealsLoading(false)
      }
    }

    void loadDeals()
    return () => {
      active = false
    }
  }, [business.id, reloadKey])

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
    deals,
    dealsFailed,
    dealsLoading,
    loyaltyProgrammePerformance,
    isLoading,
    error,
    reload: () => setReloadKey((current) => current + 1),
  }
}
