export const BUSINESS_QUOTE_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'awaiting_response', label: 'Awaiting response' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'request_withdrawn', label: 'Request withdrawn' },
]

const BUSINESS_QUOTE_STATUS_LABELS = Object.fromEntries(
  BUSINESS_QUOTE_STATUS_OPTIONS.map(({ value, label }) => [value, label]),
)

export function formatBusinessQuoteStatus(status) {
  return BUSINESS_QUOTE_STATUS_LABELS[status] ?? status.replaceAll('_', ' ')
}

export function filterBusinessQuotes(quotes, status) {
  if (status === 'all') return quotes
  return quotes.filter((quote) => quote.quote_status === status)
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

export function getBusinessQuoteTimeline(quote) {
  const submittedStep = { label: 'Submitted', state: 'complete' }

  if (quote.quote_status === 'awaiting_response') {
    return [
      submittedStep,
      { label: 'Awaiting response', state: 'current' },
      { label: 'Active Job', state: 'upcoming' },
    ]
  }

  if (quote.quote_status === 'accepted') {
    return [
      submittedStep,
      { label: 'Awaiting response', state: 'complete' },
      { label: 'Active Job', state: 'current' },
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
