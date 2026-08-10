import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function Modal({
  onClose,
  children,
  maxWidthClassName = 'max-w-2xl',
  widthClassName = 'w-full',
}) {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0)
      document.body.style.paddingRight = `${scrollbarWidth}px`
    window.addEventListener('keydown', handleEsc)
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex h-[100dvh] items-center justify-center overflow-hidden overscroll-none bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`${widthClassName} ${maxWidthClassName} max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

export default Modal
