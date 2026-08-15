export const BUSINESS_QUOTE_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'request_withdrawn', label: 'Request withdrawn' },
]

export const BUSINESS_QUOTE_ORDER_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
]

export const MAX_QUOTES_PER_REQUEST = 3

const QUOTE_DRAFT_STORAGE_PREFIX = 'locallink.quoteDraft.'

function getQuoteDraftStorageKey(requestedId, providerId) {
  return `${QUOTE_DRAFT_STORAGE_PREFIX}${requestedId}.${providerId}`
}

const BUSINESS_QUOTE_STATUS_LABELS = Object.fromEntries(
  BUSINESS_QUOTE_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
)

export function formatBusinessQuoteStatus(status) {
  return BUSINESS_QUOTE_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')
}

export function filterBusinessQuotes(
  quotes,
  { status = 'all', search = '', order = 'newest' } = {},
) {
  const normalizedSearch = search.trim().toLocaleLowerCase('en-NZ')
  const matchingQuotes = quotes.filter((quote) => {
    const searchableText = [
      quote.title,
      quote.description,
      quote.suburb,
      quote.city,
      quote.category,
      quote.message,
    ]
      .map((value) => String(value ?? '').toLocaleLowerCase('en-NZ'))
      .join(' ')

    return (
      (status === 'all' || quote.quote_status === status) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })

  const direction = order === 'oldest' ? 1 : -1
  return matchingQuotes.toSorted(
    (first, second) =>
      (new Date(first.created_at).getTime() -
        new Date(second.created_at).getTime()) *
      direction,
  )
}

export function getBusinessQuoteResponseDeadline(quote) {
  const suppliedDeadline = new Date(quote.response_deadline)
  if (quote.response_deadline && !Number.isNaN(suppliedDeadline.getTime())) {
    return suppliedDeadline
  }

  const deadline = new Date(quote.created_at)
  if (!quote.created_at || Number.isNaN(deadline.getTime())) return null

  let workingDaysAdded = 0
  while (workingDaysAdded < 5) {
    deadline.setDate(deadline.getDate() + 1)
    const day = deadline.getDay()
    if (day !== 0 && day !== 6) workingDaysAdded += 1
  }

  return deadline
}

export function getBusinessQuoteResponseReminderThreshold(quote) {
  const deadline = getBusinessQuoteResponseDeadline(quote)
  if (!deadline) return null

  const threshold = new Date(deadline)
  let workingDaysSubtracted = 0
  while (workingDaysSubtracted < 3) {
    threshold.setDate(threshold.getDate() - 1)
    const day = threshold.getDay()
    if (day !== 0 && day !== 6) workingDaysSubtracted += 1
  }

  return threshold
}

export function isBusinessQuoteResponseDeadlineUrgent(
  quote,
  now = new Date(),
) {
  const deadline = getBusinessQuoteResponseDeadline(quote)
  const threshold = getBusinessQuoteResponseReminderThreshold(quote)
  const currentTime = new Date(now)

  if (
    !deadline ||
    !threshold ||
    Number.isNaN(currentTime.getTime()) ||
    quote.quote_status !== 'awaiting_response'
  ) {
    return false
  }

  return currentTime >= threshold && currentTime <= deadline
}

export function formatConsumerResponseCountdown(deadline, now = new Date()) {
  const deadlineDate = new Date(deadline)
  const currentTime = new Date(now)
  const remaining = deadlineDate.getTime() - currentTime.getTime()

  if (
    !deadline ||
    Number.isNaN(deadlineDate.getTime()) ||
    Number.isNaN(currentTime.getTime()) ||
    remaining <= 0
  ) {
    return 'response period ended'
  }

  const hour = 60 * 60 * 1000
  if (remaining <= 24 * hour) {
    const hours = Math.max(1, Math.ceil(remaining / hour))
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }

  const cursor = new Date(currentTime)
  const deadlineDay = new Date(deadlineDate)
  cursor.setHours(0, 0, 0, 0)
  deadlineDay.setHours(0, 0, 0, 0)
  let workingDaysRemaining = 0
  while (cursor < deadlineDay) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) workingDaysRemaining += 1
  }

  const days = Math.max(1, workingDaysRemaining)
  return `${days} day${days === 1 ? '' : 's'}`
}

export function getBusinessQuoteTimeline(quote) {
  const submittedStep = { label: 'Submitted', state: 'complete' }

  if (quote.quote_status === 'awaiting_response') {
    return [
      submittedStep,
      { label: 'Awaiting response', state: 'current' },
    ]
  }

  if (quote.quote_status === 'accepted') {
    return [
      submittedStep,
      { label: 'Awaiting response', state: 'complete' },
    ]
  }

  return [
    submittedStep,
    {
      label: formatBusinessQuoteStatus(quote.quote_status),
      state: 'current',
    },
  ]
}

export function formatResponseTimeRemaining(deadline, now = new Date()) {
  const deadlineDate = new Date(deadline)
  const remaining = deadlineDate.getTime() - now.getTime()
  if (!deadline || Number.isNaN(deadlineDate.getTime()) || remaining <= 0) {
    return 'Response period ended'
  }

  const day = 24 * 60 * 60 * 1000
  const hour = 60 * 60 * 1000
  const minute = 60 * 1000
  const days = Math.floor(remaining / day)
  const hours = Math.floor((remaining % day) / hour)

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}${
      hours > 0 ? ` ${hours} hour${hours === 1 ? '' : 's'}` : ''
    } remaining`
  }

  if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'} remaining`
  }

  const minutes = Math.max(1, Math.ceil(remaining / minute))
  return `${minutes} minute${minutes === 1 ? '' : 's'} remaining`
}

export function saveBusinessQuoteDraft(requestedId, providerId, draftFields) {
  if (!requestedId || !providerId) return null

  const draft = {
    requestedId,
    providerId,
    fields: draftFields,
    saved_at: new Date().toISOString(),
  }

  try {
    sessionStorage.setItem(
      getQuoteDraftStorageKey(requestedId, providerId),
      JSON.stringify(draft),
    )
  } catch {
    return null
  }

  return draft
}

export function getBusinessQuoteDraft(requestedId, providerId) {
  if (!requestedId || !providerId) return null

  try {
    const raw = sessionStorage.getItem(
      getQuoteDraftStorageKey(requestedId, providerId),
    )
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearBusinessQuoteDraft(requestedId, providerId) {
  if (!requestedId || !providerId) return
  try {
    sessionStorage.removeItem(getQuoteDraftStorageKey(requestedId, providerId))
  } catch {
    //Ignore storage errors
  }
}

export function countSubmittedQuotesForRequest(quotes) {
  return quotes.filter((quote) => quote.quote_status !== 'draft').length
}

export function hasReachedMaxQuotesForRequest(quotes) {
  return countSubmittedQuotesForRequest(quotes) >= MAX_QUOTES_PER_REQUEST
}

export function isRequestOpenForQuoteSubmission(request, now = new Date()) {
  if (!request) return false
  if (request.status === 'closed' || request.status === 'expired') {
    return false
  }

  if (request.submission_deadline) {
    const deadline = new Date(request.submission_deadline)
    if (
      !Number.isNaN(deadline.getTime()) &&
      deadline.getTime() <= now.getTime()
    ) {
      return false
    }
  }

  return true
}

export function canSubmitQuoteDraft(request, existingQuotes, now = new Date()) {
  return (
    isRequestOpenForQuoteSubmission(request, now) &&
    !hasReachedMaxQuotesForRequest(existingQuotes)
  )
}
