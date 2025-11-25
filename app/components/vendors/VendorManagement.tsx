'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { DataTable } from '@/app/components/DataTable'
import { MetricCard } from '@/app/components/MetricCard'
import { 
  VendorComponentData, 
  VendorStatsData,
  transformVendorApiToComponent,
  generateMockVendorStats,
  createTestVendorsData
} from '@/lib/adapters/vendor-adapter'

// Use types from adapter
type Vendor = VendorComponentData
type VendorStats = VendorStatsData

interface VendorManagementProps {
  className?: string
}

export function VendorManagement({ className = '' }: VendorManagementProps) {
  const router = useRouter()
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  useEffect(() => {
    loadVendorData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [vendors, searchQuery, statusFilter, ratingFilter, categoryFilter])

  const loadVendorData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      // Try to fetch real data from API
      try {
        const [vendorsRes, statsRes] = await Promise.all([
          fetch('/api/stock/vendors?limit=50'),
          fetch('/api/stock/vendors/analytics')
        ])

        if (vendorsRes.ok && statsRes.ok) {
          const [vendorsData, statsData] = await Promise.all([
            vendorsRes.json(),
            statsRes.json()
          ])

          // Transform API data to component format
          const transformedVendors = (vendorsData.vendors || []).map(transformVendorApiToComponent)
          
          setVendors(transformedVendors)
          setStats(statsData.summary || generateMockVendorStats(transformedVendors))
          setError(null)
          console.log(`✅ Loaded ${transformedVendors.length} vendors from API`)
          return
        }
      } catch (apiError) {
        console.warn('API not available, using test data:', apiError)
      }

      // Fallback to test data for development
      console.log('📝 Using test vendor data for development')
      const testVendors = createTestVendorsData()
      const testStats = generateMockVendorStats(testVendors)
      
      setVendors(testVendors)
      setStats(testStats)
      setError(null)
      
    } catch (error) {
      console.error('Failed to load vendor data:', error)
      setError('Failed to load vendor data. Using offline mode.')
      
      // Even if everything fails, show test data
      const testVendors = createTestVendorsData()
      setVendors(testVendors)
      setStats(generateMockVendorStats(testVendors))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...vendors]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(vendor =>
        vendor.name.toLowerCase().includes(query) ||
        vendor.contact_name?.toLowerCase().includes(query) ||
        vendor.email?.toLowerCase().includes(query) ||
        vendor.categories.some(cat => cat.toLowerCase().includes(query))
      )
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter)
    }
    
    // Rating filter
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter)
      filtered = filtered.filter(vendor => vendor.rating >= minRating)
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(vendor => 
        vendor.categories.includes(categoryFilter)
      )
    }
    
    setFilteredVendors(filtered)
  }

  const handleVendorAction = (action: string, vendorId: string) => {
    switch (action) {
      case 'view':
        router.push(`/vendors/${vendorId}`)
        break
      case 'edit':
        router.push(`/vendors/${vendorId}/edit`)
        break
      case 'orders':
        router.push(`/stock/purchase-orders?vendor=${vendorId}`)
        break
      case 'items':
        router.push(`/inventory?supplier=${vendorId}`)
        break
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex px-2 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'suspended':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <span
        key={index}
        className={`icon-[tabler--star] h-3 w-3 ${
          index < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      ></span>
    ))
  }

  const getPerformanceIcon = (rate: number) => {
    if (rate >= 95) return <span className="icon-[tabler--circle-check] h-4 w-4 text-green-500"></span>
    if (rate >= 85) return <span className="icon-[tabler--clock] h-4 w-4 text-yellow-500"></span>
    return <span className="icon-[tabler--alert-triangle] h-4 w-4 text-red-500"></span>
  }

  const vendorColumns = [
    {
      key: 'name' as keyof Vendor,
      label: 'Vendor',
      sortable: true,
      render: (value: string, vendor: Vendor) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {vendor.contact_name && <div>{vendor.contact_name}</div>}
            <div className="flex items-center space-x-2 mt-1">
              <span className={getStatusBadge(vendor.status)}>
                {vendor.status}
              </span>
              <div className="flex items-center">
                {getRatingStars(vendor.rating)}
                <span className="ml-1 text-xs text-gray-500">
                  ({vendor.rating.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'categories' as keyof Vendor,
      label: 'Categories',
      render: (value: string[]) => (
        <div className="space-y-1">
          {value.slice(0, 3).map((category, index) => (
            <span 
              key={index}
              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1"
            >
              {category}
            </span>
          ))}
          {value.length > 3 && (
            <span className="text-xs text-gray-500">+{value.length - 3} more</span>
          )}
        </div>
      )
    },
    {
      key: 'total_spent' as keyof Vendor,
      label: 'Total Spent',
      sortable: true,
      render: (value: number, vendor: Vendor) => (
        <div>
          <div className="font-medium">${value.toLocaleString()}</div>
          <div className="text-sm text-gray-500">
            {vendor.total_orders} orders
          </div>
          <div className="text-xs text-gray-500">
            Avg: ${vendor.average_order_value.toLocaleString()}
          </div>
        </div>
      )
    },
    {
      key: 'on_time_delivery_rate' as keyof Vendor,
      label: 'Performance',
      sortable: true,
      render: (value: number, vendor: Vendor) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            {getPerformanceIcon(value)}
            <span className="text-sm font-medium">{value.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-gray-500">On-time delivery</div>
          {vendor.lead_time_days && (
            <div className="text-xs text-gray-500">
              {vendor.lead_time_days} days lead time
            </div>
          )}
        </div>
      )
    },
    {
      key: 'last_order_date' as keyof Vendor,
      label: 'Last Order',
      sortable: true,
      render: (value: string | undefined) => (
        <div className="text-sm">
          {value ? (
            <div>
              <div>{new Date(value).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">
                {Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24))} days ago
              </div>
            </div>
          ) : (
            <span className="text-gray-400 italic">Never</span>
          )}
        </div>
      )
    },
    {
      key: 'id' as keyof Vendor,
      label: 'Actions',
      render: (value: string, vendor: Vendor) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleVendorAction('view', value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            title="View Details"
          >
            <span className="icon-[tabler--eye] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleVendorAction('orders', value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
            title="View Orders"
          >
            <span className="icon-[tabler--package] h-4 w-4"></span>
          </button>
          <button
            onClick={() => handleVendorAction('edit', value)}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            title="Edit Vendor"
          >
            <span className="icon-[tabler--edit] h-4 w-4"></span>
          </button>
        </div>
      )
    }
  ]

  const allCategories = Array.from(
    new Set(vendors.flatMap(v => v.categories))
  ).sort()

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
          <p className="text-gray-600">
            {filteredVendors.length} of {vendors.length} vendors
            {selectedVendors.length > 0 && ` • ${selectedVendors.length} selected`}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => loadVendorData(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            title="Refresh"
          >
            <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="icon-[tabler--filter] h-4 w-4"></span>
            <span>Filters</span>
          </button>
          
          <button
            onClick={() => router.push('/vendors/new')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--plus] h-4 w-4"></span>
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Vendors"
            value={stats.totalVendors.toString()}
            subtitle={`${stats.activeVendors} active`}
icon={() => <span className="icon-[tabler--truck] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Total Spent"
            value={`$${stats.totalSpent.toLocaleString()}`}
            subtitle="This year"
icon={() => <span className="icon-[tabler--currency-dollar] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Average Rating"
            value={stats.averageRating.toFixed(1)}
            subtitle="Out of 5.0"
icon={() => <span className="icon-[tabler--star] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="On-Time Delivery"
            value={`${stats.onTimeDeliveryRate.toFixed(1)}%`}
            subtitle="Average rate"
icon={() => <span className="icon-[tabler--clock] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Top Performers"
            value={stats.topPerformers.toString()}
            subtitle="95%+ delivery rate"
icon={() => <span className="icon-[tabler--award] w-5 h-5"></span>}
            theme="white"
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="icon-[tabler--dots-vertical] h-4 w-4"></span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Ratings</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4.0">4.0+ Stars</option>
                <option value="3.5">3.5+ Stars</option>
                <option value="3.0">3.0+ Stars</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Vendors Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <DataTable
          columns={vendorColumns}
          data={filteredVendors}
          emptyMessage="No vendors found"
          selectable={true}
          selectedItems={selectedVendors}
          onSelectionChange={setSelectedVendors}
          pagination={{
            pageSize: 25,
            showSizeSelector: true
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-lg px-6 py-3">
          <button
            onClick={() => router.push('/vendors/import')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span className="icon-[tabler--upload] h-4 w-4"></span>
            <span>Import Vendors</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => {/* Export vendors */}}
            className="flex items-center space-x-2 text-green-600 hover:text-green-800"
          >
            <span className="icon-[tabler--download] h-4 w-4"></span>
            <span>Export</span>
          </button>
          
          <div className="w-px h-4 bg-gray-300"></div>
          
          <button
            onClick={() => router.push('/vendors/analytics')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-800"
          >
            <span className="icon-[tabler--trending-up] h-4 w-4"></span>
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="icon-[tabler--alert-triangle] h-5 w-5"></span>
            <span>{error}</span>
            <button 
              onClick={() => loadVendorData(true)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  )
}