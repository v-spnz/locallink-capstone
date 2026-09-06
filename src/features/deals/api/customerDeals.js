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
  redemption_instructions
`

export async function fetchPublishedDealById(dealId) {
  const { data, error } = await supabase
    .from('business_deals')
    .select(PUBLISHED_DEAL_FIELDS)
    .eq('id', dealId)
    .eq('status', 'published')
    .single()

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
