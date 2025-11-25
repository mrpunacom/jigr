'use client'

import { Suspense } from 'react'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { UniversalModuleLayout } from '@/app/components/UniversalModuleLayout'
import { AnalyticsDashboard } from '@/app/components/analytics/AnalyticsDashboard'
import { ResponsiveProvider } from '@/app/components/responsive/ResponsiveDesignSystem'

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="flex space-x-2">
          <div className="h-10 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <ResponsiveProvider>
      <ResponsiveLayout>
        <UniversalModuleLayout 
          moduleName="analytics"
          moduleTitle="Analytics & Reports"
          currentPage="dashboard"
          backgroundImage="analytics-charts.jpg"
          className="min-h-screen"
        >
          <main className="max-w-7xl mx-auto px-4 py-6">
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsDashboard />
            </Suspense>
          </main>
        </UniversalModuleLayout>
      </ResponsiveLayout>
    </ResponsiveProvider>
  )
}