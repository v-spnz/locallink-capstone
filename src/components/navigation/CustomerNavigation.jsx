import {
  BadgePercent,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Gift,
  House,
  XCircle,
  LoaderCircle,
  Car,
  ClipboardClock,
  Clock,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import useAuth from '../../auth/useAuth'
import useCustomerNotifications from '../../features/service-marketplace/hooks/useCustomerNotifications'
import BrandLogo from './BrandLogo'
import './BusinessNavigation.css'
import { notifyCustomerMarketplaceChanged } from '../../features/service-marketplace/marketplaceEvents'

const navigationItems = [
  { to: '/home', label: 'Home', icon: <House aria-hidden="true" /> },
  {
    to: '/deals',
    label: 'Local deals',
    icon: <BadgePercent aria-hidden="true" />,
  },
  {
    to: '/loyalty',
    label: 'Loyalty rewards',
    icon: <Gift aria-hidden="true" />,
  },
  {
    to: '/jobs',
    label: 'Job requests',
    icon: <BriefcaseBusiness aria-hidden="true" />,
  },
]

const NOTIFICATION_ICONS = {
  new_quote: FileText,
  quote_withdrawn: XCircle,
  job_completed: CheckCircle2,
  job_scheduled: ClipboardClock,
  on_the_way: Car,
  in_progress: LoaderCircle,
  quote_deadline_reminder: Clock,
  deal_ended: BadgePercent,
}

function getConsumerInitials(user) {
  const firstName = user?.user_metadata?.first_name ?? ''
  const lastName = user?.user_metadata?.last_name ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  return initials || user?.email?.[0]?.toUpperCase() || 'LL'
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

export default function CustomerNavigation() {
  const { user } = useAuth()
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false)
  const notificationMenuRef = useRef(null)
  const {
    notifications,
    unreadCount,
    isLoading: areNotificationsLoading,
    refresh: refreshNotifications,
    markAllRead,
    dismissAll,
    deleteNotification,
  } = useCustomerNotifications()

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

  async function toggleNotificationMenu() {
    if (isNotificationMenuOpen) {
      setIsNotificationMenuOpen(false)
      return
    }

    setIsNotificationMenuOpen(true)
    const latestNotifications = await refreshNotifications()
    await markAllRead(latestNotifications)
  }

  return (
    <header className="portal-header business-portal-header customer-portal-header">
      <nav
        className="nav business-nav customer-nav"
        aria-label="Main navigation"
      >
        <BrandLogo to="/home" variant="business" />

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

        <div className="business-nav-actions customer-nav-actions">
          {user && (
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
                        disabled={notifications.length === 0}
                        onClick={dismissAll}
                      >
                        Dismiss all
                      </button>
                    </div>
                  </div>

                  {areNotificationsLoading && notifications.length === 0 && (
                    <p className="business-notification-empty">Loading…</p>
                  )}
                  {!areNotificationsLoading && notifications.length === 0 && (
                    <p className="business-notification-empty">
                      You’re all caught up. Updates on your jobs, quotes and
                      deal claims will appear here.
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
                          to={notification.destination}
                          role="menuitem"
                          onClick={() => {
                            setIsNotificationMenuOpen(false)
                            notifyCustomerMarketplaceChanged(user.id)
                          }}
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
                            void deleteNotification(
                              notification.notification_id,
                            )
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
          )}

          {user ? (
            <NavLink
              className={({ isActive }) =>
                `business-account-link customer-account-link${isActive ? ' active' : ''}`
              }
              to="/profile"
            >
              <span className="business-account-avatar" aria-hidden="true">
                {getConsumerInitials(user)}
              </span>
              <span className="business-account-name">Profile</span>
            </NavLink>
          ) : (
            <div className="portal-auth-links" aria-label="Account actions">
              <Link className="portal-login-link" to="/login" viewTransition>
                Log in
              </Link>
              <Link
                className="portal-create-link"
                to="/register"
                viewTransition
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
