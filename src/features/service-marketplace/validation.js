import { CITIES, POSTED_DISTANCES, TRADE_CATEGORIES, URGENCY_OPTIONS } from './constants'
import jobtypes from '../../data/jobtypes'

export function validateJobWizardStep(step, draft, suburbOptions) {
  const errors = {}

  if (step === 1) {
    if (!draft.category) errors.category = 'Please select a trade category.'
    else if (!TRADE_CATEGORIES.includes(draft.category))
      errors.category = 'Please choose a valid trade category from the list.'
  }

  if (step === 2) {
    const knownTypes = jobtypes[draft.category] || []
    if (!draft.type) errors.type = 'Please select a job type.'
    else if (!knownTypes.includes(draft.type))
      errors.type = 'Please choose a valid job type from the list.'
    else if (draft.type === 'Other') {
      const otherType = (draft.otherType || '').trim()
      if (!otherType) errors.type = 'Please specify the job type.'
      else if (otherType.length < 3)
        errors.type = 'Please include at least 3 characters in the job type.'
      else if (otherType.length > 30)
        errors.type = 'Job type cannot exceed 30 characters.'
    }
  }

  if (step === 3) {
    const description = draft.description.trim()
    if (!description) errors.description = 'Please enter a job description.'
    else if (description.length < 10)
      errors.description =
        'Please include at least 10 characters in the description.'
    else if (description.length > 400)
      errors.description = 'Description cannot exceed 400 characters.'

    if (!draft.jobDate) errors.jobDate = 'Please select a job date.'
    else if (draft.jobDate < new Date(new Date().toDateString()))
      errors.jobDate = 'Job date cannot be in the past.'

    if (draft.budget && draft.budget.trim().length > 40)
      errors.budget = 'Budget cannot exceed 40 characters.'

    if (!draft.urgency) errors.urgency = 'Please select an urgency level.'
    else if (!URGENCY_OPTIONS.includes(draft.urgency))
      errors.urgency = 'Please choose a valid urgency level.'
  }

  if (step === 4) {
    if (!draft.city) errors.city = 'Please select a city.'
    else if (!CITIES.includes(draft.city))
      errors.city = 'Please choose a valid city from the list.'

    if (!draft.suburb) errors.suburb = 'Please select a suburb.'
    else if (!suburbOptions.map((option) => option.trim()).includes(draft.suburb))
      errors.suburb = 'Please choose a suburb that matches the selected city.'

    if (!draft.postedDistance)
      errors.postedDistance = 'Please select a posted distance.'
  }

  return errors
}

export function validateQuote(amountValue, messageValue) {
  const amount = Number(amountValue)
  if (!Number.isFinite(amount) || amount < 1)
    return 'Enter a valid quote amount.'
  if (messageValue.trim().length < 10)
    return 'Add a quote message of at least 10 characters.'
  return ''
}