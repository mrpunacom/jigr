'use client'

import { useExplanation } from '@/app/components/explanation/useExplanation'
import ExplanationTrigger from '@/app/components/explanation/ExplanationTrigger'

export default function ExplanationTestPage() {
  const { openModal, isLoading, error } = useExplanation()

  const handleTestTrigger = (pageId: string) => {
    openModal(pageId, {
      moduleKey: 'stock',
      pageKey: 'console',
      fullPath: '/explanation-test',
      permissions: ['read'],
      userRole: 'STAFF',
      currentData: {
        testMode: true,
        pageTitle: 'Explanation System Test'
      }
    })
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Explanation System Test Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Triggers</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-medium mb-3">Icon Trigger</h3>
              <ExplanationTrigger
                position="inline"
                variant="icon"
                size="large"
                showTooltip={true}
                tooltipText="Click for Stock Console help"
                onTrigger={handleTestTrigger}
              />
            </div>
            
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-medium mb-3">Button Trigger</h3>
              <ExplanationTrigger
                position="inline"
                variant="button"
                size="medium"
                showTooltip={true}
                tooltipText="Button style help trigger"
                onTrigger={handleTestTrigger}
              />
            </div>
            
            <div className="border rounded-lg p-4 text-center">
              <h3 className="font-medium mb-3">Text Trigger</h3>
              <ExplanationTrigger
                position="inline"
                variant="text"
                size="medium"
                showTooltip={true}
                tooltipText="Text style help trigger"
                onTrigger={handleTestTrigger}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h2>
          <ul className="space-y-2 text-gray-600">
            <li><kbd className="bg-gray-100 px-2 py-1 rounded">F1</kbd> - Open help modal</li>
            <li><kbd className="bg-gray-100 px-2 py-1 rounded">Shift + ?</kbd> - Open help modal</li>
            <li><kbd className="bg-gray-100 px-2 py-1 rounded">Escape</kbd> - Close modal</li>
          </ul>
        </div>

        {/* Floating trigger for testing positioning */}
        <ExplanationTrigger
          position="floating"
          placement="bottom-right"
          variant="icon"
          size="medium"
          showTooltip={true}
          tooltipText="Floating help trigger"
          onTrigger={handleTestTrigger}
        />
        
        {/* Status display */}
        {isLoading && (
          <div className="fixed bottom-4 left-4 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
            Loading explanation...
          </div>
        )}
        
        {error && (
          <div className="fixed bottom-4 left-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  )
}