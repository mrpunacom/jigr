/**
 * Purchase Order Analytics API
 * 
 * Provides comprehensive analytics and reporting for purchase orders:
 * - Spending analysis and trends
 * - Vendor performance comparisons
 * - Order cycle time metrics
 * - Seasonal and frequency analysis
 * - Cost optimization insights
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/purchase-orders/analytics - Get purchase order analytics
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const period = parseInt(searchParams.get('period') || '90') // days
    const vendorId = searchParams.get('vendor_id') // optional filter
    const status = searchParams.get('status') || 'all' // optional filter
    const groupBy = searchParams.get('group_by') || 'month' // week, month, quarter

    console.log(`📊 Generating purchase order analytics for user ${user_id}, period: ${period} days`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - period)

    // Build query for purchase orders
    let query = supabase
      .from('PurchaseOrders')
      .select(`
        id,
        order_number,
        vendor_id,
        status,
        order_date,
        expected_delivery_date,
        actual_delivery_date,
        subtotal,
        tax_amount,
        shipping_amount,
        total_amount,
        items_count,
        created_at,
        Vendors:Vendors(
          id,
          name,
          category,
          payment_terms
        ),
        PurchaseOrderItems:PurchaseOrderItems(
          id,
          quantity,
          unit_cost,
          total_cost,
          received_quantity
        )
      `)
      .eq('user_id', user_id)
      .gte('order_date', startDate.toISOString())
      .lte('order_date', endDate.toISOString())

    if (vendorId) {
      query = query.eq('vendor_id', vendorId)
    }

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order('order_date', { ascending: true })

    const { data: orders, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch purchase order data' }, { status: 500 })
    }

    // Generate comprehensive analytics
    const analytics = generatePurchaseOrderAnalytics(orders, period, groupBy)

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      analytics,
      recommendations: generateProcurementRecommendations(analytics, orders)
    })

  } catch (error) {
    console.error('Purchase order analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate comprehensive purchase order analytics
 */
function generatePurchaseOrderAnalytics(orders: any[], period: number, groupBy: string): any {
  // Summary metrics
  const summary = calculateSummaryMetrics(orders)
  
  // Trend analysis
  const trends = calculateTrendAnalysis(orders, groupBy)
  
  // Vendor analysis
  const vendorAnalysis = calculateVendorAnalysis(orders)
  
  // Performance metrics
  const performance = calculatePerformanceMetrics(orders)
  
  // Cost analysis
  const costAnalysis = calculateCostAnalysis(orders)
  
  // Seasonal analysis
  const seasonalAnalysis = calculateSeasonalAnalysis(orders)

  return {
    summary,
    trends,
    vendorAnalysis,
    performance,
    costAnalysis,
    seasonalAnalysis
  }
}

/**
 * Calculate summary metrics
 */
function calculateSummaryMetrics(orders: any[]): any {
  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  // Status breakdown
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {})

  const completedOrders = statusCounts.completed || 0
  const pendingOrders = statusCounts.pending || 0
  const cancelledOrders = statusCounts.cancelled || 0

  // Completion rate
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0

  // Unique vendors
  const uniqueVendors = new Set(orders.map(order => order.vendor_id)).size

  // Average items per order
  const totalItems = orders.reduce((sum, order) => sum + (order.items_count || 0), 0)
  const averageItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0

  return {
    totalOrders,
    totalSpent: Math.round(totalSpent * 100) / 100,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    completionRate: Math.round(completionRate * 100) / 100,
    statusBreakdown: statusCounts,
    uniqueVendors,
    totalItems,
    averageItemsPerOrder: Math.round(averageItemsPerOrder * 100) / 100
  }
}

/**
 * Calculate trend analysis over time
 */
function calculateTrendAnalysis(orders: any[], groupBy: string): any {
  const groupedData = groupOrdersByPeriod(orders, groupBy)
  
  const trends = Object.entries(groupedData).map(([period, periodOrders]: [string, any]) => ({
    period,
    orderCount: periodOrders.length,
    totalSpent: Math.round(periodOrders.reduce((sum: number, order: any) => 
      sum + (order.total_amount || 0), 0) * 100) / 100,
    averageOrderValue: periodOrders.length > 0 ? 
      Math.round((periodOrders.reduce((sum: number, order: any) => 
        sum + (order.total_amount || 0), 0) / periodOrders.length) * 100) / 100 : 0,
    completedOrders: periodOrders.filter((order: any) => order.status === 'completed').length
  }))

  // Calculate growth rates
  const growthRates = calculateGrowthRates(trends)

  return {
    data: trends,
    growthRates
  }
}

/**
 * Calculate vendor analysis
 */
function calculateVendorAnalysis(orders: any[]): any {
  const vendorStats = orders.reduce((acc, order) => {
    const vendorId = order.vendor_id
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendorInfo: order.Vendors,
        orderCount: 0,
        totalSpent: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        averageDeliveryTime: 0,
        onTimeDeliveries: 0
      }
    }

    acc[vendorId].orderCount++
    acc[vendorId].totalSpent += order.total_amount || 0

    if (order.status === 'completed') {
      acc[vendorId].completedOrders++
      
      // Calculate delivery performance
      if (order.actual_delivery_date && order.expected_delivery_date) {
        const expectedDate = new Date(order.expected_delivery_date)
        const actualDate = new Date(order.actual_delivery_date)
        
        if (actualDate <= expectedDate) {
          acc[vendorId].onTimeDeliveries++
        }
      }
    } else if (order.status === 'cancelled') {
      acc[vendorId].cancelledOrders++
    }

    return acc
  }, {})

  // Calculate performance metrics for each vendor
  const vendorPerformance = Object.values(vendorStats).map((vendor: any) => ({
    ...vendor,
    totalSpent: Math.round(vendor.totalSpent * 100) / 100,
    averageOrderValue: vendor.orderCount > 0 ? 
      Math.round((vendor.totalSpent / vendor.orderCount) * 100) / 100 : 0,
    completionRate: vendor.orderCount > 0 ? 
      Math.round((vendor.completedOrders / vendor.orderCount) * 100 * 100) / 100 : 0,
    onTimeRate: vendor.completedOrders > 0 ? 
      Math.round((vendor.onTimeDeliveries / vendor.completedOrders) * 100 * 100) / 100 : 0
  }))

  // Sort by total spent
  vendorPerformance.sort((a, b) => b.totalSpent - a.totalSpent)

  return {
    topVendorsBySpending: vendorPerformance.slice(0, 10),
    vendorCount: vendorPerformance.length,
    concentrationRisk: calculateConcentrationRisk(vendorPerformance)
  }
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(orders: any[]): any {
  const completedOrders = orders.filter(order => order.status === 'completed')
  
  if (completedOrders.length === 0) {
    return {
      averageCycleTime: 0,
      onTimeDeliveryRate: 0,
      averageDeliveryDelay: 0,
      orderFulfillmentRate: 0
    }
  }

  // Calculate cycle times (order to delivery)
  const cycleTimes = completedOrders
    .filter(order => order.actual_delivery_date)
    .map(order => {
      const orderDate = new Date(order.order_date)
      const deliveryDate = new Date(order.actual_delivery_date)
      return (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    })

  const averageCycleTime = cycleTimes.length > 0 ? 
    cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length : 0

  // Calculate on-time delivery rate
  const onTimeDeliveries = completedOrders.filter(order => {
    if (!order.actual_delivery_date || !order.expected_delivery_date) return false
    return new Date(order.actual_delivery_date) <= new Date(order.expected_delivery_date)
  }).length

  const onTimeDeliveryRate = (onTimeDeliveries / completedOrders.length) * 100

  // Calculate average delivery delay for late orders
  const lateOrders = completedOrders.filter(order => {
    if (!order.actual_delivery_date || !order.expected_delivery_date) return false
    return new Date(order.actual_delivery_date) > new Date(order.expected_delivery_date)
  })

  const averageDeliveryDelay = lateOrders.length > 0 ?
    lateOrders.reduce((sum, order) => {
      const expected = new Date(order.expected_delivery_date)
      const actual = new Date(order.actual_delivery_date)
      return sum + ((actual.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24))
    }, 0) / lateOrders.length : 0

  // Order fulfillment rate (completed vs total)
  const orderFulfillmentRate = (completedOrders.length / orders.length) * 100

  return {
    averageCycleTime: Math.round(averageCycleTime * 100) / 100,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 100) / 100,
    averageDeliveryDelay: Math.round(averageDeliveryDelay * 100) / 100,
    orderFulfillmentRate: Math.round(orderFulfillmentRate * 100) / 100,
    totalCycleTimeData: cycleTimes
  }
}

/**
 * Calculate cost analysis
 */
function calculateCostAnalysis(orders: any[]): any {
  const totalSpent = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
  const totalSubtotal = orders.reduce((sum, order) => sum + (order.subtotal || 0), 0)
  const totalTax = orders.reduce((sum, order) => sum + (order.tax_amount || 0), 0)
  const totalShipping = orders.reduce((sum, order) => sum + (order.shipping_amount || 0), 0)

  // Cost breakdown percentages
  const subtotalPercentage = totalSpent > 0 ? (totalSubtotal / totalSpent) * 100 : 0
  const taxPercentage = totalSpent > 0 ? (totalTax / totalSpent) * 100 : 0
  const shippingPercentage = totalSpent > 0 ? (totalShipping / totalSpent) * 100 : 0

  // Order size distribution
  const orderSizes = orders.map(order => order.total_amount || 0).sort((a, b) => a - b)
  const medianOrderSize = orderSizes.length > 0 ? 
    orderSizes[Math.floor(orderSizes.length / 2)] : 0

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    costBreakdown: {
      subtotal: Math.round(totalSubtotal * 100) / 100,
      tax: Math.round(totalTax * 100) / 100,
      shipping: Math.round(totalShipping * 100) / 100
    },
    costBreakdownPercentage: {
      subtotal: Math.round(subtotalPercentage * 100) / 100,
      tax: Math.round(taxPercentage * 100) / 100,
      shipping: Math.round(shippingPercentage * 100) / 100
    },
    medianOrderSize: Math.round(medianOrderSize * 100) / 100,
    largestOrder: orderSizes[orderSizes.length - 1] || 0,
    smallestOrder: orderSizes[0] || 0
  }
}

/**
 * Calculate seasonal analysis
 */
function calculateSeasonalAnalysis(orders: any[]): any {
  const monthlyData = orders.reduce((acc, order) => {
    const month = new Date(order.order_date).getMonth()
    if (!acc[month]) {
      acc[month] = { orderCount: 0, totalSpent: 0 }
    }
    acc[month].orderCount++
    acc[month].totalSpent += order.total_amount || 0
    return acc
  }, {})

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const seasonalTrends = Object.entries(monthlyData).map(([month, data]: [string, any]) => ({
    month: monthNames[parseInt(month)],
    monthNumber: parseInt(month),
    orderCount: data.orderCount,
    totalSpent: Math.round(data.totalSpent * 100) / 100,
    averageOrderValue: data.orderCount > 0 ? 
      Math.round((data.totalSpent / data.orderCount) * 100) / 100 : 0
  }))

  return {
    monthlyTrends: seasonalTrends,
    peakMonth: seasonalTrends.reduce((max, month) => 
      month.totalSpent > max.totalSpent ? month : max, 
      { totalSpent: 0, month: 'None' }
    )
  }
}

/**
 * Helper functions
 */
function groupOrdersByPeriod(orders: any[], groupBy: string): { [key: string]: any[] } {
  return orders.reduce((acc, order) => {
    const date = new Date(order.order_date)
    let key: string

    switch (groupBy) {
      case 'week':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
        break
      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        break
      case 'month':
      default:
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
    }

    if (!acc[key]) acc[key] = []
    acc[key].push(order)
    return acc
  }, {})
}

function calculateGrowthRates(trends: any[]): any {
  if (trends.length < 2) return { orderGrowth: 0, spendingGrowth: 0 }

  const latest = trends[trends.length - 1]
  const previous = trends[trends.length - 2]

  const orderGrowth = previous.orderCount > 0 ? 
    ((latest.orderCount - previous.orderCount) / previous.orderCount) * 100 : 0

  const spendingGrowth = previous.totalSpent > 0 ? 
    ((latest.totalSpent - previous.totalSpent) / previous.totalSpent) * 100 : 0

  return {
    orderGrowth: Math.round(orderGrowth * 100) / 100,
    spendingGrowth: Math.round(spendingGrowth * 100) / 100
  }
}

function calculateConcentrationRisk(vendorPerformance: any[]): number {
  if (vendorPerformance.length === 0) return 0

  const totalSpent = vendorPerformance.reduce((sum, vendor) => sum + vendor.totalSpent, 0)
  const topVendorSpending = vendorPerformance[0]?.totalSpent || 0

  return totalSpent > 0 ? (topVendorSpending / totalSpent) * 100 : 0
}

/**
 * Generate procurement recommendations
 */
function generateProcurementRecommendations(analytics: any, orders: any[]): string[] {
  const recommendations: string[] = []

  // Order frequency recommendations
  if (analytics.summary.averageOrderValue < 100) {
    recommendations.push('Consider consolidating small orders to reduce procurement costs')
  }

  // Vendor diversification
  if (analytics.vendorAnalysis.concentrationRisk > 60) {
    recommendations.push('High vendor concentration risk - consider diversifying suppliers')
  }

  // Performance improvements
  if (analytics.performance.onTimeDeliveryRate < 80) {
    recommendations.push('Poor delivery performance - review vendor SLAs and expectations')
  }

  // Cost optimization
  if (analytics.costAnalysis.costBreakdownPercentage.shipping > 15) {
    recommendations.push('High shipping costs - negotiate better rates or consolidate shipments')
  }

  // Completion rate
  if (analytics.summary.completionRate < 90) {
    recommendations.push('Low order completion rate - review approval and fulfillment processes')
  }

  // Seasonal planning
  const peakMonth = analytics.seasonalAnalysis.peakMonth
  if (peakMonth.month !== 'None') {
    recommendations.push(`Plan ahead for peak ordering in ${peakMonth.month}`)
  }

  return recommendations
}