'use client'

import { useState, useEffect, useCallback } from 'react'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { SearchInput } from '../../components/SearchInput'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { StatCard, ModuleCard } from '../../components/ModuleCard'
import { supabase } from '@/lib/supabase'
import { 
  History, Calendar, User, MapPin, 
  FileText, Package, Clock, Filter,
  ChevronDown, Download, Trash2
} from 'lucide-react'

interface CountHistoryItem {
  id: string
  item_id: string
  item_name: string
  category_name?: string
  quantity_on_hand: number
  count_unit: string
  location_id?: string
  location_name?: string
  notes?: string
  counted_by: string
  count_date: string
  created_at: string
  // For display
  counted_by_name?: string
}

interface CountHistoryResponse {
  success: boolean
  counts: CountHistoryItem[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  summary: {
    totalCounts: number
    uniqueItems: number
    lastCountDate?: string
    mostActiveCounter?: string
  }
  lastUpdated: string
}

export default function CountHistoryPage() {
  const [session, setSession] = useState<any>(null)

  // Session management
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])
  const [counts, setCounts] = useState<CountHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItem, setSelectedItem] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [selectedCounter, setSelectedCounter] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState<any>({})

  // Filter options
  const [items, setItems] = useState<Array<{id: string, name: string}>>([])
  const [locations, setLocations] = useState<Array<{id: string, name: string}>>([])
  const [counters, setCounters] = useState<Array<{id: string, name: string}>>([])

  const fetchCountHistory = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        sortBy: sortBy
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedItem) params.append('item_id', selectedItem)
      if (selectedLocation) params.append('location_id', selectedLocation)
      if (selectedDateRange !== 'all') params.append('dateRange', selectedDateRange)
      if (selectedCounter) params.append('counter_id', selectedCounter)

      const response = await fetch(`/api/count/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch count history')
      }

      const data: CountHistoryResponse = await response.json()

      if (data.success) {
        setCounts(data.counts)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching count history:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, currentPage, searchTerm, selectedItem, selectedLocation, selectedDateRange, selectedCounter, sortBy])

  const fetchFilterOptions = useCallback(async () => {
    if (!session?.access_token) return

    try {
      const response = await fetch('/api/count/filter-options', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
        setLocations(data.locations || [])
        setCounters(data.counters || [])
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (session) {
      fetchCountHistory()
      fetchFilterOptions()
    }
  }, [session, fetchCountHistory, fetchFilterOptions])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, selectedItem, selectedLocation, selectedDateRange, selectedCounter, sortBy])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleExportHistory = () => {
    // Future: Export count history to CSV/Excel
    console.log('Export history clicked')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toLocaleString()} ${unit}`
  }

  if (loading) {
    return (
      <StandardPageWrapper moduleName="count" currentPage="history">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="count" currentPage="history">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Counts</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalCounts || 0}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="green">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Items Counted</p>
                <p className="text-2xl font-bold text-gray-900">{summary.uniqueItems || 0}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="purple">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Last Count</p>
                <p className="text-sm font-bold text-gray-900">
                  {summary.lastCountDate 
                    ? new Date(summary.lastCountDate).toLocaleDateString('en-NZ')
                    : 'No counts yet'
                  }
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Most Active</p>
                <p className="text-sm font-bold text-gray-900 truncate">
                  {summary.mostActiveCounter || 'N/A'}
                </p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Search and Filters */}
        <ModuleCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <div>
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Search by item name..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item
                </label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Items</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportHistory}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Counter
              </label>
              <select
                value={selectedCounter}
                onChange={(e) => setSelectedCounter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Counters</option>
                {counters.map((counter) => (
                  <option key={counter.id} value={counter.id}>
                    {counter.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date_desc">Latest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="item_name">Item Name</option>
                <option value="quantity_high">Quantity High</option>
                <option value="quantity_low">Quantity Low</option>
              </select>
            </div>
          </div>
        </ModuleCard>

        {/* Count History Table */}
        {loading ? (
          <LoadingSpinner />
        ) : counts.length === 0 ? (
          <EmptyState
            title="No count history found"
            description={searchTerm || selectedItem || selectedLocation || selectedDateRange !== 'all' || selectedCounter
              ? "No count records match your current filters. Try adjusting your search criteria."
              : "No count records found. Start by performing some inventory counts to see history here."
            }
            action={
              <button
                onClick={() => window.location.href = '/count/new'}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Package className="h-4 w-4 mr-2" />
                Start Counting
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Counted By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {counts.map((count) => (
                      <tr key={count.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {count.item_name}
                            </div>
                            {count.category_name && (
                              <div className="text-sm text-gray-500">
                                {count.category_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatQuantity(count.quantity_on_hand, count.count_unit)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {count.location_name || 'Not specified'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {count.counted_by_name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(count.count_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {count.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {counts.map((count) => (
                <div key={count.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{count.item_name}</h3>
                        {count.category_name && (
                          <p className="text-xs text-gray-500 mt-1">{count.category_name}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-blue-600">
                        {formatQuantity(count.quantity_on_hand, count.count_unit)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center text-gray-500">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span>{count.location_name || 'No location'}</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <User className="h-3 w-3 mr-1" />
                        <span>{count.counted_by_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center text-gray-500 col-span-2">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatDate(count.count_date)}</span>
                      </div>
                    </div>

                    {count.notes && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="flex items-start">
                          <FileText className="h-3 w-3 text-gray-400 mr-1 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600 leading-relaxed">{count.notes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNumber: number
                    if (totalPages <= 7) {
                      pageNumber = i + 1
                    } else if (currentPage <= 4) {
                      pageNumber = i + 1
                    } else if (currentPage >= totalPages - 3) {
                      pageNumber = totalPages - 6 + i
                    } else {
                      pageNumber = currentPage - 3 + i
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </StandardPageWrapper>
  )
}