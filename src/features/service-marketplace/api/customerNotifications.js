import { supabase } from '../../../lib/supabase'

export async function fetchCustomerNotifications(customerId, limit = 20) {
  const { data, error } = await supabase.rpc('get_customer_notifications', {
    p_customer_id: customerId,
    p_limit: limit,
  })

  if (error) throw error
  return data ?? []
}

export async function markCustomerNotificationsRead(
  customerId,
  notificationIds,
) {
  if (!notificationIds.length) return 0

  const { data, error } = await supabase.rpc(
    'mark_customer_notifications_read',
    {
      p_customer_id: customerId,
      p_notification_ids: notificationIds,
    },
  )

  if (error) throw error
  return data ?? 0
}
