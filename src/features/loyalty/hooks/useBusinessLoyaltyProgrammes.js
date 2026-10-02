import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useBusiness from '../../../business/useBusiness'
import useUnsavedBusinessDraftGuard from '../../../business/useUnsavedBusinessDraftGuard'
import {
  cancelBusinessLoyaltySchedule,
  deleteBusinessLoyaltyDraft,
  endBusinessLoyaltyProgramme,
  fetchBusinessLoyaltyProgrammes,
  fetchBusinessLoyaltyEndSummary,
  saveBusinessLoyaltyProgramme,
} from '../api/businessLoyalty'
import {
  getProgrammeAvailability,
  LOYALTY_STATUS_FILTERS,
  matchesLoyaltyStatusFilter,
} from '../businessLoyaltyTemplates'
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
  imageUrl: '',
  imageFile: null,
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
  const navigate = useNavigate()
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
  const [busyProgrammeId, setBusyProgrammeId] = useState(null)
  const saveInProgressRef = useRef(false)
  const {
    setHasUnsavedChanges,
    isLeaveConfirmationOpen,
    requestLeave,
    cancelLeave,
    discardAndLeave,
    saveDraftAndLeave,
  } = useUnsavedBusinessDraftGuard({
    isActive: step !== 'list',
    navigate,
    onSaveDraft: () => persist('draft'),
  })

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

  function setImage(file) {
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        image: 'Choose a JPG, PNG, or WebP image.',
      }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        image: 'Choose an image smaller than 5 MB.',
      }))
      return
    }

    setForm((current) => ({
      ...current,
      imageFile: file,
      imageUrl: '',
    }))
    setErrors((current) => ({ ...current, image: '' }))
    setHasUnsavedChanges(true)
  }

  function removeImage() {
    setForm((current) => ({
      ...current,
      imageFile: null,
      imageUrl: '',
    }))
    setErrors((current) => ({ ...current, image: '' }))
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

  async function runLifecycleAction(programmeId, action, successMessage) {
    if (busyProgrammeId) return false
    setBusyProgrammeId(programmeId)
    setRequestError('')
    setFeedback(null)
    try {
      const result = await action()
      await loadProgrammes()
      setFeedback({ variant: 'success', message: successMessage(result) })
      return result
    } catch (error) {
      console.error('Unable to update loyalty programme.', error)
      const message = 'Unable to update this programme. Please try again.'
      setRequestError(message)
      setFeedback({ variant: 'error', message })
      return false
    } finally {
      setBusyProgrammeId(null)
    }
  }

  function handleDeleteDraft(programmeId) {
    return runLifecycleAction(
      programmeId,
      () => deleteBusinessLoyaltyDraft(programmeId, business.id),
      () => 'Draft deleted.',
    )
  }

  function handleCancelSchedule(programmeId) {
    return runLifecycleAction(
      programmeId,
      () => cancelBusinessLoyaltySchedule(programmeId, business.id),
      () => 'Scheduled publication cancelled. The programme is now a draft.',
    )
  }

  function handleGetEndSummary(programmeId) {
    return fetchBusinessLoyaltyEndSummary(programmeId, business.id)
  }

  function handleEndProgramme(programmeId) {
    return runLifecycleAction(
      programmeId,
      () => endBusinessLoyaltyProgramme(programmeId, business.id),
      (result) =>
        result.customerCount > 0
          ? `Programme ended. ${result.notificationsCreated} ${result.notificationsCreated === 1 ? 'customer was' : 'customers were'} notified.`
          : 'Programme ended. There were no existing customers to notify.',
    )
  }

  function leaveToList() {
    setHasUnsavedChanges(false)
    setErrors({})
    setRequestError('')
    setReviewAttempted(false)
    setStep('list')
  }

  function handleBackToList() {
    requestLeave(leaveToList)
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

    try {
      const programmeForSave = form.id
        ? form
        : {
            ...form,
            id:
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `local-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          }
      if (!form.id) setForm(programmeForSave)

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
      setActiveStatus(
        status === 'draft' ? 'draft' : getProgrammeAvailability(saved).value,
      )
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

  const programmeRecords = programmes.map((programme) => ({
    programme,
    availability: getProgrammeAvailability(programme),
  }))
  const programmeCounts = Object.fromEntries(
    LOYALTY_STATUS_FILTERS.map(({ value }) => [
      value,
      programmeRecords.filter(({ availability }) =>
        matchesLoyaltyStatusFilter(availability.value, value),
      ).length,
    ]),
  )
  const visibleProgrammes = programmeRecords
    .filter(({ availability }) =>
      matchesLoyaltyStatusFilter(availability.value, activeStatus),
    )
    .map(({ programme }) => programme)

  return {
    programmes,
    visibleProgrammes,
    programmeCounts,
    businessName: business.business_name || 'Your business',
    form,
    errors,
    feedback,
    requestError,
    step,
    activeStatus,
    reviewAttempted,
    isLoading,
    isSaving,
    busyProgrammeId,
    isLeaveConfirmationOpen,
    loadProgrammes,
    setField,
    setImage,
    removeImage,
    setActiveStatus,
    handleReview,
    handleStartNewProgramme,
    handleEditProgramme,
    handleDeleteDraft,
    handleCancelSchedule,
    handleGetEndSummary,
    handleEndProgramme,
    handleBackToList,
    cancelLeave,
    discardAndLeave,
    saveDraftAndLeave,
    handleBackToEdit,
    handleSaveDraft,
    handleConfirmPublish: () => persist('published'),
    dismissFeedback: () => setFeedback(null),
  }
}
