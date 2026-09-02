import { supabase } from '../../../lib/supabase'

export function fetchAcceptedJobContacts(businessId) {
  return businessId
    ? supabase.rpc('get_accepted_job_contacts', {
        p_business_id: businessId,
      })
    : supabase.rpc('get_accepted_job_contacts')
}
