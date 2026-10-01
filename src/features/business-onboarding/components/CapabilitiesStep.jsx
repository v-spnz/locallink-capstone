import { Check } from 'lucide-react'
import { CAPABILITY_OPTIONS } from '../businessOnboarding'

export default function CapabilitiesStep({ form, selectedCount, onToggle }) {
  return (
    <div className="business-onboarding-stage">
      <header>
        <h2>Select your LocalLink tools</h2>
        <p>Choose one or more. You can change these later.</p>
      </header>

      <div className="business-capability-options">
        {CAPABILITY_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = form[option.key]

          return (
            <button
              key={option.key}
              type="button"
              className={selected ? 'selected' : ''}
              onClick={() => onToggle(option.key)}
              aria-pressed={selected}
            >
              <span className="business-capability-icon">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
              <Check className="business-capability-check" />
            </button>
          )
        })}
      </div>
      <p className="business-capability-selection-count" role="status">
        {selectedCount}{' '}
        {selectedCount === 1 ? 'tool selected' : 'tools selected'}
      </p>
    </div>
  )
}
