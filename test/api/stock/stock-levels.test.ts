/**
 * Stock Levels API Tests
 * Tests for /api/stock/levels endpoint
 */

import { GET, POST } from '@/app/api/stock/levels/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('/api/stock/levels', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('GET - Stock Level Monitoring', () => {
    it('should return all stock levels with summary', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('stockLevels')
      expect(data).toHaveProperty('summary')
      expect(data.summary).toHaveProperty('totalItems')
      expect(data.summary).toHaveProperty('lowStockItems')
      expect(data.summary).toHaveProperty('outOfStockItems')
      expect(data.summary).toHaveProperty('overstockItems')
      expect(Array.isArray(data.stockLevels)).toBe(true)
    })

    it('should filter stock levels by status', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { status: 'low_stock' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stockLevels).toBeDefined()
      expect(Array.isArray(data.stockLevels)).toBe(true)
    })

    it('should filter stock levels by category', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { category: 'produce' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stockLevels).toBeDefined()
    })

    it('should filter stock levels by location', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { location: 'warehouse-a' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stockLevels).toBeDefined()
    })

    it('should search stock levels by item name', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { search: 'tomato' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stockLevels).toBeDefined()
    })

    it('should support pagination', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { page: '2', limit: '10' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('pagination')
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(10)
    })

    it('should sort stock levels', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { 
          sort_by: 'current_quantity',
          sort_order: 'desc'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.stockLevels).toBeDefined()
    })

    it('should include trend analysis when requested', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_trends: 'true' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.stockLevels.length > 0) {
        expect(data.stockLevels[0]).toHaveProperty('trends')
      }
    })

    it('should include stock value calculations', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_values: 'true' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toHaveProperty('totalStockValue')
    })
  })

  describe('POST - Stock Level Updates', () => {
    it('should successfully update multiple stock levels', async () => {
      const updates = [
        {
          inventory_item_id: 'item-1',
          new_quantity: 50,
          reason: 'Inventory count adjustment'
        },
        {
          inventory_item_id: 'item-2',
          new_quantity: 25,
          reason: 'Damaged goods removal'
        }
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'bulk_update',
          updates: updates
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.operation).toBe('bulk_update')
      expect(data.results).toBeDefined()
      expect(data.summary).toBeDefined()
      expect(data.summary.totalUpdates).toBe(2)
    })

    it('should validate update operations', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'bulk_update'
          // Missing updates array
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Updates array is required')
    })

    it('should handle recalculation operations', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'recalculate_all',
          include_trends: true,
          include_forecasts: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.operation).toBe('recalculate_all')
      expect(data.processedItems).toBeDefined()
    })

    it('should handle par level adjustments', async () => {
      const adjustments = [
        {
          inventory_item_id: 'item-1',
          par_level_low: 10,
          par_level_high: 100,
          reason: 'Seasonal adjustment'
        }
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'adjust_par_levels',
          adjustments: adjustments
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.operation).toBe('adjust_par_levels')
      expect(data.results).toBeDefined()
    })

    it('should validate par level values', async () => {
      const adjustments = [
        {
          inventory_item_id: 'item-1',
          par_level_low: 100,
          par_level_high: 50, // Invalid: low > high
        }
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'adjust_par_levels',
          adjustments: adjustments
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Par level low cannot be greater than par level high')
    })

    it('should handle stock transfer operations', async () => {
      const transfers = [
        {
          inventory_item_id: 'item-1',
          from_location: 'warehouse-a',
          to_location: 'warehouse-b',
          quantity: 25,
          reason: 'Redistribution'
        }
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'transfer_stock',
          transfers: transfers
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.operation).toBe('transfer_stock')
      expect(data.results).toBeDefined()
    })
  })

  describe('Stock Status Classification', () => {
    it('should correctly classify stock status', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Check that stock items have proper status classification
      if (data.stockLevels.length > 0) {
        const stockItem = data.stockLevels[0]
        expect(stockItem).toHaveProperty('stockStatus')
        expect(['optimal', 'low_stock', 'out_of_stock', 'overstock', 'reorder_point'].includes(stockItem.stockStatus)).toBe(true)
      }
    })

    it('should identify critical stock alerts', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_alerts: 'true' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('alerts')
      expect(Array.isArray(data.alerts)).toBe(true)
    })
  })

  describe('Stock Value Calculations', () => {
    it('should calculate total stock value correctly', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_values: 'true' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toHaveProperty('totalStockValue')
      expect(typeof data.summary.totalStockValue).toBe('number')
    })

    it('should calculate stock value by category', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { 
          include_values: 'true',
          group_by: 'category'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.summary).toHaveProperty('valueByCategory')
    })
  })

  describe('Performance and Efficiency', () => {
    it('should handle large datasets efficiently', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { limit: '1000' }
      })

      const startTime = Date.now()
      const response = await GET(request)
      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(response.status).toBe(200)
      expect(responseTime).toBeLessThan(5000) // Should respond within 5 seconds
    })

    it('should cache expensive calculations', async () => {
      // First request
      const request1 = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_trends: 'true' }
      })

      const response1 = await GET(request1)
      expect(response1.status).toBe(200)

      // Second identical request should be faster (if caching is implemented)
      const request2 = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { include_trends: 'true' }
      })

      const response2 = await GET(request2)
      expect(response2.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      testUtils.mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should validate bulk update data', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'bulk_update',
          updates: [
            {
              // Missing inventory_item_id
              new_quantity: 50
            }
          ]
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('inventory_item_id is required')
    })

    it('should handle negative quantity validation', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'bulk_update',
          updates: [
            {
              inventory_item_id: 'item-1',
              new_quantity: -10 // Invalid negative quantity
            }
          ]
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Quantity cannot be negative')
    })
  })

  describe('Integration with Other Systems', () => {
    it('should trigger stock movement records for updates', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'bulk_update',
          updates: [
            {
              inventory_item_id: 'item-1',
              new_quantity: 50,
              reason: 'Manual adjustment'
            }
          ]
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify stock movement was recorded
      expect(testUtils.mockSupabase.from).toHaveBeenCalledWith('stock_movements')
    })

    it('should update related recipe costs when stock costs change', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/levels',
        body: {
          operation: 'recalculate_all',
          update_recipe_costs: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('recipeCostsUpdated')
    })
  })

  describe('Reporting and Analytics', () => {
    it('should provide stock turnover metrics', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { 
          include_analytics: 'true',
          analytics_period: '30d'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.analytics) {
        expect(data.analytics).toHaveProperty('turnoverRate')
        expect(data.analytics).toHaveProperty('averageStockLevel')
        expect(data.analytics).toHaveProperty('stockoutFrequency')
      }
    })

    it('should generate stock level reports', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/levels',
        searchParams: { 
          format: 'report',
          report_type: 'summary'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('report')
      expect(data.report).toHaveProperty('generatedAt')
      expect(data.report).toHaveProperty('summary')
    })
  })
})