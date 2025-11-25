'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { MetricCard } from '@/app/components/MetricCard'
import { QuickActionButton, QuickActionGrid } from '@/app/components/QuickActionButton'

interface DashboardMetrics {
  stock: {
    totalItems: number
    totalValue: number
    lowStockCount: number
    expiringCount: number
  }
  recipes: {
    totalRecipes: number
    averageCost: number
    recentlyAdded: number
  }
  menu: {
    totalItems: number
    averageMargin: number
    popularItems: number
  }
  operations: {
    dailyRevenue: number
    ordersToday: number
    avgOrderValue: number
    customerSatisfaction: number
  }
}

interface RecentActivity {
  id: string
  type: 'stock_update' | 'recipe_created' | 'menu_update' | 'order' | 'alert'
  title: string
  description: string
  timestamp: string
  status?: 'success' | 'warning' | 'error'
  metadata?: any
}

interface QuickInsight {
  id: string
  title: string
  description: string
  type: 'success' | 'warning' | 'info' | 'error'
  action?: {
    label: string
    url: string
  }
}

interface MainDashboardProps {
  className?: string
}

export function MainDashboard({ className = '' }: MainDashboardProps) {
  const router = useRouter()
  
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(loadDashboardData, 120000)
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const [metricsRes, activityRes, insightsRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/dashboard/activity?limit=10'),
        fetch('/api/dashboard/insights')
      ])

      const [metricsData, activityData, insightsData] = await Promise.all([
        metricsRes.ok ? metricsRes.json() : null,
        activityRes.ok ? activityRes.json() : { activities: [] },
        insightsRes.ok ? insightsRes.json() : { insights: [] }
      ])

      if (metricsData) setMetrics(metricsData)
      setRecentActivity(activityData.activities || [])
      setQuickInsights(insightsData.insights || [])
      setError(null)
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'scan':
        router.push('/scan')
        break
      case 'stock_count':
        router.push('/scan?workflow=inventory_count')
        break
      case 'add_recipe':
        router.push('/recipes/import/universal')
        break
      case 'view_stock':
        router.push('/stock/dashboard')
        break
      case 'view_recipes':
        router.push('/recipes')
        break
      case 'view_menu':
        router.push('/menu')
        break
      case 'analytics':
        router.push('/analytics')
        break
      case 'alerts':
        router.push('/alerts')
        break
    }
  }

  const getActivityIcon = (type: string, status?: string) => {
    const iconClass = "h-4 w-4"
    const colorClass = status === 'error' ? 'text-red-500' : 
                     status === 'warning' ? 'text-amber-500' : 'text-green-500'
    
    switch (type) {
      case 'stock_update': return <span className={`icon-[tabler--package] ${iconClass} ${colorClass}`}></span>
      case 'recipe_created': return <span className={`icon-[tabler--chef-hat] ${iconClass} ${colorClass}`}></span>
      case 'menu_update': return <span className={`icon-[tabler--menu-2] ${iconClass} ${colorClass}`}></span>
      case 'order': return <span className={`icon-[tabler--currency-dollar] ${iconClass} ${colorClass}`}></span>
      case 'alert': return <span className={`icon-[tabler--alert-triangle] ${iconClass} ${colorClass}`}></span>
      default: return <span className={`icon-[tabler--activity] ${iconClass} ${colorClass}`}></span>
    }
  }

  const getInsightIcon = (type: string) => {
    const iconClass = "h-5 w-5"
    switch (type) {
      case 'success': return <span className={`icon-[tabler--star] ${iconClass} text-green-500`}></span>
      case 'warning': return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-amber-500`}></span>
      case 'error': return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-red-500`}></span>
      default: return <span className={`icon-[tabler--chart-bar] ${iconClass} text-blue-500`}></span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
          ))}
        </div>
        <div className="bg-gray-200 h-40 rounded-lg"></div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-200 h-64 rounded-lg"></div>
          <div className="bg-gray-200 h-64 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your operations.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            title="Refresh"
          >
            <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
          </button>
          
          <button
            onClick={() => handleQuickAction('scan')}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <span className="icon-[tabler--scan] h-4 w-4"></span>
            <span>Quick Scan</span>
          </button>
        </div>
      </div>

      {/* Quick Insights */}
      {quickInsights.length > 0 && (
        <div className="space-y-3">
          {quickInsights.slice(0, 2).map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${
                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                insight.type === 'error' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getInsightIcon(insight.type)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                  {insight.action && (
                    <button
                      onClick={() => router.push(insight.action!.url)}
                      className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>{insight.action.label}</span>
                      <span className="icon-[tabler--arrow-right] h-3 w-3"></span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Stock Value"
            value={`$${metrics.stock.totalValue.toLocaleString()}`}
            subtitle={`${metrics.stock.totalItems} items tracked`}
            icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
            theme="white"
            onClick={() => handleQuickAction('view_stock')}
          />
          
          <MetricCard
            title="Low Stock Items"
            value={metrics.stock.lowStockCount}
            subtitle="Need attention"
            icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
            theme="white"
            className={metrics.stock.lowStockCount > 0 ? 'border-amber-200 bg-amber-50' : ''}
            onClick={() => handleQuickAction('alerts')}
          />
          
          <MetricCard
            title="Recipe Library"
            value={metrics.recipes.totalRecipes}
            subtitle={`Avg cost $${metrics.recipes.averageCost.toFixed(2)}`}
            icon={() => <span className="icon-[tabler--chef-hat] w-5 h-5"></span>}
            theme="white"
            onClick={() => handleQuickAction('view_recipes')}
          />
          
          <MetricCard
            title="Menu Items"
            value={metrics.menu.totalItems}
            subtitle={`${metrics.menu.averageMargin.toFixed(1)}% avg margin`}
            icon={() => <span className="icon-[tabler--menu-2] w-5 h-5"></span>}
            theme="white"
            onClick={() => handleQuickAction('view_menu')}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <QuickActionGrid>
          <QuickActionButton
            title="Scan Barcode"
            description="Quick product lookup"
            icon={() => <span className="icon-[tabler--scan] w-5 h-5"></span>}
            onClick={() => handleQuickAction('scan')}
            size="medium"
          />
          
          <QuickActionButton
            title="Stock Count"
            description="Start inventory count"
            icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
            onClick={() => handleQuickAction('stock_count')}
            size="medium"
          />
          
          <QuickActionButton
            title="Add Recipe"
            description="Import or create new"
            icon={() => <span className="icon-[tabler--chef-hat] w-5 h-5"></span>}
            onClick={() => handleQuickAction('add_recipe')}
            size="medium"
          />
          
          <QuickActionButton
            title="Take Photo"
            description="Document delivery"
            icon={() => <span className="icon-[tabler--camera] w-5 h-5"></span>}
            onClick={() => router.push('/upload/capture')}
            size="medium"
          />
          
          <QuickActionButton
            title="View Analytics"
            description="Performance insights"
            icon={() => <span className="icon-[tabler--chart-bar] w-5 h-5"></span>}
            onClick={() => handleQuickAction('analytics')}
            size="medium"
          />
          
          <QuickActionButton
            title="Manage Team"
            description="User permissions"
            icon={() => <span className="icon-[tabler--users] w-5 h-5"></span>}
            onClick={() => router.push('/admin/team')}
            size="medium"
          />
        </QuickActionGrid>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <button
                onClick={() => router.push('/activity')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all →
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 6).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    {getActivityIcon(activity.type, activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="icon-[tabler--activity] w-12 h-12 text-gray-300 mx-auto mb-4"></span>
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Module Status */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Module Status</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="icon-[tabler--package] h-5 w-5 text-blue-600"></span>
                  <div>
                    <p className="font-medium text-gray-900">Stock Management</p>
                    <p className="text-sm text-gray-500">Real-time inventory tracking</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="icon-[tabler--chef-hat] h-5 w-5 text-green-600"></span>
                  <div>
                    <p className="font-medium text-gray-900">Recipe Management</p>
                    <p className="text-sm text-gray-500">Cost calculation & scaling</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="icon-[tabler--menu-2] h-5 w-5 text-purple-600"></span>
                  <div>
                    <p className="font-medium text-gray-900">Menu Engineering</p>
                    <p className="text-sm text-gray-500">Pricing & profitability</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="icon-[tabler--truck] h-5 w-5 text-orange-600"></span>
                  <div>
                    <p className="font-medium text-gray-900">Delivery Compliance</p>
                    <p className="text-sm text-gray-500">OCR document processing</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Active</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/admin/configuration')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Configure Modules →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>
            <span>{error}</span>
            <button 
              onClick={() => loadDashboardData(true)}
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