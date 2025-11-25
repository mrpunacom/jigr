'use client'

import { Suspense } from 'react'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { ModuleHeader } from '@/app/components/ModuleHeader'
import { InventoryManagement } from '@/app/components/inventory/InventoryManagement'
import { getModuleConfig } from '@/lib/module-config'

function InventorySkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      
      {/* Filters skeleton */}
      <div className="h-40 bg-gray-200 rounded"></div>
      
      {/* Table skeleton */}
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  )
}

export default function InventoryPage() {
  const stockModule = getModuleConfig('stock')

  return (
    <ResponsiveLayout>
      <ModuleHeader module={stockModule!} currentPage="inventory" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<InventorySkeleton />}>
          <InventoryManagement />
        </Suspense>
      </main>
    </ResponsiveLayout>
  )
}