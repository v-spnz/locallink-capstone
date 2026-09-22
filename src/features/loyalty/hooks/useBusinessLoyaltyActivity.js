import { useCallback, useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  fetchBusinessLoyaltyActivity,
  subscribeToBusinessLoyaltyActivity,
} from '../api/loyaltyActivityApi'

export default function useBusinessLoyaltyActivity() {
  const { business } = useBusiness()
  const [activity, setActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')

    const loadActivity = useCallback(async () => {
    if (!business.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setRequestError('')
    try {
      const data = await fetchBusinessLoyaltyActivity(business.id)
      setActivity(data)
    } catch (error) {
      console.error('Unable to load loyalty activity.', error)
      setRequestError('Unable to load recent activity. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    let cancelled = false

    async function loadInitialActivity() {
      if (!business.id) {
        setIsLoading(false)
        return
      }
      try {
        const data = await fetchBusinessLoyaltyActivity(business.id)
        if (!cancelled) setActivity(data)
      } catch (error) {
        console.error('Unable to load loyalty activity.', error)
        if (!cancelled) {
          setRequestError('Unable to load recent activity. Please try again.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadInitialActivity()
    return () => {
      cancelled = true
    }
  }, [business.id])

  useEffect(() => {
    if (!business.id) return undefined
    const unsubscribe = subscribeToBusinessLoyaltyActivity(
      business.id,
      (newRecord) => {
        setActivity((current) => [newRecord, ...current])
      },
    )
    return unsubscribe
  }, [business.id])

  return {
    activity,
    isLoading,
    requestError,
    loadActivity,
  }
}
