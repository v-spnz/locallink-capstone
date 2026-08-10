import { useState, useEffect } from 'react'

export default function ComboBox({
  options = [],
  placeholder = 'Select an option...',
  value,
  onChange,
  maxHeight = 'auto',
  overflowY = 'visible'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const toText = (v) => (v === null || v === undefined ? '' : String(v))

  // What's shown in the input. Normally mirrors `value`, but while the user
  // is actively typing we let their exact keystrokes stand even if `value`
  // gets transformed into something else upstream (e.g. an invalid budget
  // turning into NaN) - that way what they typed stays on screen so any
  // validation message about it has something to point at.
  const [inputText, setInputText] = useState(toText(value))

  // Resync from the outside only when not mid-typing (e.g. initial load,
  // form reset, or value changed by something other than this input) AND
  // the value is something actually worth displaying. If `value` is NaN
  // (e.g. a parent did Number("abc") on invalid typed text), don't let it
  // stomp what the user typed - leave the original text on screen so any
  // validation message about it still makes sense.
  useEffect(() => {
    const isInvalidNumber = typeof value === 'number' && Number.isNaN(value)
    if (!isFocused && !isInvalidNumber) {
      setInputText(toText(value))
    }
  }, [value, isFocused])

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

  return (
    <div
      style={{ position: 'relative', width: '250px', fontFamily: 'sans-serif' }}
    >
      <input
        type="text"
        value={inputText}
        onChange={(e) => {
          const newText = e.target.value
          setInputText(newText)
          setIsOpen(true)
          onChange?.(newText)
        }}
        onFocus={() => {
          setIsFocused(true)
          setIsOpen(true)
        }}
        onBlur={() => {
          setIsFocused(false)
          setTimeout(() => setIsOpen(false), 200)
        }}
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