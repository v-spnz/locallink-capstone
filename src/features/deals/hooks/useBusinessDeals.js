import { useCallback, useEffect, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import { fetchBusinessDeals, saveBusinessDeal } from '../api/businessDeals'
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
  gstIncluded: '',
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

  function toggleLocation(locationId) {
    setForm((current) => ({
      ...current,
      locationIds: current.locationIds.includes(locationId)
        ? current.locationIds.filter((id) => id !== locationId)
        : [...current.locationIds, locationId],
    }))
    setErrors((current) => ({ ...current, locationIds: '' }))
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
    const validationErrors = validateDeal(form, {
      forPublication: status === 'published',
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      if (status === 'published') setStep('form')
      return false
    }

    setIsSaving(true)
    setRequestError('')
    setSuccessMessage('')
    try {
      const saved = await saveBusinessDeal({
        businessId: business.id,
        deal: form,
        status,
      })
      setDeals((current) => [
        saved,
        ...current.filter((deal) => deal.id !== saved.id),
      ])
      setForm(saved)
      setHasUnsavedChanges(false)
      setSuccessMessage(
        status === 'published'
          ? 'Deal published successfully.'
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
    setForm(newDeal())
    setHasUnsavedChanges(false)
    setStep('form')
  }

  function handleEditDeal(dealId) {
    const deal = deals.find((item) => item.id === dealId)
    if (!deal) return
    setForm({ ...deal, locationIds: [...deal.locationIds], imageFile: null })
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
    toggleLocation,
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
