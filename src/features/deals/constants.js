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
