'use client'

import { useState, useEffect, useCallback } from 'react'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { SearchInput } from '../../components/SearchInput'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Package, DollarSign, Activity, Target, 
  Filter, Download, ArrowUp, ArrowDown,
  Calendar, BarChart3, Percent
} from 'lucide-react'

interface VarianceItem {
  id: string
  item_id: string
  item_name: string
  category_name?: string
  expected_quantity: number
  actual_quantity: number
  variance_quantity: number
  variance_percentage: number
  count_unit: string
  location_name?: string
  count_date: string
  cost_per_unit?: number
  variance_value?: number
  variance_status: 'positive' | 'negative' | 'neutral'
  threshold_exceeded: boolean
}

interface VarianceResponse {
  success: boolean
  variances: VarianceItem[]
  summary: {
    totalVariances: number
    positiveVariances: number
    negativeVariances: number
    totalVarianceValue: number
    averageVariancePercentage: number
    itemsOverThreshold: number
  }
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  lastUpdated: string
}

export default function CountVariancePage() {
  const [session, setSession] = useState<any>(null)
  const [variances, setVariances] = useState<VarianceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedThreshold, setSelectedThreshold] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('month')
  const [sortBy, setSortBy] = useState('variance_percentage_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [summary, setSummary] = useState<any>({})

  // Filter options
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([])

  // Session management
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  const fetchVarianceData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      // Use mock data instead of API call for demo
      console.log('Loading mock variance data...')
      
      const mockVariances = [
        {
          id: 'var-1',
          item_id: 'item-1',
          item_name: 'Flour',
          category_name: 'Dry Goods',
          expected_quantity: 30,
          actual_quantity: 25,
          counted_quantity: 25,
          variance: -5,
          variance_quantity: -5,
          variance_percentage: -16.67,
          count_unit: 'kg',
          location_name: 'Kitchen Prep',
          count_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          last_counted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          variance_status: 'negative' as 'positive' | 'negative' | 'neutral',
          threshold_exceeded: true,
          cost_impact: 15.50
        },
        {
          id: 'var-2', 
          item_id: 'item-2',
          item_name: 'Sugar',
          category_name: 'Dry Goods',
          expected_quantity: 10,
          actual_quantity: 12,
          counted_quantity: 12,
          variance: 2,
          variance_quantity: 2,
          variance_percentage: 20.0,
          count_unit: 'kg',
          location_name: 'Kitchen Prep',
          count_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          last_counted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          variance_status: 'positive' as 'positive' | 'negative' | 'neutral',
          threshold_exceeded: true,
          cost_impact: -8.30
        },
        {
          id: 'var-3',
          item_id: 'item-3', 
          item_name: 'Rice',
          category_name: 'Dry Goods',
          expected_quantity: 15,
          actual_quantity: 14,
          counted_quantity: 14,
          variance: -1,
          variance_quantity: -1,
          variance_percentage: -6.67,
          count_unit: 'kg',
          location_name: 'Dry Storage',
          count_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          last_counted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          variance_status: 'neutral' as 'positive' | 'negative' | 'neutral',
          threshold_exceeded: false,
          cost_impact: 3.20
        }
      ]

      const mockSummary = {
        totalVariances: 3,
        significantVariances: 2,
        totalCostImpact: 10.40,
        averageVariancePercentage: -0.89,
        lastUpdated: new Date().toISOString()
      }

      setTimeout(() => {
        setVariances(mockVariances)
        setSummary(mockSummary)
        setTotalPages(1)
        setTotalItems(3)
        setLoading(false)
      }, 500) // Small delay to simulate API call

      /* Original API call (commented out for demo)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        sortBy: sortBy,
        dateRange: selectedDateRange
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category_id', selectedCategory)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedThreshold !== 'all') params.append('threshold', selectedThreshold)

      const response = await fetch(`/api/count/variance?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch variance data')
      }

      const data: VarianceResponse = await response.json()

      if (data.success) {
        setVariances(data.variances)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
        setSummary(data.summary)
      }
      */
    } catch (error) {
      console.error('Error fetching variance data:', error)
      setLoading(false)
    }
  }, [session?.access_token, currentPage, searchTerm, selectedCategory, selectedStatus, selectedThreshold, selectedDateRange, sortBy])

  const fetchCategories = useCallback(async () => {
    if (!session?.access_token) return

    try {
      // Use mock categories data
      const mockCategories = [
        { id: 'dry-goods', name: 'Dry Goods' },
        { id: 'fresh-produce', name: 'Fresh Produce' },
        { id: 'dairy', name: 'Dairy' },
        { id: 'beverages', name: 'Beverages' }
      ]
      
      setCategories(mockCategories)
      return

      /* Original API call (commented out for demo)
      const response = await fetch('/api/inventory/categories', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
      */
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (session) {
      fetchVarianceData()
      fetchCategories()
    }
  }, [session, fetchVarianceData, fetchCategories])

  // Reset to page 1 when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchTerm, selectedCategory, selectedStatus, selectedThreshold, selectedDateRange, sortBy])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleExportVariance = () => {
    // Future: Export variance analysis to CSV/Excel
    console.log('Export variance clicked')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    const sign = percentage > 0 ? '+' : ''
    return `${sign}${percentage.toFixed(1)}%`
  }

  const getVarianceIcon = (status: string, percentage: number) => {
    if (status === 'positive') {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (status === 'negative') {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getVarianceColor = (status: string, thresholdExceeded: boolean) => {
    if (thresholdExceeded) {
      return status === 'positive' ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
    }
    return status === 'positive' ? 'text-green-600' : status === 'negative' ? 'text-red-600' : 'text-gray-600'
  }

  if (loading) {
    return (
      <StandardPageWrapper moduleName="count" currentPage="variance">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="count" currentPage="variance">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Variances</p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalVariances || 0}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="green">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Positive</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{summary.positiveVariances || 0}</p>
                  <p className="text-xs text-green-600 font-medium">OVER</p>
                </div>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Negative</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-bold text-gray-900">{summary.negativeVariances || 0}</p>
                  <p className="text-xs text-red-600 font-medium">UNDER</p>
                </div>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="orange">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Over Threshold</p>
                <p className="text-2xl font-bold text-gray-900">{summary.itemsOverThreshold || 0}</p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Variance Summary Card */}
        <ModuleCard theme="light" className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-white/70">Total Variance Value</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.totalVarianceValue || 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Percent className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-white/70">Avg Variance %</p>
              <p className="text-2xl font-bold text-white">
                {formatPercentage(summary.averageVariancePercentage || 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-white" />
              </div>
              <p className="text-sm text-white/70">Accuracy Rate</p>
              <p className="text-2xl font-bold text-white">
                {summary.totalVariances > 0 
                  ? (((summary.totalVariances - summary.itemsOverThreshold) / summary.totalVariances) * 100).toFixed(1)
                  : '0.0'
                }%
              </p>
            </div>
          </div>
        </ModuleCard>

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
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportVariance}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variance Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="positive">Positive (Over Count)</option>
                <option value="negative">Negative (Under Count)</option>
                <option value="neutral">Neutral (No Variance)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Threshold Alert
              </label>
              <select
                value={selectedThreshold}
                onChange={(e) => setSelectedThreshold(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Items</option>
                <option value="exceeded">Over Threshold</option>
                <option value="within">Within Threshold</option>
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
                <option value="variance_percentage_desc">Highest Variance %</option>
                <option value="variance_percentage_asc">Lowest Variance %</option>
                <option value="variance_value_desc">Highest Value Impact</option>
                <option value="variance_value_asc">Lowest Value Impact</option>
                <option value="item_name">Item Name</option>
                <option value="date_desc">Latest First</option>
              </select>
            </div>
          </div>
        </ModuleCard>

        {/* Variance Analysis Results */}
        {loading ? (
          <LoadingSpinner />
        ) : variances.length === 0 ? (
          <EmptyState
            title="No variance data found"
            description={searchTerm || selectedCategory || selectedStatus !== 'all' || selectedThreshold !== 'all'
              ? "No variance records match your current filters. Try adjusting your search criteria."
              : "No variance data found for the selected date range. Variance analysis requires multiple counts of the same items to compare expected vs actual quantities."
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
                        Expected vs Actual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Variance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value Impact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {variances.map((variance) => (
                      <tr key={variance.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {variance.item_name}
                            </div>
                            {variance.category_name && (
                              <div className="text-sm text-gray-500">
                                {variance.category_name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="text-gray-900">
                              Expected: {variance.expected_quantity.toLocaleString()} {variance.count_unit}
                            </div>
                            <div className="text-gray-600">
                              Actual: {variance.actual_quantity.toLocaleString()} {variance.count_unit}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getVarianceIcon(variance.variance_status, variance.variance_percentage)}
                            <div className="ml-2">
                              <div className={`text-sm font-medium ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                                {variance.variance_quantity > 0 ? '+' : ''}{variance.variance_quantity.toLocaleString()} {variance.count_unit}
                              </div>
                              <div className={`text-xs ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                                {formatPercentage(variance.variance_percentage)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                            {variance.variance_value ? formatCurrency(variance.variance_value) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {variance.threshold_exceeded && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Threshold
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              variance.variance_status === 'positive' 
                                ? 'bg-green-100 text-green-800'
                                : variance.variance_status === 'negative'
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {variance.variance_status === 'positive' ? 'Over' : variance.variance_status === 'negative' ? 'Under' : 'Neutral'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(variance.count_date).toLocaleDateString('en-NZ')}
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
              {variances.map((variance) => (
                <div key={variance.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{variance.item_name}</h3>
                        {variance.category_name && (
                          <p className="text-xs text-gray-500 mt-1">{variance.category_name}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {variance.threshold_exceeded && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        {getVarianceIcon(variance.variance_status, variance.variance_percentage)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Expected</p>
                        <p className="font-medium text-gray-900">
                          {variance.expected_quantity.toLocaleString()} {variance.count_unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Actual</p>
                        <p className="font-medium text-gray-900">
                          {variance.actual_quantity.toLocaleString()} {variance.count_unit}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className={`text-sm font-medium ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                            {variance.variance_quantity > 0 ? '+' : ''}{variance.variance_quantity.toLocaleString()} {variance.count_unit}
                          </span>
                          <span className={`text-xs ml-2 ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                            ({formatPercentage(variance.variance_percentage)})
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(variance.count_date).toLocaleDateString('en-NZ')}
                        </div>
                      </div>
                      
                      {variance.variance_value && (
                        <div className="mt-1">
                          <span className={`text-xs ${getVarianceColor(variance.variance_status, variance.threshold_exceeded)}`}>
                            Value impact: {formatCurrency(variance.variance_value)}
                          </span>
                        </div>
                      )}
                    </div>
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