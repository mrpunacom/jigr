'use client'

import { Suspense } from 'react'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { UniversalModuleLayout } from '@/app/components/UniversalModuleLayout'
import { MainDashboard } from '@/app/components/dashboard/MainDashboard'

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
      
      {/* Insights skeleton */}
      <div className="space-y-3">
        <div className="h-16 bg-gray-200 rounded"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
      
      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      {/* Quick actions skeleton */}
      <div className="h-40 bg-gray-200 rounded"></div>
      
      {/* Content grid skeleton */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded"></div>
        <div className="h-80 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ResponsiveLayout>
      <UniversalModuleLayout 
        moduleName="dashboard"
        moduleTitle="JiGR Dashboard"
        currentPage="overview"
        backgroundImage="restaurant-kitchen.jpg"
        className="min-h-screen"
      >
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <MainDashboard />
          </Suspense>
        </main>
      </UniversalModuleLayout>
    </ResponsiveLayout>
  )
}