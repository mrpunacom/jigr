/**
 * Barcode Stock Update API Tests
 * Tests for /api/barcode/stock-update endpoint
 */

import { GET, POST } from '@/app/api/barcode/stock-update/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('/api/barcode/stock-update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
    testUtils.mockExternalApis()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('POST - Quick Stock Updates', () => {
    describe('set_quantity operation', () => {
      it('should successfully set quantity for existing inventory item', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'set_quantity',
            quantity: 50,
            inventory_item_id: 'test-inventory-item-id',
            notes: 'Manual stock adjustment'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.operation).toBe('set_quantity')
        expect(data.barcode).toBe(validBarcode)
        expect(data.action).toBe('quantity_updated')
        expect(data.item).toBeDefined()
        expect(data.newQuantity).toBe(50)
      })

      it('should create new item when auto_create_item is true', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        // Mock no existing inventory item
        testUtils.mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'inventory_items') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
                }))
              })),
              insert: jest.fn(() => ({
                select: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: testUtils.createMockInventoryItem(),
                    error: null
                  })
                }))
              }))
            }
          }
          return testUtils.createMockSupabase().from(table)
        })

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'set_quantity',
            quantity: 25,
            auto_create_item: true,
            item_data: {
              item_name: 'New Test Item',
              unit_of_measurement: 'kg',
              cost_per_unit: 15.50
            }
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('item_created_and_updated')
        expect(data.item).toBeDefined()
        expect(data.newQuantity).toBe(25)
      })
    })

    describe('add_quantity operation', () => {
      it('should successfully add quantity to existing stock', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        // Mock existing inventory item with current quantity
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
                      data: { ...existingItem, current_quantity: 45 },
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
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'add_quantity',
            quantity: 15,
            inventory_item_id: 'test-inventory-item-id',
            reason: 'Receiving delivery'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.operation).toBe('add_quantity')
        expect(data.previousQuantity).toBe(30)
        expect(data.newQuantity).toBe(45)
        expect(data.quantityChange).toBe(15)
      })
    })

    describe('subtract_quantity operation', () => {
      it('should successfully subtract quantity from existing stock', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const existingItem = testUtils.createMockInventoryItem({ 
          current_quantity: 50 
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
                      data: { ...existingItem, current_quantity: 35 },
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
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'subtract_quantity',
            quantity: 15,
            inventory_item_id: 'test-inventory-item-id',
            reason: 'Used in production'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.operation).toBe('subtract_quantity')
        expect(data.previousQuantity).toBe(50)
        expect(data.newQuantity).toBe(35)
        expect(data.quantityChange).toBe(-15)
      })

      it('should prevent negative stock levels', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const existingItem = testUtils.createMockInventoryItem({ 
          current_quantity: 10 
        })

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'subtract_quantity',
            quantity: 15, // More than available
            inventory_item_id: 'test-inventory-item-id'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.error).toContain('would result in negative stock')
        expect(data.currentQuantity).toBe(10)
        expect(data.requestedChange).toBe(15)
      })
    })

    describe('link_item operation', () => {
      it('should successfully link barcode to existing inventory item', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        const inventoryItem = testUtils.createMockInventoryItem()

        testUtils.mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'inventory_items') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: inventoryItem, error: null })
                }))
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => ({
                  select: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: { ...inventoryItem, barcode: validBarcode },
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
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'link_item',
            inventory_item_id: 'test-inventory-item-id'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('barcode_linked')
        expect(data.item).toBeDefined()
        expect(data.message).toContain('linked')
      })

      it('should detect when barcode is already linked', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        const inventoryItem = testUtils.createMockInventoryItem({ 
          barcode: validBarcode 
        })

        testUtils.mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'inventory_items') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({ data: inventoryItem, error: null })
                }))
              }))
            }
          }
          return testUtils.createMockSupabase().from(table)
        })

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'link_item',
            inventory_item_id: 'test-inventory-item-id'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.action).toBe('already_linked')
        expect(data.message).toContain('already linked')
      })

      it('should return error for non-existent inventory item', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')

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
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'link_item',
            inventory_item_id: 'non-existent-id'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.error).toBe('Inventory item not found')
      })
    })

    describe('create_item operation', () => {
      it('should successfully create new inventory item from barcode', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'create_item',
            quantity: 20,
            item_data: {
              item_name: 'New Barcode Item',
              category: 'produce',
              unit_of_measurement: 'kg',
              cost_per_unit: 12.50,
              par_level_low: 5,
              par_level_high: 50
            },
            location: 'warehouse-a'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.action).toBe('item_created')
        expect(data.item).toBeDefined()
        expect(data.message).toContain('Created')
      })
    })

    describe('validation and error handling', () => {
      it('should return error for missing barcode', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            operation: 'set_quantity',
            quantity: 50
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Barcode is required')
      })

      it('should return error for missing operation', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            quantity: 50
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Operation is required')
      })

      it('should return error for invalid operation', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'invalid_operation',
            quantity: 50
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid operation')
      })
    })

    describe('stock movement tracking', () => {
      it('should create stock movement records for quantity changes', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'add_quantity',
            quantity: 10,
            inventory_item_id: 'test-inventory-item-id',
            reason: 'Receiving delivery'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        
        // Verify stock movement was recorded
        expect(testUtils.mockSupabase.from).toHaveBeenCalledWith('stock_movements')
      })
    })

    describe('stock alerts', () => {
      it('should check for stock alerts after quantity updates', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const existingItem = testUtils.createMockInventoryItem({ 
          current_quantity: 15,
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
                      data: { ...existingItem, current_quantity: 5 },
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
          url: 'http://localhost:3000/api/barcode/stock-update',
          body: {
            barcode: validBarcode,
            operation: 'subtract_quantity',
            quantity: 10,
            inventory_item_id: 'test-inventory-item-id',
            reason: 'Used in production'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.stockAlerts).toBeDefined()
        expect(Array.isArray(data.stockAlerts)).toBe(true)
      })
    })
  })

  describe('GET - Update Suggestions', () => {
    it('should return update suggestions for barcode', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/stock-update',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.barcode).toBe(validBarcode)
      expect(data).toHaveProperty('productFound')
      expect(data).toHaveProperty('suggestions')
      expect(data).toHaveProperty('quickActions')
      expect(Array.isArray(data.suggestions)).toBe(true)
      expect(Array.isArray(data.quickActions)).toBe(true)
    })

    it('should return error for missing barcode parameter', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/stock-update'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Barcode parameter is required')
    })

    it('should include inventory matches in suggestions', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/stock-update',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('inventoryMatches')
      expect(Array.isArray(data.inventoryMatches)).toBe(true)
    })

    it('should generate appropriate quick actions based on context', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')

      // Mock existing barcode link
      const linkedItem = testUtils.createMockInventoryItem({ 
        barcode: validBarcode 
      })
      
      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items' || table === 'barcode_products') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => ({
                single: jest.fn().mockResolvedValue({ data: linkedItem, error: null })
              }))
            }))
          }
        }
        return testUtils.createMockSupabase().from(table)
      })

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/stock-update',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.existingLink).toBeDefined()
      expect(data.existingLink.exists).toBe(true)
      expect(data.quickActions).toBeDefined()
      expect(data.quickActions.some(action => action.type === 'update_quantity')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      testUtils.mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const validBarcode = testUtils.generateValidBarcode('123456789')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/stock-update',
        body: {
          barcode: validBarcode,
          operation: 'set_quantity',
          quantity: 50,
          inventory_item_id: 'test-inventory-item-id'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle missing inventory items appropriately', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')

      // Mock no existing inventory item or barcode link
      testUtils.mockSupabase.from.mockImplementation((table: string) => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
          }))
        }))
      }))

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/stock-update',
        body: {
          barcode: validBarcode,
          operation: 'add_quantity',
          quantity: 10,
          auto_create_item: false
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toContain('No inventory item found')
      expect(data.suggestions).toBeDefined()
    })
  })
})