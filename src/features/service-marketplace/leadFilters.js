export const LEAD_URGENCY_FILTERS = {
  all: 'All',
  Urgent: 'Urgent',
  Normal: 'Normal',
  Flexible: 'Flexible',
}

export const LEAD_ORDER_OPTIONS = {
  urgent_first: 'Urgent first',
  normal_first: 'Normal first',
  flexible_first: 'Flexible first',
}

const LEAD_URGENCY_ORDER = {
  urgent_first: ['urgent', 'normal', 'flexible'],
  normal_first: ['normal', 'urgent', 'flexible'],
  flexible_first: ['flexible', 'urgent', 'normal'],
}

const URGENT_DEADLINE_WINDOW_MS = 48 * 60 * 60 * 1000

function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('en-NZ')
}

export function isAvailableLead(lead, now = new Date()) {
  const deadline = new Date(lead.quote_deadline)
  const hasValidDeadline =
    lead.quote_deadline && !Number.isNaN(deadline.getTime())

  return (
    lead.job_status === 'open' &&
    hasValidDeadline &&
    deadline.getTime() > now.getTime() &&
    Number(lead.quote_count) < Number(lead.max_quotes)
  )
}

export function matchesBusinessProfile(lead, services, serviceAreas) {
  const normalizedServices = services.map(normalize)
  const normalizedAreas = serviceAreas.map(normalize)

  return (
    normalizedServices.includes(normalize(lead.category)) &&
    [lead.suburb, lead.city].some((area) =>
      normalizedAreas.includes(normalize(area)),
    )
  )
}

export function getLeadDisplayDetails(lead) {
  return {
    title: lead.title,
    category: lead.category,
    suburb: lead.suburb,
    urgency: lead.urgency,
    quoteCount: Number(lead.quote_count),
    maxQuotes: Number(lead.max_quotes),
    quoteDeadline: lead.quote_deadline,
  }
}

export function isUrgentLead(lead, now = new Date()) {
  const deadline = new Date(lead.quote_deadline)
  const timeRemaining = deadline.getTime() - now.getTime()

  return timeRemaining > 0 && timeRemaining <= URGENT_DEADLINE_WINDOW_MS
}

export function filterAndSortLeads(
  leads,
  {
    search = '',
    urgency = 'all',
    order = 'urgent_first',
    now = new Date(),
  } = {},
) {
  const normalizedSearch = normalize(search)
  const normalizedUrgency = normalize(urgency)
  const matchingLeads = leads.filter((lead) => {
    const searchableText = [
      lead.title,
      lead.description,
      lead.suburb,
      lead.city,
      lead.category,
    ]
      .map(normalize)
      .join(' ')

    return (
      isAvailableLead(lead, now) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (urgency === 'all' || normalize(lead.urgency) === normalizedUrgency)
    )
  })

  return matchingLeads.toSorted((first, second) => {
    const urgencyOrder =
      LEAD_URGENCY_ORDER[order] ?? LEAD_URGENCY_ORDER.urgent_first
    const urgencyDifference =
      urgencyOrder.indexOf(normalize(first.urgency)) -
      urgencyOrder.indexOf(normalize(second.urgency))
    if (urgencyDifference !== 0) return urgencyDifference

    return (
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
    )
  })
}
