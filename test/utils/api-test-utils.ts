/**
 * API Testing Utilities
 * Comprehensive utilities for testing all JiGR API endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export interface MockSupabaseClient {
  from: jest.MockedFunction<any>
  storage: {
    from: jest.MockedFunction<any>
  }
  auth: {
    getUser: jest.MockedFunction<any>
    signOut: jest.MockedFunction<any>
  }
}

export interface TestUser {
  id: string
  email: string
  client_id: string
}

export interface TestInventoryItem {
  id: string
  item_name: string
  current_quantity: number
  unit_of_measurement: string
  cost_per_unit: number
  par_level_low: number
  par_level_high: number
  barcode?: string
}

export interface TestRecipe {
  id: string
  name: string
  yield_amount: number
  total_cost: number
  prep_time_minutes: number
}

export interface TestStockMovement {
  id: string
  inventory_item_id: string
  movement_type: string
  quantity: number
  direction: 'in' | 'out'
  reason: string
  movement_date: string
}

/**
 * API Test Utilities Class
 */
export class ApiTestUtils {
  private static instance: ApiTestUtils
  private mockSupabase: MockSupabaseClient
  
  constructor() {
    this.mockSupabase = this.createMockSupabase()
  }
  
  static getInstance(): ApiTestUtils {
    if (!ApiTestUtils.instance) {
      ApiTestUtils.instance = new ApiTestUtils()
    }
    return ApiTestUtils.instance
  }

  /**
   * Create mock Supabase client with all necessary methods
   */
  createMockSupabase(): MockSupabaseClient {
    const mockFrom = jest.fn().mockImplementation((table: string) => {
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: this.getMockData(table), error: null }),
            limit: jest.fn().mockResolvedValue({ data: [this.getMockData(table)], error: null }),
            order: jest.fn().mockReturnThis(),
            range: jest.fn().mockReturnThis()
          }),
          neq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          filter: jest.fn().mockReturnThis()
        }),
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: this.getMockData(table), error: null })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: this.getMockData(table), error: null })
            })
          })
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null })
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: this.getMockData(table), error: null })
          })
        })
      }
    })

    return {
      from: mockFrom,
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com' } })),
          remove: jest.fn().mockResolvedValue({ data: null, error: null })
        }))
      },
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null
        }),
        signOut: jest.fn().mockResolvedValue({ error: null })
      }
    }
  }

  /**
   * Get mock data for different table types
   */
  getMockData(table: string): any {
    const mockData: { [key: string]: any } = {
      inventory_items: this.createMockInventoryItem(),
      barcode_products: this.createMockBarcodeProduct(),
      Recipes: this.createMockRecipe(),
      RecipeIngredients: this.createMockRecipeIngredient(),
      MenuPricing: this.createMockMenuItem(),
      stock_movements: this.createMockStockMovement(),
      scanning_sessions: this.createMockScanningSession(),
      scanning_session_items: this.createMockScanningSessionItem(),
      vendors: this.createMockVendor(),
      purchase_orders: this.createMockPurchaseOrder()
    }

    return mockData[table] || {}
  }

  /**
   * Create test data factories
   */
  createMockInventoryItem(overrides: Partial<TestInventoryItem> = {}): TestInventoryItem {
    return {
      id: 'test-inventory-item-id',
      item_name: 'Test Item',
      current_quantity: 50,
      unit_of_measurement: 'kg',
      cost_per_unit: 10.50,
      par_level_low: 10,
      par_level_high: 100,
      barcode: '1234567890123',
      ...overrides
    }
  }

  createMockBarcodeProduct(overrides: any = {}) {
    return {
      id: 'test-barcode-product-id',
      barcode: '1234567890123',
      product_name: 'Test Product',
      brand: 'Test Brand',
      category: 'test_category',
      description: 'Test product description',
      size_info: '1kg',
      unit_of_measurement: 'kg',
      confidence_score: 0.95,
      is_verified: true,
      ...overrides
    }
  }

  createMockRecipe(overrides: Partial<TestRecipe> = {}): TestRecipe {
    return {
      id: 'test-recipe-id',
      name: 'Test Recipe',
      yield_amount: 4,
      total_cost: 25.00,
      prep_time_minutes: 30,
      ...overrides
    }
  }

  createMockRecipeIngredient(overrides: any = {}) {
    return {
      id: 'test-ingredient-id',
      recipe_id: 'test-recipe-id',
      inventory_item_id: 'test-inventory-item-id',
      quantity_needed: 2.5,
      unit: 'kg',
      is_optional: false,
      ...overrides
    }
  }

  createMockMenuItem(overrides: any = {}) {
    return {
      id: 'test-menu-item-id',
      item_name: 'Test Menu Item',
      recipe_id: 'test-recipe-id',
      current_price: 18.50,
      cost_percentage: 65,
      ...overrides
    }
  }

  createMockStockMovement(overrides: Partial<TestStockMovement> = {}): TestStockMovement {
    return {
      id: 'test-movement-id',
      inventory_item_id: 'test-inventory-item-id',
      movement_type: 'adjustment',
      quantity: 10,
      direction: 'in',
      reason: 'Test movement',
      movement_date: new Date().toISOString(),
      ...overrides
    }
  }

  createMockScanningSession(overrides: any = {}) {
    return {
      id: 'test-session-id',
      user_id: 'test-user-id',
      workflow_type: 'inventory_count',
      status: 'active',
      started_at: new Date().toISOString(),
      scanned_items_count: 0,
      total_quantity_scanned: 0,
      ...overrides
    }
  }

  createMockScanningSessionItem(overrides: any = {}) {
    return {
      id: 'test-session-item-id',
      session_id: 'test-session-id',
      barcode: '1234567890123',
      quantity: 1,
      product_name: 'Test Product',
      scanned_at: new Date().toISOString(),
      scan_count: 1,
      ...overrides
    }
  }

  createMockVendor(overrides: any = {}) {
    return {
      id: 'test-vendor-id',
      vendor_name: 'Test Vendor',
      contact_email: 'vendor@test.com',
      contact_phone: '+1234567890',
      is_active: true,
      ...overrides
    }
  }

  createMockPurchaseOrder(overrides: any = {}) {
    return {
      id: 'test-po-id',
      vendor_id: 'test-vendor-id',
      status: 'pending',
      total_amount: 250.00,
      order_date: new Date().toISOString(),
      ...overrides
    }
  }

  /**
   * Mock authenticated user context
   */
  mockAuthenticatedUser(user: TestUser = { 
    id: 'test-user-id', 
    email: 'test@example.com', 
    client_id: 'test-client-id' 
  }) {
    // Mock the authentication utilities
    jest.doMock('@/lib/api-utils', () => ({
      getAuthenticatedClientId: jest.fn().mockResolvedValue({
        user_id: user.id,
        client_id: user.client_id
      })
    }))
    
    jest.doMock('@/lib/supabase', () => ({
      createClient: jest.fn().mockReturnValue(this.mockSupabase)
    }))
  }

  /**
   * Create mock Next.js request
   */
  createMockRequest(options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    url?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}): NextRequest {
    const {
      method = 'GET',
      url = 'http://localhost:3000/api/test',
      body,
      headers = {},
      searchParams = {}
    } = options

    const mockUrl = new URL(url)
    
    // Add search parameters
    Object.entries(searchParams).forEach(([key, value]) => {
      mockUrl.searchParams.set(key, value)
    })

    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (body && method !== 'GET') {
      requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    const request = new Request(mockUrl.toString(), requestInit) as NextRequest
    
    // Mock the json() method
    if (body) {
      request.json = jest.fn().mockResolvedValue(body)
    }

    return request
  }

  /**
   * Helper to test API response
   */
  async testApiResponse(
    response: NextResponse,
    expectedStatus: number = 200,
    expectedKeys: string[] = []
  ) {
    expect(response.status).toBe(expectedStatus)
    
    if (expectedKeys.length > 0) {
      const data = await response.json()
      expectedKeys.forEach(key => {
        expect(data).toHaveProperty(key)
      })
    }
  }

  /**
   * Mock fetch for external API calls
   */
  mockExternalApis() {
    global.fetch = jest.fn().mockImplementation((url: string) => {
      // Mock barcode lookup APIs
      if (url.includes('upcitemdb.com')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            code: 'OK',
            items: [{
              title: 'Test Product',
              brand: 'Test Brand',
              category: 'Food',
              upc: '1234567890123'
            }]
          })
        })
      }
      
      if (url.includes('openfoodfacts.org')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 1,
            product: {
              product_name: 'Test Food Product',
              brands: 'Test Brand',
              categories_tags: ['en:food'],
              quantity: '500g'
            }
          })
        })
      }

      // Default mock response
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve('')
      })
    })
  }

  /**
   * Clean up mocks after tests
   */
  cleanup() {
    jest.clearAllMocks()
    jest.restoreAllMocks()
  }

  /**
   * Test data validation helper
   */
  validateTestData(data: any, requiredFields: string[]): boolean {
    return requiredFields.every(field => data.hasOwnProperty(field))
  }

  /**
   * Generate test barcode with valid checksum
   */
  generateValidBarcode(prefix: string = '123456789'): string {
    const digits = prefix.padEnd(11, '0').slice(0, 11).split('').map(Number)
    let sum = 0
    
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1)
    }
    
    const checkDigit = (10 - (sum % 10)) % 10
    return digits.join('') + checkDigit.toString()
  }

  /**
   * Create test database fixtures
   */
  async createTestFixtures() {
    const fixtures = {
      inventoryItems: [
        this.createMockInventoryItem({ 
          id: 'item-1', 
          item_name: 'Tomatoes', 
          current_quantity: 25, 
          barcode: this.generateValidBarcode('001')
        }),
        this.createMockInventoryItem({ 
          id: 'item-2', 
          item_name: 'Lettuce', 
          current_quantity: 15, 
          barcode: this.generateValidBarcode('002')
        })
      ],
      recipes: [
        this.createMockRecipe({ 
          id: 'recipe-1', 
          name: 'Caesar Salad', 
          yield_amount: 2 
        })
      ],
      vendors: [
        this.createMockVendor({ 
          id: 'vendor-1', 
          vendor_name: 'Fresh Produce Co.' 
        })
      ]
    }

    return fixtures
  }
}

/**
 * Global test utilities instance
 */
export const testUtils = ApiTestUtils.getInstance()

/**
 * Test assertion helpers
 */
export const testAssertions = {
  /**
   * Assert API success response structure
   */
  assertSuccessResponse: (response: any, additionalFields: string[] = []) => {
    expect(response).toHaveProperty('success', true)
    additionalFields.forEach(field => {
      expect(response).toHaveProperty(field)
    })
  },

  /**
   * Assert API error response structure
   */
  assertErrorResponse: (response: any, expectedStatus: number = 400) => {
    expect(response.status).toBe(expectedStatus)
    expect(response).toHaveProperty('error')
  },

  /**
   * Assert barcode validation
   */
  assertValidBarcode: (barcode: string) => {
    expect(barcode).toMatch(/^\d{12,13}$/)
  },

  /**
   * Assert inventory item structure
   */
  assertInventoryItem: (item: any) => {
    const requiredFields = [
      'id', 'item_name', 'current_quantity', 
      'unit_of_measurement', 'cost_per_unit'
    ]
    requiredFields.forEach(field => {
      expect(item).toHaveProperty(field)
    })
  },

  /**
   * Assert recipe structure
   */
  assertRecipe: (recipe: any) => {
    const requiredFields = ['id', 'name', 'yield_amount']
    requiredFields.forEach(field => {
      expect(recipe).toHaveProperty(field)
    })
  }
}

/**
 * Database test utilities
 */
export const dbTestUtils = {
  /**
   * Reset test database state
   */
  resetDatabase: async () => {
    // Implementation would depend on your database setup
    console.log('🔄 Resetting test database...')
  },

  /**
   * Seed test data
   */
  seedTestData: async () => {
    const fixtures = await testUtils.createTestFixtures()
    console.log('🌱 Seeding test data...', fixtures)
    return fixtures
  }
}