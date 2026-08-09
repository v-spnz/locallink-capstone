import { useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  completeBusinessJob,
  fetchBusinessMarketplaceItems,
  submitBusinessQuote,
} from '../api/businessJobs'
import { MARKETPLACE_PAGE_CONTENT } from '../constants'
import { validateQuote } from '../validation'

export default function useBusinessMarketplace(type) {
  const content = MARKETPLACE_PAGE_CONTENT[type]
  const { business } = useBusiness()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteMessage, setQuoteMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    async function loadItems() {
      setIsLoading(true)
      setError('')
      try {
        const nextItems = await fetchBusinessMarketplaceItems(type, business.id)
        if (active) setItems(nextItems)
      } catch {
        if (active) setError(`Unable to load ${content.title.toLowerCase()}.`)
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
  }

  async function handleQuoteSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    const validationError = validateQuote(quoteAmount, quoteMessage)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    try {
      await submitBusinessQuote({
        businessId: business.id,
        jobRequestId: selectedLead,
        amount: quoteAmount,
        message: quoteMessage,
      })
      setSuccess('Quote submitted. The customer can now review it.')
      setSelectedLead(null)
      setQuoteAmount('')
      setQuoteMessage('')
      setReloadKey((current) => current + 1)
    } catch {
      setError('Unable to submit this quote. The lead may no longer be open.')
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
    items,
    isLoading,
    error,
    success,
    selectedLead,
    quoteAmount,
    quoteMessage,
    isSaving,
    setQuoteAmount,
    setQuoteMessage,
    toggleLead,
    handleQuoteSubmit,
    handleCompleteJob,
  }
}
