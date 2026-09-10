import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const TOAST_DURATION = 6000

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

export default function ActionToast({
  message,
  variant = 'success',
  onDismiss,
}) {
  const dismissRef = useRef(onDismiss)
  const Icon = TOAST_ICONS[variant] ?? Info
  const isError = variant === 'error'

  useEffect(() => {
    dismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    const timer = window.setTimeout(
      () => dismissRef.current?.(),
      TOAST_DURATION,
    )

    return () => window.clearTimeout(timer)
  }, [message])

  return createPortal(
    <div
      className={`action-toast is-${variant}`}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="action-toast-icon" aria-hidden="true">
        <Icon />
      </span>
      <p>{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss ${variant} notification`}
        title="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
    </div>,
    document.body,
  )
}
