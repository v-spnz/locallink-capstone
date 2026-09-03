import { DEAL_CATEGORIES, DEAL_OFFER_TYPES } from './constants.js'

export function sanitizeDealMoney(value) {
  const cleaned = String(value ?? '').replace(/[^\d.]/g, '')
  const [whole = '', ...decimalParts] = cleaned.split('.')
  const decimal = decimalParts.join('').slice(0, 2)
  return cleaned.includes('.')
    ? `${whole.slice(0, 7)}.${decimal}`
    : whole.slice(0, 7)
}

export function sanitizeDealPercentage(value) {
  const cleaned = sanitizeDealMoney(value)
  return Number(cleaned) > 100 ? '100' : cleaned
}

export function sanitizeClaimLimit(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 7)
}

function isValidMoney(value) {
  return /^\d+(\.\d{1,2})?$/.test(String(value)) && Number(value) > 0
}

function requireText(errors, deal, field, label, minimum, maximum) {
  const value = String(deal[field] ?? '').trim()
  if (!value) errors[field] = `${label} is required.`
  else if (value.length < minimum)
    errors[field] = `${label} must be at least ${minimum} characters.`
  else if (value.length > maximum)
    errors[field] = `${label} cannot exceed ${maximum} characters.`
}

export function validateDeal(deal, { forPublication = false } = {}) {
  const errors = {}
  const offerTypes = DEAL_OFFER_TYPES.map(({ value }) => value)

  for (const [field, label, minimum, maximum] of [
    ['title', 'Deal title', 3, 120],
    ['description', 'Description', 10, 1000],
  ]) {
    if (forPublication) {
      requireText(errors, deal, field, label, minimum, maximum)
    } else {
      const value = String(deal[field] ?? '').trim()
      if (value && (value.length < minimum || value.length > maximum))
        errors[field] =
          `${label} must be between ${minimum} and ${maximum} characters.`
    }
  }

  if (forPublication && !deal.category)
    errors.category = 'Select a deal category.'
  else if (deal.category && !DEAL_CATEGORIES.includes(deal.category))
    errors.category = 'Select a valid deal category.'

  if (forPublication && !deal.imageFile && !deal.imageUrl)
    errors.image = 'Add the agreed deal image.'
  if (deal.imageFile) {
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(deal.imageFile.type)
    )
      errors.image = 'Use a JPG, PNG, or WebP image.'
    else if (deal.imageFile.size > 5 * 1024 * 1024)
      errors.image = 'The deal image must be 5 MB or smaller.'
  }

  if (forPublication && !deal.offerType)
    errors.offerType = 'Select an offer type.'
  else if (deal.offerType && !offerTypes.includes(deal.offerType))
    errors.offerType = 'Select a valid offer type.'

  if (deal.offerType === 'percentage_discount') {
    if (forPublication && !deal.discountPercentage)
      errors.discountPercentage = 'Enter the discount percentage.'
    else if (
      deal.discountPercentage &&
      (!isValidMoney(deal.discountPercentage) ||
        Number(deal.discountPercentage) > 100)
    )
      errors.discountPercentage =
        'Enter a percentage greater than 0 and no more than 100.'
  }

  if (deal.offerType === 'fixed_discount') {
    if (forPublication && !deal.discountAmount)
      errors.discountAmount = 'Enter the discount amount.'
    else if (deal.discountAmount && !isValidMoney(deal.discountAmount))
      errors.discountAmount = 'Enter a valid discount amount greater than $0.'
  }

  if (deal.offerType === 'special_price') {
    if (forPublication && !deal.originalPrice)
      errors.originalPrice = 'Enter the original price.'
    else if (deal.originalPrice && !isValidMoney(deal.originalPrice))
      errors.originalPrice = 'Enter a valid original price greater than $0.'

    if (forPublication && !deal.dealPrice)
      errors.dealPrice = 'Enter the deal price.'
    else if (deal.dealPrice && !isValidMoney(deal.dealPrice))
      errors.dealPrice = 'Enter a valid deal price greater than $0.'
    else if (
      deal.originalPrice &&
      deal.dealPrice &&
      Number(deal.dealPrice) >= Number(deal.originalPrice)
    )
      errors.dealPrice = 'The deal price must be lower than the original price.'
  }

  if (['buy_one_get_one', 'other'].includes(deal.offerType)) {
    const details = String(deal.offerDetails ?? '').trim()
    if (forPublication && !details) errors.offerDetails = 'Describe the offer.'
    else if (details && (details.length < 2 || details.length > 300))
      errors.offerDetails =
        'Offer details must be between 2 and 300 characters.'
  }

  if (forPublication && (!deal.locationIds || deal.locationIds.length === 0))
    errors.locationIds = 'Add a business address before publishing.'

  if (forPublication && !deal.startDate)
    errors.startDate = 'Select a start date.'
  if (forPublication && !deal.endDate) errors.endDate = 'Select an end date.'
  if (deal.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(deal.startDate))
    errors.startDate = 'Enter a valid start date.'
  if (deal.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(deal.endDate))
    errors.endDate = 'Enter a valid end date.'
  else if (deal.startDate && deal.endDate && deal.endDate < deal.startDate)
    errors.endDate = 'End date cannot be earlier than the start date.'

  if (forPublication && !deal.claimLimit)
    errors.claimLimit = 'Enter the maximum number of claims.'
  else if (
    deal.claimLimit &&
    (!/^\d+$/.test(String(deal.claimLimit)) ||
      Number(deal.claimLimit) < 1 ||
      Number(deal.claimLimit) > 1000000)
  )
    errors.claimLimit =
      'Enter a whole-number claim limit between 1 and 1,000,000.'

  for (const [field, label] of [
    ['conditions', 'Conditions'],
    ['exclusions', 'Exclusions'],
  ]) {
    if (String(deal[field] ?? '').length > 1000)
      errors[field] = `${label} cannot exceed 1,000 characters.`
  }

  if (forPublication)
    requireText(
      errors,
      deal,
      'redemptionInstructions',
      'Redemption instructions',
      3,
      1000,
    )
  else if (
    deal.redemptionInstructions &&
    (deal.redemptionInstructions.trim().length < 3 ||
      deal.redemptionInstructions.length > 1000)
  )
    errors.redemptionInstructions =
      'Redemption instructions must be between 3 and 1,000 characters.'

  return errors
}
