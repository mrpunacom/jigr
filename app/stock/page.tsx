'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getModuleConfig } from '@/lib/module-config'
import { ModuleHeaderUniversal } from '@/app/components/ModuleHeaderUniversal'
import { ResponsiveLayout } from '@/app/components/ResponsiveLayout'
import { ModuleCard } from '@/app/components/ModuleCard'
import { MetricCard, AlertMetricCard } from '@/app/components/MetricCard'
import { QuickActionButton, QuickActionGrid } from '@/app/components/QuickActionButton'
import { DataTable } from '@/app/components/DataTable'
import { StockLevelIndicator } from '@/app/components/StockLevelIndicator'

interface DashboardMetrics {
  totalValue: {
    value: number
    formatted: string
    subtitle: string
  }
  itemsBelowParCount: {
    value: number
    subtitle: string
  }
  expiringCount: {
    value: number
    subtitle: string
  }
}

interface ItemBelowPar {
  id: string
  item_name: string
  current_stock: number
  par_level_low: number
  count_unit: string
  count_date?: string
}

interface ExpiringBatch {
  id: string
  batch_number: string
  item_name: string
  quantity: number
  unit: string
  expiration_date: string
  days_until_expiry: number
}

interface DashboardData {
  metrics: DashboardMetrics
  itemsBelowPar: ItemBelowPar[]
  expiringBatches: ExpiringBatch[]
  lastUpdated: string
}

export default function StockDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stockModule = getModuleConfig('stock')

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/stock/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (error) {
      console.error('Error loading dashboard:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'count':
        router.push('/count/new')
        break
      case 'scan':
        router.push('/stock/items?scan=true')
        break
      case 'receive':
        // Future: router.push('/stock/batches/new')
        alert('Receiving workflow coming in Phase 3!')
        break
      case 'reports':
        router.push('/count/history')
        break
    }
  }

  const handleViewBelowPar = () => {
    router.push('/stock/items?status=low_stock')
  }

  const handleViewExpiring = () => {
    router.push('/stock/batches?filter=expiring')
  }

  const getExpirationUrgency = (days: number) => {
    if (days <= 0) return { color: 'text-red-500', bg: 'bg-red-50', label: 'Expired' }
    if (days === 1) return { color: 'text-red-500', bg: 'bg-red-50', label: 'Today' }
    if (days <= 3) return { color: 'text-amber-500', bg: 'bg-amber-50', label: `${days}d` }
    return { color: 'text-green-500', bg: 'bg-green-50', label: `${days}d` }
  }

  // Table columns for items below par
  const belowParColumns = [
    {
      key: 'item_name' as keyof ItemBelowPar,
      label: 'Item',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'current_stock' as keyof ItemBelowPar,
      label: 'Current Stock',
      render: (value: number, item: ItemBelowPar) => (
        <StockLevelIndicator
          current={value}
          parLow={item.par_level_low}
          unit={item.count_unit}
          showText={true}
        />
      )
    },
    {
      key: 'par_level_low' as keyof ItemBelowPar,
      label: 'Par Level',
      render: (value: number, item: ItemBelowPar) => `${value} ${item.count_unit}`
    },
    {
      key: 'id' as keyof ItemBelowPar,
      label: 'Action',
      render: (value: string, item: ItemBelowPar) => (
        <div className="flex space-x-2">
          <button
            onClick={() => router.push(`/stock/items/${value}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Item"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          <button
            onClick={() => router.push(`/count/new?item_id=${value}&item_name=${encodeURIComponent(item.item_name)}`)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Count Item"
            style={{ minHeight: '44px', minWidth: '44px' }}
          >
            <span className="icon-[tabler--clipboard] h-4 w-4"></span>
          </button>
        </div>
      )
    }
  ]

  // Table columns for expiring batches
  const expiringColumns = [
    {
      key: 'item_name' as keyof ExpiringBatch,
      label: 'Item',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'batch_number' as keyof ExpiringBatch,
      label: 'Batch #',
      render: (value: string) => (
        <span className="text-sm text-gray-600 font-mono">{value}</span>
      )
    },
    {
      key: 'expiration_date' as keyof ExpiringBatch,
      label: 'Expires',
      render: (value: string, batch: ExpiringBatch) => {
        const urgency = getExpirationUrgency(batch.days_until_expiry)
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900">
              {new Date(value).toLocaleDateString()}
            </span>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${urgency.bg} ${urgency.color}`}>
              {urgency.label}
            </span>
          </div>
        )
      }
    },
    {
      key: 'quantity' as keyof ExpiringBatch,
      label: 'Quantity',
      render: (value: number, batch: ExpiringBatch) => `${value} ${batch.unit}`
    }
  ]

  if (loading) {
    return (
      <ResponsiveLayout>
        <ModuleHeaderUniversal module={stockModule!} currentPage="console" />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </main>
      </ResponsiveLayout>
    )
  }

  if (error || !data) {
    return (
      <ResponsiveLayout>
        <ModuleHeaderUniversal module={stockModule!} currentPage="console" />
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Failed to load dashboard data'}
          </div>
        </main>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout>
      <ModuleHeaderUniversal module={stockModule!} currentPage="console" />
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Stock Dashboard</h1>
              <p className="mt-1 text-sm text-gray-300">
                Overview of your inventory health and quick actions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 text-xs text-white/60">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Inventory Value"
              value={data.metrics.totalValue.formatted}
              subtitle={data.metrics.totalValue.subtitle}
              icon={() => <span className="icon-[tabler--currency-dollar] w-5 h-5"></span>}
              theme="light"
            />

            <AlertMetricCard
              title="Items Below Par"
              value={data.metrics.itemsBelowParCount.value}
              subtitle={data.metrics.itemsBelowParCount.subtitle}
              icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
              alertLevel={data.metrics.itemsBelowParCount.value > 0 ? 'warning' : 'success'}
              count={data.metrics.itemsBelowParCount.value}
              onClick={data.metrics.itemsBelowParCount.value > 0 ? handleViewBelowPar : undefined}
            />

            <AlertMetricCard
              title="Expiring Soon"
              value={data.metrics.expiringCount.value}
              subtitle={data.metrics.expiringCount.subtitle}
              icon={() => <span className="icon-[tabler--clock] w-5 h-5"></span>}
              alertLevel={data.metrics.expiringCount.value > 0 ? 'critical' : 'success'}
              count={data.metrics.expiringCount.value}
              onClick={data.metrics.expiringCount.value > 0 ? handleViewExpiring : undefined}
            />
          </div>

          {/* Quick Actions */}
          <ModuleCard theme="light" className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <QuickActionGrid>
              <QuickActionButton
                title="Start Count"
                description="Begin stocktake session"
                icon={() => <span className="icon-[tabler--clipboard] w-5 h-5"></span>}
                onClick={() => handleQuickAction('count')}
                size="medium"
              />
              <QuickActionButton
                title="Scan Barcode"
                description="Find items quickly"
                icon={() => <span className="icon-[tabler--scan] w-5 h-5"></span>}
                onClick={() => handleQuickAction('scan')}
                size="medium"
                disabled={true}
              />
              <QuickActionButton
                title="Receive Delivery"
                description="Add new stock batches"
                icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
                onClick={() => handleQuickAction('receive')}
                size="medium"
                disabled={true}
              />
            </QuickActionGrid>
          </ModuleCard>

          {/* Items Below Par Table */}
          {data.itemsBelowPar.length > 0 && (
            <ModuleCard theme="light" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Items Below Par Level</h3>
                <button
                  onClick={handleViewBelowPar}
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  View all →
                </button>
              </div>
              <DataTable
                columns={belowParColumns}
                data={data.itemsBelowPar}
                emptyMessage="All items are at or above par level"
              />
            </ModuleCard>
          )}

          {/* Expiring Batches Table */}
          {data.expiringBatches.length > 0 && (
            <ModuleCard theme="light" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Expiring Soon</h3>
                <button
                  onClick={handleViewExpiring}
                  className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                >
                  View all →
                </button>
              </div>
              <DataTable
                columns={expiringColumns}
                data={data.expiringBatches}
                emptyMessage="No batches expiring in the next 3 days"
              />
            </ModuleCard>
          )}

          {/* Empty State for Clean Inventory */}
          {data.itemsBelowPar.length === 0 && data.expiringBatches.length === 0 && (
            <ModuleCard theme="light" className="p-8">
              <div className="text-center">
                <span className="icon-[tabler--trending-up] h-12 w-12 text-green-400 mx-auto mb-4"></span>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Your inventory is in great shape! 
                </h3>
                <p className="text-white/70 mb-6">
                  All items are above par level and no batches are expiring soon.
                </p>
                <QuickActionButton
                  title="View All Items"
                  description="Browse your complete inventory"
                  icon={() => <span className="icon-[tabler--eye] w-5 h-5"></span>}
                  onClick={() => router.push('/stock/items')}
                  size="small"
                />
              </div>
            </ModuleCard>
          )}
        </div>
      </main>
    </ResponsiveLayout>
  )
}