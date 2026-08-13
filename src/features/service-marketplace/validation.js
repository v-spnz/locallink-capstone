import {
  CITIES,
  QUOTE_PRICE_TYPES,
  TRADE_CATEGORIES,
  URGENCY_OPTIONS,
  MIN_BUDGET,
  MAX_BUDGET,
} from './constants.js'
import jobtypes from '../../data/jobtypes.js'

export function sanitizeQuoteAmount(value) {
  const numericValue = String(value ?? '').replace(/[^\d.]/g, '')
  const hasDecimal = numericValue.includes('.')
  const [whole = '', ...decimalParts] = numericValue.split('.')
  const decimal = decimalParts.join('').slice(0, 2)
  const limitedWhole = whole.slice(0, 7)

  return hasDecimal ? `${limitedWhole}.${decimal}` : limitedWhole
}

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

    if (draft.minBudget !== null && !MIN_BUDGET.includes(draft.minBudget))
      errors.minBudget = 'Please select a valid minimum budget from the list.'
    else if (draft.maxBudget !== null && !MAX_BUDGET.includes(draft.maxBudget))
      errors.maxBudget = 'Please select a valid maximum budget from the list.'
    else if (
      draft.minBudget !== null &&
      draft.maxBudget !== null &&
      draft.minBudget > draft.maxBudget
    )
      errors.minBudget = 'Minimum budget cannot be higher than maximum budget.'

    if (!draft.urgency) errors.urgency = 'Please select an urgency level.'
    else if (!URGENCY_OPTIONS.includes(draft.urgency))
      errors.urgency = 'Please choose a valid urgency level.'
  }

  if (step === 4) {
    if (!draft.city) errors.city = 'Please select a city.'
    else if (!CITIES.includes(draft.city))
      errors.city = 'Please choose a valid city from the list.'

    if (!draft.suburb) errors.suburb = 'Please select a suburb.'
    else if (
      !suburbOptions.map((option) => option.trim()).includes(draft.suburb)
    )
      errors.suburb = 'Please choose a suburb that matches the selected city.'

    if (!draft.postedDistance)
      errors.postedDistance = 'Please select a posted distance.'
  }

  return errors
}

export function validateQuote(values, today = new Date()) {
  const errors = {}
  const amountText = String(values.amount ?? '')
  const amount = Number(amountText)
  const hasValidCurrencyFormat = /^\d+(\.\d{1,2})?$/.test(amountText)
  const todayValue = new Date(today)
  const localToday = [
    todayValue.getFullYear(),
    String(todayValue.getMonth() + 1).padStart(2, '0'),
    String(todayValue.getDate()).padStart(2, '0'),
  ].join('-')

  if (!QUOTE_PRICE_TYPES.some(({ value }) => value === values.priceType))
    errors.priceType = 'Please select a price type.'
  if (
    !hasValidCurrencyFormat ||
    !Number.isFinite(amount) ||
    amount < 1 ||
    amount > 1000000
  )
    errors.amount = 'Enter a valid quote price between $1 and $1,000,000.'
  if (!values.availability)
    errors.availability = 'Please select an available date.'
  else if (values.availability < localToday)
    errors.availability = 'Availability cannot be in the past.'

  for (const [field, label, maxLength] of [
    ['arrivalWindow', 'arrival window', 120],
    ['includedWork', 'included work', 1000],
    ['conditions', 'conditions', 1000],
    ['expectedDuration', 'expected duration', 120],
  ]) {
    const value = values[field]?.trim() ?? ''
    if (!value) errors[field] = `Please enter the ${label}.`
    else if (value.length > maxLength)
      errors[field] = `${label[0].toUpperCase()}${label.slice(1)} is too long.`
  }

  if (
    values.arrivalStart &&
    values.arrivalEnd &&
    values.arrivalStart >= values.arrivalEnd
  ) {
    errors.arrivalWindow = 'Arrival end time must be after the start time.'
  }

  if ((values.message?.trim() ?? '').length > 1000)
    errors.message = 'Message cannot exceed 1000 characters.'

  return errors
}
