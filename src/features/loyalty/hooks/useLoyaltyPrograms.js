import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchMyLoyaltyRecords } from '../api/loyaltyApi'

export default function useLoyaltyPrograms() {
  const [tab, setTab] = useState('inprogress')
  const [search, setSearch] = useState('')
  const [programs, setPrograms] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadPrograms = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const records = await fetchMyLoyaltyRecords()
      setPrograms(records)
    } catch (loadError) {
      console.error('Unable to load loyalty programmes.', loadError)
      setError('Unable to load your loyalty programmes right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Mount-time fetch from an external system (the API) — the loading
    // state's setState is the expected first synchronous act here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPrograms()
  }, [loadPrograms])

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return programs
    return programs.filter(
      (program) =>
        program.business.toLowerCase().includes(query) ||
        program.programmeName.toLowerCase().includes(query),
    )
  }, [programs, search])

  const inProgress = filteredPrograms.filter(
    (program) => !program.rewardEligible,
  )
  const rewardReady = filteredPrograms.filter(
    (program) => program.rewardEligible,
  )

  return {
    tab,
    search,
    programs,
    inProgress,
    rewardReady,
    list: tab === 'inprogress' ? inProgress : rewardReady,
    error,
    isLoading,
    setTab,
    setSearch,
    reload: loadPrograms,
  }
}
