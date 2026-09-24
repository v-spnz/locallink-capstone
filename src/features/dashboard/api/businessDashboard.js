import { supabase } from '../../../lib/supabase'

function numberOrZero(value) {
  return Number(value ?? 0)
}

function nullableNumber(value) {
  return value == null ? null : Number(value)
}

function analyticsParameters({ businessId, startDate, endDate }) {
  return {
    p_business_id: businessId,
    p_start_date: startDate,
    p_end_date: endDate,
  }
}

function mapDashboardMetrics(record) {
  return {
    totalDeals: numberOrZero(record.total_deals),
    draftDeals: numberOrZero(record.draft_deals),
    activeDeals: numberOrZero(record.active_deals),
    scheduledDeals: numberOrZero(record.scheduled_deals),
    expiredDeals: numberOrZero(record.expired_deals),
    endedEarlyDeals: numberOrZero(record.ended_early_deals),
    dealClaims: numberOrZero(record.deal_claims),
    dealRedemptions: numberOrZero(record.deal_redemptions),
    dealClaimCohortRedemptions: numberOrZero(
      record.deal_claim_cohort_redemptions,
    ),
    dealClaimToRedemptionRate: numberOrZero(
      record.deal_claim_to_redemption_rate,
    ),
    uniqueDealCustomers: numberOrZero(record.unique_deal_customers),
    recordedTransactionValueCents: nullableNumber(
      record.recorded_transaction_value_cents,
    ),
    recordedCustomerSavingsCents: nullableNumber(
      record.recorded_customer_savings_cents,
    ),
    averageRecordedTransactionCents: nullableNumber(
      record.average_recorded_transaction_cents,
    ),
    redemptionsWithTransactionValue: numberOrZero(
      record.redemptions_with_transaction_value,
    ),
    loyaltyCustomers: numberOrZero(record.loyalty_customers),
    activeLoyaltyCustomers: numberOrZero(record.active_loyalty_customers),
    loyaltyActivityEvents: numberOrZero(record.loyalty_activity_events),
    loyaltyRewardsEarned: numberOrZero(record.loyalty_rewards_earned),
    loyaltyRewardsRedeemed: numberOrZero(record.loyalty_rewards_redeemed),
    marketplaceMatchedLeads: numberOrZero(record.marketplace_matched_leads),
    marketplaceQuotesSubmitted: numberOrZero(
      record.marketplace_quotes_submitted,
    ),
    marketplaceQuotesAccepted: numberOrZero(record.marketplace_quotes_accepted),
    marketplaceJobsWon: numberOrZero(record.marketplace_jobs_won),
    marketplaceCompletedJobs: numberOrZero(record.marketplace_completed_jobs),
    marketplaceLeadToQuoteRate: numberOrZero(
      record.marketplace_lead_to_quote_rate,
    ),
    marketplaceQuoteToJobRate: numberOrZero(
      record.marketplace_quote_to_job_rate,
    ),
    marketplaceLeadToJobRate: numberOrZero(record.marketplace_lead_to_job_rate),
  }
}

function mapDealPerformance(record) {
  return {
    dealId: record.deal_id,
    dealName: record.deal_name,
    category: record.category,
    status: record.deal_status,
    claims: numberOrZero(record.claims),
    redemptions: numberOrZero(record.redemptions),
    claimCohortRedemptions: numberOrZero(record.claim_cohort_redemptions),
    claimToRedemptionRate: numberOrZero(record.claim_to_redemption_rate),
    uniqueCustomers: numberOrZero(record.unique_customers),
    recordedTransactionValueCents: nullableNumber(
      record.recorded_transaction_value_cents,
    ),
    recordedCustomerSavingsCents: nullableNumber(
      record.recorded_customer_savings_cents,
    ),
    averageRecordedTransactionCents: nullableNumber(
      record.average_recorded_transaction_cents,
    ),
    redemptionsWithTransactionValue: numberOrZero(
      record.redemptions_with_transaction_value,
    ),
  }
}

function mapLoyaltyProgrammePerformance(record) {
  return {
    programmeId: record.programme_id,
    programmeName: record.programme_name,
    programmeType: record.programme_type,
    status: record.programme_status,
    totalCustomers: numberOrZero(record.total_customers),
    activeCustomers: numberOrZero(record.active_customers),
    progressEvents: numberOrZero(record.progress_events),
    progressAmount: numberOrZero(record.progress_amount),
    rewardsEarned: numberOrZero(record.rewards_earned),
    rewardsRedeemed: numberOrZero(record.rewards_redeemed),
  }
}

export async function fetchBusinessDashboardMetrics(options) {
  const { data, error } = await supabase
    .rpc('get_business_dashboard_metrics', analyticsParameters(options))
    .single()

  if (error) throw error
  return mapDashboardMetrics(data)
}

export async function fetchBusinessDealPerformance(options) {
  const { data, error } = await supabase.rpc(
    'get_business_deal_performance',
    analyticsParameters(options),
  )

  if (error) throw error
  return (data ?? []).map(mapDealPerformance)
}

export async function fetchBusinessLoyaltyProgrammePerformance(options) {
  const { data, error } = await supabase.rpc(
    'get_business_loyalty_programme_performance',
    analyticsParameters(options),
  )

  if (error) throw error
  return (data ?? []).map(mapLoyaltyProgrammePerformance)
}
