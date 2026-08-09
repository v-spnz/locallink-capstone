import { supabase } from '../../../lib/supabase'

const RPC_BY_TYPE = {
  leads: 'get_business_job_leads',
  quotes: 'get_business_quotes',
  jobs: 'get_business_active_jobs',
}

export async function fetchBusinessMarketplaceItems(type, businessId) {
  const { data, error } = await supabase.rpc(RPC_BY_TYPE[type], {
    p_business_id: businessId,
  })
  if (error) throw error
  return data ?? []
}

export async function submitBusinessQuote({
  businessId,
  jobRequestId,
  amount,
  message,
}) {
  const { error } = await supabase.rpc('submit_business_quote', {
    p_business_id: businessId,
    p_job_request_id: jobRequestId,
    p_amount_cents: Math.round(Number(amount) * 100),
    p_message: message.trim(),
  })
  if (error) throw error
}

export async function completeBusinessJob(businessId, jobRequestId) {
  const { data, error } = await supabase.rpc('complete_business_job', {
    p_business_id: businessId,
    p_job_request_id: jobRequestId,
  })
  if (error || !data) throw error ?? new Error('Job was not completed')
}
