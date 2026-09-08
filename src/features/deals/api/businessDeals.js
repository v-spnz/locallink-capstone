import { supabase } from '../../../lib/supabase'
import { selectBusinessDealLocation } from '../businessLocation'

const DEAL_FIELDS = `
  id,
  business_id,
  title,
  description,
  category,
  image_url,
  offer_type,
  discount_percentage,
  discount_amount_cents,
  original_price_cents,
  deal_price_cents,
  offer_details,
  gst_included,
  start_date,
  end_date,
  conditions,
  claim_limit,
  exclusions,
  redemption_instructions,
  status,
  published_at,
  created_at,
  updated_at,
  locations:business_deal_locations(location_id)
`

function fromCents(value) {
  return value == null ? '' : (value / 100).toFixed(2).replace(/\.00$/, '')
}

function toCents(value) {
  return value ? Math.round(Number(value) * 100) : null
}

export function mapBusinessDeal(record) {
  return {
    id: record.id,
    businessId: record.business_id,
    title: record.title || '',
    description: record.description || '',
    category: record.category || '',
    imageUrl: record.image_url || '',
    imageFile: null,
    offerType: record.offer_type || '',
    discountPercentage:
      record.discount_percentage == null
        ? ''
        : String(record.discount_percentage).replace(/\.00$/, ''),
    discountAmount: fromCents(record.discount_amount_cents),
    originalPrice: fromCents(record.original_price_cents),
    dealPrice: fromCents(record.deal_price_cents),
    offerDetails: record.offer_details || '',
    gstIncluded: 'included',
    locationIds: (record.locations || []).map(({ location_id }) => location_id),
    startDate: record.start_date || '',
    endDate: record.end_date || '',
    conditions: record.conditions || '',
    claimLimit: record.claim_limit == null ? '' : String(record.claim_limit),
    exclusions: record.exclusions || '',
    redemptionInstructions: record.redemption_instructions || '',
    status: record.status || 'draft',
    publishedAt: record.published_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }
}

export async function fetchBusinessDeals(businessId) {
  const [dealsResult, locationsResult] = await Promise.all([
    supabase
      .from('business_deals')
      .select(DEAL_FIELDS)
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('business_locations')
      .select('id, name, address_line1, suburb, city, postcode, is_primary')
      .eq('business_id', businessId)
      .order('is_primary', { ascending: false })
      .order('name'),
  ])

  if (dealsResult.error) throw dealsResult.error
  if (locationsResult.error) throw locationsResult.error

  const businessLocation = selectBusinessDealLocation(
    locationsResult.data || [],
  )

  return {
    deals: (dealsResult.data || []).map(mapBusinessDeal),
    locations: businessLocation ? [businessLocation] : [],
  }
}

async function uploadDealImage(file, businessId) {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${businessId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from('deal-images')
    .upload(path, file)
  if (error) throw error

  const { data } = supabase.storage.from('deal-images').getPublicUrl(path)
  return data.publicUrl
}

function nullableText(value) {
  const trimmed = String(value ?? '').trim()
  return trimmed || null
}

export async function saveBusinessDeal({ businessId, deal, status = 'draft' }) {
  const imageUrl = deal.imageFile
    ? await uploadDealImage(deal.imageFile, businessId)
    : deal.imageUrl || null

  const payload = {
    business_id: businessId,
    title: nullableText(deal.title),
    description: nullableText(deal.description),
    category: nullableText(deal.category),
    image_url: imageUrl,
    offer_type: nullableText(deal.offerType),
    discount_percentage:
      deal.offerType === 'percentage_discount' && deal.discountPercentage
        ? Number(deal.discountPercentage)
        : null,
    discount_amount_cents:
      deal.offerType === 'fixed_discount' ? toCents(deal.discountAmount) : null,
    original_price_cents:
      deal.offerType === 'special_price' ? toCents(deal.originalPrice) : null,
    deal_price_cents:
      deal.offerType === 'special_price' ? toCents(deal.dealPrice) : null,
    offer_details: ['buy_one_get_one', 'other'].includes(deal.offerType)
      ? nullableText(deal.offerDetails)
      : null,
    gst_included: true,
    start_date: deal.startDate || null,
    end_date: deal.endDate || null,
    conditions: nullableText(deal.conditions),
    claim_limit: deal.claimLimit ? Number(deal.claimLimit) : null,
    exclusions: nullableText(deal.exclusions),
    redemption_instructions: nullableText(deal.redemptionInstructions),
  }

  const { data: savedDealId, error: saveError } = await supabase.rpc(
    'save_business_deal',
    {
      p_deal_id: deal.id,
      p_business_id: payload.business_id,
      p_title: payload.title,
      p_description: payload.description,
      p_category: payload.category,
      p_image_url: payload.image_url,
      p_offer_type: payload.offer_type,
      p_discount_percentage: payload.discount_percentage,
      p_discount_amount_cents: payload.discount_amount_cents,
      p_original_price_cents: payload.original_price_cents,
      p_deal_price_cents: payload.deal_price_cents,
      p_offer_details: payload.offer_details,
      p_start_date: payload.start_date,
      p_end_date: payload.end_date,
      p_conditions: payload.conditions,
      p_claim_limit: payload.claim_limit,
      p_exclusions: payload.exclusions,
      p_redemption_instructions: payload.redemption_instructions,
      p_location_ids: deal.locationIds,
      p_status: status,
    },
  )
  if (saveError) throw saveError

  const { data: saved, error: refreshError } = await supabase
    .from('business_deals')
    .select(DEAL_FIELDS)
    .eq('id', savedDealId)
    .eq('business_id', businessId)
    .single()
  if (refreshError) throw refreshError
  return mapBusinessDeal(saved)
}
