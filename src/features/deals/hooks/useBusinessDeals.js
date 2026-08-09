import { useState } from 'react'
import {
  createBusinessDeal,
  publishBusinessDeal,
  updateBusinessDeal,
} from '../api/businessDeals'
import { validateDeal } from '../validation'

const EMPTY_DEAL = {
  title: '',
  description: '',
  discount: '',
  expiryDate: '',
  status: 'Active',
}

export default function useBusinessDeals() {
  const [form, setForm] = useState(EMPTY_DEAL)
  const [errors, setErrors] = useState({})
  const [deals, setDeals] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [step, setStep] = useState('list')
  const [selectedDealId, setSelectedDealId] = useState(null)
  const [editingDealId, setEditingDealId] = useState(null)

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  function handleReview(event) {
    event.preventDefault()
    setSuccessMessage('')
    const validationErrors = validateDeal(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length === 0) setStep('review')
  }

  function handleConfirmPublish() {
    if (editingDealId) {
      setDeals((previous) =>
        previous.map((deal) =>
          deal.id === editingDealId ? updateBusinessDeal(deal, form) : deal,
        ),
      )
      setSuccessMessage('Deal updated successfully!')
    } else {
      setDeals((previous) => [createBusinessDeal(form), ...previous])
      setSuccessMessage('Deal created successfully!')
    }
    setForm(EMPTY_DEAL)
    setErrors({})
    setEditingDealId(null)
    setStep('list')
  }

  function handleStartNewDeal() {
    setSuccessMessage('')
    setErrors({})
    setEditingDealId(null)
    setForm(EMPTY_DEAL)
    setStep('form')
  }

  function handlePublishDeal(dealId) {
    setDeals((previous) =>
      previous.map((deal) =>
        deal.id === dealId ? publishBusinessDeal(deal) : deal,
      ),
    )
    setSuccessMessage('Deal published successfully!')
  }

  function handleEditDeal(dealId) {
    const deal = deals.find((item) => item.id === dealId)
    if (!deal) return
    setForm({
      title: deal.title,
      description: deal.description,
      discount: deal.discount,
      expiryDate: deal.expiryDate,
      status: deal.status || 'Active',
    })
    setEditingDealId(dealId)
    setErrors({})
    setSuccessMessage('')
    setSelectedDealId(null)
    setStep('form')
  }

  return {
    form,
    errors,
    deals,
    successMessage,
    step,
    selectedDealId,
    editingDealId,
    setField,
    handleReview,
    handleConfirmPublish,
    handleStartNewDeal,
    handlePublishDeal,
    handleEditDeal,
    handleSelectDeal: (dealId) =>
      setSelectedDealId((current) => (current === dealId ? null : dealId)),
    handleCloseDetails: () => setSelectedDealId(null),
    handleBackToEdit: () => setStep('form'),
    handleBackToList: () => setStep('list'),
  }
}
