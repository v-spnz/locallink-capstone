import { supabase } from '../../../lib/supabase'

function mapClaim(record, redemptionCode) {
  return {
    claimReference: record.claim_reference,
    redemptionCode,
    dealTitle: record.deal_title,
    dealStatus: record.deal_status,
    customerDisplayName: record.customer_name,
    claimedAt: record.claimed_at,
    expiresAt: record.expires_at,
    redeemedAt: record.redeemed_at,
    offerType: record.offer_type,
    discountPercentage: record.discount_percentage,
    discountAmountCents: record.discount_amount_cents,
    originalPriceCents: record.original_price_cents,
    dealPriceCents: record.deal_price_cents,
    offerDetails: record.offer_details,
    redemptionInstructions: record.redemption_instructions,
  }
}

function mapRedemption(record) {
  return {
    claimReference: record.claim_reference,
    dealId: record.deal_id,
    dealTitle: record.deal_title,
    customerDisplayName: record.customer_name,
    claimedAt: record.claimed_at,
    redeemedAt: record.redeemed_at,
    redeemedByName: record.redeemed_by_name,
    redemptionStatus: 'redeemed',
  }
}

function mapLookup(record) {
  return {
    claimReference: record.claim_reference,
    customerDisplayName: record.customer_name,
    dealTitle: record.deal_title,
    redemptionStatus: record.redemption_status,
    claimedAt: record.claimed_at,
    redeemedAt: record.redeemed_at,
  }
}

export async function validateBusinessDealRedemptionCode(redemptionCode) {
  const { data, error } = await supabase
    .rpc('validate_business_deal_redemption_code', {
      p_redemption_code: redemptionCode,
    })
    .single()

  if (error) throw error
  return mapClaim(data, redemptionCode)
}

export async function redeemBusinessDealClaim(redemptionCode) {
  const { data, error } = await supabase
    .rpc('redeem_business_deal_claim_by_code', {
      p_redemption_code: redemptionCode,
    })
    .single()

  if (error) throw error
  return {
    redeemedAt: data.redeemed_at,
  }
}

export async function lookupBusinessDealClaim(lookupValue) {
  const { data, error } = await supabase
    .rpc('lookup_business_deal_claim', {
      p_lookup_value: lookupValue,
    })
    .single()

  if (error) throw error
  return mapLookup(data)
}

export async function fetchBusinessDealRedemptions(businessId) {
  const { data, error } = await supabase.rpc('get_business_deal_redemptions', {
    p_business_id: businessId,
  })

  if (error) throw error
  return (data ?? []).map(mapRedemption)
}
