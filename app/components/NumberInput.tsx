'use client'

import { useState, useEffect, useRef } from 'react'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  className?: string
  placeholder?: string
  autoFocus?: boolean
  onEnter?: () => void
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  unit = '',
  className = '',
  placeholder = '0',
  autoFocus = false,
  onEnter
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState(value.toString())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInternalValue(value.toString())
  }, [value])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [autoFocus])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // Allow empty string for clearing
    if (inputValue === '') {
      setInternalValue('')
      onChange(0)
      return
    }
    
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(inputValue)) {
      return
    }
    
    setInternalValue(inputValue)
    
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleBlur = () => {
    // Clean up the display value on blur
    const numValue = parseFloat(internalValue) || 0
    const clampedValue = Math.max(min, Math.min(max, numValue))
    setInternalValue(clampedValue.toString())
    onChange(clampedValue)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter()
    }
  }

  const incrementValue = () => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
  }

  const decrementValue = () => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center bg-white rounded-lg border-2 border-gray-300 focus-within:border-blue-500 shadow-sm">
        {/* Decrement button */}
        <button
          type="button"
          onClick={decrementValue}
          disabled={value <= min}
          className="flex items-center justify-center w-16 h-16 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors"
          style={{ minHeight: '64px', minWidth: '64px' }}
        >
          <span className="icon-[tabler--minus] h-6 w-6"></span>
        </button>

        {/* Number input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={internalValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="w-full h-16 px-4 text-center text-2xl font-bold text-gray-900 bg-transparent border-0 focus:outline-none"
            style={{ fontSize: '2rem', lineHeight: '1', minHeight: '64px' }}
          />
          {unit && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
              {unit}
            </div>
          )}
        </div>

        {/* Increment button */}
        <button
          type="button"
          onClick={incrementValue}
          disabled={value >= max}
          className="flex items-center justify-center w-16 h-16 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors"
          style={{ minHeight: '64px', minWidth: '64px' }}
        >
          <span className="icon-[tabler--plus] h-6 w-6"></span>
        </button>
      </div>

      {/* Quick increment buttons for common values */}
      <div className="mt-3 flex space-x-2 justify-center">
        {[1, 5, 10, 50].map((quickValue) => (
          <button
            key={quickValue}
            type="button"
            onClick={() => onChange(value + quickValue)}
            disabled={value + quickValue > max}
            className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{ minHeight: '40px' }}
          >
            +{quickValue}
          </button>
        ))}
      </div>
    </div>
  )
}