import { supabase } from '../lib/supabase'

export async function getDefaultAuthenticatedPath(user) {
  if (!user) return '/login'

  const { data, error } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('profile_id', user.id)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (data) return '/business/analytics'

  return user.user_metadata?.registration_intent === 'business'
    ? '/business/onboarding'
    : '/home'
}
