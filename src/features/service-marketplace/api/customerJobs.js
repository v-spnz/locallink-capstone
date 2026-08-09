import { supabase } from '../../../lib/supabase'

const JOB_FIELDS =
  'id, title, description, category, city, suburb, radius_km, status, created_at'

export async function fetchCustomerJobs(customerId) {
  const [jobsResult, quotesResult] = await Promise.all([
    supabase
      .from('job_requests')
      .select(JOB_FIELDS)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false }),
    supabase.rpc('get_customer_job_quotes'),
  ])

  return {
    jobs: jobsResult.error ? null : (jobsResult.data ?? []),
    quotes: quotesResult.error ? null : (quotesResult.data ?? []),
    hasError: Boolean(jobsResult.error || quotesResult.error),
  }
}

export async function saveCustomerJob({ customerId, job, jobId }) {
  const payload = {
    customer_id: customerId,
    title: job.title,
    description: job.description,
    category: job.category,
    job_type: job.category,
    city: job.city,
    suburb: job.suburb,
    radius_km: Number.parseInt(job.postedDistance, 10),
    status: 'open',
  }

  const query = jobId
    ? supabase
        .from('job_requests')
        .update(payload)
        .eq('id', jobId)
        .eq('customer_id', customerId)
    : supabase.from('job_requests').insert(payload)
  const { data, error } = await query.select(JOB_FIELDS).single()

  if (error) throw error
  return { ...data, postedDistance: `${data.radius_km}km` }
}

export async function respondToCustomerQuote(quoteId, accept) {
  const { error } = await supabase.rpc('respond_to_job_quote', {
    p_quote_id: quoteId,
    p_accept: accept,
  })
  if (error) throw error
}
