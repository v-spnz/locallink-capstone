import { supabase } from '../../../lib/supabase'

const PUBLISHED_DEAL_FIELDS = `
  id,
  title,
  description,
  category,
  image_url,
  offer_type,
  discount_percentage,
  discount_amount_cents,
  original_price_cents,
  deal_price_cents,
  offer_details,
  gst_included,
  start_date,
  end_date,
  conditions,
  claim_limit,
  exclusions,
  redemption_instructions,
  status
`

function aucklandDateKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export async function fetchPublishedDealById(dealId) {
  const today = aucklandDateKey()
  const { data, error } = await supabase
    .from('business_deals')
    .select(PUBLISHED_DEAL_FIELDS)
    .eq('id', dealId)
    .in('status', ['scheduled', 'active'])
    .lte('start_date', today)
    .gte('end_date', today)
    .single()

  if (error) throw error
  return data
}

export async function fetchDealClaim(customerId, dealId) {
  const { data, error } = await supabase
    .from('business_deal_claims')
    .select('id, deal_id, customer_id, claimed_at')
    .eq('customer_id', customerId)
    .eq('deal_id', dealId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function claimDeal(dealId) {
  const { data, error } = await supabase.rpc('claim_business_deal', {
    p_deal_id: dealId,
  })

  if (error) throw error
  return data
}

export async function fetchSavedDealIds(customerId) {
  const { data, error } = await supabase
    .from('saved_deals')
    .select('deal_id')
    .eq('customer_id', customerId)

  if (error) throw error
  return (data ?? []).map((row) => row.deal_id)
}

export async function saveDeal(customerId, dealId) {
  const { error } = await supabase
    .from('saved_deals')
    .insert({ customer_id: customerId, deal_id: dealId })

  if (error) throw error
}

export async function unsaveDeal(customerId, dealId) {
  const { error } = await supabase
    .from('saved_deals')
    .delete()
    .eq('customer_id', customerId)
    .eq('deal_id', dealId)

  if (error) throw error
}
