import { useEffect, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import {
  confirmCustomerJobCompletion,
  deleteCustomerJob,
  fetchCustomerJobs,
  respondToCustomerQuote,
  saveCustomerJob,
} from '../api/customerJobs'
import { formatRequestError, getOverallJobStatus } from '../formatters'
import { notifyBusinessMarketplaceChanged } from '../marketplaceEvents'

function groupQuotesByJob(quotes) {
  return quotes.reduce((groupedQuotes, quote) => {
    const jobQuotes = groupedQuotes[quote.job_request_id] ?? []
    return {
      ...groupedQuotes,
      [quote.job_request_id]: [...jobQuotes, quote],
    }
  }, {})
}

// Keeps status_history sorted oldest-first, which
// ActiveJobProgressTimeline relies on.
function normalizeJob(job) {
  const statusHistory = Array.isArray(job.status_history)
    ? job.status_history.toSorted(
        (first, second) =>
          new Date(first.updated_at).getTime() -
          new Date(second.updated_at).getTime(),
      )
    : []

  return {
    ...job,
    status_history: statusHistory,
    postedDistance: `${job.radius_km}km`,
  }
}

export default function useCustomerJobs() {
  const { user } = useAuth()
  const [postedJobs, setPostedJobs] = useState([])
  const [quotesByJob, setQuotesByJob] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [respondingQuoteId, setRespondingQuoteId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingJob, setEditingJob] = useState(null)
  const [repostSeed, setRepostSeed] = useState(null)
  const [modalInitialStep, setModalInitialStep] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const [selectedJobId, setSelectedJobId] = useState(null)
  const [activeTab, setActiveTab] = useState('jobs')
  const [selectedQuoteJobId, setSelectedQuoteJobId] = useState(null)
  const [confirmingJobId, setConfirmingJobId] = useState(null)

  const jobStatus = getOverallJobStatus(postedJobs)
  const modalInitialJob = editingJob || repostSeed

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

  function openPostModal() {
    setEditingJob(null)
    setRepostSeed(null)
    setModalInitialStep(1)
    setModalError('')
    setIsModalOpen(true)
  }

  function openEditModal(job) {
    setEditingJob(job)
    setRepostSeed(null)
    setModalInitialStep(1)
    setModalError('')
    setIsModalOpen(true)
  }

  function openRepostModal(job) {
    setEditingJob(null)
    setRepostSeed(job)
    setModalInitialStep(5)
    setModalError('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setEditingJob(null)
    setRepostSeed(null)
    setModalError('')
  }

  function openJobDetail(jobId) {
    setSelectedJobId(jobId)
  }

  function closeJobDetail() {
    setSelectedJobId(null)
  }

  function switchTab(tab) {
    setActiveTab(tab)
    setSelectedJobId(null)
    if (tab === 'quotes' && !selectedQuoteJobId && postedJobs.length > 0) {
      setSelectedQuoteJobId(postedJobs[0].id)
    }
  }

  function viewQuotesForJob(jobId) {
    setSelectedQuoteJobId(jobId)
    setSelectedJobId(null)
    setActiveTab('quotes')
  }

  function selectQuoteJob(jobId) {
    setSelectedQuoteJobId(jobId)
  }

  async function handleSubmitJob(draft) {
    setIsSaving(true)
    setModalError('')
    setRequestError('')
    const wasEditing = Boolean(editingJob)

    try {
      const savedJob = await saveCustomerJob({
        customerId: user.id,
        draft,
        jobId: editingJob?.id,
      })
      setPostedJobs((current) =>
        wasEditing
          ? current.map((job) => (job.id === savedJob.id ? savedJob : job))
          : [savedJob, ...current],
      )
      setSuccessMessage(
        wasEditing ? 'Job updated successfully!' : 'Job posted successfully!',
      )
      closeModal()
    } catch (saveError) {
      console.error('Unable to save job request.', saveError)
      setModalError(
        formatRequestError(
          'Your job request could not be saved. Please try again.',
          saveError,
        ),
      )
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
      const updatedQuote = Object.values(quotesByJob)
        .flat()
        .find((quote) => quote.quote_id === quoteId)
      if (updatedQuote?.business_id) {
        notifyBusinessMarketplaceChanged(updatedQuote.business_id)
      }
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

  async function handleConfirmCompletion(jobId) {
    setConfirmingJobId(jobId)
    setRequestError('')
    setSuccessMessage('')

    try {
      const updatedJob = await confirmCustomerJobCompletion(jobId)
      const acceptedQuote = (quotesByJob[jobRequestId] ?? []).find(
        (quote) => quote.quote_status === 'accepted',
      )
      if (acceptedQuote?.business_id) {
        notifyBusinessMarketplaceChanged(acceptedQuote.business_id)
      }
      setPostedJobs((current) =>
        current.map((job) =>
          job.id === jobId ? normalizeJob({ ...job, ...updatedJob }) : job,
        ),
      )
      setSuccessMessage('Job completion confirmed!')
    } catch (confirmationError) {
      setRequestError(
        formatRequestError(
          'This job could not be confirmed as completed. Its status may have changed.',
          confirmationError,
        ),
      )
    } finally {
      setConfirmingJobId(null)
    }
  }

  // Testing-only utility, not tied to a user story yet.
  async function handleDeleteJob(jobId) {
    setRequestError('')
    try {
      await deleteCustomerJob(jobId, user.id)
      setPostedJobs((current) => current.filter((job) => job.id !== jobId))
      setQuotesByJob((current) => {
        const next = { ...current }
        delete next[jobId]
        return next
      })
      setSelectedJobId((current) => (current === jobId ? null : current))
      setSuccessMessage('Job deleted.')
    } catch {
      setRequestError('This job could not be deleted. Please try again.')
    }
  }

  return {
    postedJobs,
    quotesByJob,
    jobStatus,
    successMessage,
    requestError,
    isLoading,
    respondingQuoteId,
    isModalOpen,
    modalInitialJob,
    modalInitialStep,
    isSaving,
    modalError,
    selectedJobId,
    activeTab,
    selectedQuoteJobId,
    confirmingJobId,
    openPostModal,
    openEditModal,
    openRepostModal,
    closeModal,
    openJobDetail,
    closeJobDetail,
    switchTab,
    viewQuotesForJob,
    selectQuoteJob,
    handleSubmitJob,
    handleQuoteResponse,
    handleConfirmCompletion,
    handleDeleteJob,
  }
}
