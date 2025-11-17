'use client'

import { useState, useEffect, useCallback } from 'react'
import { FoodCostBadge } from '../../components/FoodCostBadge'
import { EmptyState } from '../../components/EmptyState'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { ModuleCard, StatCard } from '../../components/ModuleCard'
import { useAuth } from '../../hooks/useAuth'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { 
  TrendingUp, TrendingDown, DollarSign, Target, 
  BarChart3, PieChart, AlertTriangle, Star,
  Calendar, Filter, Download, Zap
} from 'lucide-react'
import { 
  MenuPricingResponse, 
  MenuPricingItem,
  PricingSummary
} from '../../../types/MenuTypes'

interface MenuAnalytics {
  total_revenue_potential: number
  weighted_food_cost_percentage: number
  top_performers: MenuPricingItem[]
  underperformers: MenuPricingItem[]
  category_analysis: CategoryAnalysis[]
  recommendations: Recommendation[]
}

interface CategoryAnalysis {
  category_name: string
  item_count: number
  average_margin: number
  average_food_cost_percentage: number
  total_contribution: number
  status_distribution: {
    excellent: number
    good: number
    high: number
    critical: number
    underpriced: number
  }
}

interface Recommendation {
  type: 'pricing' | 'cost_reduction' | 'promotion' | 'removal'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  potential_impact: string
  affected_items: number
}

export default function MenuAnalysisPage() {
  const { session, loading: authLoading } = useAuth()
  const [analytics, setAnalytics] = useState<MenuAnalytics | null>(null)
  const [pricingData, setPricingData] = useState<MenuPricingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const fetchAnalysisData = useCallback(async () => {
    if (!session?.access_token) return

    try {
      setLoading(true)

      // Fetch pricing data first
      const pricingResponse = await fetch('/api/menu/pricing', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!pricingResponse.ok) {
        throw new Error('Failed to fetch pricing data')
      }

      const pricingData: MenuPricingResponse = await pricingResponse.json()

      if (pricingData.success && pricingData.items.length > 0) {
        setPricingData(pricingData.items)
        
        // Generate analytics from pricing data
        const analytics = generateAnalytics(pricingData.items)
        setAnalytics(analytics)
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  const generateAnalytics = (items: MenuPricingItem[]): MenuAnalytics => {
    // Calculate total revenue potential (assuming average sales)
    const totalRevenuePotential = items.reduce((sum, item) => {
      const estimatedMonthlySales = 100 // Placeholder
      return sum + (item.menu_price * estimatedMonthlySales)
    }, 0)

    // Calculate weighted food cost percentage
    const totalRevenue = items.reduce((sum, item) => sum + (item.menu_price * 100), 0)
    const totalCosts = items.reduce((sum, item) => sum + (item.cost_per_portion * 100), 0)
    const weightedFoodCostPercentage = totalRevenue > 0 ? (totalCosts / totalRevenue) * 100 : 0

    // Top performers (best margin and low food cost %)
    const topPerformers = items
      .filter(item => item.food_cost_percentage <= 32)
      .sort((a, b) => b.contribution_margin - a.contribution_margin)
      .slice(0, 5)

    // Underperformers (high food cost % or low margin)
    const underperformers = items
      .filter(item => item.food_cost_percentage > 40 || item.contribution_margin < 5)
      .sort((a, b) => b.food_cost_percentage - a.food_cost_percentage)
      .slice(0, 5)

    // Category analysis
    const categoryGroups = items.reduce((groups, item) => {
      if (!groups[item.category_name]) {
        groups[item.category_name] = []
      }
      groups[item.category_name].push(item)
      return groups
    }, {} as Record<string, MenuPricingItem[]>)

    const categoryAnalysis: CategoryAnalysis[] = Object.entries(categoryGroups).map(([category, categoryItems]) => {
      const statusDistribution = {
        excellent: categoryItems.filter(i => i.status === 'excellent').length,
        good: categoryItems.filter(i => i.status === 'good').length,
        high: categoryItems.filter(i => i.status === 'high').length,
        critical: categoryItems.filter(i => i.status === 'critical').length,
        underpriced: categoryItems.filter(i => i.status === 'underpriced').length
      }

      return {
        category_name: category,
        item_count: categoryItems.length,
        average_margin: categoryItems.reduce((sum, item) => sum + item.contribution_margin, 0) / categoryItems.length,
        average_food_cost_percentage: categoryItems.reduce((sum, item) => sum + item.food_cost_percentage, 0) / categoryItems.length,
        total_contribution: categoryItems.reduce((sum, item) => sum + (item.contribution_margin * 100), 0), // Estimated
        status_distribution: statusDistribution
      }
    })

    // Generate recommendations
    const recommendations: Recommendation[] = []

    // High food cost items
    const highCostItems = items.filter(item => item.food_cost_percentage > 40)
    if (highCostItems.length > 0) {
      recommendations.push({
        type: 'pricing',
        priority: 'high',
        title: 'Increase Prices on High-Cost Items',
        description: `${highCostItems.length} items have food costs above 40%. Consider price increases.`,
        potential_impact: `Potential to improve margins by ${formatCurrency(highCostItems.reduce((sum, item) => sum + 3, 0))} per item`,
        affected_items: highCostItems.length
      })
    }

    // Underpriced items
    const underpricedItems = items.filter(item => item.food_cost_percentage < 15)
    if (underpricedItems.length > 0) {
      recommendations.push({
        type: 'pricing',
        priority: 'medium',
        title: 'Optimize Underpriced Items',
        description: `${underpricedItems.length} items may be underpriced with very low food cost percentages.`,
        potential_impact: 'Opportunity to increase revenue without losing customers',
        affected_items: underpricedItems.length
      })
    }

    // Low margin items
    const lowMarginItems = items.filter(item => item.contribution_margin < 8)
    if (lowMarginItems.length > 0) {
      recommendations.push({
        type: 'cost_reduction',
        priority: 'high',
        title: 'Reduce Costs on Low-Margin Items',
        description: `${lowMarginItems.length} items have contribution margins below $8.`,
        potential_impact: 'Focus on ingredient cost optimization',
        affected_items: lowMarginItems.length
      })
    }

    // Category performance
    const poorPerformingCategories = categoryAnalysis.filter(cat => 
      cat.average_food_cost_percentage > 35
    )
    if (poorPerformingCategories.length > 0) {
      recommendations.push({
        type: 'promotion',
        priority: 'medium',
        title: 'Review Category Performance',
        description: `${poorPerformingCategories.length} categories show high average food costs.`,
        potential_impact: 'Category-wide optimization opportunities',
        affected_items: poorPerformingCategories.reduce((sum, cat) => sum + cat.item_count, 0)
      })
    }

    return {
      total_revenue_potential: totalRevenuePotential,
      weighted_food_cost_percentage: weightedFoodCostPercentage,
      top_performers: topPerformers,
      underperformers: underperformers,
      category_analysis: categoryAnalysis,
      recommendations: recommendations
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'pricing': return <DollarSign className="h-5 w-5" />
      case 'cost_reduction': return <TrendingDown className="h-5 w-5" />
      case 'promotion': return <Zap className="h-5 w-5" />
      case 'removal': return <AlertTriangle className="h-5 w-5" />
      default: return <Target className="h-5 w-5" />
    }
  }

  const getRecommendationColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const filteredCategoryAnalysis = selectedCategory === 'all' 
    ? analytics?.category_analysis || []
    : analytics?.category_analysis.filter(cat => cat.category_name === selectedCategory) || []

  if (authLoading || loading) {
    return (
      <StandardPageWrapper moduleName="menu" currentPage="analysis">
        <div className="container mx-auto px-4 py-6">
          <LoadingSpinner />
        </div>
      </StandardPageWrapper>
    )
  }

  if (!analytics || pricingData.length === 0) {
    return (
      <StandardPageWrapper moduleName="menu" currentPage="analysis">
        <div className="container mx-auto px-4 py-6">
          <EmptyState
            title="No menu analysis data available"
            description="Menu analysis requires recipes with menu prices and cost data. Make sure you have recipes configured with prices."
          />
        </div>
      </StandardPageWrapper>
    )
  }

  const categories = Array.from(new Set(pricingData.map(item => item.category_name)))

  return (
    <StandardPageWrapper moduleName="menu" currentPage="analysis">
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Controls */}
        <ModuleCard className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analysis Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="current">Current Menu</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Focus
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard accentColor="green" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Revenue Potential</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.total_revenue_potential)}
                </p>
                <p className="text-sm text-gray-500">Monthly estimate</p>
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="blue" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Weighted Food Cost</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.weighted_food_cost_percentage.toFixed(1)}%
                </p>
                <div className="mt-1">
                  <FoodCostBadge percentage={analytics.weighted_food_cost_percentage} size="sm" />
                </div>
              </div>
            </div>
          </StatCard>

          <StatCard accentColor="orange" className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">Menu Items</p>
                <p className="text-2xl font-bold text-gray-900">{pricingData.length}</p>
                <p className="text-sm text-gray-500">Across {categories.length} categories</p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Top Performers & Underperformers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <ModuleCard theme="light" className="p-6">
            <div className="flex items-center mb-4">
              <Star className="h-6 w-6 text-yellow-500 mr-3" />
              <h2 className="text-xl font-semibold text-white">Top Performers</h2>
            </div>
            
            {analytics.top_performers.length === 0 ? (
              <p className="text-white/80">No top performers identified</p>
            ) : (
              <div className="space-y-3">
                {analytics.top_performers.map((item) => (
                  <div key={item.recipe_id} className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{item.recipe_name}</h3>
                        <p className="text-sm text-white/80">{item.category_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatCurrency(item.contribution_margin)}</p>
                        <FoodCostBadge percentage={item.food_cost_percentage} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModuleCard>

          {/* Underperformers */}
          <ModuleCard theme="light" className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Needs Attention</h2>
            </div>
            
            {analytics.underperformers.length === 0 ? (
              <p className="text-white/80">No items need immediate attention</p>
            ) : (
              <div className="space-y-3">
                {analytics.underperformers.map((item) => (
                  <div key={item.recipe_id} className="bg-white/10 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{item.recipe_name}</h3>
                        <p className="text-sm text-white/80">{item.category_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatCurrency(item.contribution_margin)}</p>
                        <FoodCostBadge percentage={item.food_cost_percentage} size="sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ModuleCard>
        </div>

        {/* Category Analysis */}
        <ModuleCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Performance</h2>
          
          {filteredCategoryAnalysis.length === 0 ? (
            <EmptyState
              title="No category data available"
              description="Select a different category or ensure your menu has categorized items."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Food Cost %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCategoryAnalysis.map((category) => (
                    <tr key={category.category_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.category_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {category.item_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(category.average_margin)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <FoodCostBadge percentage={category.average_food_cost_percentage} size="sm" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {category.status_distribution.excellent > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {category.status_distribution.excellent} 🟢
                            </span>
                          )}
                          {category.status_distribution.critical > 0 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {category.status_distribution.critical} 🔴
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ModuleCard>

        {/* Recommendations */}
        <ModuleCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Strategic Recommendations</h2>
          
          {analytics.recommendations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your menu is performing well! No immediate recommendations.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.recommendations.map((rec, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 ${getRecommendationColor(rec.priority)}`}
                >
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-4 ${
                      rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                      rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {getRecommendationIcon(rec.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{rec.title}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-1">{rec.description}</p>
                      <div className="mt-2 text-sm text-gray-600">
                        <p><strong>Impact:</strong> {rec.potential_impact}</p>
                        <p><strong>Affected Items:</strong> {rec.affected_items}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModuleCard>
      </div>
    </StandardPageWrapper>
  )
}