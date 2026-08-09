export function validateDeal(deal) {
  const errors = {}
  if (!deal.title) errors.title = 'Title is required'
  if (!deal.description) errors.description = 'Description is required'
  if (!deal.discount) errors.discount = 'Discount is required'
  if (!deal.expiryDate) errors.expiryDate = 'Expiry date is required'
  if (
    deal.expiryDate &&
    deal.expiryDate < new Date().toISOString().split('T')[0]
  ) {
    errors.expiryDate = 'Expiry date must be in the future'
  }
  return errors
}
