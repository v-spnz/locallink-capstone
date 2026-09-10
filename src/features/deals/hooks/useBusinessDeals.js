import { useCallback, useEffect, useRef, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  deleteBusinessDeal,
  endBusinessDeal,
  fetchBusinessDealEndSummary,
  fetchBusinessDeals,
  saveBusinessDeal,
} from '../api/businessDeals'
import { getDealLifecycle } from '../constants'
import { validateDeal } from '../validation'

export const EMPTY_DEAL = {
  id: null,
  title: '',
  description: '',
  category: '',
  imageUrl: '',
  imageFile: null,
  offerType: '',
  discountPercentage: '',
  discountAmount: '',
  originalPrice: '',
  dealPrice: '',
  offerDetails: '',
  gstIncluded: 'included',
  locationIds: [],
  startDate: '',
  endDate: '',
  conditions: '',
  claimLimit: '',
  exclusions: '',
  redemptionInstructions: '',
  status: 'draft',
  endedAt: null,
}

function newDeal() {
  return { ...EMPTY_DEAL, locationIds: [] }
}

export default function useBusinessDeals() {
  const { business } = useBusiness()
  const [form, setForm] = useState(newDeal)
  const [errors, setErrors] = useState({})
  const [deals, setDeals] = useState([])
  const [locations, setLocations] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [requestError, setRequestError] = useState('')
  const [step, setStep] = useState('list')
  const [selectedDealId, setSelectedDealId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [endingDealId, setEndingDealId] = useState(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [deleteConfirmationId, setDeleteConfirmationId] = useState(null)
  const [deletingDealId, setDeletingDealId] = useState(null)
  const [cancelingDealId, setCancelingDealId] = useState(null)
  const saveInProgressRef = useRef(false)
  const endInProgressRef = useRef(false)

  const loadDeals = useCallback(async () => {
    setIsLoading(true)
    setRequestError('')
    try {
      const data = await fetchBusinessDeals(business.id)
      setDeals(data.deals)
      setLocations(data.locations)
    } catch (error) {
      console.error('Unable to load deals.', error)
      setRequestError('Unable to load your deals. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    const loadTimer = window.setTimeout(loadDeals, 0)
    return () => window.clearTimeout(loadTimer)
  }, [loadDeals])

  useEffect(() => {
    if (!hasUnsavedChanges || step === 'list') return undefined

    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function warnBeforeInternalNavigation(event) {
      const link = event.target.closest?.('a[href]')
      if (!link || window.confirm('Leave without saving your deal draft?'))
        return
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', warnBeforeInternalNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', warnBeforeInternalNavigation, true)
    }
  }, [hasUnsavedChanges, step])

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
    setHasUnsavedChanges(true)
  }

  function setImage(file) {
    setForm((current) => ({
      ...current,
      imageFile: file,
      imageUrl: file ? '' : current.imageUrl,
    }))
    setErrors((current) => ({ ...current, image: '' }))
    setHasUnsavedChanges(true)
  }

  async function persist(status) {
    if (saveInProgressRef.current) return false

    const validationErrors = validateDeal(form, {
      forPublication: status === 'published',
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      if (status === 'published') setStep('form')
      return false
    }

    saveInProgressRef.current = true
    setIsSaving(true)
    setRequestError('')
    setFeedback(null)
    const dealForSave = form.id ? form : { ...form, id: crypto.randomUUID() }
    if (!form.id) setForm(dealForSave)
    try {
      const saved = await saveBusinessDeal({
        businessId: business.id,
        deal: dealForSave,
        status,
      })
      setDeals((current) => [
        saved,
        ...current.filter((deal) => deal.id !== saved.id),
      ])
      setForm(saved)
      setHasUnsavedChanges(false)
      const lifecycle = getDealLifecycle(saved)
      setFeedback({
        variant: 'success',
        message:
          status === 'published'
            ? `Deal published. Status: ${lifecycle.label}.`
            : 'Deal saved as draft.',
      })
      setStep('list')
      return true
    } catch (error) {
      console.error('Unable to save deal.', error)
      const message =
        status === 'published'
          ? 'Unable to publish the deal. Check every highlighted field and try again.'
          : 'Unable to save this draft. Please try again.'
      setRequestError(message)
      setFeedback({ variant: 'error', message })
      return false
    } finally {
      saveInProgressRef.current = false
      setIsSaving(false)
    }
  }

  function handleReview(event) {
    event.preventDefault()
    setFeedback(null)
    setRequestError('')
    const validationErrors = validateDeal(form, { forPublication: true })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0) setStep('review')
  }

  function handleStartNewDeal() {
    setFeedback(null)
    setRequestError('')
    setErrors({})
    setForm({
      ...newDeal(),
      locationIds: locations[0]?.id ? [locations[0].id] : [],
    })
    setHasUnsavedChanges(false)
    setStep('form')
  }

  function handleEditDeal(dealId) {
    const deal = deals.find((item) => item.id === dealId)
    if (!deal) return
    setForm({
      ...deal,
      locationIds: locations[0]?.id ? [locations[0].id] : [],
      imageFile: null,
    })
    setErrors({})
    setFeedback(null)
    setRequestError('')
    setSelectedDealId(null)
    setHasUnsavedChanges(false)
    setStep('form')
  }

  function handleBackToList() {
    if (
      hasUnsavedChanges &&
      !window.confirm('Leave without saving your deal draft?')
    )
      return
    setHasUnsavedChanges(false)
    setErrors({})
    setFeedback(null)
    setRequestError('')
    setStep('list')
  }

  async function handleDeleteDraft(dealId) {
    setRequestError('')
    setFeedback(null)
    setDeletingDealId(dealId)
    try {
      await deleteBusinessDeal(business.id, dealId)
      setDeals((current) => current.filter((deal) => deal.id !== dealId))
      setDeleteConfirmationId(null)
      setSelectedDealId((current) => (current === dealId ? null : current))
      setFeedback({
        variant: 'success',
        message: 'Draft deleted.',
      })
    } catch (error) {
      console.error('Unable to delete draft.', error)
      setRequestError('Unable to delete this draft. Please try again.')
    } finally {
      setDeletingDealId(null)
    }
  }

  async function handleCancelScheduledPublication(dealId) {
    const deal = deals.find((item) => item.id === dealId)
    if (!deal) return

    setRequestError('')
    setFeedback(null)
    setCancelingDealId(dealId)
    try {
      const saved = await saveBusinessDeal({
        businessId: business.id,
        deal,
        status: 'draft',
      })
      setDeals((current) =>
        current.map((item) => (item.id === saved.id ? saved : item)),
      )
      setFeedback({
        variant: 'success',
        message: 'Scheduled publication cancelled. The deal is now a draft.',
      })
    } catch (error) {
      console.error('Unable to cancel scheduled publication.', error)
      setRequestError('Unable to cancel this scheduled deal. Please try again.')
    } finally {
      setCancelingDealId(null)
    }
  }
  async function handleEndDeal(dealId) {
    if (endInProgressRef.current) return false

    endInProgressRef.current = true
    setEndingDealId(dealId)
    setRequestError('')
    setFeedback(null)
    try {
      const result = await endBusinessDeal(dealId, business.id)
      setDeals((current) =>
        current.map((deal) => (deal.id === dealId ? result.deal : deal)),
      )
      setFeedback({
        variant: 'success',
        message:
          result.claimCount > 0
            ? `Deal ended early. ${result.claimCount} existing ${result.claimCount === 1 ? 'claim remains' : 'claims remain'} redeemable and ${result.notificationsCreated} ${result.notificationsCreated === 1 ? 'customer was' : 'customers were'} notified.`
            : 'Deal ended early. New claims are no longer available.',
      })
      return true
    } catch (error) {
      console.error('Unable to end deal.', error)
      const message = 'Unable to end this deal right now. Please try again.'
      setRequestError(message)
      setFeedback({ variant: 'error', message })
      return false
    } finally {
      endInProgressRef.current = false
      setEndingDealId(null)
    }
  }

  return {
    form,
    errors,
    deals,
    locations,
    feedback,
    requestError,
    step,
    selectedDealId,
    editingDealId: form.id,
    isLoading,
    isSaving,
    endingDealId,
    hasUnsavedChanges,
    deleteConfirmationId,
    deletingDealId,
    cancelingDealId,
    setField,
    setImage,
    setDeleteConfirmationId,
    handleReview,
    handleSaveDraft: () => persist('draft'),
    handleConfirmPublish: () => persist('published'),
    handleStartNewDeal,
    handleEditDeal,
    handleGetEndSummary: fetchBusinessDealEndSummary,
    handleEndDeal,
    handleSelectDeal: (dealId) =>
      setSelectedDealId((current) => (current === dealId ? null : dealId)),
    handleCloseDetails: () => setSelectedDealId(null),
    handleBackToEdit: () => setStep('form'),
    handleBackToList,
    handleDeleteDraft,
    handleCancelScheduledPublication,
    dismissFeedback: () => setFeedback(null),
    reload: loadDeals,
  }
}
