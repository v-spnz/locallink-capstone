import { useCallback, useEffect, useMemo, useState } from 'react'
import useBusiness from '../../../business/useBusiness'
import { supabase } from '../../../lib/supabase'
import {
  dismissBusinessNotification,
  dismissBusinessNotifications,
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
  const [dismissedIds, setDismissedIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const businessId = business?.id
  const isEnabled = Boolean(
    businessId && capabilities.service_marketplace_enabled,
  )

  const refresh = useCallback(async () => {
    if (!isEnabled) {
      setNotifications([])
      setDismissedIds(new Set())
      return []
    }

    setIsLoading(true)
    try {
      const nextNotifications = await fetchBusinessNotifications(businessId)
      const visibleNotifications = nextNotifications.filter(
        (notification) => !dismissedIds.has(notification.notification_id),
      )
      setNotifications(visibleNotifications)
      return visibleNotifications
    } catch (error) {
      console.error('Unable to load business notifications.', error)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [businessId, dismissedIds, isEnabled])

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

  const dismissAll = useCallback(async () => {
    if (!businessId || notifications.length === 0) return false

    setIsDismissing(true)
    setNotifications([])
    try {
      await dismissBusinessNotifications(businessId)
      return true
    } catch (error) {
      console.error('Unable to dismiss business notifications.', error)
      await refresh()
      return false
    } finally {
      setIsDismissing(false)
    }
  }, [businessId, notifications.length, refresh])

  const dismissOne = useCallback(
    async (notificationId) => {
      if (!businessId || !notificationId) return false

      setDismissedIds((current) => {
        const next = new Set(current)
        next.add(notificationId)
        return next
      })
      setNotifications((current) =>
        current.filter(
          (notification) => notification.notification_id !== notificationId,
        ),
      )

      try {
        const deletedCount = await dismissBusinessNotification(
          businessId,
          notificationId,
        )
        if (deletedCount > 0) return true
      } catch (error) {
        console.error('Unable to dismiss business notification.', error)
      }

      setDismissedIds((current) => {
        const next = new Set(current)
        next.delete(notificationId)
        return next
      })
      await refresh()
      return false
    },
    [businessId, refresh],
  )

  return {
    notifications,
    unreadCount,
    isLoading,
    isDismissing,
    refresh,
    markAllRead,
    dismissOne,
    dismissAll,
  }
}
