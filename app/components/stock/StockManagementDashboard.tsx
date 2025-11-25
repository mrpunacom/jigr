'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MetricCard } from '@/app/components/MetricCard'
import { DataTable } from '@/app/components/DataTable'
import { StockLevelIndicator } from '@/app/components/StockLevelIndicator'

interface StockMetrics {
  totalItems: number
  totalValue: number
  lowStockItems: number
  expiringBatches: number
  recentMovements: number
  avgTurnover: number
  wastageValue: number
  receivingValue: number
}

interface StockItem {
  id: string
  item_name: string
  current_stock: number
  par_level_low: number
  par_level_high: number
  count_unit: string
  cost_per_unit: number
  category: string
  location: string
  last_count_date?: string
  supplier?: string
  barcode?: string
  status: 'normal' | 'low' | 'critical' | 'overstock'
}

interface RecentMovement {
  id: string
  item_name: string
  movement_type: 'adjustment' | 'count' | 'sale' | 'waste' | 'transfer' | 'receiving'
  direction: 'in' | 'out'
  quantity: number
  unit: string
  timestamp: string
  user_name?: string
  notes?: string
  reference_number?: string
}

interface StockManagementDashboardProps {
  className?: string
}

export function StockManagementDashboard({ className = '' }: StockManagementDashboardProps) {
  const router = useRouter()
  
  const [metrics, setMetrics] = useState<StockMetrics | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [recentMovements, setRecentMovements] = useState<RecentMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const [metricsRes, itemsRes, movementsRes] = await Promise.all([
        fetch('/api/stock/dashboard/metrics'),
        fetch('/api/stock/items?limit=50&include_status=true'),
        fetch('/api/stock/movements?limit=20&include_user=true')
      ])

      const [metricsData, itemsData, movementsData] = await Promise.all([
        metricsRes.json(),
        itemsRes.json(), 
        movementsRes.json()
      ])

      setMetrics(metricsData)
      setStockItems(itemsData.items || [])
      setRecentMovements(movementsData.movements || [])
      setError(null)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/scan?workflow=lookup')
        break
      case 'count':
        router.push('/scan?workflow=inventory_count')
        break
      case 'receive':
        router.push('/scan?workflow=receiving')
        break
      case 'add_item':
        router.push('/stock/items/new')
        break
      case 'reports':
        router.push('/stock/reports')
        break
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-500'
      case 'low': return 'text-amber-500'  
      case 'overstock': return 'text-blue-500'
      default: return 'text-green-500'
    }
  }

  const getMovementTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'receiving': return <span className={`icon-[tabler--trending-up] ${iconClass} text-green-500`}></span>
      case 'sale': return <span className={`icon-[tabler--trending-down] ${iconClass} text-blue-500`}></span>
      case 'waste': return <span className={`icon-[tabler--trending-down] ${iconClass} text-red-500`}></span>
      case 'count': return <span className={`icon-[tabler--package] ${iconClass} text-gray-500`}></span>
      case 'adjustment': return <span className={`icon-[tabler--edit] ${iconClass} text-amber-500`}></span>
      case 'transfer': return <span className={`icon-[tabler--refresh] ${iconClass} text-purple-500`}></span>
      default: return <span className={`icon-[tabler--package] ${iconClass} text-gray-500`}></span>
    }
  }

  const filteredItems = stockItems.filter(item => {
    if (searchQuery && !item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.barcode?.includes(searchQuery)) {
      return false
    }
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
    if (locationFilter !== 'all' && item.location !== locationFilter) return false
    return true
  })

  const stockItemColumns = [
    {
      key: 'item_name' as keyof StockItem,
      label: 'Item',
      sortable: true,
      render: (value: string, item: StockItem) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">
            {item.category} • {item.location}
            {item.barcode && <span className="ml-2 font-mono">{item.barcode}</span>}
          </div>
        </div>
      )
    },
    {
      key: 'current_stock' as keyof StockItem,
      label: 'Stock Level',
      render: (value: number, item: StockItem) => (
        <div className="flex items-center space-x-2">
          <StockLevelIndicator
            current={value}
            parLow={item.par_level_low}
            parHigh={item.par_level_high}
            unit={item.count_unit}
            showText={true}
          />
          <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status.toUpperCase()}
          </span>
        </div>
      )
    },
    {
      key: 'cost_per_unit' as keyof StockItem,
      label: 'Value',
      render: (value: number, item: StockItem) => (
        <div>
          <div className="font-medium">${(value * item.current_stock).toFixed(2)}</div>
          <div className="text-xs text-gray-500">${value.toFixed(2)}/{item.count_unit}</div>
        </div>
      )
    },
    {
      key: 'last_count_date' as keyof StockItem,
      label: 'Last Count',
      render: (value: string | undefined) => (
        <span className="text-sm text-gray-600">
          {value ? new Date(value).toLocaleDateString() : 'Never'}
        </span>
      )
    },
    {
      key: 'id' as keyof StockItem,
      label: 'Actions',
      render: (value: string, item: StockItem) => (
        <div className="flex space-x-1">
          <button
            onClick={() => router.push(`/stock/items/${value}`)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Item"
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          <button
            onClick={() => router.push(`/scan?workflow=inventory_count&item=${value}`)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="Count Item"
          >
            <span className="icon-[tabler--scan] h-4 w-4"></span>
          </button>
        </div>
      )
    }
  ]

  const movementColumns = [
    {
      key: 'movement_type' as keyof RecentMovement,
      label: 'Type',
      render: (value: string) => (
        <div className="flex items-center space-x-2">
          {getMovementTypeIcon(value)}
          <span className="capitalize text-sm">{value.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'item_name' as keyof RecentMovement,
      label: 'Item',
      sortable: true,
      render: (value: string) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'quantity' as keyof RecentMovement,
      label: 'Quantity',
      render: (value: number, movement: RecentMovement) => (
        <span className={`font-mono ${movement.direction === 'in' ? 'text-green-600' : 'text-red-600'}`}>
          {movement.direction === 'in' ? '+' : '-'}{value} {movement.unit}
        </span>
      )
    },
    {
      key: 'timestamp' as keyof RecentMovement,
      label: 'When',
      render: (value: string) => (
        <div className="text-sm">
          <div>{new Date(value).toLocaleDateString()}</div>
          <div className="text-xs text-gray-500">{new Date(value).toLocaleTimeString()}</div>
        </div>
      )
    },
    {
      key: 'user_name' as keyof RecentMovement,
      label: 'By',
      render: (value: string | undefined) => (
        <span className="text-sm text-gray-600">{value || 'System'}</span>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        {error}
        <button 
          onClick={() => loadDashboardData(true)}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600">Real-time inventory tracking and control</p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            title="Refresh"
          >
            <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
          </button>
          
          <button
            onClick={() => handleQuickAction('scan')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--scan] h-4 w-4"></span>
            <span>Scan</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('add_item')}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--plus] h-4 w-4"></span>
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Items"
            value={metrics.totalItems.toLocaleString()}
            subtitle={`$${metrics.totalValue.toLocaleString()} total value`}
            icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Low Stock Items"
            value={metrics.lowStockItems}
            subtitle="Need attention"
            icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
            theme="white"
            className={metrics.lowStockItems > 0 ? 'border-amber-200 bg-amber-50' : ''}
          />
          <MetricCard
            title="Expiring Soon"
            value={metrics.expiringBatches}
            subtitle="Next 7 days"
            icon={() => <span className="icon-[tabler--clock] w-5 h-5"></span>}
            theme="white"
            className={metrics.expiringBatches > 0 ? 'border-red-200 bg-red-50' : ''}
          />
          <MetricCard
            title="Avg Turnover"
            value={`${metrics.avgTurnover.toFixed(1)}x`}
            subtitle="Monthly rate"
            icon={() => <span className="icon-[tabler--chart-bar] w-5 h-5"></span>}
            theme="white"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => handleQuickAction('count')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="icon-[tabler--scan] h-8 w-8 text-blue-600 mb-2"></span>
            <span className="text-sm font-medium">Count Items</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('receive')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="icon-[tabler--trending-up] h-8 w-8 text-green-600 mb-2"></span>
            <span className="text-sm font-medium">Receive Stock</span>
          </button>
          
          <button
            onClick={() => router.push('/stock/purchase-orders')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="icon-[tabler--currency-dollar] h-8 w-8 text-purple-600 mb-2"></span>
            <span className="text-sm font-medium">Purchase Orders</span>
          </button>
          
          <button
            onClick={() => handleQuickAction('reports')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="icon-[tabler--chart-bar] h-8 w-8 text-indigo-600 mb-2"></span>
            <span className="text-sm font-medium">Reports</span>
          </button>
          
          <button
            onClick={() => router.push('/stock/alerts')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="icon-[tabler--alert-triangle] h-8 w-8 text-red-600 mb-2"></span>
            <span className="text-sm font-medium">Alerts</span>
          </button>
        </div>
      </div>

      {/* Stock Items */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <h3 className="text-lg font-semibold">Stock Items</h3>
            
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center space-x-2">
              <div className="relative">
                <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="normal">Normal</option>
                <option value="low">Low Stock</option>
                <option value="critical">Critical</option>
                <option value="overstock">Overstock</option>
              </select>
              
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                  setCategoryFilter('all')
                  setLocationFilter('all')
                }}
                className="px-3 py-2 text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50"
                title="Clear filters"
              >
                <span className="icon-[tabler--filter] h-4 w-4"></span>
              </button>
            </div>
          </div>
        </div>
        
        <DataTable
          columns={stockItemColumns}
          data={filteredItems}
          emptyMessage="No stock items found"
          className="border-0"
        />
        
        {filteredItems.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
            Showing {filteredItems.length} of {stockItems.length} items
          </div>
        )}
      </div>

      {/* Recent Movements */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Movements</h3>
            <button
              onClick={() => router.push('/stock/movements')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </button>
          </div>
        </div>
        
        <DataTable
          columns={movementColumns}
          data={recentMovements}
          emptyMessage="No recent movements"
          className="border-0"
        />
      </div>
    </div>
  )
}