import {
  BadgePercent,
  Bell,
  BellRing,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleUserRound,
  FileCheck2,
  Gift,
  LayoutDashboard,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import useBusiness from '../../business/useBusiness'
import useBusinessNotifications from '../../features/service-marketplace/hooks/useBusinessNotifications'
import BrandLogo from './BrandLogo'
import './BusinessNavigation.css'

function getBusinessInitials(name = '') {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  return initials || 'LL'
}

const NOTIFICATION_ICONS = {
  new_lead: UsersRound,
  quote_approved: FileCheck2,
  quote_updated: BellRing,
  quote_deadline_reminder: BellRing,
  job_completed: BriefcaseBusiness,
}

function formatNotificationTime(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getBusinessNotificationDestination(notification) {
  const jobRequestId = notification.related_job_request_id
  const quoteId = notification.related_quote_id
  const notificationId = notification.notification_id
  let tab
  let focusId

  switch (notification.notification_type) {
    case 'new_lead':
      tab = 'leads'
      focusId = jobRequestId
      break
    case 'quote_updated':
    case 'quote_deadline_reminder':
      tab = 'quotes'
      focusId = quoteId
      break
    case 'quote_approved':
      tab = 'jobs'
      focusId = jobRequestId
      break
    case 'job_completed':
      tab = 'history'
      focusId = jobRequestId
      break
    default:
      return notification.destination
  }

  if (!focusId) return notification.destination

  const params = new URLSearchParams({
    tab,
    focus: focusId,
    notification: String(notificationId),
  })
  return `/business/services?${params.toString()}`
}

export default function BusinessNavigation() {
  const { business, capabilities, membership } = useBusiness()
  const location = useLocation()
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)
  const notificationMenuRef = useRef(null)
  const {
    notifications,
    unreadCount,
    isLoading: areNotificationsLoading,
    isDismissing,
    refresh: refreshNotifications,
    markAllRead,
    dismissOne,
    dismissAll,
  } = useBusinessNotifications()
  const canManageBusiness = ['owner', 'admin'].includes(membership.role)
  const businessName = business?.business_name || 'Business account'
  const navigationItems = [
    {
      to: '/business/analytics',
      label: 'Dashboard',
      icon: <LayoutDashboard aria-hidden="true" />,
    },
  ]

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setIsAccountMenuOpen(false)
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isAccountMenuOpen])

  useEffect(() => {
    if (!isNotificationMenuOpen) return undefined

    function closeOnOutsideClick(event) {
      if (!notificationMenuRef.current?.contains(event.target)) {
        setIsNotificationMenuOpen(false)
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setIsNotificationMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isNotificationMenuOpen])

  if (capabilities.deals_enabled) {
    navigationItems.push({
      to: '/business/create-deal',
      label: 'Deals',
      icon: <BadgePercent aria-hidden="true" />,
    })
  }

  if (capabilities.loyalty_enabled) {
    navigationItems.push({
      to: '/business/create-loyalty',
      label: 'Loyalty',
      icon: <Gift aria-hidden="true" />,
    })
  }

  if (capabilities.service_marketplace_enabled) {
    navigationItems.push({
      to: '/business/services',
      label: 'Services',
      icon: <Zap aria-hidden="true" />,
    })
  }

  async function toggleNotificationMenu() {
    setIsAccountMenuOpen(false)
    if (isNotificationMenuOpen) {
      setIsNotificationMenuOpen(false)
      return
    }

    setIsNotificationMenuOpen(true)
    const latestNotifications = await refreshNotifications()
    await markAllRead(latestNotifications)
  }

  return (
    <header className="portal-header business-portal-header">
      <nav className="nav business-nav" aria-label="Business navigation">
        <BrandLogo
          to="/business/analytics"
          badge="Business"
          variant="business"
        />

        <div className="nav-links">
          {navigationItems.map(({ to, label, icon }) => {
            return (
              <NavLink
                key={to}
                className={({ isActive }) =>
                  `nav-btn${isActive ? ' active' : ''}`
                }
                to={to}
              >
                {icon}
                <span>{label}</span>
              </NavLink>
            )
          })}
        </div>

        <div className="business-nav-actions">
          <div
            className={`business-notification-menu${isNotificationMenuOpen ? ' is-open' : ''}`}
            ref={notificationMenuRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsNotificationMenuOpen(false)
              }
            }}
          >
            <button
              type="button"
              className={`business-notification-button${unreadCount > 0 ? ' has-unread' : ''}`}
              aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
              aria-haspopup="menu"
              aria-expanded={isNotificationMenuOpen}
              title="Notifications"
              onClick={toggleNotificationMenu}
            >
              <Bell
                aria-hidden="true"
                fill={unreadCount > 0 ? 'currentColor' : 'none'}
              />
              {unreadCount > 0 && (
                <span
                  className="business-notification-count"
                  aria-hidden="true"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationMenuOpen && (
              <div className="business-notification-dropdown" role="menu">
                <div className="business-notification-heading">
                  <strong>Notifications</strong>
                  <div className="business-notification-heading-actions">
                    {notifications.length > 0 && (
                      <span>{notifications.length} recent</span>
                    )}
                    <button
                      type="button"
                      disabled={notifications.length === 0 || isDismissing}
                      onClick={dismissAll}
                    >
                      {isDismissing ? 'Dismissing…' : 'Dismiss all'}
                    </button>
                  </div>
                </div>

                {areNotificationsLoading && notifications.length === 0 && (
                  <p className="business-notification-empty">Loading…</p>
                )}
                {!areNotificationsLoading && notifications.length === 0 && (
                  <p className="business-notification-empty">
                    You’re all caught up. New leads and job updates will appear
                    here.
                  </p>
                )}
                {notifications.map((notification) => {
                  const NotificationIcon =
                    NOTIFICATION_ICONS[notification.notification_type] ?? Bell

                  return (
                    <div
                      className={`business-notification-item${notification.read_at ? '' : ' is-unread'}`}
                      key={notification.notification_id}
                    >
                      <Link
                        className="business-notification-link"
                        to={getBusinessNotificationDestination(notification)}
                        role="menuitem"
                        onClick={() => setIsNotificationMenuOpen(false)}
                      >
                        <span className="business-notification-icon">
                          <NotificationIcon aria-hidden="true" />
                        </span>
                        <span className="business-notification-copy">
                          <strong>{notification.title}</strong>
                          <span>{notification.message}</span>
                          <time dateTime={notification.created_at}>
                            {formatNotificationTime(notification.created_at)}
                          </time>
                        </span>
                      </Link>
                      <button
                        type="button"
                        className="business-notification-dismiss"
                        aria-label="Dismiss notification"
                        title="Dismiss notification"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void dismissOne(notification.notification_id)
                        }}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          {canManageBusiness ? (
            <div
              className={`business-account-menu${isAccountMenuOpen ? ' is-open' : ''}`}
              ref={accountMenuRef}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setIsAccountMenuOpen(false)
                }
              }}
            >
              <button
                type="button"
                className={`business-account-link${location.pathname.startsWith('/business/settings') ? ' active' : ''}`}
                aria-label="Open business account menu"
                aria-haspopup="menu"
                aria-expanded={isAccountMenuOpen}
                onClick={() => {
                  setIsNotificationMenuOpen(false)
                  setIsAccountMenuOpen((current) => !current)
                }}
              >
                <span className="business-account-avatar" aria-hidden="true">
                  {getBusinessInitials(businessName)}
                </span>
                <span className="business-account-name">{businessName}</span>
                <ChevronDown
                  className="business-account-chevron"
                  aria-hidden="true"
                />
              </button>

              {isAccountMenuOpen && (
                <div className="business-account-dropdown" role="menu">
                  <p>Account</p>
                  <NavLink
                    to="/business/settings/profile"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    <Building2 aria-hidden="true" />
                    <span>Profile &amp; business details</span>
                  </NavLink>
                  <NavLink
                    to="/business/settings/notifications"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                  >
                    <Bell aria-hidden="true" />
                    <span>Notification preferences</span>
                  </NavLink>
                </div>
              )}
            </div>
          ) : (
            <Link className="business-account-link" to="/profile">
              <span className="business-account-avatar" aria-hidden="true">
                <CircleUserRound />
              </span>
              <span className="business-account-name">Profile</span>
              <ChevronDown
                className="business-account-chevron"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
