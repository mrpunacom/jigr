'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdvancedBarcodeScanner } from '@/app/components/barcode/AdvancedBarcodeScanner'

interface ScanResult {
  barcode: string
  product?: {
    id: string
    name: string
    brand?: string
    category?: string
    images?: string[]
  }
  inventory?: {
    current_stock: number
    par_level_low?: number
    unit: string
    location?: string
  }
  timestamp: number
  status: 'found' | 'not_found' | 'processing'
}

export default function ScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get workflow type from URL params
  const workflowType = (searchParams.get('workflow') as any) || 'lookup'
  const returnUrl = searchParams.get('return')

  const [sessionScans, setSessionScans] = useState<ScanResult[]>([])

  const handleScanResult = (result: ScanResult) => {
    setSessionScans(prev => {
      // Update existing or add new
      const existingIndex = prev.findIndex(
        item => item.barcode === result.barcode && 
                item.timestamp === result.timestamp
      )
      
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = result
        return updated
      } else {
        return [result, ...prev]
      }
    })

    // Handle specific workflow actions
    if (result.status === 'found') {
      handleWorkflowAction(result)
    }
  }

  const handleWorkflowAction = (result: ScanResult) => {
    switch (workflowType) {
      case 'inventory_count':
        // For inventory counting, navigate to count page with pre-filled data
        if (result.product) {
          const countUrl = `/stock/count?item_id=${result.product.id}&barcode=${result.barcode}&item_name=${encodeURIComponent(result.product.name)}`
          router.push(countUrl)
        }
        break
        
      case 'stock_update':
        // For stock updates, show quick update modal or navigate to item page
        if (result.product) {
          router.push(`/stock/items/${result.product.id}?action=update&barcode=${result.barcode}`)
        }
        break
        
      case 'receiving':
        // For receiving workflow, navigate to receiving page
        router.push(`/stock/batches/new?barcode=${result.barcode}`)
        break
        
      case 'lookup':
      default:
        // For lookup, just display results (already handled by scanner component)
        break
    }
  }

  const handleClose = () => {
    if (returnUrl) {
      router.push(returnUrl)
    } else {
      router.back()
    }
  }

  // Page metadata for different workflows
  useEffect(() => {
    const titles = {
      inventory_count: 'Inventory Count Scanner',
      stock_update: 'Stock Update Scanner',
      receiving: 'Receiving Scanner',
      lookup: 'Barcode Lookup'
    }
    
    document.title = titles[workflowType as keyof typeof titles] || 'Barcode Scanner'
  }, [workflowType])

  return (
    <div className="h-screen overflow-hidden">
      <AdvancedBarcodeScanner
        workflowType={workflowType}
        onScanResult={handleScanResult}
        onClose={handleClose}
        showHistory={true}
        autoLookup={true}
        className="h-full"
      />
      
      {/* Session Summary (floating overlay for multi-scan workflows) */}
      {(workflowType === 'inventory_count' || workflowType === 'receiving') && sessionScans.length > 0 && (
        <div className="fixed top-20 right-4 z-30 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/20 max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-white">Session</h4>
            <span className="text-xs text-gray-400">{sessionScans.length} items</span>
          </div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sessionScans.slice(0, 5).map((scan, index) => (
              <div key={`${scan.barcode}-${index}`} className="text-xs text-white/80 flex justify-between">
                <span className="truncate flex-1">{scan.product?.name || scan.barcode}</span>
                <span className="ml-2 text-gray-400">
                  {scan.status === 'found' ? '✓' : scan.status === 'processing' ? '...' : '?'}
                </span>
              </div>
            ))}
          </div>
          
          {workflowType === 'inventory_count' && (
            <button
              onClick={() => router.push('/stock/count/submit')}
              className="mt-2 w-full text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-white transition-colors"
            >
              Submit Count ({sessionScans.filter(s => s.status === 'found').length})
            </button>
          )}
        </div>
      )}
    </div>
  )
}