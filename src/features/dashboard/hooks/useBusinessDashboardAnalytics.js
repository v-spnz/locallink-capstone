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
  const [performancePeriod, setPerformancePeriod] = useState('')
  const [performanceError, setPerformanceError] = useState('')
  const [deals, setDeals] = useState([])
  const [dealsFailed, setDealsFailed] = useState(false)
  const [dealsLoading, setDealsLoading] = useState(true)
  const [loyaltyProgrammePerformance, setLoyaltyProgrammePerformance] =
    useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [metricsPeriod, setMetricsPeriod] = useState('')
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const periodKey = `${business.id}:${startDate}:${endDate}:${reloadKey}`

  const loadMetrics = useCallback(async () => {
    if (!startDate || !endDate) return null

    return fetchBusinessDashboardMetrics({
      businessId: business.id,
      startDate,
      endDate,
    })
  }, [business.id, endDate, startDate])

  const loadPerformanceBreakdowns = useCallback(async () => {
    if (!startDate || !endDate) return null

    const options = {
      businessId: business.id,
      startDate,
      endDate,
    }
    return Promise.allSettled([
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
        const nextMetrics = await loadMetrics()
        if (active) setMetrics(nextMetrics)
      } catch (loadError) {
        if (!active) return
        console.error('Unable to load business dashboard metrics.', loadError)
        setMetrics(null)
        setError('Unable to load dashboard analytics. Please try again.')
      } finally {
        if (active) {
          setIsLoading(false)
          setMetricsPeriod(periodKey)
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [loadMetrics, periodKey])

  useEffect(() => {
    let active = true

    async function load() {
      setPerformanceError('')
      try {
        const result = await loadPerformanceBreakdowns()
        if (!active) return

        if (!result) {
          setDealPerformance([])
          setLoyaltyProgrammePerformance([])
          return
        }

        const [dealsResult, loyaltyResult] = result
        if (dealsResult.status === 'fulfilled') {
          setDealPerformance(dealsResult.value)
        } else {
          console.error('Unable to load deal performance.', dealsResult.reason)
          setDealPerformance([])
          setPerformanceError(
            'Unable to load deal performance. Please try again.',
          )
        }
        if (loyaltyResult.status === 'fulfilled') {
          setLoyaltyProgrammePerformance(loyaltyResult.value)
        } else {
          console.error(
            'Unable to load loyalty performance.',
            loyaltyResult.reason,
          )
          setLoyaltyProgrammePerformance([])
        }
      } catch (loadError) {
        if (!active) return
        console.error(
          'Unable to load deal/loyalty performance breakdowns.',
          loadError,
        )
        setDealPerformance([])
        setLoyaltyProgrammePerformance([])
        setPerformanceError(
          'Unable to load deal performance. Please try again.',
        )
      } finally {
        if (active) setPerformancePeriod(periodKey)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [loadPerformanceBreakdowns, periodKey])

  return {
    metrics,
    dealPerformance,
    performanceLoading: performancePeriod !== periodKey,
    performanceError,
    deals,
    dealsFailed,
    dealsLoading,
    loyaltyProgrammePerformance,
    isLoading: isLoading || metricsPeriod !== periodKey,
    error,
    reload: () => setReloadKey((current) => current + 1),
  }
}
