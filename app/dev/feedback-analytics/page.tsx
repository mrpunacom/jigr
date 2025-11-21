'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { withHeroOrDevAuth } from '@/lib/dev-auth-context'

interface FeedbackAnalytics {
  totalFeedback: number
  todaysFeedback: number
  weeklyFeedback: number
  criticalIssues: number
  topPages: { path: string; count: number; avgSeverity: number }[]
  categoryBreakdown: { category: string; count: number; percentage: number }[]
  severityBreakdown: { severity: string; count: number; percentage: number }[]
  testerActivity: { testerId: string; count: number; lastActive: string }[]
  trends: { date: string; count: number; critical: number }[]
}

interface FeedbackItem {
  id: string
  path: string
  category: string
  severity: string
  note: string
  testerId: string
  timestamp: string
  deviceInfo?: string
  resolved: boolean
}

function FeedbackAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null)
  const [recentFeedback, setRecentFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)

      // Get all feedback data from localStorage (simulated database for now)
      const allFeedbackData = getAllFeedbackFromStorage()
      
      // Calculate analytics
      const analyticsData = calculateAnalytics(allFeedbackData, selectedTimeframe)
      setAnalytics(analyticsData)
      
      // Get recent feedback items
      const recent = allFeedbackData
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 20)
      setRecentFeedback(recent)
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get all feedback from localStorage across all testers
  const getAllFeedbackFromStorage = (): FeedbackItem[] => {
    const allFeedback: FeedbackItem[] = []
    
    // Scan all localStorage keys for feedback data
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('TesterFeedbackNotes_') || key.startsWith('HeroFeedbackNotes_'))) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const feedbackData = JSON.parse(data)
            const testerId = key.replace('TesterFeedbackNotes_', '').replace('HeroFeedbackNotes_', '')
            const isHero = key.startsWith('HeroFeedbackNotes_')
            
            // Convert feedback structure to flat array
            Object.entries(feedbackData).forEach(([path, notes]: [string, any]) => {
              notes.forEach((note: any, index: number) => {
                allFeedback.push({
                  id: `${testerId}-${path}-${index}`,
                  path,
                  category: note.category || 'suggestion',
                  severity: note.severity || 'medium',
                  note: note.note || '',
                  testerId: isHero ? `🏆 ${testerId}` : testerId,
                  timestamp: note.timestamp || new Date().toISOString(),
                  deviceInfo: 'iPad Air Safari 12', // Default device
                  resolved: false // Default to unresolved
                })
              })
            })
          }
        } catch (error) {
          console.warn('Failed to parse feedback data for key:', key)
        }
      }
    }
    
    return allFeedback
  }

  // Calculate analytics from feedback data
  const calculateAnalytics = (feedbackData: FeedbackItem[], timeframe: string): FeedbackAnalytics => {
    const now = new Date()
    const timeframeDays = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 0
    
    // Filter by timeframe if not 'all'
    const filteredData = timeframeDays > 0 
      ? feedbackData.filter(item => {
          const itemDate = new Date(item.timestamp)
          const daysDiff = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
          return daysDiff <= timeframeDays
        })
      : feedbackData

    const totalFeedback = filteredData.length
    
    // Today's feedback
    const todaysFeedback = feedbackData.filter(item => {
      const itemDate = new Date(item.timestamp)
      return itemDate.toDateString() === now.toDateString()
    }).length

    // Weekly feedback
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const weeklyFeedback = feedbackData.filter(item => 
      new Date(item.timestamp) >= weekStart
    ).length

    // Critical issues
    const criticalIssues = filteredData.filter(item => 
      item.severity === 'critical' || item.severity === 'high'
    ).length

    // Top pages by feedback count
    const pageStats = new Map<string, { count: number; severitySum: number }>()
    filteredData.forEach(item => {
      const current = pageStats.get(item.path) || { count: 0, severitySum: 0 }
      const severityWeight = item.severity === 'critical' ? 4 : 
                            item.severity === 'high' ? 3 :
                            item.severity === 'medium' ? 2 : 1
      pageStats.set(item.path, {
        count: current.count + 1,
        severitySum: current.severitySum + severityWeight
      })
    })

    const topPages = Array.from(pageStats.entries())
      .map(([path, stats]) => ({
        path,
        count: stats.count,
        avgSeverity: stats.severitySum / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Category breakdown
    const categoryStats = new Map<string, number>()
    filteredData.forEach(item => {
      categoryStats.set(item.category, (categoryStats.get(item.category) || 0) + 1)
    })

    const categoryBreakdown = Array.from(categoryStats.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / totalFeedback) * 100
      }))
      .sort((a, b) => b.count - a.count)

    // Severity breakdown
    const severityStats = new Map<string, number>()
    filteredData.forEach(item => {
      severityStats.set(item.severity, (severityStats.get(item.severity) || 0) + 1)
    })

    const severityBreakdown = Array.from(severityStats.entries())
      .map(([severity, count]) => ({
        severity,
        count,
        percentage: (count / totalFeedback) * 100
      }))
      .sort((a, b) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1 }
        return (order[b.severity as keyof typeof order] || 0) - (order[a.severity as keyof typeof order] || 0)
      })

    // Tester activity
    const testerStats = new Map<string, { count: number; lastActive: string }>()
    filteredData.forEach(item => {
      const current = testerStats.get(item.testerId) || { count: 0, lastActive: item.timestamp }
      testerStats.set(item.testerId, {
        count: current.count + 1,
        lastActive: new Date(item.timestamp) > new Date(current.lastActive) ? item.timestamp : current.lastActive
      })
    })

    const testerActivity = Array.from(testerStats.entries())
      .map(([testerId, stats]) => ({
        testerId,
        count: stats.count,
        lastActive: stats.lastActive
      }))
      .sort((a, b) => b.count - a.count)

    // Trends (last 14 days)
    const trends: { date: string; count: number; critical: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayFeedback = feedbackData.filter(item => 
        item.timestamp.split('T')[0] === dateStr
      )
      
      trends.push({
        date: dateStr,
        count: dayFeedback.length,
        critical: dayFeedback.filter(item => 
          item.severity === 'critical' || item.severity === 'high'
        ).length
      })
    }

    return {
      totalFeedback,
      todaysFeedback,
      weeklyFeedback,
      criticalIssues,
      topPages,
      categoryBreakdown,
      severityBreakdown,
      testerActivity,
      trends
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, selectedTimeframe])

  // Initial load
  useEffect(() => {
    fetchAnalytics()
  }, [selectedTimeframe])

  // Export analytics data
  const exportAnalytics = () => {
    if (!analytics) return
    
    const exportData = {
      generated: new Date().toISOString(),
      timeframe: selectedTimeframe,
      analytics,
      recentFeedback: recentFeedback.slice(0, 10)
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jigr-feedback-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#EF4444'
      case 'high': return '#F59E0B'
      case 'medium': return '#3B82F6'
      case 'low': return '#10B981'
      default: return '#6B7280'
    }
  }

  const getCategoryColor = (category: string, index: number) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4']
    return colors[index % colors.length]
  }

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0f1419', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <div>Loading feedback analytics...</div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#0f1419', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div>No feedback data available</div>
          <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '8px' }}>
            Start testing with the feedback system to see analytics
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f1419', color: 'white', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        padding: '12px',
        textAlign: 'center',
        fontSize: '14px',
        fontWeight: '600'
      }}>
        🔐 DEV TEAM AUTHENTICATED - Real-Time Feedback Analytics Dashboard
      </div>

      <div style={{ padding: '24px' }}>
        {/* Dashboard Header */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                📊 Feedback Analytics Dashboard
              </h1>
              <div style={{ display: 'flex', gap: '12px', margin: '8px 0 16px 0' }}>
                <Link
                  href="/dev/feedback-analytics"
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#A78BFA',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    border: '1px solid rgba(139, 92, 246, 0.4)'
                  }}
                >
                  📊 Analytics Dashboard (Current)
                </Link>
                <Link
                  href="/dev/architecture-testing"
                  style={{
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    color: '#4ADE80',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    border: '1px solid rgba(34, 197, 94, 0.4)'
                  }}
                >
                  🏗️ Architecture Testing
                </Link>
              </div>
              <p style={{ fontSize: '16px', opacity: 0.8, margin: 0 }}>
                Real-time insights into testing feedback and system usage
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as any)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="all">All Time</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: autoRefresh ? 'rgba(34, 197, 94, 0.2)' : 'rgba(107, 114, 128, 0.2)',
                  border: `1px solid ${autoRefresh ? 'rgba(34, 197, 94, 0.4)' : 'rgba(107, 114, 128, 0.4)'}`,
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
              </button>
              <button
                onClick={exportAnalytics}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                📊 Export
              </button>
            </div>
          </div>

          {/* Last Updated */}
          <div style={{ fontSize: '12px', opacity: 0.6 }}>
            Last updated: {lastUpdated.toLocaleString('en-NZ')}
            {autoRefresh && <span> • Auto-refreshing every 30s</span>}
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #3B82F6'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Total Feedback</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3B82F6' }}>{analytics.totalFeedback}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
              {selectedTimeframe === 'all' ? 'All time' : `Last ${selectedTimeframe}`}
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #10B981'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Today's Feedback</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10B981' }}>{analytics.todaysFeedback}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
              +{analytics.weeklyFeedback - analytics.todaysFeedback} this week
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #EF4444'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Critical Issues</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#EF4444' }}>{analytics.criticalIssues}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
              {analytics.totalFeedback > 0 ? Math.round((analytics.criticalIssues / analytics.totalFeedback) * 100) : 0}% of total feedback
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            borderLeft: '4px solid #8B5CF6'
          }}>
            <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>Active Testers</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8B5CF6' }}>{analytics.testerActivity.length}</div>
            <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '4px' }}>
              Contributing feedback
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          {/* Top Pages */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              📄 Top Pages by Feedback Volume
            </h3>
            {analytics.topPages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.topPages.slice(0, 8).map((page, index) => (
                  <div key={page.path} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: '24px', fontSize: '14px', opacity: 0.6 }}>
                      #{index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {page.path}
                      </div>
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        height: '6px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: '#3B82F6',
                          height: '100%',
                          width: `${(page.count / analytics.topPages[0].count) * 100}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{page.count}</span>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: getSeverityColor(
                          page.avgSeverity >= 3.5 ? 'critical' :
                          page.avgSeverity >= 2.5 ? 'high' :
                          page.avgSeverity >= 1.5 ? 'medium' : 'low'
                        )
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                No feedback data available
              </div>
            )}
          </div>

          {/* Severity Breakdown */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              🚨 Severity Breakdown
            </h3>
            {analytics.severityBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analytics.severityBreakdown.map((severity) => (
                  <div key={severity.severity} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: getSeverityColor(severity.severity)
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', textTransform: 'capitalize' }}>
                          {severity.severity}
                        </span>
                        <span style={{ fontSize: '14px' }}>
                          {severity.count} ({Math.round(severity.percentage)}%)
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        height: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          backgroundColor: getSeverityColor(severity.severity),
                          height: '100%',
                          width: `${severity.percentage}%`,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                No severity data available
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Recent Feedback */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              🕐 Recent Feedback
            </h3>
            {recentFeedback.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {recentFeedback.slice(0, 10).map((item) => (
                  <div key={item.id} style={{
                    borderLeft: `3px solid ${getSeverityColor(item.severity)}`,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '12px',
                    marginBottom: '8px',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', opacity: 0.8 }}>
                        {item.testerId}
                      </span>
                      <span style={{ fontSize: '11px', opacity: 0.6 }}>
                        {new Date(item.timestamp).toLocaleDateString('en-NZ')} {new Date(item.timestamp).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                      <strong>{item.path}</strong> • {item.category} • {item.severity}
                    </div>
                    <div style={{ fontSize: '12px', opacity: 0.8 }}>
                      {item.note.substring(0, 120)}{item.note.length > 120 ? '...' : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                No recent feedback available
              </div>
            )}
          </div>

          {/* Tester Activity */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 16px 0' }}>
              👥 Tester Activity
            </h3>
            {analytics.testerActivity.length > 0 ? (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {analytics.testerActivity.slice(0, 8).map((tester, index) => (
                  <div key={tester.testerId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '6px'
                  }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '2px' }}>
                        {tester.testerId}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.6 }}>
                        Last active: {new Date(tester.lastActive).toLocaleDateString('en-NZ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#3B82F6' }}>
                        {tester.count}
                      </div>
                      <div style={{ fontSize: '11px', opacity: 0.6 }}>
                        feedback items
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', opacity: 0.6 }}>
                No tester activity available
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '12px',
          opacity: 0.6
        }}>
          JiGR Feedback Analytics Dashboard • Real-time insights • Auto-refresh enabled • Enhanced with screenshot capture & device detection<br />
          Smart notifications • GitHub/Slack integration • Assignment management • Predictive analytics ready
        </div>
      </div>
    </div>
  )
}

export default withHeroOrDevAuth(FeedbackAnalyticsDashboard)