/**
 * JiGR Stock Dashboard - Main Interface
 * 
 * Beautiful, responsive dashboard for the hybrid inventory counting system
 * Optimized for iPad Air 2013 with touch-friendly design
 */

'use client'

import React, { useState, useEffect } from 'react'
import { StockDesignTokens, getWorkflowStyles, StockResponsiveUtils } from '../StockModuleCore'
import { WorkflowConfig } from '../StockModuleCore'

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  totalItems: number
  pendingCounts: number
  anomaliesDetected: number
  containersInUse: number
  lastCountDate: string | null
}

interface WorkflowStats {
  workflow: string
  itemCount: number
  recentCounts: number
  avgConfidence: number
}

// ============================================================================
// STOCK DASHBOARD COMPONENT
// ============================================================================

export const StockDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [workflowStats, setWorkflowStats] = useState<WorkflowStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setIsLoading(true)
      
      // TODO: Replace with actual API calls
      // For now, using mock data to demonstrate the UI
      setTimeout(() => {
        setStats({
          totalItems: 247,
          pendingCounts: 23,
          anomaliesDetected: 3,
          containersInUse: 8,
          lastCountDate: new Date().toISOString()
        })
        
        setWorkflowStats([
          { workflow: 'unit_count', itemCount: 89, recentCounts: 45, avgConfidence: 0.95 },
          { workflow: 'container_weight', itemCount: 72, recentCounts: 18, avgConfidence: 0.88 },
          { workflow: 'bottle_hybrid', itemCount: 34, recentCounts: 12, avgConfidence: 0.92 },
          { workflow: 'keg_weight', itemCount: 28, recentCounts: 8, avgConfidence: 0.96 },
          { workflow: 'batch_weight', itemCount: 24, recentCounts: 6, avgConfidence: 0.91 }
        ])
        
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader stats={stats} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Actions Bar */}
        <QuickActionsBar />
        
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Items"
            value={stats?.totalItems || 0}
            icon={() => <span className="icon-[tabler--package] w-5 h-5"></span>}
            color="blue"
            trend="+12 this week"
          />
          <StatCard
            title="Pending Counts"
            value={stats?.pendingCounts || 0}
            icon={() => <span className="icon-[tabler--clock] w-5 h-5"></span>}
            color="yellow"
            trend="23 due today"
          />
          <StatCard
            title="Anomalies"
            value={stats?.anomaliesDetected || 0}
            icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
            color="red"
            trend="3 need review"
          />
          <StatCard
            title="Containers"
            value={stats?.containersInUse || 0}
            icon={() => <span className="icon-[tabler--archive] w-5 h-5"></span>}
            color="green"
            trend="8 in use"
          />
        </div>

        {/* Workflow Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Counting Workflows</h2>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              View All Items
            </button>
          </div>
          
          <div className={`grid gap-6 ${StockResponsiveUtils.ipadOptimized.cardGrid}`}>
            {Object.entries(WorkflowConfig).map(([workflow, config]) => {
              const stats = workflowStats.find(s => s.workflow === workflow)
              return (
                <WorkflowCard
                  key={workflow}
                  workflow={workflow}
                  config={config}
                  stats={stats}
                  isActive={activeWorkflow === workflow}
                  onClick={() => setActiveWorkflow(workflow)}
                />
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
        
      </div>
    </div>
  )
}

// ============================================================================
// DASHBOARD HEADER COMPONENT
// ============================================================================

const DashboardHeader: React.FC<{ stats: DashboardStats | null }> = ({ stats }) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Management</h1>
            <p className="text-gray-600 mt-1">
              Hybrid inventory counting system
              {stats?.lastCountDate && (
                <span className="ml-2">
                  • Last count: {new Date(stats.lastCountDate).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="icon-[tabler--plus] w-5 h-5"></span>
              Submit Count
            </button>
            <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2">
              <span className="icon-[tabler--package] w-5 h-5"></span>
              Add Item
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// QUICK ACTIONS BAR
// ============================================================================

const QuickActionsBar: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border mb-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></span>
            <input
              type="text"
              placeholder="Search inventory items..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <span className="icon-[tabler--filter] w-5 h-5"></span>
            Filter
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors">
            <span className="icon-[tabler--chart-bar] w-5 h-5"></span>
            Reports
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors">
            <span className="icon-[tabler--archive] w-5 h-5"></span>
            Containers
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string
  value: number
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
          {trend && (
            <p className="text-sm text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// WORKFLOW CARD COMPONENT  
// ============================================================================

interface WorkflowCardProps {
  workflow: string
  config: any
  stats?: WorkflowStats
  isActive: boolean
  onClick: () => void
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({ workflow, config, stats, isActive, onClick }) => {
  const workflowStyles = getWorkflowStyles(workflow)
  const IconComponent = getWorkflowIcon(config.icon)

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg text-white"
            style={{ backgroundColor: workflowStyles.primary }}
          >
            <IconComponent size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{config.name}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.itemCount}</p>
            <p className="text-xs text-gray-600">Items</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{stats.recentCounts}</p>
            <p className="text-xs text-gray-600">Recent Counts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{Math.round(stats.avgConfidence * 100)}%</p>
            <p className="text-xs text-gray-600">Confidence</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t">
        <button 
          className="w-full py-2 rounded-lg font-medium transition-colors"
          style={{ 
            backgroundColor: workflowStyles.secondary, 
            color: workflowStyles.primary 
          }}
        >
          Start Counting
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// RECENT ACTIVITY COMPONENT
// ============================================================================

const RecentActivity: React.FC = () => {
  const mockActivity = [
    {
      id: 1,
      type: 'count',
      message: 'Bulk rice counted using container weight',
      user: 'Sarah Chen',
      timestamp: '2 minutes ago',
      workflow: 'container_weight',
      status: 'completed'
    },
    {
      id: 2,
      type: 'anomaly',
      message: 'Anomaly detected: Wine bottle weight outlier',
      user: 'System',
      timestamp: '15 minutes ago',
      workflow: 'bottle_hybrid',
      status: 'warning'
    },
    {
      id: 3,
      type: 'container',
      message: 'Container JIGR-C-00045 assigned for flour counting',
      user: 'Mike Rodriguez',
      timestamp: '1 hour ago',
      workflow: 'container_weight',
      status: 'info'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="divide-y">
        {mockActivity.map((activity) => (
          <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ActivityIcon type={activity.type} status={activity.status} />
                <div>
                  <p className="text-gray-900">{activity.message}</p>
                  <p className="text-sm text-gray-500">
                    {activity.user} • {activity.timestamp}
                  </p>
                </div>
              </div>
              <WorkflowBadge workflow={activity.workflow} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

const DashboardSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 animate-pulse">
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-300 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-12 bg-gray-300 rounded w-32"></div>
            <div className="h-12 bg-gray-300 rounded w-32"></div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="h-6 bg-gray-300 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const ActivityIcon: React.FC<{ type: string; status: string }> = ({ type, status }) => {
  const iconProps = { size: 20 }
  
  if (type === 'count') return <span className="icon-[tabler--circle-check] w-4 h-4 text-green-600"></span>
  if (type === 'anomaly') return <span className="icon-[tabler--alert-triangle] w-4 h-4 text-yellow-600"></span>
  if (type === 'container') return <span className="icon-[tabler--archive] w-4 h-4 text-blue-600"></span>
  
  return <span className="icon-[tabler--clock] w-4 h-4 text-gray-600"></span>
}

const WorkflowBadge: React.FC<{ workflow: string }> = ({ workflow }) => {
  const config = WorkflowConfig[workflow as keyof typeof WorkflowConfig]
  const styles = getWorkflowStyles(workflow)
  
  return (
    <span 
      className="px-3 py-1 text-xs font-medium rounded-full"
      style={{ 
        backgroundColor: styles.secondary, 
        color: styles.primary 
      }}
    >
      {config?.name || workflow}
    </span>
  )
}

const getWorkflowIcon = (iconName: string) => {
  const icons: Record<string, React.ComponentType<any>> = {
    () => <span className="icon-[tabler--calculator] w-6 h-6"></span>,
    () => <span className="icon-[tabler--scale] w-6 h-6"></span>,
    () => <span className="icon-[tabler--glass-full] w-6 h-6"></span>,
    () => <span className="icon-[tabler--beer] w-6 h-6"></span>,
    () => <span className="icon-[tabler--chef-hat] w-6 h-6"></span>
  }
  
  return icons[iconName] || (() => <span className="icon-[tabler--calculator] w-6 h-6"></span>)
}

export default StockDashboard