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

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  category: 'stock' | 'finance' | 'operational' | 'compliance' | 'system'
  title: string
  message: string
  details?: string
  timestamp: string
  is_read: boolean
  is_archived: boolean
  action_url?: string
  action_label?: string
  priority: 'high' | 'medium' | 'low'
  related_entity_type?: string
  related_entity_id?: string
  auto_resolve_at?: string
  metadata?: any
}

interface NotificationSettings {
  email_enabled: boolean
  push_enabled: boolean
  categories: {
    stock: boolean
    finance: boolean
    operational: boolean
    compliance: boolean
    system: boolean
  }
  severity_levels: {
    critical: boolean
    warning: boolean
    info: boolean
    success: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
}

interface AlertStats {
  total: number
  unread: number
  critical: number
  warning: number
  todayCount: number
  resolvedToday: number
}

interface AlertsAndNotificationsProps {
  className?: string
}

export function AlertsAndNotifications({ className = '' }: AlertsAndNotificationsProps) {
  const router = useRouter()
  const responsive = useResponsive()
  
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('unread')
  const [showFilters, setShowFilters] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([])

  useEffect(() => {
    loadAlertsData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [alerts, searchQuery, typeFilter, categoryFilter, statusFilter])

  const loadAlertsData = async (showLoader = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      const [alertsRes, statsRes, settingsRes] = await Promise.all([
        fetch('/api/alerts'),
        fetch('/api/alerts/stats'),
        fetch('/api/alerts/settings')
      ])

      if (!alertsRes.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const [alertsData, statsData, settingsData] = await Promise.all([
        alertsRes.json(),
        statsRes.ok ? statsRes.json() : { total: 0, unread: 0, critical: 0, warning: 0, todayCount: 0, resolvedToday: 0 },
        settingsRes.ok ? settingsRes.json() : null
      ])

      setAlerts(alertsData.alerts || [])
      setStats(statsData)
      setSettings(settingsData?.settings)
      setError(null)
      
    } catch (error) {
      console.error('Failed to load alerts:', error)
      setError('Failed to load alerts')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...alerts]
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(alert =>
        alert.title.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query) ||
        alert.category.toLowerCase().includes(query)
      )
    }
    
    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(alert => alert.type === typeFilter)
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(alert => alert.category === categoryFilter)
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'unread') {
        filtered = filtered.filter(alert => !alert.is_read)
      } else if (statusFilter === 'read') {
        filtered = filtered.filter(alert => alert.is_read)
      } else if (statusFilter === 'archived') {
        filtered = filtered.filter(alert => alert.is_archived)
      }
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    setFilteredAlerts(filtered)
  }

  const handleAlertAction = async (action: string, alertId: string) => {
    const alert = alerts.find(a => a.id === alertId)
    
    switch (action) {
      case 'mark_read':
        await updateAlert(alertId, { is_read: true })
        break
      case 'mark_unread':
        await updateAlert(alertId, { is_read: false })
        break
      case 'archive':
        await updateAlert(alertId, { is_archived: true })
        break
      case 'delete':
        await deleteAlert(alertId)
        break
      case 'view_details':
        if (alert?.action_url) {
          router.push(alert.action_url)
        }
        break
    }
  }

  const updateAlert = async (alertId: string, updates: Partial<Alert>) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update alert')
      
      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, ...updates } : alert
        )
      )
    } catch (error) {
      console.error('Failed to update alert:', error)
    }
  }

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete alert')
      
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedAlerts.length === 0) return
    
    try {
      const response = await fetch('/api/alerts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert_ids: selectedAlerts,
          action
        })
      })
      
      if (!response.ok) throw new Error('Failed to perform bulk action')
      
      await loadAlertsData(true)
      setSelectedAlerts([])
    } catch (error) {
      console.error('Failed to perform bulk action:', error)
    }
  }

  const getAlertIcon = (type: string, category: string) => {
    const iconClass = "h-5 w-5"
    
    if (type === 'critical') return <span className={`icon-[tabler--exclamation-triangle] ${iconClass} text-red-500`}></span>
    if (type === 'warning') return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-amber-500`}></span>
    if (type === 'success') return <span className={`icon-[tabler--circle-check] ${iconClass} text-green-500`}></span>
    if (type === 'info') return <span className={`icon-[tabler--info-circle] ${iconClass} text-blue-500`}></span>
    
    // Category-based icons as fallback
    switch (category) {
      case 'stock': return <span className={`icon-[tabler--package] ${iconClass} text-orange-500`}></span>
      case 'finance': return <span className={`icon-[tabler--currency-dollar] ${iconClass} text-green-500`}></span>
      case 'operational': return <span className={`icon-[tabler--bolt] ${iconClass} text-purple-500`}></span>
      case 'compliance': return <span className={`icon-[tabler--alert-triangle] ${iconClass} text-red-500`}></span>
      case 'system': return <span className={`icon-[tabler--settings] ${iconClass} text-gray-500`}></span>
      default: return <span className={`icon-[tabler--bell] ${iconClass} text-blue-500`}></span>
    }
  }

  const getAlertBorderColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200'
      case 'warning': return 'border-amber-200'
      case 'success': return 'border-green-200'
      case 'info': return 'border-blue-200'
      default: return 'border-gray-200'
    }
  }

  const getTimeSince = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

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
              Alerts & Notifications
            </ResponsiveText>
            <ResponsiveText 
              size={{ mobile: 'text-sm', tablet: 'text-base', desktop: 'text-base' }}
              className="text-gray-600"
            >
              {filteredAlerts.length} alerts
              {selectedAlerts.length > 0 && ` • ${selectedAlerts.length} selected`}
            </ResponsiveText>
          </div>
          
          <div className={`flex ${responsive.isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
            <TouchButton
              onClick={() => loadAlertsData(true)}
              disabled={refreshing}
              variant="ghost"
              size="md"
              className={`${responsive.isMobile ? 'w-full justify-start' : ''}`}
            >
              <span className={`icon-[tabler--refresh] h-5 w-5 ${refreshing ? 'animate-spin' : ''}`}></span>
              {responsive.isMobile && <span className="ml-2">Refresh</span>}
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'secondary'}
              size="md"
              className={`${responsive.isMobile ? 'w-full justify-start' : ''}`}
            >
              <span className="icon-[tabler--filter] h-4 w-4"></span>
              <span className="ml-2">Filters</span>
            </TouchButton>
            
            <TouchButton
              onClick={() => setShowSettings(!showSettings)}
              variant="secondary"
              size="md"
              className={`${responsive.isMobile ? 'w-full justify-start' : ''}`}
            >
              <span className="icon-[tabler--settings] h-4 w-4"></span>
              <span className="ml-2">Settings</span>
            </TouchButton>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <ResponsiveGrid 
            cols={{ mobile: 1, tablet: 3, desktop: 6, largeDesktop: 6 }}
            gap={{ mobile: 4, tablet: 4, desktop: 4 }}
          >
          <MetricCard
            title="Total Alerts"
            value={stats.total.toString()}
            subtitle="All time"
            icon={() => <span className="icon-[tabler--bell] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Unread"
            value={stats.unread.toString()}
            subtitle="Need attention"
            icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
            theme="white"
            className={stats.unread > 0 ? 'border-amber-200 bg-amber-50' : ''}
          />
          <MetricCard
            title="Critical"
            value={stats.critical.toString()}
            subtitle="High priority"
            icon={() => <span className="icon-[tabler--exclamation-triangle] w-5 h-5"></span>}
            theme="white"
            className={stats.critical > 0 ? 'border-red-200 bg-red-50' : ''}
          />
          <MetricCard
            title="Warnings"
            value={stats.warning.toString()}
            subtitle="Medium priority"
            icon={() => <span className="icon-[tabler--alert-triangle] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Today"
            value={stats.todayCount.toString()}
            subtitle="New alerts"
            icon={() => <span className="icon-[tabler--clock] w-5 h-5"></span>}
            theme="white"
          />
          <MetricCard
            title="Resolved"
            value={stats.resolvedToday.toString()}
            subtitle="Today"
            icon={() => <span className="icon-[tabler--circle-check] w-5 h-5"></span>}
            theme="white"
          />
          </ResponsiveGrid>
        )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <button
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('all')
                setCategoryFilter('all')
                setStatusFilter('unread')
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Reset filters
            </button>
          </div>
          
          <ResponsiveGrid 
            cols={{ mobile: 1, tablet: 2, desktop: 4, largeDesktop: 4 }}
            gap={{ mobile: 4, tablet: 4, desktop: 4 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <span className="icon-[tabler--search] absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"></span>
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ minHeight: responsive.isTouch ? '48px' : '40px' }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ minHeight: responsive.isTouch ? '48px' : '40px' }}
              >
                <option value="all">All Types</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ minHeight: responsive.isTouch ? '48px' : '40px' }}
              >
                <option value="all">All Categories</option>
                <option value="stock">Stock</option>
                <option value="finance">Finance</option>
                <option value="operational">Operational</option>
                <option value="compliance">Compliance</option>
                <option value="system">System</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ minHeight: responsive.isTouch ? '48px' : '40px' }}
              >
                <option value="all">All Statuses</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </ResponsiveGrid>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedAlerts.length} alerts selected
            </span>
            <div className={`flex ${responsive.isMobile ? 'flex-col space-y-2' : 'items-center space-x-2'}`}>
              <TouchButton
                onClick={() => handleBulkAction('mark_read')}
                variant="primary"
                size="sm"
                className={`${responsive.isMobile ? 'w-full' : ''}`}
              >
                Mark Read
              </TouchButton>
              <TouchButton
                onClick={() => handleBulkAction('archive')}
                variant="secondary"
                size="sm"
                className={`${responsive.isMobile ? 'w-full' : ''}`}
              >
                Archive
              </TouchButton>
              <TouchButton
                onClick={() => handleBulkAction('delete')}
                variant="primary"
                size="sm"
                className={`${responsive.isMobile ? 'w-full' : ''} bg-red-600 hover:bg-red-700 text-white`}
              >
                Delete
              </TouchButton>
              <TouchButton
                onClick={() => setSelectedAlerts([])}
                variant="ghost"
                size="sm"
                className={`${responsive.isMobile ? 'w-full' : ''} text-gray-500 hover:text-gray-700`}
              >
                Clear
              </TouchButton>
            </div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white border rounded-lg p-4 transition-colors ${
                getAlertBorderColor(alert.type)
              } ${
                alert.is_read ? 'opacity-75' : ''
              } ${
                selectedAlerts.includes(alert.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Selection Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedAlerts.includes(alert.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAlerts(prev => [...prev, alert.id])
                    } else {
                      setSelectedAlerts(prev => prev.filter(id => id !== alert.id))
                    }
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                
                {/* Alert Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getAlertIcon(alert.type, alert.category)}
                </div>
                
                {/* Alert Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`text-sm font-medium text-gray-900 ${!alert.is_read ? 'font-semibold' : ''}`}>
                        {alert.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      {alert.details && (
                        <p className="text-xs text-gray-500 mt-2">{alert.details}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <span className="capitalize">{alert.category}</span>
                        <span className="capitalize">{alert.type}</span>
                        <span>{getTimeSince(alert.timestamp)}</span>
                        {alert.priority === 'high' && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            High Priority
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`flex ${responsive.isMobile ? 'flex-col space-y-1' : 'items-center space-x-1'} ml-4`}>
                      {alert.action_url && (
                        <TouchButton
                          onClick={() => handleAlertAction('view_details', alert.id)}
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <span className="icon-[tabler--eye] h-4 w-4"></span>
                          {responsive.isMobile && <span className="ml-2">View Details</span>}
                        </TouchButton>
                      )}
                      
                      <TouchButton
                        onClick={() => handleAlertAction(alert.is_read ? 'mark_unread' : 'mark_read', alert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:bg-gray-50"
                      >
                        {alert.is_read ? <span className="icon-[tabler--bell] h-4 w-4"></span> : <span className="icon-[tabler--circle-check] h-4 w-4"></span>}
                        {responsive.isMobile && <span className="ml-2">{alert.is_read ? 'Mark Unread' : 'Mark Read'}</span>}
                      </TouchButton>
                      
                      <TouchButton
                        onClick={() => handleAlertAction('archive', alert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:bg-gray-50"
                      >
                        <span className="icon-[tabler--archive] h-4 w-4"></span>
                        {responsive.isMobile && <span className="ml-2">Archive</span>}
                      </TouchButton>
                      
                      <TouchButton
                        onClick={() => handleAlertAction('delete', alert.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <span className="icon-[tabler--trash] h-4 w-4"></span>
                        {responsive.isMobile && <span className="ml-2">Delete</span>}
                      </TouchButton>
                    </div>
                  </div>
                  
                  {alert.action_url && alert.action_label && (
                    <TouchButton
                      onClick={() => handleAlertAction('view_details', alert.id)}
                      variant="ghost"
                      size="sm"
                      className="mt-3 text-blue-600 hover:text-blue-800 justify-start p-0"
                    >
                      {alert.action_label}
                      <span className="icon-[tabler--arrow-right] h-3 w-3 ml-1"></span>
                    </TouchButton>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <span className="icon-[tabler--bell] h-12 w-12 text-gray-300 mx-auto mb-4"></span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-500">
              {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' 
                ? "No alerts match your current filters."
                : "You're all caught up! No new alerts at this time."}
            </p>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="icon-[tabler--alert-triangle] h-5 w-5"></span>
            <span>{error}</span>
            <button 
              onClick={() => loadAlertsData(true)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      </div>
    </ResponsiveContainer>
  )
}