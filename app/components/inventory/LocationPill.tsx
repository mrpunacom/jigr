'use client'

import { InventoryLocation } from '@/types/InventoryTypes'
import { toReactStyleValue, FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, ANIMATIONS } from '@/lib/apple-design-system'

interface LocationPillProps {
  locations: InventoryLocation[]
  selectedLocationId?: string
  onLocationSelect: (locationId: string) => void
  className?: string
}

export function LocationPill({ 
  locations, 
  selectedLocationId, 
  onLocationSelect,
  className = '' 
}: LocationPillProps) {
  // Use only the provided locations, no "All Locations" option
  const allOptions = locations
  
  return (
    <div className={`flex justify-start ${className}`}>
      <div className="flex space-x-0.5 bg-white/90 p-0.5 rounded-full backdrop-blur-md border border-gray-200 shadow-lg overflow-x-auto max-w-full">
        {allOptions.map((location) => {
          const isActive = location.id === selectedLocationId
          const displayName = location.name || `Location ${location.id}`
          
          return (
            <button 
              key={location.id}
              onClick={() => onLocationSelect(location.id)}
              className={`
                flex-shrink-0 text-center rounded-full transition-all duration-300 flex items-center justify-center px-4
                ${isActive 
                  ? 'text-white bg-gray-900 shadow-lg' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              style={{ 
                minHeight: '31px', // 44px * 0.7 = 30.8px ≈ 31px
                fontFamily: FONT_FAMILY,
                fontSize: '12px', // 17pt * 0.7 = 11.9pt ≈ 12px
                fontWeight: isActive ? FONT_WEIGHTS.SEMIBOLD : FONT_WEIGHTS.MEDIUM,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                transition: `all ${ANIMATIONS.STANDARD || '0.2s'} ease`,
                paddingLeft: '8px', // 12 * 0.7 = 8.4 ≈ 8px
                paddingRight: '8px',
                whiteSpace: 'nowrap'
              }}
            >
              {displayName}
            </button>
          )
        })}
      </div>
    </div>
  )
}