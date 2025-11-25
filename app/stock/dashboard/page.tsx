'use client'

import { Suspense } from 'react'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { ModuleHeader } from '@/app/components/ModuleHeader'
import { StockManagementDashboard } from '@/app/components/stock/StockManagementDashboard'
import { getModuleConfig } from '@/lib/module-config'

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
        ))}
      </div>
      
      {/* Quick actions skeleton */}
      <div className="bg-gray-200 h-40 rounded-lg"></div>
      
      {/* Table skeleton */}
      <div className="bg-gray-200 h-96 rounded-lg"></div>
    </div>
  )
}

export default function StockDashboardPage() {
  const stockModule = getModuleConfig('stock')

  return (
    <ResponsiveLayout>
      <ModuleHeader module={stockModule!} currentPage="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <StockManagementDashboard />
        </Suspense>
      </main>
    </ResponsiveLayout>
  )
}