'use client'

import { useState, useEffect, useCallback } from 'react'
import { SearchInput } from '../../components/SearchInput'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  Star, TrendingUp, HelpCircle, Trash2, 
  BarChart3, Target, AlertTriangle, Info,
  ChevronDown, ChevronUp, Users, DollarSign
} from 'lucide-react'
import { 
  MenuEngineeringMatrix,
  MenuEngineeringResponse,
  QuadrantSummary,
  MenuEngineering
} from '../../../types/MenuTypes'

export default function MenuEngineeringPage() {
  const { session, loading: authLoading } = useAuth()
  const [matrix, setMatrix] = useState<MenuEngineeringMatrix | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedQuadrant, setExpandedQuadrant] = useState<string | null>('star')
  const [showDataWarning, setShowDataWarning] = useState(true)

  const fetchEngineeringData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      const response = await fetch('/api/menu/engineering', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch menu engineering data')
      }

      const data: MenuEngineeringResponse = await response.json()

      if (data.success) {
        setMatrix(data.matrix)
      }
    } catch (error) {
      console.error('Error fetching menu engineering data:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!authLoading && session) {
      fetchEngineeringData()
    }
  }, [authLoading, session, fetchEngineeringData])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleItemClick = (recipeId: string) => {
    window.location.href = `/recipes/${recipeId}`
  }

  const getQuadrantIcon = (quadrant: string) => {
    switch (quadrant) {
      case 'star': return <Star className="h-6 w-6 text-yellow-500" />
      case 'plowhorse': return <TrendingUp className="h-6 w-6 text-blue-500" />
      case 'puzzle': return <HelpCircle className="h-6 w-6 text-orange-500" />
      case 'dog': return <Trash2 className="h-6 w-6 text-red-500" />
      default: return null
    }
  }

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case 'star': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'plowhorse': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'puzzle': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'dog': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const filterItems = (items: MenuEngineering[]) => {
    if (!searchTerm) return items
    return items.filter(item => 
      item.recipe_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (authLoading || loading) {
    return (
      <StandardPageWrapper moduleName="menu" currentPage="engineering">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  if (!matrix) {
    return (
      <StandardPageWrapper moduleName="menu" currentPage="engineering">
        <div className="container mx-auto px-4 py-6">
          <EmptyState
            title="No menu engineering data available"
            description="Menu engineering analysis requires recipes with menu prices and sales data. Make sure you have recipes configured with prices."
          />
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="menu" currentPage="engineering">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Sales Data Warning */}
        {showDataWarning && (
          <div className="bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-start">
            <Info className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Limited Sales Data</p>
              <p className="text-sm mt-1">
                Menu engineering works best with actual sales data. Currently using placeholder data. 
                Connect your POS system for accurate popularity analysis.
              </p>
            </div>
            <button 
              onClick={() => setShowDataWarning(false)}
              className="ml-3 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-gray-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{matrix.total_items}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="green">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Median Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(matrix.median_margin)}
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="blue">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Median Sales</p>
                <p className="text-2xl font-bold text-gray-900">{matrix.median_sales}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="yellow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Stars</p>
                <p className="text-2xl font-bold text-gray-900">{matrix.stars.count}</p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Search */}
        <ModuleCard className="p-6">
          <div className="max-w-md">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search menu items..."
            />
          </div>
        </ModuleCard>

        {/* Menu Engineering Matrix */}
        <ModuleCard theme="light" className="p-6">
          <div className="flex items-center mb-6">
            <Target className="h-6 w-6 text-white mr-3" />
            <h2 className="text-xl font-semibold text-white">Menu Engineering Matrix</h2>
          </div>

          {/* 2x2 Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stars - High Profit, High Sales */}
            <div className={`rounded-lg border-2 p-6 ${getQuadrantColor('star')}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getQuadrantIcon('star')}
                  <div className="ml-3">
                    <h3 className="font-bold text-lg">⭐ STARS</h3>
                    <p className="text-sm opacity-80">High Profit • High Sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{matrix.stars.count}</p>
                  <p className="text-sm opacity-80">items</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="opacity-80">Avg Margin</p>
                  <p className="font-semibold">{formatCurrency(matrix.stars.average_margin)}</p>
                </div>
                <div>
                  <p className="opacity-80">Total Contribution</p>
                  <p className="font-semibold">{formatCurrency(matrix.stars.total_contribution)}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4 opacity-90">
                {matrix.stars.description}
              </p>
              
              <button
                onClick={() => setExpandedQuadrant(expandedQuadrant === 'star' ? null : 'star')}
                className="flex items-center text-sm font-medium hover:underline"
              >
                {expandedQuadrant === 'star' ? (
                  <>Hide Items <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Show Items <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </button>
            </div>

            {/* Plowhorses - High Profit, Low Sales */}
            <div className={`rounded-lg border-2 p-6 ${getQuadrantColor('plowhorse')}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getQuadrantIcon('plowhorse')}
                  <div className="ml-3">
                    <h3 className="font-bold text-lg">🐴 PLOWHORSES</h3>
                    <p className="text-sm opacity-80">High Profit • Low Sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{matrix.plowhorses.count}</p>
                  <p className="text-sm opacity-80">items</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="opacity-80">Avg Margin</p>
                  <p className="font-semibold">{formatCurrency(matrix.plowhorses.average_margin)}</p>
                </div>
                <div>
                  <p className="opacity-80">Total Contribution</p>
                  <p className="font-semibold">{formatCurrency(matrix.plowhorses.total_contribution)}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4 opacity-90">
                {matrix.plowhorses.description}
              </p>
              
              <button
                onClick={() => setExpandedQuadrant(expandedQuadrant === 'plowhorse' ? null : 'plowhorse')}
                className="flex items-center text-sm font-medium hover:underline"
              >
                {expandedQuadrant === 'plowhorse' ? (
                  <>Hide Items <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Show Items <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </button>
            </div>

            {/* Puzzles - Low Profit, High Sales */}
            <div className={`rounded-lg border-2 p-6 ${getQuadrantColor('puzzle')}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getQuadrantIcon('puzzle')}
                  <div className="ml-3">
                    <h3 className="font-bold text-lg">❓ PUZZLES</h3>
                    <p className="text-sm opacity-80">Low Profit • High Sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{matrix.puzzles.count}</p>
                  <p className="text-sm opacity-80">items</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="opacity-80">Avg Margin</p>
                  <p className="font-semibold">{formatCurrency(matrix.puzzles.average_margin)}</p>
                </div>
                <div>
                  <p className="opacity-80">Total Contribution</p>
                  <p className="font-semibold">{formatCurrency(matrix.puzzles.total_contribution)}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4 opacity-90">
                {matrix.puzzles.description}
              </p>
              
              <button
                onClick={() => setExpandedQuadrant(expandedQuadrant === 'puzzle' ? null : 'puzzle')}
                className="flex items-center text-sm font-medium hover:underline"
              >
                {expandedQuadrant === 'puzzle' ? (
                  <>Hide Items <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Show Items <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </button>
            </div>

            {/* Dogs - Low Profit, Low Sales */}
            <div className={`rounded-lg border-2 p-6 ${getQuadrantColor('dog')}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {getQuadrantIcon('dog')}
                  <div className="ml-3">
                    <h3 className="font-bold text-lg">🐕 DOGS</h3>
                    <p className="text-sm opacity-80">Low Profit • Low Sales</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{matrix.dogs.count}</p>
                  <p className="text-sm opacity-80">items</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="opacity-80">Avg Margin</p>
                  <p className="font-semibold">{formatCurrency(matrix.dogs.average_margin)}</p>
                </div>
                <div>
                  <p className="opacity-80">Total Contribution</p>
                  <p className="font-semibold">{formatCurrency(matrix.dogs.total_contribution)}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4 opacity-90">
                {matrix.dogs.description}
              </p>
              
              <button
                onClick={() => setExpandedQuadrant(expandedQuadrant === 'dog' ? null : 'dog')}
                className="flex items-center text-sm font-medium hover:underline"
              >
                {expandedQuadrant === 'dog' ? (
                  <>Hide Items <ChevronUp className="h-4 w-4 ml-1" /></>
                ) : (
                  <>Show Items <ChevronDown className="h-4 w-4 ml-1" /></>
                )}
              </button>
            </div>
          </div>
        </ModuleCard>

        {/* Expanded Quadrant Items */}
        {expandedQuadrant && matrix && (
          <ModuleCard className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              {getQuadrantIcon(expandedQuadrant)}
              <span className="ml-2">
                {expandedQuadrant.charAt(0).toUpperCase() + expandedQuadrant.slice(1)} Items
              </span>
            </h3>

            {(() => {
              const quadrantData = matrix[expandedQuadrant as keyof MenuEngineeringMatrix] as QuadrantSummary
              const filteredItems = filterItems(quadrantData.items)

              return filteredItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  {searchTerm ? 'No items match your search.' : 'No items in this quadrant.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Margin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommendation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredItems.map((item) => (
                        <tr 
                          key={item.recipe_id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleItemClick(item.recipe_id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {item.recipe_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {item.category_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.contribution_margin)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.sales_count}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                            {item.recommendation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleItemClick(item.recipe_id)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </ModuleCard>
        )}
      </div>
    </StandardPageWrapper>
  )
}