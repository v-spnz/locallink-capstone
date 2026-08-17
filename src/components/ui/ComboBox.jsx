import { useState } from 'react'

export default function ComboBox({
  options = [],
  placeholder = 'Select an option...',
  value,
  onChange,
  maxHeight = 'auto',
  overflowY = 'visible',
  width = '250px',
  prefix,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const query = value ?? ''

  const filteredOptions =
    query === ''
      ? options
      : options.filter((option) =>
          String(option).toLowerCase().includes(String(query).toLowerCase()),
        )

  const handleSelect = (option) => {
    setIsOpen(false)
    onChange?.(option)
  }

  return (
    <div style={{ position: 'relative', width, fontFamily: 'sans-serif' }}>
      {prefix && (
        <span
          style={{
            position: 'absolute',
            left: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6b7280',
            pointerEvents: 'none',
          }}
        >
          {prefix}
        </span>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const newValue = e.target.value
          onChange?.(newValue)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px',
          paddingLeft: prefix ? '20px' : '8px',
          boxSizing: 'border-box',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}
      />
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: 1000,
            maxHeight,
            overflowY,
          }}
        >
          {filteredOptions.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              style={{ padding: '8px', cursor: 'pointer' }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
