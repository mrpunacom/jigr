import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Feedback Analytics API
export async function GET(request: NextRequest) {
  try {
    // Check for basic authentication or dev mode
    const authHeader = request.headers.get('authorization')
    const { searchParams } = new URL(request.url)
    const devMode = searchParams.get('dev') === 'true'
    
    // Simple dev authentication for now
    if (!devMode && (!authHeader || !authHeader.includes('dev-access'))) {
      return NextResponse.json(
        { error: 'Unauthorized - dev access required' },
        { status: 401 }
      )
    }

    const timeframe = searchParams.get('timeframe') || '7d'
    const format = searchParams.get('format') || 'json'

    // For now, return mock data since we're using localStorage
    // In a real implementation, this would query a feedback database table
    const mockAnalytics = generateMockAnalytics(timeframe)

    if (format === 'csv') {
      const csv = generateCSVReport(mockAnalytics)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="feedback-analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    return NextResponse.json({
      success: true,
      timeframe,
      generated: new Date().toISOString(),
      analytics: mockAnalytics
    })

  } catch (error) {
    console.error('Error in feedback analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Store feedback data (for future database integration)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testerId, deviceInfo, feedback, metadata } = body

    // Validate required fields
    if (!testerId || !feedback) {
      return NextResponse.json(
        { error: 'Missing required fields: testerId, feedback' },
        { status: 400 }
      )
    }

    // For now, just log the data since we're using localStorage
    // In a real implementation, this would store in a database
    console.log('📊 Feedback Analytics Data Received:', {
      testerId,
      deviceInfo,
      feedbackCount: Array.isArray(feedback) ? feedback.length : Object.keys(feedback).length,
      timestamp: new Date().toISOString(),
      metadata
    })

    // In the future, this would insert into a feedback_analytics table:
    /*
    const { data, error } = await supabase
      .from('feedback_analytics')
      .insert({
        tester_id: testerId,
        device_info: deviceInfo,
        feedback_data: feedback,
        metadata,
        created_at: new Date().toISOString()
      })
    */

    return NextResponse.json({
      success: true,
      message: 'Feedback data logged successfully',
      stored: true
    })

  } catch (error) {
    console.error('Error storing feedback analytics:', error)
    return NextResponse.json(
      { error: 'Failed to store feedback data' },
      { status: 500 }
    )
  }
}

// Generate mock analytics data for demonstration
function generateMockAnalytics(timeframe: string) {
  const now = new Date()
  const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365

  // Generate sample data
  const sampleFeedback = [
    { path: '/admin/console', category: 'ui', severity: 'medium', testerId: 'steve_laird', deviceType: 'Tablet' },
    { path: '/admin/team', category: 'bug', severity: 'high', testerId: 'hero_demo', deviceType: 'Desktop' },
    { path: '/upload/capture', category: 'performance', severity: 'low', testerId: 'tester_1', deviceType: 'Mobile' },
    { path: '/admin/console', category: 'suggestion', severity: 'medium', testerId: 'steve_laird', deviceType: 'Tablet' },
    { path: '/', category: 'ux', severity: 'critical', testerId: 'hero_demo', deviceType: 'Desktop' },
    { path: '/admin/profile', category: 'ui', severity: 'low', testerId: 'tester_2', deviceType: 'Tablet' },
    { path: '/upload/reports', category: 'bug', severity: 'high', testerId: 'steve_laird', deviceType: 'Tablet' },
    { path: '/admin/settings', category: 'suggestion', severity: 'medium', testerId: 'tester_1', deviceType: 'Mobile' }
  ]

  // Calculate metrics
  const totalFeedback = sampleFeedback.length
  const todaysFeedback = Math.floor(totalFeedback * 0.3)
  const weeklyFeedback = Math.floor(totalFeedback * 0.8)
  const criticalIssues = sampleFeedback.filter(f => f.severity === 'critical' || f.severity === 'high').length

  // Top pages
  const pageStats = new Map()
  sampleFeedback.forEach(item => {
    const current = pageStats.get(item.path) || { count: 0, severitySum: 0 }
    const severityWeight = item.severity === 'critical' ? 4 : item.severity === 'high' ? 3 : item.severity === 'medium' ? 2 : 1
    pageStats.set(item.path, {
      count: current.count + 1,
      severitySum: current.severitySum + severityWeight
    })
  })

  const topPages = Array.from(pageStats.entries())
    .map(([path, stats]: [string, any]) => ({
      path,
      count: stats.count,
      avgSeverity: stats.severitySum / stats.count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Category breakdown
  const categoryStats = new Map()
  sampleFeedback.forEach(item => {
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
  const severityStats = new Map()
  sampleFeedback.forEach(item => {
    severityStats.set(item.severity, (severityStats.get(item.severity) || 0) + 1)
  })

  const severityBreakdown = Array.from(severityStats.entries())
    .map(([severity, count]) => ({
      severity,
      count,
      percentage: (count / totalFeedback) * 100
    }))

  // Tester activity
  const testerStats = new Map()
  sampleFeedback.forEach(item => {
    const current = testerStats.get(item.testerId) || { count: 0 }
    testerStats.set(item.testerId, { count: current.count + 1 })
  })

  const testerActivity = Array.from(testerStats.entries())
    .map(([testerId, stats]: [string, any]) => ({
      testerId,
      count: stats.count,
      lastActive: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }))
    .sort((a, b) => b.count - a.count)

  // Device breakdown
  const deviceStats = new Map()
  sampleFeedback.forEach(item => {
    deviceStats.set(item.deviceType, (deviceStats.get(item.deviceType) || 0) + 1)
  })

  const deviceBreakdown = Array.from(deviceStats.entries())
    .map(([device, count]) => ({
      device,
      count,
      percentage: (count / totalFeedback) * 100
    }))

  // Trends (last 14 days)
  const trends = []
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(now.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const dayCount = Math.floor(Math.random() * 5) + 1
    const criticalCount = Math.floor(dayCount * 0.3)
    
    trends.push({
      date: dateStr,
      count: dayCount,
      critical: criticalCount
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
    deviceBreakdown,
    trends,
    metadata: {
      timeframe,
      generated: now.toISOString(),
      dataSource: 'mock_data',
      note: 'This is sample data for demonstration. Real implementation would query feedback database.'
    }
  }
}

// Generate CSV report
function generateCSVReport(analytics: any): string {
  const lines = [
    'JiGR Feedback Analytics Report',
    `Generated: ${analytics.metadata.generated}`,
    `Timeframe: ${analytics.metadata.timeframe}`,
    '',
    'SUMMARY METRICS',
    `Total Feedback,${analytics.totalFeedback}`,
    `Today's Feedback,${analytics.todaysFeedback}`,
    `Weekly Feedback,${analytics.weeklyFeedback}`,
    `Critical Issues,${analytics.criticalIssues}`,
    '',
    'TOP PAGES BY FEEDBACK VOLUME',
    'Page,Count,Average Severity',
    ...analytics.topPages.map((page: any) => `"${page.path}",${page.count},${page.avgSeverity.toFixed(2)}`),
    '',
    'CATEGORY BREAKDOWN',
    'Category,Count,Percentage',
    ...analytics.categoryBreakdown.map((cat: any) => `${cat.category},${cat.count},${cat.percentage.toFixed(1)}%`),
    '',
    'SEVERITY BREAKDOWN', 
    'Severity,Count,Percentage',
    ...analytics.severityBreakdown.map((sev: any) => `${sev.severity},${sev.count},${sev.percentage.toFixed(1)}%`),
    '',
    'TESTER ACTIVITY',
    'Tester ID,Feedback Count,Last Active',
    ...analytics.testerActivity.map((tester: any) => `"${tester.testerId}",${tester.count},${new Date(tester.lastActive).toLocaleDateString()}`),
    '',
    'DEVICE BREAKDOWN',
    'Device Type,Count,Percentage',
    ...analytics.deviceBreakdown.map((device: any) => `${device.device},${device.count},${device.percentage.toFixed(1)}%`)
  ]

  return lines.join('\n')
}