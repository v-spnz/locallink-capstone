import { supabase } from '../../../lib/supabase'

const PROGRAMME_FIELDS = `
  id,
  business_id,
  name,
  programme_type,
  reward_description,
  reward_threshold,
  reward_value,
  earning_rules,
  terms,
  start_date,
  end_date,
  status,
  join_code,
  image_url,
  ended_at,
  early_end_completion_deadline,
  published_at,
  created_at,
  updated_at
`

function nullableText(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

export function mapBusinessLoyaltyProgramme(record) {
  return {
    id: record.id,
    businessId: record.business_id,
    name: record.name || '',
    programmeType: record.programme_type || '',
    rewardDescription: record.reward_description || '',
    rewardThreshold:
      record.reward_threshold == null ? '' : String(record.reward_threshold),
    rewardValue: record.reward_value == null ? '' : String(record.reward_value),
    earningRules: record.earning_rules || '',
    terms: record.terms || '',
    startDate: record.start_date || '',
    endDate: record.end_date || '',
    status: record.status || 'draft',
    joinCode: record.join_code || '',
    imageUrl: record.image_url || '',
    endedAt: record.ended_at,
    earlyEndCompletionDeadline: record.early_end_completion_deadline || '',
    imageFile: null,
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

export async function deleteBusinessLoyaltyDraft(programmeId, businessId) {
  const { data, error } = await supabase.rpc(
    'delete_business_loyalty_programme_draft',
    { p_programme_id: programmeId, p_business_id: businessId },
  )
  if (error) throw error
  return data
}

export async function cancelBusinessLoyaltySchedule(programmeId, businessId) {
  const { data, error } = await supabase.rpc(
    'cancel_business_loyalty_programme_schedule',
    { p_programme_id: programmeId, p_business_id: businessId },
  )
  if (error) throw error
  return data
}

export async function fetchBusinessLoyaltyEndSummary(programmeId, businessId) {
  const { data, error } = await supabase
    .rpc('get_business_loyalty_programme_end_summary', {
      p_programme_id: programmeId,
      p_business_id: businessId,
    })
    .single()
  if (error) throw error
  return {
    customerCount: Number(data.customer_count || 0),
    completionDeadline: data.completion_deadline,
  }
}

export async function endBusinessLoyaltyProgramme(programmeId, businessId) {
  const { data, error } = await supabase
    .rpc('end_business_loyalty_programme_early', {
      p_programme_id: programmeId,
      p_business_id: businessId,
    })
    .single()
  if (error) throw error
  return {
    programmeId: data.programme_id,
    customerCount: Number(data.customer_count || 0),
    notificationsCreated: Number(data.notifications_created || 0),
    completionDeadline: data.completion_deadline,
  }
}

async function uploadProgrammeImage(file, businessId) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${businessId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('loyalty-programme-images')
    .upload(path, file)
  if (error) throw error

  const { data } = supabase.storage
    .from('loyalty-programme-images')
    .getPublicUrl(path)
  return data.publicUrl
}

export async function fetchBusinessLoyaltyProgrammes(businessId) {
  const { data, error } = await supabase
    .from('business_loyalty_programmes')
    .select(PROGRAMME_FIELDS)
    .eq('business_id', businessId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return (data || []).map(mapBusinessLoyaltyProgramme)
}

export async function saveBusinessLoyaltyProgramme({
  businessId,
  programme,
  status = 'draft',
}) {
  const imageUrl = programme.imageFile
    ? await uploadProgrammeImage(programme.imageFile, businessId)
    : programme.imageUrl || null

  const payload = {
    id: programme.id,
    business_id: businessId,
    name: nullableText(programme.name),
    programme_type: nullableText(programme.programmeType),
    reward_description: nullableText(programme.rewardDescription),
    reward_threshold: programme.rewardThreshold
      ? Number(programme.rewardThreshold)
      : null,
    reward_value: programme.rewardValue ? Number(programme.rewardValue) : null,
    terms: nullableText(programme.terms),
    start_date: programme.startDate || null,
    end_date: programme.endDate || null,
    image_url: imageUrl,
  }

  const { data: savedProgrammeId, error: saveError } = await supabase.rpc(
    'save_business_loyalty_programme',
    {
      p_programme_id: payload.id,
      p_business_id: payload.business_id,
      p_name: payload.name,
      p_programme_type: payload.programme_type,
      p_reward_description: payload.reward_description,
      p_reward_threshold: payload.reward_threshold,
      p_reward_value: payload.reward_value,
      p_terms: payload.terms,
      p_start_date: payload.start_date,
      p_end_date: payload.end_date,
      p_status: status,
      p_image_url: payload.image_url,
    },
  )

  if (saveError) {
    console.error('save_business_loyalty_programme failed:', saveError)
    throw saveError
  }

  const { data, error } = await supabase
    .from('business_loyalty_programmes')
    .select(PROGRAMME_FIELDS)
    .eq('id', savedProgrammeId)
    .eq('business_id', businessId)
    .single()

  if (error) throw error
  return mapBusinessLoyaltyProgramme(data)
}
