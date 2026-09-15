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
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
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
    },
  )

  if (saveError) throw saveError

  const { data, error } = await supabase
    .from('business_loyalty_programmes')
    .select(PROGRAMME_FIELDS)
    .eq('id', savedProgrammeId)
    .eq('business_id', businessId)
    .single()

  if (error) throw error
  return mapBusinessLoyaltyProgramme(data)
}
