import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuth from '../../../auth/useAuth'
import { supabase } from '../../../lib/supabase'
import {
  fetchCustomerNotifications,
  markCustomerNotificationsRead,
} from '../api/customerNotifications'

const NOTIFICATION_REFRESH_INTERVAL = 60_000

export default function useCustomerNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const customerId = user?.id
  const isEnabled = Boolean(customerId)

  const refresh = useCallback(async () => {
    if (!isEnabled) {
      setNotifications([])
      return []
    }

    setIsLoading(true)
    try {
      const nextNotifications = await fetchCustomerNotifications(customerId)
      setNotifications(nextNotifications)
      return nextNotifications
    } catch (error) {
      console.error('Unable to load customer notifications.', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [customerId, isEnabled])

  useEffect(() => {
    const initialRefreshTimer = window.setTimeout(refresh, 0)
    if (!isEnabled) {
      return () => window.clearTimeout(initialRefreshTimer)
    }

    const refreshTimer = window.setInterval(
      refresh,
      NOTIFICATION_REFRESH_INTERVAL,
    )

    const channel = supabase
      .channel(`customer-notifications:${customerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customer_notifications',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          refresh()
        },
      )
      .subscribe()

    return () => {
      window.clearTimeout(initialRefreshTimer)
      window.clearInterval(refreshTimer)
      supabase.removeChannel(channel)
    }
  }, [customerId, isEnabled, refresh])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const markAllRead = useCallback(
    async (items = notifications) => {
      const unreadIds = items
        .filter((notification) => !notification.read_at)
        .map((notification) => notification.notification_id)
      if (!customerId || unreadIds.length === 0) return

      const readAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((notification) =>
          unreadIds.includes(notification.notification_id)
            ? { ...notification, read_at: readAt }
            : notification,
        ),
      )

      try {
        await markCustomerNotificationsRead(customerId, unreadIds)
      } catch (error) {
        console.error('Unable to mark customer notifications as read.', error)
        refresh()
      }
    },
    [customerId, notifications, refresh],
  )

  return { notifications, unreadCount, isLoading, refresh, markAllRead }
}
