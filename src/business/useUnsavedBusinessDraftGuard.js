import { useEffect, useRef, useState } from 'react'

export default function useUnsavedBusinessDraftGuard({
  isActive,
  navigate,
  onSaveDraft,
}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLeaveConfirmationOpen, setIsLeaveConfirmationOpen] = useState(false)
  const pendingLeaveActionRef = useRef(null)
  const pendingLeaveIsNavigationRef = useRef(false)

  useEffect(() => {
    if (!hasUnsavedChanges || !isActive) return undefined

    function warnBeforeUnload(event) {
      event.preventDefault()
      event.returnValue = ''
    }

    function warnBeforeInternalNavigation(event) {
      const link = event.target.closest?.('a[href]')
      const href = link?.getAttribute('href')
      if (
        !link ||
        !href ||
        href.startsWith('#') ||
        link.target === '_blank' ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return

      event.preventDefault()
      event.stopPropagation()
      const destination = new URL(link.href, window.location.href)
      pendingLeaveActionRef.current = () => {
        if (destination.origin === window.location.origin) {
          navigate(
            `${destination.pathname}${destination.search}${destination.hash}`,
          )
        } else {
          window.location.assign(destination.href)
        }
      }
      pendingLeaveIsNavigationRef.current = true
      setIsLeaveConfirmationOpen(true)
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', warnBeforeInternalNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', warnBeforeInternalNavigation, true)
    }
  }, [hasUnsavedChanges, isActive, navigate])

  function requestLeave(leave) {
    if (!hasUnsavedChanges) {
      leave()
      return
    }

    pendingLeaveActionRef.current = leave
    pendingLeaveIsNavigationRef.current = false
    setIsLeaveConfirmationOpen(true)
  }

  function cancelLeave() {
    pendingLeaveActionRef.current = null
    pendingLeaveIsNavigationRef.current = false
    setIsLeaveConfirmationOpen(false)
  }

  function discardAndLeave() {
    const leave = pendingLeaveActionRef.current
    pendingLeaveActionRef.current = null
    pendingLeaveIsNavigationRef.current = false
    setIsLeaveConfirmationOpen(false)
    setHasUnsavedChanges(false)
    leave?.()
  }

  async function saveDraftAndLeave() {
    const leave = pendingLeaveActionRef.current
    const shouldNavigate = pendingLeaveIsNavigationRef.current
    const saved = await onSaveDraft()
    if (!saved) return
    pendingLeaveActionRef.current = null
    pendingLeaveIsNavigationRef.current = false
    setIsLeaveConfirmationOpen(false)
    if (shouldNavigate) leave?.()
  }

  return {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    isLeaveConfirmationOpen,
    requestLeave,
    cancelLeave,
    discardAndLeave,
    saveDraftAndLeave,
  }
}
