/**
 * Stock Movements API Tests
 * Tests for /api/stock/movements endpoint
 */

import { GET, POST } from '@/app/api/stock/movements/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('/api/stock/movements', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('GET - Movement History', () => {
    it('should return all stock movements with pagination', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('movements')
      expect(data).toHaveProperty('pagination')
      expect(data).toHaveProperty('summary')
      expect(Array.isArray(data.movements)).toBe(true)
      expect(data.summary).toHaveProperty('totalMovements')
      expect(data.summary).toHaveProperty('inboundTotal')
      expect(data.summary).toHaveProperty('outboundTotal')
    })

    it('should filter movements by inventory item', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { inventory_item_id: 'test-item-id' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toBeDefined()
    })

    it('should filter movements by date range', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toBeDefined()
    })

    it('should filter movements by type', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { movement_type: 'receiving' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toBeDefined()
    })

    it('should filter movements by direction', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { direction: 'in' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toBeDefined()
    })

    it('should include related data when requested', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          include_item_details: 'true',
          include_user_details: 'true'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.movements.length > 0) {
        const movement = data.movements[0]
        expect(movement).toHaveProperty('inventoryItem')
        expect(movement).toHaveProperty('createdByUser')
      }
    })

    it('should support different sorting options', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          sort_by: 'quantity',
          sort_order: 'desc'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.movements).toBeDefined()
    })

    it('should provide movement analytics when requested', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          include_analytics: 'true',
          analytics_period: '7d'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('analytics')
      if (data.analytics) {
        expect(data.analytics).toHaveProperty('frequentMovements')
        expect(data.analytics).toHaveProperty('movementsByType')
        expect(data.analytics).toHaveProperty('averageMovementSize')
      }
    })
  })

  describe('POST - Record New Movement', () => {
    it('should successfully record a new stock movement', async () => {
      const movementData = {
        inventory_item_id: 'test-item-id',
        movement_type: 'adjustment',
        direction: 'in',
        quantity: 10,
        reason: 'Inventory count correction',
        notes: 'Manual adjustment after physical count',
        location: 'warehouse-a'
      }

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: movementData
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.movement).toBeDefined()
      expect(data.movement.movement_type).toBe('adjustment')
      expect(data.movement.quantity).toBe(10)
    })

    it('should validate required fields', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          // Missing required fields
          movement_type: 'adjustment'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should validate movement direction', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'adjustment',
          direction: 'invalid_direction',
          quantity: 10,
          reason: 'Test'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('direction must be either in or out')
    })

    it('should validate positive quantity', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'adjustment',
          direction: 'in',
          quantity: -5, // Invalid negative quantity
          reason: 'Test'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Quantity must be positive')
    })

    it('should update inventory levels for inbound movements', async () => {
      const existingItem = testUtils.createMockInventoryItem({ 
        current_quantity: 20 
      })

      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: existingItem, error: null })
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { ...existingItem, current_quantity: 30 },
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'receiving',
          direction: 'in',
          quantity: 10,
          reason: 'Delivery received',
          update_inventory: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.inventoryUpdated).toBe(true)
      expect(data.newInventoryLevel).toBe(30)
    })

    it('should update inventory levels for outbound movements', async () => {
      const existingItem = testUtils.createMockInventoryItem({ 
        current_quantity: 30 
      })

      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: existingItem, error: null })
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { ...existingItem, current_quantity: 20 },
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'consumption',
          direction: 'out',
          quantity: 10,
          reason: 'Used in production',
          update_inventory: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.inventoryUpdated).toBe(true)
      expect(data.newInventoryLevel).toBe(20)
    })

    it('should prevent negative inventory when updating levels', async () => {
      const existingItem = testUtils.createMockInventoryItem({ 
        current_quantity: 5 
      })

      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: existingItem, error: null })
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'consumption',
          direction: 'out',
          quantity: 10, // More than available
          reason: 'Used in production',
          update_inventory: true,
          allow_negative: false
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('insufficient stock')
      expect(data.availableQuantity).toBe(5)
      expect(data.requestedQuantity).toBe(10)
    })

    it('should record bulk movements', async () => {
      const movements = [
        {
          inventory_item_id: 'item-1',
          movement_type: 'adjustment',
          direction: 'in',
          quantity: 5,
          reason: 'Correction 1'
        },
        {
          inventory_item_id: 'item-2',
          movement_type: 'adjustment',
          direction: 'out',
          quantity: 3,
          reason: 'Correction 2'
        }
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          operation: 'bulk_record',
          movements: movements,
          update_inventory: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.operation).toBe('bulk_record')
      expect(data.results).toBeDefined()
      expect(data.summary.totalMovements).toBe(2)
    })

    it('should handle transfer movements between locations', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'transfer',
          quantity: 15,
          reason: 'Location transfer',
          from_location: 'warehouse-a',
          to_location: 'warehouse-b',
          update_inventory: false // Transfers don't change total quantity
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.movement.movement_type).toBe('transfer')
      expect(data.movement.from_location).toBe('warehouse-a')
      expect(data.movement.to_location).toBe('warehouse-b')
    })
  })

  describe('Movement Types and Validation', () => {
    const movementTypes = [
      'receiving', 'consumption', 'adjustment', 'transfer', 
      'waste', 'expiry', 'sale', 'return'
    ]

    movementTypes.forEach(type => {
      it(`should accept ${type} movement type`, async () => {
        const direction = ['receiving', 'adjustment', 'return'].includes(type) ? 'in' : 'out'
        
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/stock/movements',
          body: {
            inventory_item_id: 'test-item-id',
            movement_type: type,
            direction: direction,
            quantity: 10,
            reason: `Test ${type} movement`
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.movement.movement_type).toBe(type)
      })
    })

    it('should reject invalid movement types', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'invalid_type',
          direction: 'in',
          quantity: 10,
          reason: 'Test'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid movement type')
    })
  })

  describe('Movement Analytics and Reporting', () => {
    it('should calculate movement velocity', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          inventory_item_id: 'test-item-id',
          include_velocity: 'true',
          period: '30d'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.analytics) {
        expect(data.analytics).toHaveProperty('velocity')
        expect(data.analytics.velocity).toHaveProperty('avgDailyUsage')
        expect(data.analytics.velocity).toHaveProperty('turnoverRate')
      }
    })

    it('should provide movement patterns analysis', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          include_patterns: 'true',
          pattern_analysis_days: '60'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.patterns) {
        expect(data.patterns).toHaveProperty('peakUsageTimes')
        expect(data.patterns).toHaveProperty('seasonalTrends')
        expect(data.patterns).toHaveProperty('cyclicalPatterns')
      }
    })

    it('should generate movement reports', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements',
        searchParams: { 
          format: 'report',
          report_type: 'summary',
          period: '1m'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('report')
      expect(data.report).toHaveProperty('period')
      expect(data.report).toHaveProperty('summary')
      expect(data.report).toHaveProperty('generatedAt')
    })
  })

  describe('Integration and Automation', () => {
    it('should trigger automatic reorder when stock hits reorder point', async () => {
      const existingItem = testUtils.createMockInventoryItem({ 
        current_quantity: 12,
        par_level_low: 10 
      })

      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: existingItem, error: null })
              }))
            })),
            update: jest.fn(() => ({
              eq: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: { ...existingItem, current_quantity: 8 },
                    error: null
                  })
                }))
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'consumption',
          direction: 'out',
          quantity: 4,
          reason: 'Used in production',
          update_inventory: true,
          check_reorder_triggers: true
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      if (data.alerts) {
        expect(data.alerts.some(alert => alert.type === 'reorder_triggered')).toBe(true)
      }
    })

    it('should log movement history for audit trails', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'test-item-id',
          movement_type: 'adjustment',
          direction: 'in',
          quantity: 10,
          reason: 'Audit correction',
          audit_notes: 'Physical count revealed discrepancy',
          reference_id: 'AUDIT-2024-001'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.movement).toHaveProperty('reference_id', 'AUDIT-2024-001')
      expect(data.movement).toHaveProperty('audit_trail')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      testUtils.mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/stock/movements'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle non-existent inventory items', async () => {
      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/stock/movements',
        body: {
          inventory_item_id: 'non-existent-id',
          movement_type: 'adjustment',
          direction: 'in',
          quantity: 10,
          reason: 'Test'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('Inventory item not found')
    })

    it('should handle concurrent movement updates', async () => {
      // Simulate concurrent updates to the same inventory item
      const movements = [
        {
          inventory_item_id: 'test-item-id',
          movement_type: 'consumption',
          direction: 'out',
          quantity: 5,
          reason: 'Concurrent update 1'
        },
        {
          inventory_item_id: 'test-item-id',
          movement_type: 'consumption',
          direction: 'out',
          quantity: 3,
          reason: 'Concurrent update 2'
        }
      ]

      const promises = movements.map(movement => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/stock/movements',
          body: {
            ...movement,
            update_inventory: true
          }
        })
        return POST(request)
      })

      const responses = await Promise.all(promises)
      
      // Both should succeed or handle concurrency appropriately
      responses.forEach(response => {
        expect([201, 409]).toContain(response.status) // 409 for conflict handling
      })
    })
  })
})