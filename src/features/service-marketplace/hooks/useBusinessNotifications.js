import { useCallback, useEffect, useMemo, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import { supabase } from '../../../lib/supabase'
import {
  fetchBusinessNotifications,
  markBusinessNotificationsRead,
} from '../api/businessNotifications'
import {
  notifyBusinessMarketplaceChanged,
  subscribeToBusinessMarketplaceChanges,
} from '../marketplaceEvents'

const NOTIFICATION_REFRESH_INTERVAL = 60_000

export default function useBusinessNotifications() {
  const { business, capabilities } = useBusiness()
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const businessId = business?.id
  const isEnabled = Boolean(
    businessId && capabilities.service_marketplace_enabled,
  )

  const refresh = useCallback(async () => {
    if (!isEnabled) {
      setNotifications([])
      return []
    }

    setIsLoading(true)
    try {
      const nextNotifications = await fetchBusinessNotifications(businessId)
      setNotifications(nextNotifications)
      return nextNotifications
    } catch (error) {
      console.error('Unable to load business notifications.', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [businessId, isEnabled])

  useEffect(() => {
    const initialRefreshTimer = window.setTimeout(refresh, 0)
    if (!isEnabled) {
      return () => window.clearTimeout(initialRefreshTimer)
    }

    const refreshTimer = window.setInterval(
      refresh,
      NOTIFICATION_REFRESH_INTERVAL,
    )
    const unsubscribeFromMarketplace = subscribeToBusinessMarketplaceChanges(
      (changedBusinessId) => {
        if (changedBusinessId === businessId) refresh()
      },
    )

    const channel = supabase
      .channel(`business-notifications:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'business_notifications',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          refresh()
          notifyBusinessMarketplaceChanged(businessId)
        },
      )
      .subscribe()

    return () => {
      window.clearTimeout(initialRefreshTimer)
      window.clearInterval(refreshTimer)
      unsubscribeFromMarketplace()
      supabase.removeChannel(channel)
    }
  }, [businessId, isEnabled, refresh])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const markAllRead = useCallback(
    async (items = notifications) => {
      const unreadIds = items
        .filter((notification) => !notification.read_at)
        .map((notification) => notification.notification_id)
      if (!businessId || unreadIds.length === 0) return

      const readAt = new Date().toISOString()
      setNotifications((current) =>
        current.map((notification) =>
          unreadIds.includes(notification.notification_id)
            ? { ...notification, read_at: readAt }
            : notification,
        ),
      )

      try {
        await markBusinessNotificationsRead(businessId, unreadIds)
      } catch (error) {
        console.error('Unable to mark business notifications as read.', error)
        refresh()
      }
    },
    [businessId, notifications, refresh],
  )

  return { notifications, unreadCount, isLoading, refresh, markAllRead }
}
