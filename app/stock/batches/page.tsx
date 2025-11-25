'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { DataTable } from '@/app/components/DataTable'
import { ExpirationBadge, ExpirationUrgencySection } from '@/app/components/ExpirationBadge'
import { SearchInput } from '@/app/components/SearchInput'

interface BatchData {
  id: string
  batch_number: string
  quantity: number
  unit: string
  expiration_date: string | null
  status: string
  received_date: string
  vendor_id: string | null
  item_id: string
  item_name: string
  item_unit: string
  category_name: string | null
  vendor_name: string | null
  days_until_expiry: number | null
  urgency_level: 'critical' | 'warning' | 'good'
}

interface GroupedBatches {
  critical: BatchData[]
  warning: BatchData[]
  good: BatchData[]
}

type TabType = 'all' | 'expiring' | 'expired' | 'active'

export default function StockBatchesPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<BatchData[]>([])
  const [groupedBatches, setGroupedBatches] = useState<GroupedBatches>({
    critical: [],
    warning: [],
    good: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('expiring')
  const [lastUpdated, setLastUpdated] = useState<string>('')
  
  // Expansion state for urgency sections
  const [expandedSections, setExpandedSections] = useState({
    critical: true,
    warning: true,
    good: false
  })


  useEffect(() => {
    loadBatchData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadBatchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [activeTab])

  const loadBatchData = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      // Load batches based on active tab
      const response = await fetch(`/api/stock/batches?tab=${activeTab}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setBatches(data.batches)
      setLastUpdated(data.lastUpdated)

      // For expiring tab, also load grouped data for urgency sections
      if (activeTab === 'expiring') {
        const expiringResponse = await fetch('/api/stock/batches/expiring?days=7', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (expiringResponse.ok) {
          const expiringData = await expiringResponse.json()
          setGroupedBatches(expiringData.grouped)
        }
      }

      setError(null)
    } catch (error) {
      console.error('Error loading batches:', error)
      setError('Failed to load batch data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
  }

  const handleRefresh = () => {
    loadBatchData()
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleBatchAction = (action: string, batchId: string, itemName: string) => {
    switch (action) {
      case 'view':
        // Future: Navigate to batch detail
        alert('Batch detail view coming in Phase 3!')
        break
      case 'use':
        // Future: Record usage
        alert('Record usage functionality coming in Phase 3!')
        break
      case 'waste':
        // Future: Record waste
        alert('Record waste functionality coming in Phase 3!')
        break
    }
  }

  // Table columns for batch display
  const batchColumns = [
    {
      key: 'item_name' as keyof BatchData,
      label: 'Item',
      sortable: true,
      render: (value: string, batch: BatchData) => (
        <div>
          <span className="font-medium text-gray-900">{value}</span>
          {batch.category_name && (
            <div className="text-xs text-gray-500">{batch.category_name}</div>
          )}
        </div>
      )
    },
    {
      key: 'batch_number' as keyof BatchData,
      label: 'Batch #',
      render: (value: string) => (
        <span className="text-sm text-gray-600 font-mono">{value}</span>
      )
    },
    {
      key: 'quantity' as keyof BatchData,
      label: 'Quantity',
      render: (value: number, batch: BatchData) => `${value} ${batch.unit}`
    },
    {
      key: 'expiration_date' as keyof BatchData,
      label: 'Expiration',
      render: (value: string | null) => (
        <ExpirationBadge expirationDate={value} showDate={false} />
      )
    },
    {
      key: 'vendor_name' as keyof BatchData,
      label: 'Vendor',
      render: (value: string | null) => (
        <span className="text-sm text-gray-600">{value || 'Unknown'}</span>
      )
    },
    {
      key: 'received_date' as keyof BatchData,
      label: 'Received',
      render: (value: string) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'id' as keyof BatchData,
      label: 'Actions',
      render: (value: string, batch: BatchData) => (
        <div className="flex space-x-1">
          <button
            onClick={() => handleBatchAction('view', value, batch.item_name)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          {batch.urgency_level === 'critical' && (
            <>
              <button
                onClick={() => handleBatchAction('use', value, batch.item_name)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                title="Record Usage"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <span className="icon-[tabler--circle-check] h-4 w-4"></span>
              </button>
              <button
                onClick={() => handleBatchAction('waste', value, batch.item_name)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Record Waste"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <span className="icon-[tabler--trash] h-4 w-4"></span>
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  const tabs = [
    { id: 'all', label: 'All Batches', icon: () => <span className="icon-[tabler--package] h-4 w-4"></span> },
    { id: 'expiring', label: 'Expiring Soon', icon: () => <span className="icon-[tabler--clock] h-4 w-4"></span> },
    { id: 'expired', label: 'Expired', icon: () => <span className="icon-[tabler--alert-triangle] h-4 w-4"></span> },
    { id: 'active', label: 'Active', icon: () => <span className="icon-[tabler--circle-check] h-4 w-4"></span> }
  ]

  if (loading) {
    return (
      <StandardPageWrapper moduleName="STOCK" currentPage="batches">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </StandardPageWrapper>
    )
  }

  if (error) {
    return (
      <StandardPageWrapper moduleName="STOCK" currentPage="batches">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="STOCK" currentPage="batches">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Batch Management</h1>
              <p className="mt-1 text-sm text-gray-300">
                Track expiration dates and manage batch inventory
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="text-xs text-white/60">
                Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
              <button
                onClick={handleRefresh}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                style={{ minHeight: '44px', minWidth: '44px' }}
                title="Refresh"
              >
                <span className="icon-[tabler--refresh] h-4 w-4"></span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <ModuleCard theme="light" className="p-0 overflow-hidden">
            <div className="flex border-b border-white/10">
              {tabs.map((tab) => {
                const IconComponent = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as TabType)}
                    className={`flex-1 px-4 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-white bg-white/10 border-b-2 border-blue-400'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ minHeight: '60px' }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <IconComponent />
                      <span>{tab.label}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </ModuleCard>

          {/* Urgency Sections (for Expiring Soon tab) */}
          {activeTab === 'expiring' && (
            <div className="space-y-4">
              <ExpirationUrgencySection
                title="Critical - Expired or Expiring Today"
                urgencyLevel="critical"
                count={groupedBatches.critical.length}
                isExpanded={expandedSections.critical}
                onToggle={() => toggleSection('critical')}
              >
                <DataTable
                  columns={batchColumns}
                  data={groupedBatches.critical}
                  emptyMessage="No critically expiring batches"
                />
              </ExpirationUrgencySection>

              <ExpirationUrgencySection
                title="Warning - Expiring in 2-3 Days"
                urgencyLevel="warning"
                count={groupedBatches.warning.length}
                isExpanded={expandedSections.warning}
                onToggle={() => toggleSection('warning')}
              >
                <DataTable
                  columns={batchColumns}
                  data={groupedBatches.warning}
                  emptyMessage="No batches expiring in 2-3 days"
                />
              </ExpirationUrgencySection>

              <ExpirationUrgencySection
                title="Good - Expiring in 4-7 Days"
                urgencyLevel="good"
                count={groupedBatches.good.length}
                isExpanded={expandedSections.good}
                onToggle={() => toggleSection('good')}
              >
                <DataTable
                  columns={batchColumns}
                  data={groupedBatches.good}
                  emptyMessage="No batches expiring in 4-7 days"
                />
              </ExpirationUrgencySection>
            </div>
          )}

          {/* Regular Table (for other tabs) */}
          {activeTab !== 'expiring' && (
            <ModuleCard theme="light" className="p-6">
              <DataTable
                columns={batchColumns}
                data={batches}
                loading={loading}
                emptyMessage={`No ${activeTab} batches found`}
                pagination={{
                  pageSize: 20,
                  currentPage: 1,
                  onPageChange: () => {}
                }}
              />
            </ModuleCard>
          )}

          {/* Empty State for Expiring Soon */}
          {activeTab === 'expiring' && 
           groupedBatches.critical.length === 0 && 
           groupedBatches.warning.length === 0 && 
           groupedBatches.good.length === 0 && (
            <ModuleCard theme="light" className="p-8">
              <div className="text-center">
                <span className="icon-[tabler--circle-check] h-12 w-12 text-green-400 mx-auto mb-4"></span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  No Batches Expiring Soon
                </h3>
                <p className="text-white/70">
                  All your inventory batches are fresh! No items are expiring in the next 7 days.
                </p>
              </div>
            </ModuleCard>
          )}
        </div>
    </StandardPageWrapper>
  )
}