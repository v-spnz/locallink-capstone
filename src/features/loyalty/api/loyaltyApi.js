import { supabase } from '../../../lib/supabase'

export async function fetchRewardRedemptions(userId) {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('mock_programme_id, redeemed_at')
    .eq('user_id', userId)
  if (error) throw error
  return data ?? []
}

export async function redeemLoyaltyReward(programId) {
  const { data, error } = await supabase.rpc('redeem_mock_loyalty_reward', {
    p_mock_programme_id: programId,
  })
  if (error) throw error
  return Array.isArray(data) ? data[0] : data
}
