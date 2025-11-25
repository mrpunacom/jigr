'use client'

import { Suspense } from 'react'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { VendorManagement } from '@/app/components/vendors/VendorManagement'
import { UniversalFooter } from '@/app/components/UniversalFooter'

function VendorSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
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
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded"></div>
        ))}
      </div>
      
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  )
}

export default function VendorsConsolePage() {
  return (
    <ConsolePageWrapper moduleName="vendors">
      <Suspense fallback={<VendorSkeleton />}>
        <VendorManagement />
      </Suspense>
      
      <UniversalFooter />
    </ConsolePageWrapper>
  )
}