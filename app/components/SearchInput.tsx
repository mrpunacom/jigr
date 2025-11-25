'use client'

import { useState, useEffect } from 'react'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  debounce?: number
  className?: string
}

export function SearchInput({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  debounce = 300,
  className = ''
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(value)

  useEffect(() => {
    setInternalValue(value)
  }, [value])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue)
      }
    }, debounce)

    return () => clearTimeout(timer)
  }, [internalValue, onChange, debounce, value])

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="icon-[tabler--search] h-5 w-5 text-gray-400"></span>
      </div>
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/90 backdrop-blur-sm"
        style={{ minHeight: '48px' }} // iPad Air touch target
      />
    </div>
  )
}