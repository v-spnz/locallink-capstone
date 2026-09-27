import { supabase } from '../../../lib/supabase'

export async function fetchMyLoyaltyRecords() {
  const { data, error } = await supabase.rpc('get_my_loyalty_records')
  if (error) throw error

  return (data ?? []).map((record) => ({
    id: record.loyalty_record_id,
    loyaltyIdentifier: record.loyalty_identifier,
    business: record.business_name,
    programmeId: record.programme_id,
    programmeName: record.programme_name,
    programmeType: record.programme_type,
    programmeStatus: record.programme_status,
    currentProgress: Number(record.current_progress),
    rewardThreshold: Number(record.reward_threshold),
    rewardDescription: record.reward_description,
    rewardValue:
      record.reward_value == null ? null : Number(record.reward_value),
    earningRules: record.earning_rules,
    rewardEligible: record.reward_eligible,
    updatedAt: record.updated_at,
  }))
}

export async function createMyLoyaltyScanCode(loyaltyRecordId) {
  const { data, error } = await supabase
    .rpc('create_my_loyalty_scan_code', {
      p_loyalty_record_id: loyaltyRecordId,
    })
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('LOYALTY_SCAN_CODE_UNAVAILABLE')
  return {
    scanCode: data.scan_code,
    expiresAt: data.expires_at,
  }
}

export async function joinLoyaltyProgramme(joinCode) {
  const { data, error } = await supabase
    .rpc('join_loyalty_programme', { p_join_code: joinCode })
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('LOYALTY_PROGRAMME_NOT_FOUND')

  return {
    id: data.loyalty_record_id,
    loyaltyIdentifier: data.loyalty_identifier,
    business: data.business_name,
    programmeId: data.programme_id,
    programmeName: data.programme_name,
    programmeType: data.programme_type,
    programmeStatus: data.programme_status,
    currentProgress: Number(data.current_progress),
    rewardThreshold: Number(data.reward_threshold),
    rewardDescription: data.reward_description,
    rewardValue: data.reward_value == null ? null : Number(data.reward_value),
    earningRules: data.earning_rules,
    rewardEligible: data.reward_eligible,
    updatedAt: data.updated_at,
  }
}

export async function discoverLoyaltyProgrammes() {
  const { data, error } = await supabase.rpc('discover_loyalty_programmes')
  if (error) throw error

  return (data ?? []).map((row) => ({
    businessId: row.business_id,
    businessName: row.business_name,
    formattedAddress: row.formatted_address,
    distanceKm: row.distance_km,
    programmeId: row.programme_id,
    programmeName: row.programme_name,
    programmeType: row.programme_type,
    rewardDescription: row.reward_description,
    rewardThreshold: Number(row.reward_threshold),
    earningRules: row.earning_rules,
    joinCode: row.join_code,
    loyaltyRecordId: row.loyalty_record_id,
    currentProgress:
      row.current_progress == null ? null : Number(row.current_progress),
    isJoined: row.is_joined,
  }))
}
