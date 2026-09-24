import { supabase } from '../../../lib/supabase'

function mapLoyaltyRecord(record) {
  return {
    id: record.loyalty_record_id,
    loyaltyIdentifier: record.loyalty_identifier,
    customerDisplayName: record.customer_display_name,
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
  }
}

export async function lookupBusinessLoyaltyRecord(
  businessId,
  loyaltyIdentifier,
) {
  const { data, error } = await supabase
    .rpc('lookup_business_loyalty_record', {
      p_business_id: businessId,
      p_loyalty_identifier: loyaltyIdentifier,
    })
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('LOYALTY_RECORD_NOT_FOUND')
  return mapLoyaltyRecord(data)
}

export async function addLoyaltyProgress(loyaltyRecordId, amount = 1) {
  const { data, error } = await supabase
    .rpc('add_loyalty_progress', {
      p_loyalty_record_id: loyaltyRecordId,
      p_amount: amount,
    })
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('LOYALTY_RECORD_NOT_FOUND')
  return mapLoyaltyRecord(data)
}
