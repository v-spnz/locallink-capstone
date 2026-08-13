import { supabase } from '../../../lib/supabase'

const RPC_BY_TYPE = {
  leads: 'get_business_job_leads',
  quotes: 'get_business_quotes',
  jobs: 'get_business_active_jobs',
  history: 'get_business_job_history',
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
      const items = result.data ?? []
      if (type === 'leads') return items.filter((item) => !item.has_quote)
      if (type === 'quotes') {
        return items.filter((item) => item.quote_status !== 'accepted')
      }
      if (type === 'jobs') {
        return items.filter((item) => item.job_status !== 'completed')
      }
      if (type === 'history') {
        return items.filter((item) => item.job_status === 'completed')
      }
      return items
    } finally {
      pendingMarketplaceRequests.delete(requestKey)
    }
  })()

  pendingMarketplaceRequests.set(requestKey, request)
  return request
}

export async function submitBusinessQuote({ businessId, jobRequestId, quote }) {
  const { error } = await supabase.rpc('submit_business_quote', {
    p_business_id: businessId,
    p_job_request_id: jobRequestId,
    p_price_type: quote.priceType,
    p_amount_cents: Math.round(Number(quote.amount) * 100),
    p_availability_date: quote.availability,
    p_arrival_window: quote.arrivalWindow.trim(),
    p_included_work: quote.includedWork.trim(),
    p_conditions: quote.conditions.trim(),
    p_expected_duration: quote.expectedDuration.trim(),
    p_message: quote.message.trim(),
  })
  if (error) throw error
}

export async function declineBusinessOpportunity(businessId, jobRequestId) {
  const { data, error } = await supabase.rpc(
    'decline_business_job_opportunity',
    {
      p_business_id: businessId,
      p_job_request_id: jobRequestId,
    },
  )
  if (error || !data)
    throw error ?? new Error('Opportunity could not be declined')
}

export async function updateBusinessJobStatus(
  businessId,
  jobRequestId,
  nextStatus,
) {
  const { data, error } = await supabase.rpc('update_business_job_status', {
    p_business_id: businessId,
    p_job_request_id: jobRequestId,
    p_status: nextStatus,
  })
  if (error || !data) throw error ?? new Error('Job status was not updated')
  return Array.isArray(data) ? data[0] : data
}

export async function withdrawBusinessQuote(businessId, quoteId) {
  const { data, error } = await supabase.rpc('withdraw_business_quote', {
    p_business_id: businessId,
    p_quote_id: quoteId,
  })
  if (error || !data) throw error ?? new Error('Quote was not withdrawn')
}
