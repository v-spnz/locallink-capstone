import { Check, ChevronDown } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { LOYALTY_DISCOUNT_PERCENTAGES } from '../businessLoyaltyTemplates'
import { sanitizeDiscountPercentage } from '../businessLoyaltyValidation'

export default function DiscountPercentageCombobox({ value, error, onChange }) {
  const listboxId = useId()
  const fieldRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const query = String(value ?? '')
  const filteredOptions = LOYALTY_DISCOUNT_PERCENTAGES.filter((percentage) =>
    String(percentage).includes(query),
  )

  function openMenu() {
    setIsOpen(true)
    setHighlightedIndex(0)
  }

  function selectPercentage(percentage) {
    onChange(String(percentage))
    setIsOpen(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!isOpen) return openMenu()
      setHighlightedIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1),
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) return openMenu()
      setHighlightedIndex((current) => Math.max(current - 1, 0))
    } else if (event.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      event.preventDefault()
      selectPercentage(filteredOptions[highlightedIndex] ?? filteredOptions[0])
    } else if (event.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="form-group loyalty-percentage-field" ref={fieldRef}>
      <label className="form-label" htmlFor="loyalty-reward-value">
        Discount percentage
        <span className="loyalty-required">Required to publish</span>
      </label>
      <div
        className={`loyalty-percentage-combobox${error ? ' is-invalid' : ''}`}
        onBlur={(event) => {
          if (!fieldRef.current?.contains(event.relatedTarget)) setIsOpen(false)
        }}
      >
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-describedby={error ? 'loyalty-reward-value-error' : undefined}
          aria-expanded={isOpen}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          className="form-input"
          id="loyalty-reward-value"
          inputMode="numeric"
          maxLength="3"
          placeholder="Select or type a percentage"
          role="combobox"
          value={query}
          onChange={(event) => {
            onChange(sanitizeDiscountPercentage(event.target.value))
            openMenu()
          }}
          onClick={openMenu}
          onFocus={openMenu}
          onKeyDown={handleKeyDown}
        />
        <span className="loyalty-percentage-suffix" aria-hidden="true">
          %
        </span>
        <button
          aria-label={
            isOpen ? 'Close percentage options' : 'Open percentage options'
          }
          aria-expanded={isOpen}
          className="loyalty-percentage-toggle"
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        >
          <ChevronDown aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            className="loyalty-percentage-options"
            id={listboxId}
            role="listbox"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((percentage, index) => (
                <button
                  aria-selected={query === String(percentage)}
                  className={index === highlightedIndex ? 'is-highlighted' : ''}
                  key={percentage}
                  role="option"
                  type="button"
                  onClick={() => selectPercentage(percentage)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span>{percentage}%</span>
                  {query === String(percentage) && <Check aria-hidden="true" />}
                </button>
              ))
            ) : (
              <p>No matching percentage</p>
            )}
          </div>
        )}
      </div>
      <span className="loyalty-field-helper">
        Choose from 5% to 100% in steps of 5.
      </span>
      {error && (
        <span
          className="form-error"
          id="loyalty-reward-value-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
}
