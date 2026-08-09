import { supabase } from '../../../lib/supabase'

const RPC_BY_TYPE = {
  leads: 'get_business_job_leads',
  quotes: 'get_business_quotes',
  jobs: 'get_business_active_jobs',
}

const pendingMarketplaceRequests = new Map()

async function requestMarketplaceItems(type, businessId) {
  return supabase.rpc(RPC_BY_TYPE[type], {
    p_business_id: businessId,
  })
}

export function fetchBusinessMarketplaceItems(type, businessId) {
  const requestKey = `${type}:${businessId}`
  const pendingRequest = pendingMarketplaceRequests.get(requestKey)
  if (pendingRequest) return pendingRequest

  const request = (async () => {
    try {
      let result = await requestMarketplaceItems(type, businessId)
      const shouldRetry =
        result.error &&
        (!result.status || result.status === 401 || result.status >= 500)

      if (shouldRetry) {
        if (result.status === 401) await supabase.auth.refreshSession()
        result = await requestMarketplaceItems(type, businessId)
      }

      if (result.error) {
        throw Object.assign(new Error(result.error.message), result.error, {
          status: result.status,
        })
      }
      return result.data ?? []
    } finally {
      pendingMarketplaceRequests.delete(requestKey)
    }
  })()

  pendingMarketplaceRequests.set(requestKey, request)
  return request
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
