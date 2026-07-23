import { useState } from 'react';

export default function ComboBox({ options = [], placeholder = "Select an option...", value, onChange }) {
  const [query, setQuery] = useState(value !== undefined ? value : "");
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = value !== undefined ? value : query;

  const filteredOptions = query === "" 
    ? options 
    : options.filter((option) => 
        option.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (option) => {
    setQuery(option);
    setIsOpen(false);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div style={{ position: 'relative', width: '250px', fontFamily: 'sans-serif' }}>
      {}
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            setIsOpen(true);
            if (newValue === "") {
                onChange && onChange(""); 
            }
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)} 
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px',
          boxSizing: 'border-box',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          {filteredOptions.map((option) => (
            <div
              key={option}
              onClick={() => handleSelect(option)}
              style={{
                padding: '8px',
                cursor: 'pointer'
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
    );
}
