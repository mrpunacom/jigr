/**
 * Vendor Analytics API
 * 
 * Provides comprehensive analytics and reporting for vendor performance:
 * - Cost analysis and price trends
 * - Delivery performance metrics
 * - Order volume and frequency analysis
 * - Vendor comparison and ranking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getAuthenticatedClientId } from '@/lib/api-utils'

// GET /api/stock/vendors/analytics - Get vendor performance analytics
export async function GET(request: NextRequest) {
  try {
    const { user_id, client_id } = await getAuthenticatedClientId()
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const period = searchParams.get('period') || '90' // days
    const vendorId = searchParams.get('vendor_id') // optional filter
    const category = searchParams.get('category') // optional filter
    const includeInactive = searchParams.get('include_inactive') === 'true'

    console.log(`📊 Generating vendor analytics for user ${user_id}, period: ${period} days`)

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get vendors with order data
    let vendorQuery = supabase
      .from('Vendors')
      .select(`
        id,
        name,
        business_name,
        category,
        payment_terms,
        delivery_days,
        is_preferred,
        is_active,
        rating,
        created_at,
        VendorItems:VendorItems(
          id,
          cost_per_unit,
          is_preferred,
          is_active,
          InventoryItems:inventory_items(
            id,
            item_name,
            category
          )
        ),
        PurchaseOrders:PurchaseOrders(
          id,
          order_number,
          order_date,
          delivery_date,
          status,
          total_amount,
          items_count
        )
      `)
      .eq('user_id', user_id)

    if (!includeInactive) {
      vendorQuery = vendorQuery.eq('is_active', true)
    }

    if (vendorId) {
      vendorQuery = vendorQuery.eq('id', vendorId)
    }

    if (category) {
      vendorQuery = vendorQuery.eq('category', category)
    }

    const { data: vendors, error } = await vendorQuery

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch vendor data' }, { status: 500 })
    }

    // Process analytics for each vendor
    const vendorAnalytics = vendors.map(vendor => 
      calculateVendorMetrics(vendor, startDate, endDate)
    )

    // Generate overall summary
    const summary = generateAnalyticsSummary(vendorAnalytics, period)

    // Generate insights and recommendations
    const insights = generateVendorInsights(vendorAnalytics)

    return NextResponse.json({
      period: parseInt(period),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary,
      vendors: vendorAnalytics,
      insights,
      recommendations: generateRecommendations(vendorAnalytics, summary)
    })

  } catch (error) {
    console.error('Vendor analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Type definitions for better type safety
interface VendorOrder {
  id: string
  order_number: string
  order_date: string
  delivery_date?: string
  status: 'pending' | 'completed' | 'cancelled'
  total_amount: number
  items_count: number
}

interface VendorItem {
  id: string
  cost_per_unit: number
  is_preferred: boolean
  is_active: boolean
  InventoryItems?: {
    id: string
    item_name: string
    category: string
  }
}

interface VendorWithRelations {
  id: string
  name: string
  business_name?: string
  category: string
  payment_terms: string
  delivery_days: number
  is_preferred: boolean
  is_active: boolean
  rating?: number
  PurchaseOrders?: VendorOrder[]
  VendorItems?: VendorItem[]
}

interface VendorMetrics {
  vendorInfo: {
    id: string
    name: string
    businessName?: string
    category: string
    isPreferred: boolean
    isActive: boolean
    paymentTerms: string
    expectedDeliveryDays: number
  }
  orderMetrics: {
    total: number
    completed: number
    pending: number
    cancelled: number
    frequency: number
  }
  financialMetrics: {
    totalSpent: number
    averageOrderValue: number
    averageItemCost: number
  }
  deliveryMetrics: {
    onTimeDeliveries: number
    onTimePercentage: number
    averageDeliveryDays: number
    expectedDeliveryDays: number
  }
  catalogMetrics: {
    totalItems: number
    activeItems: number
    preferredItems: number
    itemCategories: string[]
  }
  performanceScore: number
  trends: {
    recentActivity: number
    growthRate: number
  }
}

/**
 * Calculate detailed metrics for a single vendor
 */
function calculateVendorMetrics(vendor: VendorWithRelations, startDate: Date, endDate: Date): VendorMetrics {
  const orders = vendor.PurchaseOrders || []
  const items = vendor.VendorItems || []
  
  // Filter orders by date range
  const periodOrders = orders.filter((order: VendorOrder) => {
    const orderDate = new Date(order.order_date)
    return orderDate >= startDate && orderDate <= endDate
  })

  // Order metrics
  const totalOrders = periodOrders.length
  const completedOrders = periodOrders.filter((o: VendorOrder) => o.status === 'completed')
  const pendingOrders = periodOrders.filter((o: VendorOrder) => o.status === 'pending')
  const cancelledOrders = periodOrders.filter((o: VendorOrder) => o.status === 'cancelled')

  // Financial metrics
  const totalSpent = completedOrders.reduce((sum: number, order: VendorOrder) => 
    sum + (order.total_amount || 0), 0)
  const averageOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0

  // Delivery performance
  const onTimeDeliveries = completedOrders.filter((order: VendorOrder) => {
    if (!order.delivery_date) return false
    const expectedDate = new Date(order.order_date)
    expectedDate.setDate(expectedDate.getDate() + vendor.delivery_days)
    return new Date(order.delivery_date) <= expectedDate
  }).length

  const averageDeliveryTime = calculateAverageDeliveryTime(completedOrders)
  const onTimePercentage = completedOrders.length > 0 ? 
    (onTimeDeliveries / completedOrders.length) * 100 : 0

  // Cost analysis
  const activeItems = items.filter((item: VendorItem) => item.is_active)
  const averageItemCost = activeItems.length > 0 ?
    activeItems.reduce((sum: number, item: VendorItem) => sum + (item.cost_per_unit || 0), 0) /
    activeItems.length : 0

  // Order frequency analysis
  const orderFrequency = calculateOrderFrequency(periodOrders, startDate, endDate)

  // Performance score
  const performanceScore = calculatePerformanceScore({
    onTimePercentage,
    totalOrders: orders.length,
    cancelledOrders: orders.filter((o: VendorOrder) => o.status === 'cancelled').length,
    completedOrders: orders.filter((o: VendorOrder) => o.status === 'completed').length
  })

  return {
    vendorInfo: {
      id: vendor.id,
      name: vendor.name,
      businessName: vendor.business_name,
      category: vendor.category,
      isPreferred: vendor.is_preferred,
      isActive: vendor.is_active,
      paymentTerms: vendor.payment_terms,
      expectedDeliveryDays: vendor.delivery_days
    },
    orderMetrics: {
      total: totalOrders,
      completed: completedOrders.length,
      pending: pendingOrders.length,
      cancelled: cancelledOrders.length,
      frequency: orderFrequency
    },
    financialMetrics: {
      totalSpent: Math.round(totalSpent * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      averageItemCost: Math.round(averageItemCost * 100) / 100
    },
    deliveryMetrics: {
      onTimeDeliveries,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      averageDeliveryDays: Math.round(averageDeliveryTime * 10) / 10,
      expectedDeliveryDays: vendor.delivery_days
    },
    catalogMetrics: {
      totalItems: items.length,
      activeItems: items.filter((item: VendorItem) => item.is_active).length,
      preferredItems: items.filter((item: VendorItem) => item.is_preferred).length,
      itemCategories: Array.from(new Set(items
        .map((item: VendorItem) => item.InventoryItems?.category)
        .filter(Boolean)
      ))
    },
    performanceScore: Math.round(performanceScore * 100) / 100,
    trends: {
      recentActivity: totalOrders,
      growthRate: calculateGrowthRate(periodOrders, startDate, endDate)
    }
  }
}

/**
 * Calculate average delivery time for completed orders
 */
function calculateAverageDeliveryTime(completedOrders: VendorOrder[]): number {
  const ordersWithDelivery = completedOrders.filter(order => order.delivery_date)
  
  if (ordersWithDelivery.length === 0) return 0

  const totalDays = ordersWithDelivery.reduce((sum, order) => {
    const orderDate = new Date(order.order_date)
    const deliveryDate = new Date(order.delivery_date)
    const daysDiff = (deliveryDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    return sum + daysDiff
  }, 0)

  return totalDays / ordersWithDelivery.length
}

/**
 * Calculate order frequency (orders per month)
 */
function calculateOrderFrequency(orders: any[], startDate: Date, endDate: Date): number {
  if (orders.length === 0) return 0

  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  const monthsDiff = daysDiff / 30.44 // Average days per month

  return monthsDiff > 0 ? orders.length / monthsDiff : 0
}

/**
 * Calculate growth rate of orders over time
 */
function calculateGrowthRate(orders: any[], startDate: Date, endDate: Date): number {
  if (orders.length < 2) return 0

  const midPoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
  const firstHalf = orders.filter(order => new Date(order.order_date) <= midPoint)
  const secondHalf = orders.filter(order => new Date(order.order_date) > midPoint)

  if (firstHalf.length === 0) return 0

  return ((secondHalf.length - firstHalf.length) / firstHalf.length) * 100
}

/**
 * Calculate overall performance score
 */
function calculatePerformanceScore(metrics: {
  onTimePercentage: number
  totalOrders: number
  cancelledOrders: number
  completedOrders: number
}): number {
  let score = 3.0 // Base score

  // On-time delivery impact (40%)
  if (metrics.onTimePercentage >= 95) score += 1.5
  else if (metrics.onTimePercentage >= 85) score += 1.0
  else if (metrics.onTimePercentage >= 75) score += 0.5
  else if (metrics.onTimePercentage < 50) score -= 1.0

  // Order completion rate impact (35%)
  const completionRate = metrics.totalOrders > 0 ? 
    (metrics.completedOrders / metrics.totalOrders) * 100 : 0
  if (completionRate >= 95) score += 1.2
  else if (completionRate >= 85) score += 0.8
  else if (completionRate < 70) score -= 0.5

  // Cancellation rate impact (15%)
  const cancellationRate = metrics.totalOrders > 0 ? 
    (metrics.cancelledOrders / metrics.totalOrders) * 100 : 0
  if (cancellationRate === 0) score += 0.3
  else if (cancellationRate > 10) score -= 0.3
  else if (cancellationRate > 20) score -= 0.7

  // Order volume bonus (10%)
  if (metrics.totalOrders >= 50) score += 0.2
  else if (metrics.totalOrders >= 20) score += 0.15
  else if (metrics.totalOrders >= 10) score += 0.1

  return Math.max(1, Math.min(5, score))
}

/**
 * Generate overall analytics summary
 */
function generateAnalyticsSummary(vendorAnalytics: any[], period: string): any {
  const totalVendors = vendorAnalytics.length
  const activeVendors = vendorAnalytics.filter(v => v.vendorInfo.isActive).length
  const preferredVendors = vendorAnalytics.filter(v => v.vendorInfo.isPreferred).length

  const totalSpent = vendorAnalytics.reduce((sum, v) => sum + v.financialMetrics.totalSpent, 0)
  const totalOrders = vendorAnalytics.reduce((sum, v) => sum + v.orderMetrics.total, 0)
  const averagePerformanceScore = vendorAnalytics.length > 0 ?
    vendorAnalytics.reduce((sum, v) => sum + v.performanceScore, 0) / vendorAnalytics.length : 0

  // Top performers
  const topBySpending = [...vendorAnalytics]
    .sort((a, b) => b.financialMetrics.totalSpent - a.financialMetrics.totalSpent)
    .slice(0, 5)

  const topByPerformance = [...vendorAnalytics]
    .sort((a, b) => b.performanceScore - a.performanceScore)
    .slice(0, 5)

  return {
    totalVendors,
    activeVendors,
    preferredVendors,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? Math.round((totalSpent / totalOrders) * 100) / 100 : 0,
    averagePerformanceScore: Math.round(averagePerformanceScore * 100) / 100,
    topBySpending: topBySpending.map(v => ({
      name: v.vendorInfo.name,
      totalSpent: v.financialMetrics.totalSpent
    })),
    topByPerformance: topByPerformance.map(v => ({
      name: v.vendorInfo.name,
      performanceScore: v.performanceScore
    }))
  }
}

/**
 * Generate insights from vendor analytics
 */
function generateVendorInsights(vendorAnalytics: any[]): string[] {
  const insights: string[] = []

  // Performance insights
  const highPerformers = vendorAnalytics.filter(v => v.performanceScore >= 4.5).length
  const lowPerformers = vendorAnalytics.filter(v => v.performanceScore <= 2.5).length

  if (highPerformers > 0) {
    insights.push(`${highPerformers} vendor(s) are high performers (score ≥ 4.5)`)
  }
  if (lowPerformers > 0) {
    insights.push(`${lowPerformers} vendor(s) need attention (score ≤ 2.5)`)
  }

  // Delivery insights
  const lateDeliveryVendors = vendorAnalytics.filter(v => 
    v.deliveryMetrics.onTimePercentage < 80
  ).length

  if (lateDeliveryVendors > 0) {
    insights.push(`${lateDeliveryVendors} vendor(s) have delivery issues (< 80% on-time)`)
  }

  // Cost insights
  const sortedByCost = [...vendorAnalytics].sort((a, b) => 
    b.financialMetrics.averageItemCost - a.financialMetrics.averageItemCost
  )

  if (sortedByCost.length >= 2) {
    const costDiff = sortedByCost[0].financialMetrics.averageItemCost - 
                    sortedByCost[sortedByCost.length - 1].financialMetrics.averageItemCost
    if (costDiff > 10) {
      insights.push(`Significant cost variation between vendors (${costDiff.toFixed(2)} difference)`)
    }
  }

  // Order frequency insights
  const infrequentVendors = vendorAnalytics.filter(v => 
    v.orderMetrics.frequency < 0.5 // Less than 0.5 orders per month
  ).length

  if (infrequentVendors > 0) {
    insights.push(`${infrequentVendors} vendor(s) are used infrequently (< 0.5 orders/month)`)
  }

  return insights
}

/**
 * Generate actionable recommendations
 */
function generateRecommendations(vendorAnalytics: any[], summary: any): string[] {
  const recommendations: string[] = []

  // Performance recommendations
  const lowPerformers = vendorAnalytics.filter(v => v.performanceScore <= 2.5)
  if (lowPerformers.length > 0) {
    recommendations.push(`Review relationships with ${lowPerformers.length} underperforming vendor(s)`)
  }

  // Preferred vendor recommendations
  const nonPreferredHighPerformers = vendorAnalytics.filter(v => 
    !v.vendorInfo.isPreferred && v.performanceScore >= 4.0
  )
  if (nonPreferredHighPerformers.length > 0) {
    recommendations.push(`Consider marking ${nonPreferredHighPerformers.length} high-performing vendor(s) as preferred`)
  }

  // Cost optimization
  if (summary.averageOrderValue < 100) {
    recommendations.push('Consider consolidating orders to increase order value and reduce costs')
  }

  // Delivery optimization
  const lateDeliveryVendors = vendorAnalytics.filter(v => 
    v.deliveryMetrics.averageDeliveryDays > v.vendorInfo.expectedDeliveryDays * 1.2
  )
  if (lateDeliveryVendors.length > 0) {
    recommendations.push(`Discuss delivery expectations with ${lateDeliveryVendors.length} vendor(s) missing targets`)
  }

  // Diversification
  const preferredVendorSpending = vendorAnalytics
    .filter(v => v.vendorInfo.isPreferred)
    .reduce((sum, v) => sum + v.financialMetrics.totalSpent, 0)
  
  const preferredSpendingPercentage = summary.totalSpent > 0 ? 
    (preferredVendorSpending / summary.totalSpent) * 100 : 0

  if (preferredSpendingPercentage > 80) {
    recommendations.push('Consider diversifying vendor relationships to reduce dependency risk')
  }

  return recommendations
}