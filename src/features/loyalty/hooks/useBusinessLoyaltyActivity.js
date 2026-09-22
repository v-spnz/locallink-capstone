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
    loadActivity()
  }, [loadActivity])

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
