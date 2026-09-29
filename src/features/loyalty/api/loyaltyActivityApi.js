import { supabase } from '../../../lib/supabase'

function formatAmount(value) {
  const amount = Number(value)
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2)
}

function getActivityDetail(record) {
  if (record.activity_type === 'reward_earned') return 'Reward earned'
  if (record.activity_type === 'reward_redeemed') return 'Reward redeemed'

  const amount = formatAmount(record.amount)
  if (record.programme_type === 'purchase_card') {
    return `${amount} ${Number(record.amount) === 1 ? 'purchase' : 'purchases'} added`
  }
  if (['visit_card', 'stamp_card'].includes(record.programme_type)) {
    return `${amount} ${Number(record.amount) === 1 ? 'visit' : 'visits'} added`
  }
  return `$${amount} progress added`
}

function mapActivity(record) {
  return {
    id: record.id,
    programmeId: record.programme_id,
    programmeName: record.programme_name || 'Loyalty programme',
    type: record.activity_type,
    customerLabel: record.customer_label || 'Customer',
    detail: getActivityDetail(record),
    occurredAt: record.occurred_at,
  }
}

export async function fetchBusinessLoyaltyActivity(
  businessId,
  { limit = 50 } = {},
) {
  const { data, error } = await supabase.rpc('get_business_loyalty_activity', {
    p_business_id: businessId,
    p_limit: limit,
  })

  if (error) throw error
  return (data || []).map(mapActivity)
}
