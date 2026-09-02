import { supabase } from '../../../lib/supabase'

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
      .select('id, name')
      .eq('business_id', businessId)
      .order('name'),
  ])

  if (dealsResult.error) throw dealsResult.error
  if (locationsResult.error) throw locationsResult.error

  return {
    deals: (dealsResult.data || []).map(mapBusinessDeal),
    locations: locationsResult.data || [],
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
    status: 'draft',
  }

  const dealQuery = deal.id
    ? supabase
        .from('business_deals')
        .update(payload)
        .eq('id', deal.id)
        .eq('business_id', businessId)
    : supabase.from('business_deals').insert(payload)

  const { data: savedDraft, error: saveError } = await dealQuery
    .select(DEAL_FIELDS)
    .single()
  if (saveError) throw saveError

  const { error: removeLocationsError } = await supabase
    .from('business_deal_locations')
    .delete()
    .eq('deal_id', savedDraft.id)
  if (removeLocationsError) throw removeLocationsError

  if (deal.locationIds.length > 0) {
    const { error: locationError } = await supabase
      .from('business_deal_locations')
      .insert(
        deal.locationIds.map((locationId) => ({
          deal_id: savedDraft.id,
          location_id: locationId,
        })),
      )
    if (locationError) throw locationError
  }

  if (status === 'published') {
    const { data: published, error: publishError } = await supabase
      .from('business_deals')
      .update({ status: 'published' })
      .eq('id', savedDraft.id)
      .eq('business_id', businessId)
      .select(DEAL_FIELDS)
      .single()
    if (publishError) throw publishError
    return mapBusinessDeal(published)
  }

  const { data: refreshed, error: refreshError } = await supabase
    .from('business_deals')
    .select(DEAL_FIELDS)
    .eq('id', savedDraft.id)
    .single()
  if (refreshError) throw refreshError
  return mapBusinessDeal(refreshed)
}
