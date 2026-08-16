import { supabase } from '../../../lib/supabase'

export async function fetchBusinessNotifications(businessId, limit = 20) {
  const { data, error } = await supabase.rpc('get_business_notifications', {
    p_business_id: businessId,
    p_limit: limit,
  })

  if (error) throw error
  return data ?? []
}

export async function markBusinessNotificationsRead(
  businessId,
  notificationIds,
) {
  if (!notificationIds.length) return 0

  const { data, error } = await supabase.rpc(
    'mark_business_notifications_read',
    {
      p_business_id: businessId,
      p_notification_ids: notificationIds,
    },
  )

  if (error) throw error
  return data ?? 0
}

export async function dismissBusinessNotifications(businessId) {
  const { data, error } = await supabase.rpc('dismiss_business_notifications', {
    p_business_id: businessId,
  })

  if (error) throw error
  return data ?? 0
}

export async function dismissBusinessNotification(businessId, notificationId) {
  if (!businessId || !notificationId) return 0

  const { data, error } = await supabase.rpc('dismiss_business_notification', {
    p_business_id: businessId,
    p_notification_id: notificationId,
  })

  if (error) throw error
  return Number(data ?? 0)
}
