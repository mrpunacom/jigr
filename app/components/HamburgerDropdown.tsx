'use client'

import { useEffect, useRef } from 'react'
import { getMappedIcon } from '@/lib/image-storage'

interface HamburgerDropdownProps {
  isOpen: boolean
  onClose: () => void
  currentModule: string
}

export function HamburgerDropdown({ isOpen, onClose, currentModule }: HamburgerDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Add listeners with a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }, 100)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const modules = [
    { 
      key: 'upload', 
      name: 'Upload', 
      href: '/upload/console',
      icon: 'JiGRuploadWhite',
      active: true,
      description: 'Document scanning and processing'
    },
    { 
      key: 'admin', 
      name: 'Admin', 
      href: '/admin/console',
      icon: 'JiGRadmin2',
      active: true,
      description: 'User management and system settings'
    },
    { 
      key: 'stock', 
      name: 'Stock', 
      href: '/stock/items',
      icon: 'JiGRstockWhite',
      active: true,
      description: 'Inventory management and tracking'
    },
    { 
      key: 'temperature', 
      name: 'Temperature', 
      href: '#',
      icon: 'JiGRtemp',
      active: false,
      description: 'Fridge and freezer monitoring'
    },
    { 
      key: 'repairs', 
      name: 'Repairs', 
      href: '#',
      icon: 'JiGRrepairs',
      active: false,
      description: 'Equipment maintenance and repair tracking'
    },
    { 
      key: 'menu', 
      name: 'Menu', 
      href: '/menu/console',
      icon: 'JiGRmenus',
      active: true,
      description: 'Menu engineering and profitability analysis'
    },
    { 
      key: 'diary', 
      name: 'Diary', 
      href: '#',
      icon: 'JiGRdiaryWhite',
      active: false,
      description: 'Daily logs and incident reporting'
    },
    { 
      key: 'recipes', 
      name: 'Recipes', 
      href: '/recipes/console',
      icon: 'JiGRrecipes',
      active: true,
      description: 'Recipe management and production planning'
    },
    { 
      key: 'count', 
      name: 'Count', 
      href: '/count/console',
      icon: 'JiGRcount',
      active: true,
      description: 'Stocktake and inventory counting'
    }
  ]

  const handleModuleClick = (module: any) => {
    if (module.active) {
      window.location.href = module.href
      onClose()
    }
  }

  return (
    <>
      {/* Dropdown Panel - Aligned with NavPill top */}
      <div className="fixed right-6 z-50" style={{ top: '205px' }}>
        <div 
          ref={dropdownRef}
          className="bg-[#2d2e4a]/25 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-2xl"
        >
          {/* Header */}
          <div className="text-white text-sm font-semibold mb-3 text-center">
            Available Modules
          </div>
          
          {/* 3x3 Grid of Modules - Same as sidebar */}
          <div className="grid grid-cols-3 gap-3 w-48">
              {modules.map((module) => {
                const isCurrentModule = module.key === currentModule
                
                return (
                  <button
                    key={module.key}
                    onClick={() => handleModuleClick(module)}
                    disabled={!module.active}
                    className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 TouchTarget ${
                      module.active ? 'hover:bg-white/15' : 'opacity-30'
                    }`}
                    title={module.active ? module.description : 'Coming soon'}
                  >
                    {/* Module Icon */}
                    <img 
                      src={getMappedIcon(module.icon as keyof typeof import('@/lib/image-storage').ICON_MAPPING, 40)} 
                      alt={module.name} 
                      className="w-10 h-10 object-contain mb-1"
                    />
                    
                    {/* Module Name */}
                    <span className={`text-xs ${module.active ? 'text-white font-medium' : 'text-white'}`}>
                      {module.name}
                    </span>
                  </button>
                )
              })}
            </div>
          
          {/* Footer - Same as sidebar */}
          <div className="text-center mt-3 pt-3 border-t border-white/10">
            <span className="text-white/60 text-xs">Click module to access</span>
          </div>
        </div>
      </div>
    </>
  )
}