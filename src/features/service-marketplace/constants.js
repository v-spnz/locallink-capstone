export const TRADE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Landscaping',
  'Roofing',
]

export const CITIES = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Napier',
  'Hastings',
  'Palmerston North',
  'New Plymouth',
  'Nelson',
  'Rotorua',
  'Whangarei',
  'Invercargill',
  'Queenstown',
  'Porirua',
]
export const MIN_BUDGET = [50, 100, 250, 500, 1000, 2000, 5000, 10000]

export const MAX_BUDGET = [50, 100, 150, 250, 500, 1000, 2000, 5000, 10000]

export const POSTED_DISTANCES = Array.from(
  { length: 10 },
  (_, index) => `${index + 1}km`,
)

export const QUOTE_PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed total' },
  { value: 'hourly', label: 'Hourly rate' },
  { value: 'call_out', label: 'Call-out fee' },
]

function formatArrivalTime(totalMinutes) {
  const hour24 = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const hour = hour24 % 12 || 12
  const period = hour24 < 12 ? 'AM' : 'PM'
  return `${hour}:${String(minutes).padStart(2, '0')} ${period}`
}

export const QUOTE_ARRIVAL_TIMES = Array.from({ length: 29 }, (_, index) => {
  const totalMinutes = 6 * 60 + index * 30
  return {
    value: `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(
      totalMinutes % 60,
    ).padStart(2, '0')}`,
    label: formatArrivalTime(totalMinutes),
  }
})

export const QUOTE_DURATION_OPTIONS = [
  '30 minutes',
  '1 hour',
  '2 hours',
  '3 hours',
  '4 hours',
  'Half day',
  'Full day',
  '2 working days',
  '3–5 working days',
  'More than 5 working days',
]

export function formatQuoteArrivalWindow(start, end) {
  const startLabel = QUOTE_ARRIVAL_TIMES.find(
    ({ value }) => value === start,
  )?.label
  const endLabel = QUOTE_ARRIVAL_TIMES.find(({ value }) => value === end)?.label
  return startLabel && endLabel ? `${startLabel}–${endLabel}` : ''
}

export const URGENCY_OPTIONS = ['Flexible', 'Normal', 'Urgent']

export const MARKETPLACE_PAGE_CONTENT = {
  leads: {
    eyebrow: 'Service Marketplace',
    title: 'Job Leads',
    description: 'Review local service requests matched to your business.',
    empty: 'No matching job leads are available right now.',
  },
  quotes: {
    eyebrow: 'Service Marketplace',
    title: 'Quotes',
    description: 'Track the quotes your business has submitted.',
    empty: 'Your submitted quotes will appear here.',
  },
  jobs: {
    eyebrow: 'Service Marketplace',
    title: 'Jobs',
    description: 'Keep track of accepted and active work.',
    empty: 'Accepted service jobs will appear here.',
  },
  history: {
    eyebrow: 'Service Marketplace',
    title: 'Job History',
    description: 'Review work that has been completed.',
    empty: 'Completed jobs will appear here.',
  },
}

export function getMarketplaceEmptyMessage(type, totalItems) {
  if (type === 'leads' && totalItems > 0) {
    return 'No matched job leads match your search or filters.'
  }

  if (type === 'quotes' && totalItems > 0) {
    return 'No submitted quotes match this status.'
  }

  if (type === 'jobs' && totalItems > 0) {
    return 'No jobs match this status.'
  }

  if (type === 'history' && totalItems > 0) {
    return 'No completed jobs match your search.'
  }

  return MARKETPLACE_PAGE_CONTENT[type].empty
}
