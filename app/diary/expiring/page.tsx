'use client'

import { useState } from 'react'
import { EXPIRING_ITEMS } from '@/lib/dummyData/diaryData'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'

export default function DiaryExpiringPage() {
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  
  const filterOptions = [
    { value: 'all', label: 'All Items', count: EXPIRING_ITEMS.length },
    { value: 'expiring_today', label: 'Today', count: EXPIRING_ITEMS.filter(item => item.status === 'expiring_today').length },
    { value: 'expiring_tomorrow', label: 'Tomorrow', count: EXPIRING_ITEMS.filter(item => item.status === 'expiring_tomorrow').length },
    { value: 'expiring_this_week', label: 'This Week', count: EXPIRING_ITEMS.filter(item => item.status === 'expiring_this_week').length },
  ]

  const filteredItems = selectedFilter === 'all' 
    ? EXPIRING_ITEMS 
    : EXPIRING_ITEMS.filter(item => item.status === selectedFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expiring_today': return 'text-red-700 bg-red-100 border-red-200'
      case 'expiring_tomorrow': return 'text-orange-700 bg-orange-100 border-orange-200'
      case 'expiring_this_week': return 'text-yellow-700 bg-yellow-100 border-yellow-200'
      case 'expired': return 'text-red-800 bg-red-200 border-red-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'expiring_today': return 'Expires Today'
      case 'expiring_tomorrow': return 'Expires Tomorrow'
      case 'expiring_this_week': return 'This Week'
      case 'expired': return 'EXPIRED'
      default: return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const totalValue = filteredItems.reduce((sum, item) => sum + item.totalValue, 0)

  return (
    <StandardPageWrapper moduleName="diary" currentPage="expiring">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⏰ Best Before Dates
          </h1>
          <p className="text-gray-600">
            Items expiring today and soon - minimize waste, maximize value
          </p>
        </div>
        
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 mb-8">
          <p className="text-sm text-teal-700">
            <strong>Development Module</strong> - Using realistic dummy data for demonstration
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedFilter(option.value)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 TouchTarget ${
                selectedFilter === option.value 
                  ? 'border-teal-500 bg-teal-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-2xl font-bold text-gray-900">{option.count}</div>
              <div className="text-sm text-gray-600">{option.label}</div>
            </button>
          ))}
        </div>

        {/* Filter Summary */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredItems.length}</span> items
            {selectedFilter !== 'all' && (
              <span> • Total value: <span className="font-semibold text-red-600">{formatCurrency(totalValue)}</span></span>
            )}
          </div>
          {selectedFilter !== 'all' && (
            <button
              onClick={() => setSelectedFilter('all')}
              className="text-sm text-teal-600 hover:text-teal-700 font-medium TouchTarget"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{item.itemName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Category:</span>
                      <span className="ml-1 font-medium">{item.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity:</span>
                      <span className="ml-1 font-medium">{item.quantity} {item.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Best Before:</span>
                      <span className="ml-1 font-medium">{formatDate(item.bestBefore)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Days Left:</span>
                      <span className={`ml-1 font-bold ${
                        item.daysUntilExpiry === 0 ? 'text-red-600' : 
                        item.daysUntilExpiry === 1 ? 'text-orange-600' : 
                        'text-yellow-600'
                      }`}>
                        {item.daysUntilExpiry}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(item.totalValue)}</div>
                  <div className="text-sm text-gray-500">{formatCurrency(item.unitCost)}/unit</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-sm">
                <div>
                  <span className="text-gray-500">Location:</span>
                  <span className="ml-1 font-medium">{item.location}</span>
                </div>
                <div>
                  <span className="text-gray-500">Batch:</span>
                  <span className="ml-1 font-medium">{item.batchNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Supplier:</span>
                  <span className="ml-1 font-medium">{item.supplier}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 mt-4">
                <button className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors TouchTarget">
                  Mark as Used
                </button>
                <button className="px-3 py-2 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium hover:bg-orange-200 transition-colors TouchTarget">
                  Discount Price
                </button>
                <button className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors TouchTarget">
                  Mark as Waste
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500">There are no items matching your filter criteria.</p>
          </div>
        )}
    </StandardPageWrapper>
  )
}