import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '../auth/useAuth'
import { supabase } from '../lib/supabase'
import BusinessContext from './BusinessContext'

const EMPTY_CAPABILITIES = {
  deals_enabled: false,
  loyalty_enabled: false,
  service_marketplace_enabled: false,
}

export default function BusinessProvider({ children }) {
  const { user, isLoading: isAuthLoading } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState({
    membership: null,
    business: null,
    capabilities: EMPTY_CAPABILITIES,
    serviceProfile: null,
    serviceCategories: [],
    serviceAreas: [],
    isLoading: true,
    error: '',
  })

  const loadBusiness = useCallback(async () => {
    if (isAuthLoading) return

    if (!userId) {
      setState((current) => ({
        ...current,
        membership: null,
        business: null,
        capabilities: EMPTY_CAPABILITIES,
        serviceProfile: null,
        serviceCategories: [],
        serviceAreas: [],
        isLoading: false,
        error: '',
      }))
      return
    }

    setState((current) => ({
      ...current,
      isLoading: !current.business,
      error: '',
    }))

    const { data: membership, error: membershipError } = await supabase
      .from('business_members')
      .select('business_id, role, created_at')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (membershipError) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: 'Unable to load your business access.',
      }))
      return
    }

    if (!membership) {
      setState({
        membership: null,
        business: null,
        capabilities: EMPTY_CAPABILITIES,
        serviceProfile: null,
        serviceCategories: [],
        serviceAreas: [],
        isLoading: false,
        error: '',
      })
      return
    }

    const [
      businessResult,
      capabilityResult,
      serviceProfileResult,
      categoryResult,
      areaResult,
    ] = await Promise.all([
      supabase
        .from('businesses')
        .select(
          'id, business_name, description, verification_status, onboarding_completed_at',
        )
        .eq('id', membership.business_id)
        .single(),
      supabase
        .from('business_capabilities')
        .select('deals_enabled, loyalty_enabled, service_marketplace_enabled')
        .eq('business_id', membership.business_id)
        .single(),
      supabase
        .from('business_service_profiles')
        .select('service_description, availability')
        .eq('business_id', membership.business_id)
        .maybeSingle(),
      supabase
        .from('business_service_categories')
        .select('id, service_category')
        .eq('business_id', membership.business_id)
        .order('service_category'),
      supabase
        .from('business_service_areas')
        .select('id, service_area')
        .eq('business_id', membership.business_id)
        .order('service_area'),
    ])

    const loadError =
      businessResult.error ||
      capabilityResult.error ||
      serviceProfileResult.error ||
      categoryResult.error ||
      areaResult.error

    if (loadError) {
      setState((current) => ({
        ...current,
        isLoading: false,
        error: 'Unable to load your business account.',
      }))
      return
    }

    setState({
      membership,
      business: businessResult.data,
      capabilities: capabilityResult.data,
      serviceProfile: serviceProfileResult.data,
      serviceCategories: categoryResult.data ?? [],
      serviceAreas: areaResult.data ?? [],
      isLoading: false,
      error: '',
    })
  }, [isAuthLoading, userId])

  useEffect(() => {
    const loadTimer = window.setTimeout(loadBusiness, 0)

    return () => window.clearTimeout(loadTimer)
  }, [loadBusiness])

  const value = useMemo(
    () => ({ ...state, refreshBusiness: loadBusiness }),
    [loadBusiness, state],
  )

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}
