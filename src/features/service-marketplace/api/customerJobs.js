import { supabase } from '../../../lib/supabase'
import { formatBudgetRange } from '../formatters'
const JOB_FIELDS =
  'id, title, description, category, job_type, city, suburb, radius_km, ' +
  'status, image_urls, job_date, budget, urgency, created_at'

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

async function uploadJobImages(files, customerId) {
  const urls = []
  for (const file of files) {
    const ext = file.name.split('.').pop()
    const path = `${customerId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('job-images')
      .upload(path, file)
    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('job-images').getPublicUrl(path)
    urls.push(data.publicUrl)
  }
  return urls
}

export async function resolveJobImages(imgs, customerId) {
  const existingUrls = (imgs || []).filter((item) => typeof item === 'string')
  const newFiles = (imgs || []).filter((item) => item instanceof File)

  const uploadedUrls =
    newFiles.length > 0 ? await uploadJobImages(newFiles, customerId) : []

  return [...existingUrls, ...uploadedUrls]
}

export async function saveCustomerJob({ customerId, draft, jobId }) {
  const imageUrls = await resolveJobImages(draft.imgs, customerId)
  const resolvedType =
    draft.type === 'Other' ? draft.otherType.trim() : draft.type

  const payload = {
    customer_id: customerId,
    title: resolvedType,
    job_type: resolvedType,
    description: draft.description.trim(),
    category: draft.category,
    city: draft.city,
    suburb: draft.suburb,
    radius_km: Number.parseInt(draft.postedDistance, 10),
    status: 'open',
    image_urls: imageUrls,
    job_date: draft.jobDate ? draft.jobDate.toISOString().split('T')[0] : null,
    budget: formatBudgetRange(draft.minBudget, draft.maxBudget),
    urgency: draft.urgency,
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
