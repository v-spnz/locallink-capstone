import { DEAL_CATEGORIES } from '../deals/constants'

export const CATEGORY_COLOURS = {
  'Food & Drink': '#2a78d6',
  Retail: '#eb6834',
  Services: '#1baf7a',
  'Health & Wellness': '#eda100',
  Trades: '#e87ba4',
  Entertainment: '#6250d6',
  Other: '#e34948',
}

export function groupDealsByCategory(deals) {
  const groups = new Map()

  for (const deal of deals) {
    if (deal.status === 'draft') continue

    const category = DEAL_CATEGORIES.includes(deal.category)
      ? deal.category
      : 'Other'

    if (!groups.has(category)) {
      groups.set(category, {
        category,
        colour: CATEGORY_COLOURS[category],
        deals: [],
        claims: 0,
        redemptions: 0,
        claimCohortRedemptions: 0,
      })
    }

    const group = groups.get(category)
    group.deals.push(deal)
    group.claims += deal.claims
    group.redemptions += deal.redemptions
    group.claimCohortRedemptions += deal.claimCohortRedemptions
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      conversion:
        group.claims > 0 ? group.claimCohortRedemptions / group.claims : null,
    }))
    .toSorted((a, b) => b.redemptions - a.redemptions || b.claims - a.claims)
}

export function formatCategoryConversion(conversion) {
  return conversion == null ? 'No claims' : `${Math.round(conversion * 100)}%`
}
