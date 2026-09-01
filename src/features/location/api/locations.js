import { supabase } from '../../../lib/supabase'
import {
  getStoredGuestLocation,
  storeGuestLocation,
} from '../../onboarding/registrationFlow'
import { toSuburbLocation } from '../suburb'

function addressParams(address) {
  return {
    p_formatted_address: address.formattedAddress,
    p_address_line1: address.addressLine1 || address.formattedAddress,
    p_suburb: address.suburb || '',
    p_city: address.city || '',
    p_postcode: address.postcode || '',
    p_country_code: address.countryCode || 'nz',
    p_latitude: address.latitude,
    p_longitude: address.longitude,
  }
}

function mapDatabaseLocation(location) {
  return toSuburbLocation({
    name: location.address_line1 || location.formatted_address,
    formattedAddress: location.formatted_address,
    addressLine1: location.address_line1 || location.formatted_address,
    suburb: location.suburb || '',
    city: location.city || '',
    postcode: location.postcode || '',
    countryCode: location.country_code || 'nz',
    latitude: Number(location.latitude),
    longitude: Number(location.longitude),
  })
}

export async function fetchCustomerLocation() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return getStoredGuestLocation()

  const { data, error } = await supabase.rpc('get_my_location')
  if (error) throw error
  const location = data?.[0]
  return location ? mapDatabaseLocation(location) : null
}

export async function saveCustomerLocation(address) {
  const suburb = storeGuestLocation(address)

  if (!suburb) throw new Error('Choose a New Zealand suburb.')

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return

  const { error } = await supabase.rpc(
    'set_customer_location',
    addressParams(suburb),
  )
  if (error) throw error
}

export async function fetchNearbyBusinesses({
  latitude,
  longitude,
  radiusKm,
  category,
}) {
  const { data, error } = await supabase.rpc('nearby_businesses', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
    p_category: category === 'All' ? null : category,
  })
  if (error) throw error
  return data || []
}

export async function fetchManagedBusinessLocations(businessId) {
  const { data, error } = await supabase
    .from('business_locations')
    .select(
      'id, name, formatted_address, address_line1, suburb, city, postcode, country_code, is_primary',
    )
    .eq('business_id', businessId)
    .order('is_primary', { ascending: false })
    .order('name')
  if (error) throw error
  return data || []
}

export async function addManagedBusinessLocation(businessId, address) {
  const { data, error } = await supabase.rpc('add_business_location', {
    p_business_id: businessId,
    p_name: address.name || address.addressLine1,
    ...addressParams(address),
  })
  if (error) throw error
  return data
}

export async function deleteManagedBusinessLocation(businessId, locationId) {
  const { error } = await supabase
    .from('business_locations')
    .delete()
    .eq('id', locationId)
    .eq('business_id', businessId)
  if (error) throw error
}
