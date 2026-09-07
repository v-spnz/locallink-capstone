import { useCallback, useEffect, useRef, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import { fetchBusinessDeals, saveBusinessDeal } from '../api/businessDeals'
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
  const [successMessage, setSuccessMessage] = useState('')
  const [requestError, setRequestError] = useState('')
  const [step, setStep] = useState('list')
  const [selectedDealId, setSelectedDealId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveInProgressRef = useRef(false)

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
    setSuccessMessage('')
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
      setSuccessMessage(
        status === 'published'
          ? `Deal published successfully. Status: ${lifecycle.label}.`
          : 'Deal saved as a private draft.',
      )
      setStep('list')
      return true
    } catch (error) {
      console.error('Unable to save deal.', error)
      setRequestError(
        status === 'published'
          ? 'Unable to publish the deal. Check every highlighted field and try again.'
          : 'Unable to save this draft. Please try again.',
      )
      return false
    } finally {
      saveInProgressRef.current = false
      setIsSaving(false)
    }
  }

  function handleReview(event) {
    event.preventDefault()
    setSuccessMessage('')
    setRequestError('')
    const validationErrors = validateDeal(form, { forPublication: true })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0) setStep('review')
  }

  function handleStartNewDeal() {
    setSuccessMessage('')
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
    setSuccessMessage('')
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
    setRequestError('')
    setStep('list')
  }

  return {
    form,
    errors,
    deals,
    locations,
    successMessage,
    requestError,
    step,
    selectedDealId,
    editingDealId: form.id,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    setField,
    setImage,
    handleReview,
    handleSaveDraft: () => persist('draft'),
    handleConfirmPublish: () => persist('published'),
    handleStartNewDeal,
    handleEditDeal,
    handleSelectDeal: (dealId) =>
      setSelectedDealId((current) => (current === dealId ? null : dealId)),
    handleCloseDetails: () => setSelectedDealId(null),
    handleBackToEdit: () => setStep('form'),
    handleBackToList,
    reload: loadDeals,
  }
}
