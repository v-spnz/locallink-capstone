import { supabase } from '../../../lib/supabase'

const ACTIVITY_FIELDS = `
  id,
  business_id,
  programme_id,
  programme_name,
  activity_type,
  customer_label,
  detail,
  occurred_at
`

function mapActivity(record) {
  return {
    id: record.id,
    programmeId: record.programme_id,
    programmeName: record.programme_name || 'Loyalty programme',
    type: record.activity_type === 'redeem' ? 'redeem' : 'earn',
    customerLabel: record.customer_label || 'Customer',
    detail: record.detail || '',
    occurredAt: record.occurred_at,
  }
}

export async function fetchBusinessLoyaltyActivity(
  businessId,
  { limit = 50 } = {},
) {
  const { data, error } = await supabase
    .from('loyalty_activity')
    .select(ACTIVITY_FIELDS)
    .eq('business_id', businessId)
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(mapActivity)
}

export function subscribeToBusinessLoyaltyActivity(businessId, onInsert) {
  const channel = supabase
    .channel(`loyalty-activity-${businessId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'loyalty_activity',
        filter: `business_id=eq.${businessId}`,
      },
      (payload) => onInsert(mapActivity(payload.new)),
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
