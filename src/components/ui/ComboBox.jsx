import { useState } from 'react'

const toText = (v) => (v === null || v === undefined ? '' : String(v))

export default function ComboBox({
  options = [],
  placeholder = 'Select an option...',
  value,
  onChange,
  maxHeight = 'auto',
  overflowY = 'visible',
}) {
  const [isOpen, setIsOpen] = useState(false)

  const [inputText, setInputText] = useState(toText(value))

  const filteredOptions =
    inputText === ''
      ? options
      : options.filter((option) =>
          String(option).toLowerCase().includes(inputText.toLowerCase()),
        )

  const handleSelect = (option) => {
    setIsOpen(false)
    setInputText(toText(option))
    onChange?.(option)
  }

  const handleInputChange = (e) => {
    const newText = e.target.value
    setInputText(newText)
    setIsOpen(true)
    onChange?.(newText)
  }

  const handleBlur = () => {
    setTimeout(() => setIsOpen(false), 200)
    const isInvalidNumber = typeof value === 'number' && Number.isNaN(value)
    if (!isInvalidNumber) {
      setInputText(toText(value))
    }
  }

  return (
    <div
      style={{ position: 'relative', width: '250px', fontFamily: 'sans-serif' }}
    >
      <input
        type="text"
        value={inputText}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px',
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
            maxHeight: maxHeight,
            overflowY: overflowY,
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
