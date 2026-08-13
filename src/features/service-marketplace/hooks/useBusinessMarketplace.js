import { useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  declineBusinessOpportunity,
  fetchBusinessMarketplaceItems,
  submitBusinessQuote,
  updateBusinessJobStatus,
  withdrawBusinessQuote,
} from '../api/businessJobs'
import {
  formatQuoteArrivalWindow,
  MARKETPLACE_PAGE_CONTENT,
} from '../constants'
import { formatRequestError } from '../formatters'
import { filterAndSortLeads } from '../leadFilters'
import {
  filterBusinessJobs,
  formatJobProgressStage,
  getNextJobProgressStage,
  isValidJobProgressTransition,
} from '../jobTracking'
import {
  notifyBusinessMarketplaceChanged,
  subscribeToBusinessMarketplaceChanges,
} from '../marketplaceEvents'
import {
  filterBusinessQuotes,
  getBusinessQuoteDraft,
  saveBusinessQuoteDraft,
  clearBusinessQuoteDraft,
} from '../quoteTracking'
import { validateQuote } from '../validation'

export const EMPTY_QUOTE = {
  priceType: '',
  amount: '',
  availability: '',
  arrivalStart: '',
  arrivalEnd: '',
  arrivalWindow: '',
  includedWork: '',
  conditions: '',
  expectedDuration: '',
  message: '',
}

export default function useBusinessMarketplace(type) {
  const content = MARKETPLACE_PAGE_CONTENT[type]
  const { business } = useBusiness()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [reviewedLead, setReviewedLead] = useState(null)
  const [quote, setQuote] = useState(EMPTY_QUOTE)
  const [quoteErrors, setQuoteErrors] = useState({})
  const [quoteStep, setQuoteStep] = useState('form')
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [leadOrder, setLeadOrder] = useState('newest')
  const [quoteStatus, setQuoteStatus] = useState('all')
  const [quoteOrder, setQuoteOrder] = useState('newest')
  const [jobStatus, setJobStatus] = useState('all')
  const [jobOrder, setJobOrder] = useState('active_first')
  const [withdrawConfirmationId, setWithdrawConfirmationId] = useState(null)
  const [withdrawingQuoteId, setWithdrawingQuoteId] = useState(null)
  const [updatingJobId, setUpdatingJobId] = useState(null)

  const visibleItems =
    type === 'leads'
      ? filterAndSortLeads(items, {
          search,
          urgency: urgencyFilter,
          order: leadOrder,
        })
      : type === 'quotes'
        ? filterBusinessQuotes(items, {
            status: quoteStatus,
            search,
            order: quoteOrder,
          })
        : filterBusinessJobs(items, {
            status: type === 'history' ? 'completed' : jobStatus,
            search,
            order: jobOrder,
          })
  const totalItems =
    type === 'leads' ? filterAndSortLeads(items).length : items.length

  useEffect(() => {
    let active = true

    async function loadItems() {
      setIsLoading(true)
      setError('')
      setSuccess('')
      setSelectedLead(null)
      setReviewedLead(null)
      try {
        const nextItems = await fetchBusinessMarketplaceItems(type, business.id)
        if (active) {
          setItems(nextItems)
          setError('')
          setWithdrawConfirmationId(null)
        }
      } catch (loadError) {
        if (active) {
          console.error(
            `Unable to load ${content.title.toLowerCase()}.`,
            loadError,
          )
          setError(
            formatRequestError(
              `Unable to load ${content.title.toLowerCase()}.`,
              loadError,
            ),
          )
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadItems()
    return () => {
      active = false
    }
  }, [business.id, content.title, reloadKey, type])

  useEffect(
    () =>
      subscribeToBusinessMarketplaceChanges((changedBusinessId) => {
        if (changedBusinessId === business.id) {
          setReloadKey((current) => current + 1)
        }
      }),
    [business.id],
  )

  function toggleLead(jobRequestId) {
    setSelectedLead((current) => {
      const next = current === jobRequestId ? null : jobRequestId
      if (next) {
        const draft = getBusinessQuoteDraft(next, business.id)
        setQuote(draft?.fields ?? EMPTY_QUOTE)
      } else {
        setQuote(EMPTY_QUOTE)
      }
      return next
    })
    setError('')
    setSuccess('')
    setQuoteErrors({})
    setQuoteStep('form')
  }

  function toggleLeadReview(jobRequestId) {
    setReviewedLead((current) =>
      current === jobRequestId ? null : jobRequestId,
    )
    setSelectedLead(null)
    setQuote(EMPTY_QUOTE)
    setQuoteErrors({})
    setQuoteStep('form')
    setError('')
    setSuccess('')
  }

  function showLeadReview(jobRequestId) {
    setReviewedLead(jobRequestId)
    setSelectedLead(null)
    setQuote(EMPTY_QUOTE)
    setQuoteErrors({})
    setQuoteStep('form')
  }

  function setQuoteField(field, value) {
    setQuote((current) => {
      const next = { ...current, [field]: value }
      if (field === 'arrivalStart' || field === 'arrivalEnd') {
        next.arrivalWindow = formatQuoteArrivalWindow(
          next.arrivalStart,
          next.arrivalEnd,
        )
      }
      if (selectedLead) {
        saveBusinessQuoteDraft(selectedLead, business.id, next)
      }
      return next
    })
    setQuoteErrors((current) => ({
      ...current,
      [field]: '',
      ...(['arrivalStart', 'arrivalEnd'].includes(field)
        ? { arrivalWindow: '' }
        : {}),
    }))
  }

  function handleQuoteReview(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const validationErrors = validateQuote(quote)
    setQuoteErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    setQuoteStep('review')
  }

  async function handleQuoteSubmit() {
    const validationErrors = validateQuote(quote)
    setQuoteErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      setQuoteStep('form')
      return
    }

    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await submitBusinessQuote({
        businessId: business.id,
        jobRequestId: selectedLead,
        quote,
      })
      clearBusinessQuoteDraft(selectedLead, business.id)
      setSuccess('Quote submitted with Awaiting response status.')
      setSelectedLead(null)
      setReviewedLead(null)
      setQuote(EMPTY_QUOTE)
      setQuoteErrors({})
      setQuoteStep('form')
      setItems((current) =>
        current.filter((item) => item.job_request_id !== selectedLead),
      )
      notifyBusinessMarketplaceChanged(business.id)
    } catch (submitError) {
      setError(
        formatRequestError(
          'Unable to submit this quote. The three-working-day window may have closed, the request may already have three quotes, or it may no longer be open.',
          submitError,
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAdvanceJobStatus(jobRequestId, currentStatus) {
    const nextStatus = getNextJobProgressStage(currentStatus)
    if (!isValidJobProgressTransition(currentStatus, nextStatus)) {
      return
    }

    setError('')
    setSuccess('')
    setUpdatingJobId(jobRequestId)
    try {
      const updatedJob = await updateBusinessJobStatus(
        business.id,
        jobRequestId,
        nextStatus,
      )
      setItems((current) =>
        current.map((item) =>
          item.job_request_id === jobRequestId
            ? { ...item, ...updatedJob }
            : item,
        ),
      )
      setSuccess(
        nextStatus === 'pending_completion'
          ? 'Job marked as completed. Awaiting customer confirmation.'
          : `Job status updated to ${formatJobProgressStage(nextStatus)}.`,
      )
      notifyBusinessMarketplaceChanged(business.id)
    } catch (updateError) {
      setError(
        formatRequestError(
          'Unable to update this job status. It may no longer be available or the status transition may not be valid.',
          updateError,
        ),
      )
    } finally {
      setUpdatingJobId(null)
    }
  }

  async function handleDeclineOpportunity(jobRequestId) {
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await declineBusinessOpportunity(business.id, jobRequestId)
      setItems((current) =>
        current.filter((item) => item.job_request_id !== jobRequestId),
      )
      if (selectedLead === jobRequestId) setSelectedLead(null)
      if (reviewedLead === jobRequestId) setReviewedLead(null)
      setSuccess(
        'Opportunity declined. It remains available to other eligible providers.',
      )
    } catch (declineError) {
      setError(
        formatRequestError(
          'Unable to decline this opportunity. It may no longer be available.',
          declineError,
        ),
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleWithdrawQuote(quoteId) {
    setError('')
    setSuccess('')
    setWithdrawingQuoteId(quoteId)
    try {
      await withdrawBusinessQuote(business.id, quoteId)
      setItems((current) =>
        current.map((item) =>
          item.quote_id === quoteId
            ? { ...item, quote_status: 'withdrawn' }
            : item,
        ),
      )
      setWithdrawConfirmationId(null)
      setSuccess('Quote withdrawn. It can no longer be accepted or edited.')
    } catch (withdrawError) {
      setError(
        formatRequestError(
          'Unable to withdraw this quote. It may no longer be awaiting a response.',
          withdrawError,
        ),
      )
    } finally {
      setWithdrawingQuoteId(null)
    }
  }

  return {
    content,
    items: visibleItems,
    allItems: items,
    totalItems,
    search,
    urgencyFilter,
    leadOrder,
    quoteStatus,
    quoteOrder,
    jobStatus,
    jobOrder,
    isLoading,
    error,
    success,
    selectedLead,
    reviewedLead,
    quote,
    quoteErrors,
    quoteStep,
    isSaving,
    withdrawConfirmationId,
    withdrawingQuoteId,
    updatingJobId,
    setQuoteField,
    setSearch,
    setUrgencyFilter,
    setLeadOrder,
    setQuoteStatus,
    setQuoteOrder,
    setJobStatus,
    setJobOrder,
    setWithdrawConfirmationId,
    toggleLead,
    toggleLeadReview,
    showLeadReview,
    handleQuoteReview,
    handleQuoteSubmit,
    handleQuoteEdit: () => setQuoteStep('form'),
    handleDeclineOpportunity,
    handleAdvanceJobStatus,
    handleWithdrawQuote,
  }
}
