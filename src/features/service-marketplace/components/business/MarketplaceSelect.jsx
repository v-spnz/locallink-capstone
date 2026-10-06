import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Funnel } from 'lucide-react'

export default function MarketplaceSelect({
  label,
  value,
  options,
  onChange,
  variant,
  useLabelForAll = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const triggerRef = useRef(null)
  const listId = useId()
  const selectedLabel = options.find((option) => option.value === value)?.label
  const displayLabel = useLabelForAll && value === 'all' ? label : selectedLabel

  useEffect(() => {
    if (!isOpen) return undefined
    const options = dropdownRef.current?.querySelectorAll('[role="option"]')
    const selected = dropdownRef.current?.querySelector(
      '[aria-selected="true"]',
    )
    ;(selected ?? options?.[0])?.focus()

    function closeOnOutsideClick(event) {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false)
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen])

  return (
    <div
      className={`service-toolbar-select is-${variant}${isOpen ? ' is-open' : ''}`}
      ref={dropdownRef}
      onKeyDown={(event) => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
          return
        }
        const elements = [
          ...dropdownRef.current.querySelectorAll('[role="option"]'),
        ]
        const index = elements.indexOf(document.activeElement)
        const next =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? elements.length - 1
              : (index +
                  (event.key === 'ArrowDown' ? 1 : -1) +
                  elements.length) %
                elements.length
        elements[next]?.focus()
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
      }}
    >
      <button
        type="button"
        className="service-toolbar-select-trigger"
        ref={triggerRef}
        aria-controls={isOpen ? listId : undefined}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {variant === 'filter' && <Funnel aria-hidden="true" />}
        <span>{displayLabel || label}</span>
        {variant !== 'filter' && (
          <ChevronDown className="service-toolbar-chevron" aria-hidden="true" />
        )}
      </button>
      {isOpen && (
        <div
          className="service-toolbar-menu"
          id={listId}
          role="listbox"
          aria-label={label}
        >
          {options.map((option) => (
            <button
              type="button"
              className={option.value === value ? 'is-selected' : ''}
              role="option"
              tabIndex={-1}
              aria-selected={option.value === value}
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
                triggerRef.current?.focus()
              }}
            >
              <span>{option.label}</span>
              {option.value === value && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
