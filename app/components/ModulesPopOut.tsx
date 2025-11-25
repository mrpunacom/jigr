'use client'

import { useState } from 'react'
import { getMappedIcon } from '@/lib/image-storage'
import { logger } from '@/lib/console-utils'

interface ModulesPopOutProps {
  isVisible: boolean
  onClose: () => void
  triggerElement?: HTMLElement | null
}

export function ModulesPopOut({ isVisible, onClose, triggerElement }: ModulesPopOutProps) {
  if (!isVisible) return null

  // Calculate position relative to trigger element
  const triggerRect = triggerElement?.getBoundingClientRect()
  const leftPosition = triggerRect ? triggerRect.right - 30 : 130 // Move left for small overlap
  const topPosition = 145 // Position aligned with divider below client logo

  return (
    <>
      {/* Overlay to close pop-out */}
      <div 
        className="fixed inset-0 z-30"
        onClick={onClose}
      />
      
      {/* Pop-out Panel */}
      <div 
        className="fixed z-40 bg-black/20 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl"
        style={{
          left: leftPosition,
          top: topPosition,
          transform: 'translateY(-50%)'
        }}
      >
        {/* Header */}
        <div className="text-white text-sm font-semibold mb-3 text-center">
          Available Modules
        </div>
        
        {/* 3x3 Grid of Modules */}
        <div className="grid grid-cols-3 gap-3 w-48">
          {/* Row 1 */}
          <button
            onClick={() => {
              window.location.href = '/upload/console'
              onClose()
            }}
            className="flex flex-col items-center p-3 hover:bg-white/10 rounded-lg transition-all duration-200 TouchTarget"
            title="Upload Module - Document scanning and processing"
          >
            <img 
              src={getMappedIcon('JiGRuploadWhite', 40)} 
              alt="Upload" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs font-medium">Upload</span>
          </button>
          
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRstockWhite', 40)} 
              alt="Stock" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Stock</span>
          </div>
          
          <button
            onClick={() => {
              window.location.href = '/vendors/console'
              onClose()
            }}
            className="flex flex-col items-center p-3 hover:bg-white/10 rounded-lg transition-all duration-200 TouchTarget"
            title="Vendors Module - Supplier and vendor management"
          >
            <img 
              src={getMappedIcon('JiGRtemp', 40)} 
              alt="Vendors" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs font-medium">Vendors</span>
          </button>
          
          {/* Row 2 */}
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRrepairs', 40)} 
              alt="Repairs" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Repairs</span>
          </div>
          
          <button
            onClick={() => {
              window.location.href = '/admin/console'
              onClose()
            }}
            className="flex flex-col items-center p-3 hover:bg-white/10 rounded-lg transition-all duration-200 TouchTarget"
            title="Admin Module - User management and system settings"
          >
            <img 
              src={getMappedIcon('JiGRadmin2', 40)} 
              alt="Admin" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs font-medium">Admin</span>
          </button>
          
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRmenus', 40)} 
              alt="Menus" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Menus</span>
          </div>
          
          {/* Row 3 */}
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRdiaryWhite', 40)} 
              alt="Diary" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Diary</span>
          </div>
          
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRrecipes', 40)} 
              alt="Recipes" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Recipes</span>
          </div>
          
          <div className="flex flex-col items-center p-3 opacity-30">
            <img 
              src={getMappedIcon('JiGRstocktake', 40)} 
              alt="Stocktake" 
              className="w-10 h-10 object-contain mb-1"
            />
            <span className="text-white text-xs">Stocktake</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-3 pt-3 border-t border-white/10">
          <span className="text-white/60 text-xs">Click module to access</span>
        </div>
      </div>
    </>
  )
}