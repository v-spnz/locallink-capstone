import { useEffect, useMemo, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import suburbsData from '../../../data/suburbs'
import {
  fetchCustomerJobs,
  respondToCustomerQuote,
  saveCustomerJob,
} from '../api/customerJobs'
import { getOverallJobStatus } from '../formatters'
import { validateJobRequest } from '../validation'

const EMPTY_FORM = {
  title: '',
  description: '',
  category: '',
  city: '',
  suburb: '',
  postedDistance: '',
}

function groupQuotesByJob(quotes) {
  return quotes.reduce((groupedQuotes, quote) => {
    const jobQuotes = groupedQuotes[quote.job_request_id] ?? []
    return {
      ...groupedQuotes,
      [quote.job_request_id]: [...jobQuotes, quote],
    }
  }, {})
}

function normalizeJob(job) {
  return { ...job, postedDistance: `${job.radius_km}km` }
}

export default function useCustomerJobs() {
  const { user } = useAuth()
  const [postedJobs, setPostedJobs] = useState([])
  const [quotesByJob, setQuotesByJob] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [pendingJob, setPendingJob] = useState(null)
  const [editingJob, setEditingJob] = useState(null)
  const [step, setStep] = useState('form')
  const [successMessage, setSuccessMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [respondingQuoteId, setRespondingQuoteId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const suburbOptions = useMemo(
    () => (form.city && suburbsData[form.city] ? suburbsData[form.city] : []),
    [form.city],
  )
  const jobStatus = useMemo(() => getOverallJobStatus(postedJobs), [postedJobs])

  useEffect(() => {
    let active = true

    async function loadJobs() {
      setIsLoading(true)
      setRequestError('')
      const result = await fetchCustomerJobs(user.id)
      if (!active) return

      if (result.hasError)
        setRequestError('Unable to load your job requests and quotes.')
      if (result.jobs) setPostedJobs(result.jobs.map(normalizeJob))
      if (result.quotes) setQuotesByJob(groupQuotesByJob(result.quotes))
      setIsLoading(false)
    }

    loadJobs()
    return () => {
      active = false
    }
  }, [reloadKey, user.id])

  useEffect(() => {
    if (!successMessage) return undefined
    const timer = setTimeout(() => setSuccessMessage(''), 2000)
    return () => clearTimeout(timer)
  }, [successMessage])

  function setField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'city' ? { suburb: '' } : {}),
    }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function handleReview(event) {
    event.preventDefault()
    setSuccessMessage('')
    const validationErrors = validateJobRequest(form, suburbOptions)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setPendingJob(
      Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      ),
    )
    setStep('review')
  }

  function handleEditJob(job) {
    setEditingJob(job)
    setForm({
      title: job.title,
      description: job.description,
      category: job.category,
      city: job.city,
      suburb: job.suburb,
      postedDistance: job.postedDistance,
    })
    setErrors({})
    setStep('form')
  }

  function handleRepostJob(job) {
    setEditingJob(null)
    setPendingJob(job)
    setStep('review')
  }

  async function handleConfirmPost() {
    setIsSaving(true)
    setRequestError('')
    const wasEditing = Boolean(editingJob)

    try {
      const savedJob = await saveCustomerJob({
        customerId: user.id,
        job: pendingJob,
        jobId: editingJob?.id,
      })
      setPostedJobs((current) =>
        wasEditing
          ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
          : [savedJob, ...current],
      )
      setEditingJob(null)
      setPendingJob(null)
      setForm(EMPTY_FORM)
      setStep('form')
      setSuccessMessage(
        wasEditing ? 'Job updated successfully!' : 'Job posted successfully!',
      )
    } catch {
      setRequestError('Your job request could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleQuoteResponse(quoteId, accept) {
    setRespondingQuoteId(quoteId)
    setRequestError('')
    setSuccessMessage('')

    try {
      await respondToCustomerQuote(quoteId, accept)
      setSuccessMessage(accept ? 'Quote accepted!' : 'Quote declined.')
      setReloadKey((current) => current + 1)
    } catch {
      setRequestError(
        accept
          ? 'This quote could not be accepted. It may no longer be available.'
          : 'This quote could not be declined. Please try again.',
      )
    } finally {
      setRespondingQuoteId(null)
    }
  }

  return {
    postedJobs,
    quotesByJob,
    form,
    errors,
    suburbOptions,
    pendingJob,
    step,
    successMessage,
    requestError,
    isLoading,
    isSaving,
    respondingQuoteId,
    jobStatus,
    setField,
    handleReview,
    handleEditJob,
    handleRepostJob,
    handleConfirmPost,
    handleQuoteResponse,
    handleBackToEdit: () => setStep('form'),
  }
}
