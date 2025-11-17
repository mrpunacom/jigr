'use client'

// Test Data Management Page
// Simple admin interface for viewing and cleaning test data

import { useState, useEffect } from 'react'
import { ModuleCard, StatCard } from '../../components/ModuleCard'

interface TestDataStats {
  totalTestRecords: number
  testSessions: number
  sessionGroups: { [key: string]: any[] }
}

export default function TestDataManagementPage() {
  const [stats, setStats] = useState<TestDataStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [cleanupLoading, setCleanupLoading] = useState(false)

  // Load test data statistics
  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-data?action=stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.stats)
      } else {
        console.error('Failed to load test data stats:', result.error)
      }
    } catch (error) {
      console.error('Error loading test data stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Clean up all test data
  const cleanupAllTestData = async () => {
    if (!confirm('Are you sure you want to delete ALL test data? This cannot be undone.')) {
      return
    }

    try {
      setCleanupLoading(true)
      const response = await fetch('/api/test-data?action=all', {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        loadStats() // Refresh stats
      } else {
        alert('Cleanup failed: ' + result.error)
      }
    } catch (error) {
      console.error('Error cleaning up test data:', error)
      alert('Cleanup failed: ' + error)
    } finally {
      setCleanupLoading(false)
    }
  }

  // Clean up specific session
  const cleanupSession = async (sessionId: string) => {
    if (!confirm(`Are you sure you want to delete test session ${sessionId}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/test-data?action=session&sessionId=${sessionId}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      
      if (result.success) {
        alert(result.message)
        loadStats() // Refresh stats
      } else {
        alert('Session cleanup failed: ' + result.error)
      }
    } catch (error) {
      console.error('Error cleaning up session:', error)
      alert('Session cleanup failed: ' + error)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading test data statistics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Test Data Management
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage test records created during development and testing
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard accentColor="blue">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Test Records</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalTestRecords || 0}</p>
          </StatCard>
          
          <StatCard accentColor="yellow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Test Sessions</h3>
            <p className="text-3xl font-bold text-yellow-600">{stats?.testSessions || 0}</p>
          </StatCard>
          
          <StatCard accentColor="green">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Status</h3>
            <p className="text-sm text-green-600 font-medium">
              {stats?.totalTestRecords === 0 ? 'No test data' : `${stats?.totalTestRecords} test records`}
            </p>
          </StatCard>
        </div>

        {/* Actions */}
        <ModuleCard className="p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh Stats
            </button>
            
            <button
              onClick={cleanupAllTestData}
              disabled={cleanupLoading || stats?.totalTestRecords === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {cleanupLoading ? '⏳ Cleaning...' : '🗑️ Clean All Test Data'}
            </button>
          </div>
        </ModuleCard>

        {/* Test Sessions List */}
        {stats?.sessionGroups && Object.keys(stats.sessionGroups).length > 0 && (
          <ModuleCard className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Test Sessions</h3>
            <div className="space-y-4">
              {Object.entries(stats.sessionGroups).map(([sessionId, records]) => (
                <div key={sessionId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">Session: {sessionId}</h4>
                      <p className="text-sm text-gray-600">{records.length} record{records.length !== 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => cleanupSession(sessionId)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete Session
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>Latest record: {new Date(records[0]?.created_at).toLocaleString()}</p>
                    <p>Suppliers: {records.map(r => r.supplier_name || 'Unknown').join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </ModuleCard>
        )}

        {/* No test data message */}
        {stats?.totalTestRecords === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-green-900 mb-2">✅ No Test Data</h3>
            <p className="text-green-700">
              All clean! No test records found in the database.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}