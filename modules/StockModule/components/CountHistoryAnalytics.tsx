/**
 * JiGR Count History and Analytics Views
 * 
 * Comprehensive analytics dashboard with:
 * - Historical count data visualization
 * - Trend analysis and forecasting
 * - Workflow performance metrics
 * - Anomaly detection patterns
 * - Par level compliance tracking
 * - Container utilization analytics
 * - Export capabilities
 * - iPad-optimized charts and interactions
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Scale,
  Wine,
  Beer,
  Container,
  Target,
  Activity,
  Users,
  Zap,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import type { InventoryItem, CountingWorkflow, AnomalyType } from '@/types/stock'

// ============================================================================
// TYPES
// ============================================================================

interface CountRecord {
  id: string
  item_id: string
  item_name: string
  counting_workflow: CountingWorkflow
  counted_quantity: number
  expected_quantity?: number
  variance?: number
  variance_percentage?: number
  count_date: string
  counted_by: string
  has_anomalies: boolean
  anomaly_types?: AnomalyType[]
  duration_seconds: number
  confidence_score?: number
}

interface AnalyticsMetrics {
  totalCounts: number
  accuracyRate: number
  avgCountTime: number
  anomalyRate: number
  workflowBreakdown: Record<CountingWorkflow, number>
  trendsData: {
    daily: { date: string; counts: number; accuracy: number }[]
    weekly: { week: string; counts: number; accuracy: number }[]
    monthly: { month: string; counts: number; accuracy: number }[]
  }
}

interface DateRange {
  start: Date
  end: Date
}

type Timeperiod = 'day' | 'week' | 'month' | 'quarter' | 'year'
type ViewType = 'overview' | 'trends' | 'performance' | 'anomalies' | 'workflows'

interface CountHistoryAnalyticsProps {
  isOpen: boolean
  onClose: () => void
  selectedItem?: InventoryItem
  dateRange?: DateRange
}

// ============================================================================
// COUNT HISTORY ANALYTICS COMPONENT
// ============================================================================

export const CountHistoryAnalytics: React.FC<CountHistoryAnalyticsProps> = ({
  isOpen,
  onClose,
  selectedItem,
  dateRange: initialDateRange
}) => {
  const [currentView, setCurrentView] = useState<ViewType>('overview')
  const [timeperiod, setTimeperiod] = useState<Timeperiod>('week')
  const [dateRange, setDateRange] = useState<DateRange>(
    initialDateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    }
  )
  const [isLoading, setIsLoading] = useState(true)
  const [countRecords, setCountRecords] = useState<CountRecord[]>([])
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<CountingWorkflow | 'all'>('all')

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData()
    }
  }, [isOpen, dateRange, selectedItem])

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API calls
      // Mock data for demonstration
      setTimeout(() => {
        const mockCountRecords: CountRecord[] = [
          {
            id: '1',
            item_id: 'item-1',
            item_name: 'Jasmine Rice 5kg',
            counting_workflow: 'container_weight',
            counted_quantity: 24.5,
            expected_quantity: 25.0,
            variance: -0.5,
            variance_percentage: -2.0,
            count_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            counted_by: 'John Smith',
            has_anomalies: false,
            duration_seconds: 45,
            confidence_score: 0.95
          },
          {
            id: '2',
            item_id: 'item-2',
            item_name: 'Chardonnay 2021',
            counting_workflow: 'bottle_hybrid',
            counted_quantity: 12.75,
            expected_quantity: 12.0,
            variance: 0.75,
            variance_percentage: 6.25,
            count_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            counted_by: 'Sarah Johnson',
            has_anomalies: true,
            anomaly_types: ['significant_variance'],
            duration_seconds: 120,
            confidence_score: 0.88
          },
          {
            id: '3',
            item_id: 'item-3',
            item_name: 'IPA Keg 50L',
            counting_workflow: 'keg_weight',
            counted_quantity: 42.3,
            expected_quantity: 45.0,
            variance: -2.7,
            variance_percentage: -6.0,
            count_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            counted_by: 'Mike Davis',
            has_anomalies: false,
            duration_seconds: 30,
            confidence_score: 0.92
          }
        ]

        const mockMetrics: AnalyticsMetrics = {
          totalCounts: 156,
          accuracyRate: 0.94,
          avgCountTime: 67,
          anomalyRate: 0.08,
          workflowBreakdown: {
            unit_count: 45,
            container_weight: 38,
            bottle_hybrid: 32,
            keg_weight: 28,
            batch_weight: 13
          },
          trendsData: {
            daily: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              counts: Math.floor(Math.random() * 20) + 5,
              accuracy: 0.85 + Math.random() * 0.15
            })),
            weekly: Array.from({ length: 12 }, (_, i) => ({
              week: `Week ${i + 1}`,
              counts: Math.floor(Math.random() * 100) + 50,
              accuracy: 0.88 + Math.random() * 0.12
            })),
            monthly: Array.from({ length: 6 }, (_, i) => ({
              month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
              counts: Math.floor(Math.random() * 400) + 200,
              accuracy: 0.90 + Math.random() * 0.10
            }))
          }
        }

        setCountRecords(mockCountRecords)
        setMetrics(mockMetrics)
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="border-b bg-white">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-600 rounded-lg text-white">
                <BarChart3 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Count History & Analytics</h2>
                <p className="text-gray-600 mt-1">
                  {selectedItem 
                    ? `Analytics for "${selectedItem.item_name}"`
                    : 'Comprehensive counting analytics'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Download size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw size={20} className="text-gray-600" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="transform rotate-45">
                  <Package size={20} className="text-gray-600" />
                </div>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex border-t">
            {[
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'trends', label: 'Trends', icon: TrendingUp },
              { key: 'performance', label: 'Performance', icon: Target },
              { key: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
              { key: 'workflows', label: 'Workflows', icon: Package }
            ].map(tab => {
              const Icon = tab.icon
              const isActive = currentView === tab.key
              
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentView(tab.key as ViewType)}
                  className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium transition-colors ${
                    isActive 
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="border-b bg-gray-50 p-4">
          <div className="flex items-center gap-4">
            
            {/* Time Period */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Period:</span>
              <select
                value={timeperiod}
                onChange={(e) => setTimeperiod(e.target.value as Timeperiod)}
                className="border border-gray-300 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            {/* Workflow Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Workflow:</span>
              <select
                value={selectedWorkflow}
                onChange={(e) => setSelectedWorkflow(e.target.value as CountingWorkflow | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Workflows</option>
                <option value="unit_count">Unit Count</option>
                <option value="container_weight">Container Weight</option>
                <option value="bottle_hybrid">Bottle Hybrid</option>
                <option value="keg_weight">Keg Weight</option>
                <option value="batch_weight">Batch Weight</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
              <input
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <AnalyticsLoading />
          ) : (
            <>
              {currentView === 'overview' && (
                <OverviewTab metrics={metrics} countRecords={countRecords} />
              )}
              {currentView === 'trends' && (
                <TrendsTab metrics={metrics} timeperiod={timeperiod} />
              )}
              {currentView === 'performance' && (
                <PerformanceTab countRecords={countRecords} metrics={metrics} />
              )}
              {currentView === 'anomalies' && (
                <AnomaliesTab countRecords={countRecords} />
              )}
              {currentView === 'workflows' && (
                <WorkflowsTab metrics={metrics} countRecords={countRecords} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

interface OverviewTabProps {
  metrics: AnalyticsMetrics | null
  countRecords: CountRecord[]
}

const OverviewTab: React.FC<OverviewTabProps> = ({ metrics, countRecords }) => {
  if (!metrics) return null

  const recentCounts = countRecords.slice(0, 5)

  return (
    <div className="p-6 space-y-6">
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Counts"
          value={metrics.totalCounts}
          icon={Activity}
          color="blue"
          trend={{ value: 12, direction: 'up' }}
        />
        <MetricCard
          title="Accuracy Rate"
          value={`${Math.round(metrics.accuracyRate * 100)}%`}
          icon={Target}
          color="green"
          trend={{ value: 3, direction: 'up' }}
        />
        <MetricCard
          title="Avg Count Time"
          value={`${metrics.avgCountTime}s`}
          icon={Clock}
          color="orange"
          trend={{ value: 8, direction: 'down' }}
        />
        <MetricCard
          title="Anomaly Rate"
          value={`${Math.round(metrics.anomalyRate * 100)}%`}
          icon={AlertTriangle}
          color={metrics.anomalyRate > 0.1 ? "red" : "green"}
          trend={{ value: 2, direction: 'down' }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Workflow Breakdown */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(metrics.workflowBreakdown).map(([workflow, count]) => {
              const total = Object.values(metrics.workflowBreakdown).reduce((a, b) => a + b, 0)
              const percentage = Math.round((count / total) * 100)
              const workflowStyles = getWorkflowStyles(workflow as CountingWorkflow)
              
              return (
                <div key={workflow} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: workflowStyles.primary }}
                    />
                    <span className="text-gray-700 capitalize">
                      {workflow.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">{count}</span>
                    <span className="text-gray-500 text-sm">({percentage}%)</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Counts */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Counts</h3>
          <div className="space-y-3">
            {recentCounts.map(record => (
              <div key={record.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{record.item_name}</p>
                  <p className="text-gray-600 text-xs">
                    {new Date(record.count_date).toLocaleDateString()} • {record.counted_by}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{record.counted_quantity}</p>
                  {record.variance !== undefined && (
                    <p className={`text-xs ${
                      record.variance > 0 ? 'text-green-600' : 
                      record.variance < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {record.variance > 0 ? '+' : ''}{record.variance_percentage?.toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Trends Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Counting Trends (Last 30 Days)</h3>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>Interactive chart will be implemented next</p>
            <p className="text-sm">Chart.js or similar charting library integration</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TRENDS TAB
// ============================================================================

interface TrendsTabProps {
  metrics: AnalyticsMetrics | null
  timeperiod: Timeperiod
}

const TrendsTab: React.FC<TrendsTabProps> = ({ metrics, timeperiod }) => {
  if (!metrics) return null

  return (
    <div className="p-6 space-y-6">
      
      {/* Trend Charts */}
      <div className="grid gap-6">
        
        {/* Count Volume Trend */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Count Volume Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp size={16} className="text-green-600" />
              <span>+15% vs last period</span>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
              <p>Time series chart for count volume</p>
              <p className="text-sm">Showing {timeperiod}ly data</p>
            </div>
          </div>
        </div>

        {/* Accuracy Trend */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Accuracy Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Target size={16} className="text-blue-600" />
              <span>94% average accuracy</span>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Target size={48} className="mx-auto mb-2 opacity-50" />
              <p>Accuracy percentage over time</p>
              <p className="text-sm">Target: >90% accuracy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={20} className="text-blue-600" />
            <h4 className="font-semibold text-blue-900">Positive Trends</h4>
          </div>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Count accuracy improved by 3% this month</li>
            <li>• Average counting time reduced by 8 seconds</li>
            <li>• Bottle hybrid workflow showing 95% accuracy</li>
          </ul>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-yellow-600" />
            <h4 className="font-semibold text-yellow-900">Areas for Improvement</h4>
          </div>
          <ul className="space-y-2 text-sm text-yellow-800">
            <li>• Container weight counts taking longer than usual</li>
            <li>• Slight increase in variance for batch items</li>
            <li>• Weekend counting accuracy lower than weekdays</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PERFORMANCE TAB
// ============================================================================

interface PerformanceTabProps {
  countRecords: CountRecord[]
  metrics: AnalyticsMetrics | null
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ countRecords, metrics }) => {
  return (
    <div className="p-6 space-y-6">
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={20} className="text-orange-600" />
            <h4 className="font-semibold text-gray-900">Speed Performance</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fastest Count:</span>
              <span className="font-medium">18s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average:</span>
              <span className="font-medium">67s</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Slowest Count:</span>
              <span className="font-medium">245s</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Target size={20} className="text-green-600" />
            <h4 className="font-semibold text-gray-900">Accuracy Performance</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Perfect Counts:</span>
              <span className="font-medium">78%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Within 5%:</span>
              <span className="font-medium">94%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Major Variances:</span>
              <span className="font-medium">6%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={20} className="text-purple-600" />
            <h4 className="font-semibold text-gray-900">Efficiency Score</h4>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-1">87/100</div>
            <p className="text-sm text-gray-600">Overall efficiency rating</p>
          </div>
        </div>
      </div>

      {/* Performance by User */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by User</h3>
        <div className="space-y-3">
          {[
            { name: 'Sarah Johnson', counts: 45, accuracy: 0.97, avgTime: 52 },
            { name: 'John Smith', counts: 38, accuracy: 0.94, avgTime: 61 },
            { name: 'Mike Davis', counts: 33, accuracy: 0.92, avgTime: 58 },
            { name: 'Lisa Wong', counts: 28, accuracy: 0.96, avgTime: 48 }
          ].map(user => (
            <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-600">{user.counts} counts completed</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-right text-sm">
                <div>
                  <p className="text-gray-600">Accuracy</p>
                  <p className="font-medium">{Math.round(user.accuracy * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Time</p>
                  <p className="font-medium">{user.avgTime}s</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance by Time of Day */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Time of Day</h3>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-2 opacity-50" />
            <p>Hourly performance heatmap</p>
            <p className="text-sm">Shows accuracy and speed by hour</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ANOMALIES TAB
// ============================================================================

interface AnomaliesTabProps {
  countRecords: CountRecord[]
}

const AnomaliesTab: React.FC<AnomaliesTabProps> = ({ countRecords }) => {
  const anomalousRecords = countRecords.filter(record => record.has_anomalies)

  return (
    <div className="p-6 space-y-6">
      
      {/* Anomaly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-900">Critical</span>
          </div>
          <div className="text-2xl font-bold text-red-900">2</div>
          <p className="text-xs text-red-700">Requires immediate attention</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-900">Warning</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">5</div>
          <p className="text-xs text-yellow-700">Should be investigated</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Info</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">8</div>
          <p className="text-xs text-blue-700">Minor discrepancies</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Resolved</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">12</div>
          <p className="text-xs text-gray-700">Previously resolved</p>
        </div>
      </div>

      {/* Recent Anomalies */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Anomalies</h3>
        
        {anomalousRecords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No anomalies detected in recent counts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anomalousRecords.map(record => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{record.item_name}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(record.count_date).toLocaleDateString()} • {record.counted_by}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {record.anomaly_types?.map(type => (
                      <span key={type} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        {type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    Variance: {record.variance_percentage?.toFixed(1)}%
                  </p>
                  <button className="text-red-600 hover:text-red-800 text-sm mt-1">
                    Investigate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anomaly Patterns */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Patterns</h3>
        <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <AlertTriangle size={48} className="mx-auto mb-2 opacity-50" />
            <p>Anomaly pattern analysis chart</p>
            <p className="text-sm">Identifies recurring anomaly trends</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WORKFLOWS TAB
// ============================================================================

interface WorkflowsTabProps {
  metrics: AnalyticsMetrics | null
  countRecords: CountRecord[]
}

const WorkflowsTab: React.FC<WorkflowsTabProps> = ({ metrics, countRecords }) => {
  if (!metrics) return null

  const workflows: { workflow: CountingWorkflow; icon: any; name: string }[] = [
    { workflow: 'unit_count', icon: Package, name: 'Unit Count' },
    { workflow: 'container_weight', icon: Scale, name: 'Container Weight' },
    { workflow: 'bottle_hybrid', icon: Wine, name: 'Bottle Hybrid' },
    { workflow: 'keg_weight', icon: Beer, name: 'Keg Weight' },
    { workflow: 'batch_weight', icon: Calendar, name: 'Batch Weight' }
  ]

  return (
    <div className="p-6 space-y-6">
      
      {/* Workflow Performance Grid */}
      <div className="grid gap-6">
        {workflows.map(({ workflow, icon: Icon, name }) => {
          const workflowCounts = countRecords.filter(r => r.counting_workflow === workflow)
          const avgAccuracy = workflowCounts.length > 0 
            ? workflowCounts.reduce((sum, record) => {
                const accuracy = record.variance_percentage ? 1 - Math.abs(record.variance_percentage / 100) : 1
                return sum + accuracy
              }, 0) / workflowCounts.length 
            : 0
          const avgTime = workflowCounts.length > 0
            ? workflowCounts.reduce((sum, record) => sum + record.duration_seconds, 0) / workflowCounts.length
            : 0
          
          const workflowStyles = getWorkflowStyles(workflow)
          
          return (
            <div key={workflow} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-lg text-white"
                    style={{ backgroundColor: workflowStyles.primary }}
                  >
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                    <p className="text-gray-600">{metrics.workflowBreakdown[workflow]} counts</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{Math.round(avgAccuracy * 100)}%</p>
                  <p className="text-sm text-gray-600">Avg Accuracy</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{Math.round(avgTime)}s</p>
                  <p className="text-sm text-gray-600">Avg Time</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{workflowCounts.filter(r => r.has_anomalies).length}</p>
                  <p className="text-sm text-gray-600">Anomalies</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Workflow Comparison Chart */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Performance Comparison</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
            <p>Comparative performance chart</p>
            <p className="text-sm">Speed vs accuracy by workflow</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'orange' | 'red'
  trend?: { value: number; direction: 'up' | 'down' }
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600'
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="mb-1">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  )
}

const AnalyticsLoading: React.FC = () => (
  <div className="p-6">
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ))}
    </div>
    <div className="h-64 bg-gray-300 rounded-lg animate-pulse"></div>
  </div>
)

export default CountHistoryAnalytics