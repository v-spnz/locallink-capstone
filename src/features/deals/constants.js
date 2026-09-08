export const DEAL_CATEGORIES = [
  'Food & Drink',
  'Retail',
  'Services',
  'Health & Wellness',
  'Trades',
  'Entertainment',
  'Other',
]

export const DEAL_OFFER_TYPES = [
  { value: 'percentage_discount', label: 'Percentage discount' },
  { value: 'fixed_discount', label: 'Fixed dollar discount' },
  { value: 'special_price', label: 'Special price' },
  { value: 'buy_one_get_one', label: 'Buy one, get one' },
  { value: 'other', label: 'Other offer' },
]

export function getOfferTypeLabel(value) {
  return DEAL_OFFER_TYPES.find((option) => option.value === value)?.label || ''
}

export function formatDealOffer(deal) {
  switch (deal.offerType) {
    case 'percentage_discount':
      return deal.discountPercentage ? `${deal.discountPercentage}% off` : ''
    case 'fixed_discount':
      return deal.discountAmount ? `$${deal.discountAmount} off` : ''
    case 'special_price':
      return deal.dealPrice
        ? `$${deal.dealPrice}${deal.originalPrice ? ` (was $${deal.originalPrice})` : ''}`
        : ''
    case 'buy_one_get_one':
    case 'other':
      return deal.offerDetails || ''
    default:
      return ''
  }
}

function localDateKey(date) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date
  }

  const value = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(value.getTime())) return ''

  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDealLifecycle(deal, today = new Date()) {
  if (deal.status !== 'published') {
    return { value: 'draft', label: 'Draft' }
  }

  const todayKey = localDateKey(today)
  if (deal.startDate && todayKey && deal.startDate > todayKey) {
    return { value: 'scheduled', label: 'Scheduled' }
  }
  if (deal.endDate && todayKey && deal.endDate < todayKey) {
    return { value: 'expired', label: 'Expired' }
  }
  return { value: 'active', label: 'Active' }
}
