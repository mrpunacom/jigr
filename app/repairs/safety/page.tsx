'use client'

import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'

export default function RepairsSafetyPage() {
  return (
    <StandardPageWrapper moduleName="repairs" currentPage="safety">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚠️ Safety Issues
          </h1>
          <p className="text-gray-600">
            Log and track workplace safety issues
          </p>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <p className="text-sm text-blue-700">
            <strong>Module in Development</strong> - Safety issue tracking coming soon!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Safety Issues List</h2>
          <p className="text-gray-500 text-center py-8">
            Safety issues management interface will be implemented here
          </p>
        </div>
    </StandardPageWrapper>
  )
}