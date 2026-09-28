import { useEffect, useMemo, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import { fetchCustomerJobs } from '../../../features/service-marketplace/api/customerJobs'
import { getActiveQuoteCount } from '../../../features/service-marketplace/formatters'

export default function useHomeJobs() {
  const { user } = useAuth()
  const userId = user.id
  const [jobs, setJobs] = useState([])
  const [quotes, setQuotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadJobs() {
      try {
        const result = await fetchCustomerJobs(userId)
        if (!active) return
        setJobs(result.jobs ?? [])
        setQuotes(result.quotes ?? [])
      } catch (error) {
        console.error('Unable to load jobs for the home page.', error)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [userId])

  const activeJobs = useMemo(
    () => jobs.filter((job) => job.status !== 'completed'),
    [jobs],
  )

  // fetchCustomerJobs returns newest first, so the first active job is the latest posted.
  const latestJob = activeJobs[0] ?? null

  const latestJobQuoteCount = useMemo(() => {
    if (!latestJob) return 0
    return getActiveQuoteCount(
      quotes.filter((quote) => quote.job_request_id === latestJob.id),
    )
  }, [latestJob, quotes])

  return { jobs, activeJobs, latestJob, latestJobQuoteCount, isLoading }
}