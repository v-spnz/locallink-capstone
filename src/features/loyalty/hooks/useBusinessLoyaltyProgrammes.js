import { useCallback, useEffect, useRef, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import {
  fetchBusinessLoyaltyProgrammes,
  saveBusinessLoyaltyProgramme,
} from '../api/businessLoyalty'
import { validateLoyaltyProgramme } from '../businessLoyaltyValidation'

export const EMPTY_LOYALTY_PROGRAMME = {
  id: null,
  name: '',
  programmeType: '',
  rewardDescription: '',
  rewardThreshold: '',
  rewardValue: '',
  earningRules: '',
  terms: '',
  startDate: '',
  endDate: '',
  status: 'draft',
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
}

function newProgramme() {
  return { ...EMPTY_LOYALTY_PROGRAMME }
}

export default function useBusinessLoyaltyProgrammes() {
  const { business } = useBusiness()
  const [programmes, setProgrammes] = useState([])
  const [form, setForm] = useState(newProgramme)
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [requestError, setRequestError] = useState('')
  const [step, setStep] = useState('list')
  const [activeStatus, setActiveStatus] = useState('draft')
  const [reviewAttempted, setReviewAttempted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const saveInProgressRef = useRef(false)

  const loadProgrammes = useCallback(async () => {
    setIsLoading(true)
    setRequestError('')

    try {
      const data = await fetchBusinessLoyaltyProgrammes(business.id)
      setProgrammes(data)
    } catch (error) {
      console.error('Unable to load loyalty programmes.', error)
      setRequestError(
        'Unable to load your loyalty programmes. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [business.id])

  useEffect(() => {
    const loadTimer = window.setTimeout(loadProgrammes, 0)
    return () => window.clearTimeout(loadTimer)
  }, [loadProgrammes])

  useEffect(() => {
    if (!hasUnsavedChanges || step === 'list') return undefined

    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function warnBeforeInternalNavigation(event) {
      const link = event.target.closest?.('a[href]')
      if (
        !link ||
        window.confirm('Leave without saving your loyalty programme draft?')
      )
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
    setForm((current) =>
      field === 'programmeType' && current.programmeType !== value
        ? {
            ...current,
            programmeType: value,
            rewardDescription: '',
            rewardValue: '',
          }
        : { ...current, [field]: value },
    )
    setErrors((current) =>
      field === 'programmeType'
        ? {
            ...current,
            programmeType: '',
            rewardDescription: '',
            rewardValue: '',
          }
        : { ...current, [field]: '' },
    )
    setHasUnsavedChanges(true)
  }

  function handleStartNewProgramme() {
    setForm(newProgramme())
    setErrors({})
    setFeedback(null)
    setRequestError('')
    setReviewAttempted(false)
    setHasUnsavedChanges(false)
    setStep('form')
  }

  function handleEditProgramme(programmeId) {
    const programme = programmes.find((item) => item.id === programmeId)
    if (!programme) return

    setForm({ ...programme })
    setErrors({})
    setFeedback(null)
    setRequestError('')
    setReviewAttempted(false)
    setHasUnsavedChanges(false)
    setStep('form')
  }

  function handleBackToList() {
    if (
      hasUnsavedChanges &&
      !window.confirm('Leave without saving your loyalty programme draft?')
    )
      return

    setHasUnsavedChanges(false)
    setErrors({})
    setRequestError('')
    setReviewAttempted(false)
    setStep('list')
  }

  async function persist(status) {
    if (saveInProgressRef.current) return

    const validationErrors = validateLoyaltyProgramme(form, {
      forPublication: status === 'published',
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      if (status === 'published') {
        setReviewAttempted(true)
        setStep('form')
      }
      return false
    }

    saveInProgressRef.current = true
    setIsSaving(true)
    setRequestError('')
    setFeedback(null)

    const programmeForSave = form.id
      ? form
      : { ...form, id: crypto.randomUUID() }
    if (!form.id) setForm(programmeForSave)

    try {
      const saved = await saveBusinessLoyaltyProgramme({
        businessId: business.id,
        programme: programmeForSave,
        status,
      })
      setProgrammes((current) => [
        saved,
        ...current.filter((programme) => programme.id !== saved.id),
      ])
      setForm(saved)
      setHasUnsavedChanges(false)
      setReviewAttempted(false)
      setActiveStatus(status === 'draft' ? 'draft' : 'published')
      setFeedback({
        variant: 'success',
        message:
          status === 'published'
            ? `Loyalty programme published. Status: ${saved.status === 'scheduled' ? 'Scheduled' : 'Active'}.`
            : 'Programme saved as draft.',
      })
      setStep('list')
      return true
    } catch (error) {
      console.error(
        status === 'published'
          ? 'Unable to publish loyalty programme.'
          : 'Unable to save loyalty programme.',
        error,
      )
      const message =
        status === 'published'
          ? 'Unable to publish this programme. Check the details and try again.'
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
    setReviewAttempted(true)

    const validationErrors = validateLoyaltyProgramme(form, {
      forPublication: true,
    })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0) setStep('review')
  }

  function handleSaveDraft(event) {
    event.preventDefault()
    return persist('draft')
  }

  function handleBackToEdit() {
    setRequestError('')
    setStep('form')
  }

  const programmeCounts = {
    draft: programmes.filter((programme) => programme.status === 'draft')
      .length,
    published: programmes.filter((programme) => programme.status !== 'draft')
      .length,
  }

  const visibleProgrammes = programmes.filter((programme) =>
    activeStatus === 'draft'
      ? programme.status === 'draft'
      : programme.status !== 'draft',
  )

  return {
    programmes,
    visibleProgrammes,
    programmeCounts,
    form,
    errors,
    feedback,
    requestError,
    step,
    activeStatus,
    reviewAttempted,
    isLoading,
    isSaving,
    loadProgrammes,
    setField,
    setActiveStatus,
    handleReview,
    handleStartNewProgramme,
    handleEditProgramme,
    handleBackToList,
    handleBackToEdit,
    handleSaveDraft,
    handleConfirmPublish: () => persist('published'),
    dismissFeedback: () => setFeedback(null),
  }
}
