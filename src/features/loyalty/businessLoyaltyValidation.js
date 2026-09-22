const MAX_REWARD_THRESHOLD = 1_000_000
const TEMPLATE_TYPES = ['stamp_card', 'spend_and_save', 'spend_and_reward']

export function getAucklandToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const valueFor = (type) => parts.find((part) => part.type === type)?.value
  return `${valueFor('year')}-${valueFor('month')}-${valueFor('day')}`
}

export function sanitizeRewardThreshold(value) {
  return String(value ?? '')
    .replace(/[^\d.]/g, '')
    .replace(/(\..*)\./g, '$1')
    .replace(/^(\d{0,7})(?:\.(\d{0,2}))?.*$/, (_, whole, cents) =>
      cents === undefined ? whole : `${whole}.${cents}`,
    )
}

function requireText(errors, programme, field, label, minimum, maximum) {
  const value = String(programme[field] ?? '').trim()

  if (!value) errors[field] = `${label} is required.`
  else if (value.length < minimum)
    errors[field] = `${label} must be at least ${minimum} characters.`
  else if (value.length > maximum)
    errors[field] = `${label} cannot exceed ${maximum} characters.`
}

export function validateLoyaltyProgramme(
  programme,
  { forPublication = false } = {},
) {
  const errors = {}
  const name = String(programme.name ?? '').trim()
  const rewardDescription = String(programme.rewardDescription ?? '').trim()
  const terms = String(programme.terms ?? '').trim()
  const rewardThreshold = Number(programme.rewardThreshold)
  const rewardValue = Number(programme.rewardValue)
  const type = programme.programmeType

  if (forPublication) {
    requireText(errors, programme, 'name', 'Programme name', 3, 120)
  } else if (name && (name.length < 3 || name.length > 120)) {
    errors.name = 'Use between 3 and 120 characters.'
  }

  if (forPublication && !programme.programmeType) {
    errors.programmeType = 'Choose how customers earn.'
  } else if (
    programme.programmeType &&
    !TEMPLATE_TYPES.includes(programme.programmeType)
  ) {
    errors.programmeType = 'Choose a valid programme type.'
  }

  if (forPublication && type === 'spend_and_reward') {
    requireText(
      errors,
      programme,
      'rewardDescription',
      'Customer reward',
      3,
      240,
    )
  } else if (
    type === 'spend_and_reward' &&
    rewardDescription &&
    rewardDescription.length < 3
  ) {
    errors.rewardDescription = 'Use at least 3 characters.'
  } else if (type === 'spend_and_reward' && rewardDescription.length > 240) {
    errors.rewardDescription = 'Keep the reward to 240 characters or fewer.'
  }

  if (forPublication && !programme.rewardThreshold) {
    errors.rewardThreshold = 'Enter the reward target.'
  } else if (
    programme.rewardThreshold &&
    (!Number.isFinite(rewardThreshold) ||
      rewardThreshold < 1 ||
      rewardThreshold > MAX_REWARD_THRESHOLD ||
      (type === 'stamp_card' && !Number.isInteger(rewardThreshold)) ||
      (type !== 'stamp_card' && !Number.isInteger(rewardThreshold * 100)))
  ) {
    errors.rewardThreshold =
      type === 'stamp_card'
        ? 'Use a whole number between 1 and 1,000,000.'
        : 'Use an amount between $1 and $1,000,000, with up to two decimal places.'
  }

  if (type === 'spend_and_save') {
    if (forPublication && !programme.rewardValue) {
      errors.rewardValue = 'Enter the discount amount.'
    } else if (
      programme.rewardValue &&
      (!Number.isFinite(rewardValue) ||
        rewardValue < 0.01 ||
        rewardValue > MAX_REWARD_THRESHOLD ||
        !Number.isInteger(rewardValue * 100) ||
        (programme.rewardThreshold && rewardValue > rewardThreshold))
    ) {
      errors.rewardValue =
        'Use an amount of at least $0.01 that does not exceed the spend target.'
    }
  }

  if (terms.length > 1000) {
    errors.terms = 'Keep the terms to 1,000 characters or fewer.'
  }

  if (forPublication && !programme.startDate) {
    errors.startDate = 'Choose when the programme starts.'
  } else if (
    programme.startDate &&
    !/^\d{4}-\d{2}-\d{2}$/.test(programme.startDate)
  ) {
    errors.startDate = 'Enter a valid start date.'
  }

  if (programme.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(programme.endDate)) {
    errors.endDate = 'Enter a valid end date.'
  } else if (
    programme.startDate &&
    programme.endDate &&
    programme.endDate < programme.startDate
  ) {
    errors.endDate = 'End date cannot be earlier than the start date.'
  } else if (
    forPublication &&
    programme.endDate &&
    programme.endDate < getAucklandToday()
  ) {
    errors.endDate = 'End date cannot be in the past.'
  }

  return errors
}

export function validateLoyaltyDraft(programme) {
  return validateLoyaltyProgramme(programme)
}
