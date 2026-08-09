export function createBusinessDeal(deal) {
  return {
    ...deal,
    id: Date.now(),
    title: deal.title.trim(),
    description: deal.description.trim(),
    discount: deal.discount.trim(),
  }
}

export function updateBusinessDeal(existingDeal, changes) {
  return {
    ...existingDeal,
    ...changes,
    title: changes.title.trim(),
    description: changes.description.trim(),
    discount: changes.discount.trim(),
  }
}

export function publishBusinessDeal(deal) {
  return { ...deal, status: 'Active' }
}
