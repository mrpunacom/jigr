'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Removed Lucide React imports - using Tabler icons via CSS classes
import { MetricCard } from '@/app/components/MetricCard'
import { 
  useResponsive, 
  ResponsiveGrid, 
  ResponsiveContainer, 
  TouchButton,
  ResponsiveText
} from '@/app/components/responsive/ResponsiveDesignSystem'

interface AnalyticsData {
  overview: {
    totalRevenue: number
    revenueChange: number
    totalOrders: number
    ordersChange: number
    averageOrderValue: number
    aovChange: number
    customerSatisfaction: number
    satisfactionChange: number
  }
  periods: {
    current: string
    previous: string
  }
  charts: {
    revenueChart: Array<{
      date: string
      revenue: number
      orders: number
    }>
    categoryChart: Array<{
      category: string
      revenue: number
      orders: number
      margin: number
    }>
    itemPerformance: Array<{
      id: string
      name: string
      revenue: number
      orders: number
      margin: number
      trend: 'up' | 'down' | 'stable'
    }>
    hourlyDistribution: Array<{
      hour: number
      orders: number
      revenue: number
    }>
  }
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral'
    title: string
    description: string
    metric?: string
    recommendation?: string
  }>
}

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const router = useRouter()
  const responsive = useResponsive()
  
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange, setDateRange] = useState('7d') // 7d, 30d, 90d, 1y
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    loadAnalyticsData()
  }, [dateRange])

  const loadAnalyticsData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const response = await fetch(`/api/analytics/dashboard?range=${dateRange}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
      
    } catch (error) {
      console.error('Failed to load analytics:', error)
      setError('Failed to load analytics data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?range=${dateRange}&format=pdf`)
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_report_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export report')
    }
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <span className="icon-[tabler--trending-up] h-4 w-4 text-green-500"></span>
    if (change < 0) return <span className="icon-[tabler--trending-down] h-4 w-4 text-red-500"></span>
    return <div className="w-4 h-4" />
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <span className="icon-[tabler--award] h-5 w-5 text-green-500"></span>
      case 'negative': return <span className="icon-[tabler--trending-down] h-5 w-5 text-red-500"></span>
      default: return <span className="icon-[tabler--bolt] h-5 w-5 text-blue-500"></span>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-80 bg-gray-200 rounded"></div>
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <div className="flex items-center justify-between">
          <span>{error || 'Failed to load analytics'}</span>
          <button 
            onClick={() => loadAnalyticsData(true)}
            className="text-sm underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex ${responsive.isMobile ? 'flex-col space-y-4' : 'flex-row items-center justify-between'}`}>
          <div>
            <ResponsiveText 
              as="h1" 
              size={{ mobile: 'text-xl', tablet: 'text-2xl', desktop: 'text-2xl' }}
              weight="font-bold"
              className="text-gray-900"
            >
              Analytics & Reports
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'text-sm', tablet: 'text-base', desktop: 'text-base' }}
              className="text-gray-600"
            >
              Performance insights for {data.periods.current}
              {data.periods.previous && ` vs ${data.periods.previous}`}
            </ResponsiveText>
          </div>
          
          <div className={`flex ${responsive.isMobile ? 'flex-col space-y-2' : 'items-center space-x-3'}`}>
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`${responsive.isMobile ? 'w-full' : ''} px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              style={{ minHeight: responsive.isTouch ? '48px' : '40px' }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <div className={`flex ${responsive.isMobile ? 'w-full space-x-2' : 'space-x-3'}`}>
              <TouchButton
                onClick={() => loadAnalyticsData(true)}
                disabled={refreshing}
                variant="ghost"
                size="md"
                className={`${responsive.isMobile ? 'flex-1' : ''}`}
              >
                <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
                {responsive.isMobile && <span className="ml-2">Refresh</span>}
              </TouchButton>
              
              <TouchButton
                onClick={exportReport}
                variant="primary"
                size="md"
                className={`${responsive.isMobile ? 'flex-1' : ''}`}
              >
                <span className="icon-[tabler--download] h-4 w-4"></span>
                <span className="ml-2">Export</span>
              </TouchButton>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <ResponsiveGrid 
          cols={{ mobile: 1, tablet: 2, desktop: 4, largeDesktop: 4 }}
          gap={{ mobile: 4, tablet: 4, desktop: 4 }}
        >
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.overview.totalRevenue)}
          subtitle={
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.overview.revenueChange)}
              <span className={getTrendColor(data.overview.revenueChange)}>
                {formatPercent(data.overview.revenueChange)}
              </span>
            </div>
          }
          icon={() => <span className="icon-[tabler--currency-dollar] w-5 h-5"></span>}
          theme="white"
        />
        
        <MetricCard
          title="Total Orders"
          value={data.overview.totalOrders.toLocaleString()}
          subtitle={
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.overview.ordersChange)}
              <span className={getTrendColor(data.overview.ordersChange)}>
                {formatPercent(data.overview.ordersChange)}
              </span>
            </div>
          }
          icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
          theme="white"
        />
        
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.overview.averageOrderValue)}
          subtitle={
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.overview.aovChange)}
              <span className={getTrendColor(data.overview.aovChange)}>
                {formatPercent(data.overview.aovChange)}
              </span>
            </div>
          }
          icon={() => <span className="icon-[tabler--target] w-5 h-5"></span>}
          theme="white"
        />
        
        <MetricCard
          title="Customer Satisfaction"
          value={`${data.overview.customerSatisfaction.toFixed(1)}/5.0`}
          subtitle={
            <div className="flex items-center space-x-1">
              {getTrendIcon(data.overview.satisfactionChange)}
              <span className={getTrendColor(data.overview.satisfactionChange)}>
                {formatPercent(data.overview.satisfactionChange)}
              </span>
            </div>
          }
          icon={() => <span className="icon-[tabler--users] w-5 h-5"></span>}
          theme="white"
        />
        </ResponsiveGrid>

        {/* Charts Section */}
        <ResponsiveGrid 
          cols={{ mobile: 1, tablet: 1, desktop: 2, largeDesktop: 2 }}
          gap={{ mobile: 4, tablet: 6, desktop: 6 }}
        >
        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="revenue">Revenue</option>
              <option value="orders">Orders</option>
            </select>
          </div>
          
          {/* Simple chart representation */}
          <div className="space-y-2">
            {data.charts.revenueChart.map((item, index) => {
              const maxValue = Math.max(...data.charts.revenueChart.map(d => 
                selectedMetric === 'revenue' ? d.revenue : d.orders
              ))
              const value = selectedMetric === 'revenue' ? item.revenue : item.orders
              const percentage = (value / maxValue) * 100
              
              return (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-16 text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-20 text-xs text-gray-900 text-right">
                    {selectedMetric === 'revenue' 
                      ? formatCurrency(value)
                      : value.toLocaleString()
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Category Performance</h3>
            <button
              onClick={() => router.push('/analytics/categories')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View details →
            </button>
          </div>
          
          <div className="space-y-3">
            {data.charts.categoryChart.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{category.category}</h4>
                  <p className="text-sm text-gray-500">
                    {category.orders} orders • {category.margin.toFixed(1)}% margin
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(category.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Items */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Items</h3>
            <button
              onClick={() => router.push('/analytics/items')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all →
            </button>
          </div>
          
          <div className="space-y-3">
            {data.charts.itemPerformance.slice(0, 5).map((item, index) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <p className="text-sm text-gray-500">
                      {item.orders} orders • {item.margin.toFixed(1)}% margin
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  {item.trend === 'up' && <span className="icon-[tabler--arrow-up-right] h-4 w-4 text-green-500"></span>}
                  {item.trend === 'down' && <span className="icon-[tabler--arrow-down-right] h-4 w-4 text-red-500"></span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Distribution</h3>
          
          <div className="grid grid-cols-8 gap-2">
            {data.charts.hourlyDistribution.map((hour) => {
              const maxOrders = Math.max(...data.charts.hourlyDistribution.map(h => h.orders))
              const height = (hour.orders / maxOrders) * 100
              
              return (
                <div key={hour.hour} className="text-center">
                  <div className="h-24 flex items-end mb-1">
                    <div 
                      className="w-full bg-blue-600 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${hour.hour}:00 - ${hour.orders} orders`}
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    {hour.hour.toString().padStart(2, '0')}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        </ResponsiveGrid>

        {/* Insights Section */}
      {data.insights.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          
          <ResponsiveGrid 
            cols={{ mobile: 1, tablet: 1, desktop: 2, largeDesktop: 2 }}
            gap={{ mobile: 4, tablet: 4, desktop: 4 }}
          >
            {data.insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                  insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getInsightIcon(insight.type)}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                    {insight.metric && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {insight.metric}
                      </p>
                    )}
                    {insight.recommendation && (
                      <p className="text-xs text-blue-600 font-medium">
                        💡 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </ResponsiveGrid>
        </div>
      )}

        {/* Quick Actions */}
        <div className={`${responsive.isMobile ? 'space-y-3' : 'flex justify-center'}`}>
          {responsive.isMobile ? (
            <div className="space-y-3">
              <TouchButton
                onClick={() => router.push('/analytics/detailed')}
                variant="secondary"
                size="lg"
                className="w-full justify-start"
              >
                <span className="icon-[tabler--chart-bar] h-4 w-4"></span>
                <span>Detailed Analytics</span>
              </TouchButton>
              <TouchButton
                onClick={() => router.push('/analytics/custom')}
                variant="secondary"
                size="lg"
                className="w-full justify-start"
              >
                <span className="icon-[tabler--filter] h-4 w-4"></span>
                <span>Custom Reports</span>
              </TouchButton>
              <TouchButton
                onClick={() => router.push('/analytics/forecasting')}
                variant="secondary"
                size="lg"
                className="w-full justify-start"
              >
                <span className="icon-[tabler--trending-up] h-4 w-4"></span>
                <span>Forecasting</span>
              </TouchButton>
            </div>
          ) : (
            <div className="flex items-center space-x-4 bg-white border border-gray-200 rounded-lg px-6 py-3">
              <TouchButton
                onClick={() => router.push('/analytics/detailed')}
                variant="ghost"
                className="text-blue-600 hover:text-blue-800"
              >
                <span className="icon-[tabler--chart-bar] h-4 w-4"></span>
                <span>Detailed Analytics</span>
              </TouchButton>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <TouchButton
                onClick={() => router.push('/analytics/custom')}
                variant="ghost"
                className="text-purple-600 hover:text-purple-800"
              >
                <span className="icon-[tabler--filter] h-4 w-4"></span>
                <span>Custom Reports</span>
              </TouchButton>
              
              <div className="w-px h-4 bg-gray-300"></div>
              
              <TouchButton
                onClick={() => router.push('/analytics/forecasting')}
                variant="ghost"
                className="text-green-600 hover:text-green-800"
              >
                <span className="icon-[tabler--trending-up] h-4 w-4"></span>
                <span>Forecasting</span>
              </TouchButton>
            </div>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  )
}