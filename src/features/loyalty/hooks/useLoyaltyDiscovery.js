import { useCallback, useEffect, useState } from 'react'
import { discoverLoyaltyProgrammes } from '../api/loyaltyApi'

export default function useLoyaltyDiscovery() {
  const [businesses, setBusinesses] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const results = await discoverLoyaltyProgrammes()
      setBusinesses(results)
    } catch (loadError) {
      console.error('Unable to load nearby loyalty programmes.', loadError)
      setError('Unable to load loyalty programmes right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Mount-time fetch from an external system (the API) — the loading
    // state's setState is the expected first synchronous act here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { businesses, isLoading, error, reload: load }
}
