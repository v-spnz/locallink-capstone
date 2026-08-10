export const LEAD_SORT_OPTIONS = {
  newest: 'Newest first',
  urgency: 'Most urgent',
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
  { search = '', sort = 'newest', now = new Date() } = {},
) {
  const normalizedSearch = normalize(search)
  const matchingLeads = leads.filter((lead) => {
    const searchableText = [lead.title, lead.description, lead.suburb]
      .map(normalize)
      .join(' ')

    return (
      isAvailableLead(lead, now) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })

  return matchingLeads.toSorted((first, second) => {
    const field = sort === 'urgency' ? 'quote_deadline' : 'created_at'
    const direction = sort === 'urgency' ? 1 : -1
    return (
      (new Date(first[field]).getTime() - new Date(second[field]).getTime()) *
      direction
    )
  })
}
