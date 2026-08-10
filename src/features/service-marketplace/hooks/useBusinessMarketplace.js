import { useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  completeBusinessJob,
  fetchBusinessMarketplaceItems,
  submitBusinessQuote,
} from '../api/businessJobs'
import { MARKETPLACE_PAGE_CONTENT } from '../constants'
import { formatRequestError } from '../formatters'
import { filterAndSortLeads } from '../leadFilters'
import { validateQuote } from '../validation'

export const EMPTY_QUOTE = {
  priceType: '',
  amount: '',
  availability: '',
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
  const [quote, setQuote] = useState(EMPTY_QUOTE)
  const [quoteErrors, setQuoteErrors] = useState({})
  const [quoteStep, setQuoteStep] = useState('form')
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  const visibleItems =
    type === 'leads' ? filterAndSortLeads(items, { search, sort }) : items
  const totalItems =
    type === 'leads' ? filterAndSortLeads(items).length : items.length

  useEffect(() => {
    let active = true

    async function loadItems() {
      setIsLoading(true)
      setError('')
      setSuccess('')
      setSelectedLead(null)
      try {
        const nextItems = await fetchBusinessMarketplaceItems(type, business.id)
        if (active) {
          setItems(nextItems)
          setError('')
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

  function setQuoteField(field, value) {
    setQuote((current) => ({ ...current, [field]: value }))
    setQuoteErrors((current) => ({ ...current, [field]: '' }))
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
      setQuote(EMPTY_QUOTE)
      setQuoteErrors({})
      setQuoteStep('form')
      setReloadKey((current) => current + 1)
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

  return {
    content,
    items: visibleItems,
    totalItems,
    search,
    sort,
    isLoading,
    error,
    success,
    selectedLead,
    quote,
    quoteErrors,
    quoteStep,
    isSaving,
    setQuoteField,
    setSearch,
    setSort,
    toggleLead,
    handleQuoteReview,
    handleQuoteSubmit,
    handleQuoteEdit: () => setQuoteStep('form'),
    handleCompleteJob,
  }
}
