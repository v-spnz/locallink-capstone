import { useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  completeBusinessJob,
  declineBusinessOpportunity,
  fetchBusinessMarketplaceItems,
  submitBusinessQuote,
  withdrawBusinessQuote,
} from '../api/businessJobs'
import {
  formatQuoteArrivalWindow,
  MARKETPLACE_PAGE_CONTENT,
} from '../constants'
import { formatRequestError } from '../formatters'
import { filterAndSortLeads } from '../leadFilters'
import {
  notifyBusinessMarketplaceChanged,
  subscribeToBusinessMarketplaceChanges,
} from '../marketplaceEvents'
import { filterBusinessQuotes } from '../quoteTracking'
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
  const [quoteStatus, setQuoteStatus] = useState('all')
  const [withdrawConfirmationId, setWithdrawConfirmationId] = useState(null)
  const [withdrawingQuoteId, setWithdrawingQuoteId] = useState(null)

  const visibleItems =
    type === 'leads'
      ? filterAndSortLeads(items, { search, urgency: urgencyFilter })
      : type === 'quotes'
        ? filterBusinessQuotes(items, quoteStatus)
        : items
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
    setSelectedLead((current) =>
      current === jobRequestId ? null : jobRequestId,
    )
    setError('')
    setSuccess('')
    setQuote(EMPTY_QUOTE)
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

  async function handleCompleteJob(jobRequestId) {
    setError('')
    setSuccess('')
    setIsSaving(true)
    try {
      await completeBusinessJob(business.id, jobRequestId)
      setSuccess('Job marked as completed for you and the customer.')
      setReloadKey((current) => current + 1)
    } catch {
      setError('Unable to update this job.')
    } finally {
      setIsSaving(false)
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
    quoteStatus,
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
    setQuoteField,
    setSearch,
    setUrgencyFilter,
    setQuoteStatus,
    setWithdrawConfirmationId,
    toggleLead,
    toggleLeadReview,
    showLeadReview,
    handleQuoteReview,
    handleQuoteSubmit,
    handleQuoteEdit: () => setQuoteStep('form'),
    handleDeclineOpportunity,
    handleCompleteJob,
    handleWithdrawQuote,
  }
}
