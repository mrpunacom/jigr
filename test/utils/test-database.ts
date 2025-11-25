/**
 * Test Database Utilities
 * Manages test database setup, seeding, and cleanup
 */

import { createClient } from '@supabase/supabase-js'
import { testUtils } from './api-test-utils'

export interface TestDatabaseConfig {
  supabaseUrl: string
  supabaseKey: string
  testSchema?: string
  useInMemory?: boolean
}

export class TestDatabase {
  private static instance: TestDatabase
  private supabase: any
  private config: TestDatabaseConfig
  private testData: any = {}

  constructor(config: TestDatabaseConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  static getInstance(config?: TestDatabaseConfig): TestDatabase {
    if (!TestDatabase.instance) {
      if (!config) {
        throw new Error('TestDatabase config required for first initialization')
      }
      TestDatabase.instance = new TestDatabase(config)
    }
    return TestDatabase.instance
  }

  /**
   * Initialize test database with required tables and data
   */
  async initialize(): Promise<void> {
    console.log('🔧 Initializing test database...')

    try {
      // Create test user and client
      await this.createTestUser()
      
      // Seed basic test data
      await this.seedTestData()
      
      console.log('✅ Test database initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize test database:', error)
      throw error
    }
  }

  /**
   * Create test user and client for authentication
   */
  private async createTestUser(): Promise<void> {
    const testUser = {
      id: 'test-user-id',
      email: 'test@jigr-testing.com',
      created_at: new Date().toISOString()
    }

    const testClient = {
      id: 'test-client-id',
      client_name: 'Test Restaurant',
      created_at: new Date().toISOString()
    }

    // Store for reference in tests
    this.testData.user = testUser
    this.testData.client = testClient

    // In real implementation, these would be created in the test database
    // For now, we'll mock them
    console.log('👤 Test user created:', testUser.email)
    console.log('🏢 Test client created:', testClient.client_name)
  }

  /**
   * Seed test database with sample data
   */
  async seedTestData(): Promise<void> {
    console.log('🌱 Seeding test data...')

    // Create test inventory items
    this.testData.inventoryItems = await this.createInventoryItems()
    
    // Create test vendors
    this.testData.vendors = await this.createVendors()
    
    // Create test recipes
    this.testData.recipes = await this.createRecipes()
    
    // Create test barcode products
    this.testData.barcodeProducts = await this.createBarcodeProducts()
    
    // Create test menu items
    this.testData.menuItems = await this.createMenuItems()

    console.log('✅ Test data seeded successfully')
  }

  /**
   * Create sample inventory items
   */
  private async createInventoryItems(): Promise<any[]> {
    const items = [
      {
        id: 'inv-001',
        user_id: this.testData.user.id,
        item_name: 'Fresh Tomatoes',
        description: 'Organic vine-ripened tomatoes',
        category: 'produce',
        current_quantity: 25,
        unit_of_measurement: 'lb',
        cost_per_unit: 3.50,
        par_level_low: 10,
        par_level_high: 50,
        location: 'produce-cooler',
        barcode: testUtils.generateValidBarcode('001'),
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-002',
        user_id: this.testData.user.id,
        item_name: 'Extra Virgin Olive Oil',
        description: 'Premium Mediterranean olive oil',
        category: 'condiments_spices',
        current_quantity: 12,
        unit_of_measurement: 'bottle',
        cost_per_unit: 15.00,
        par_level_low: 3,
        par_level_high: 20,
        location: 'dry-storage',
        barcode: testUtils.generateValidBarcode('002'),
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-003',
        user_id: this.testData.user.id,
        item_name: 'Fresh Mozzarella',
        description: 'House-made fresh mozzarella',
        category: 'dairy',
        current_quantity: 8,
        unit_of_measurement: 'ball',
        cost_per_unit: 6.75,
        par_level_low: 5,
        par_level_high: 25,
        location: 'dairy-cooler',
        barcode: testUtils.generateValidBarcode('003'),
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-004',
        user_id: this.testData.user.id,
        item_name: 'All-Purpose Flour',
        description: 'Unbleached all-purpose flour',
        category: 'grains_bakery',
        current_quantity: 5,
        unit_of_measurement: 'lb',
        cost_per_unit: 2.25,
        par_level_low: 10,
        par_level_high: 100,
        location: 'dry-storage',
        barcode: testUtils.generateValidBarcode('004'),
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'inv-005',
        user_id: this.testData.user.id,
        item_name: 'Fresh Basil',
        description: 'Organic fresh basil leaves',
        category: 'produce',
        current_quantity: 2,
        unit_of_measurement: 'bunch',
        cost_per_unit: 2.50,
        par_level_low: 3,
        par_level_high: 15,
        location: 'herb-station',
        barcode: testUtils.generateValidBarcode('005'),
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]

    console.log(`📦 Created ${items.length} test inventory items`)
    return items
  }

  /**
   * Create sample vendors
   */
  private async createVendors(): Promise<any[]> {
    const vendors = [
      {
        id: 'vendor-001',
        user_id: this.testData.user.id,
        vendor_name: 'Fresh Produce Suppliers',
        contact_name: 'Maria Garcia',
        contact_email: 'maria@freshproduce.com',
        contact_phone: '+1-555-0101',
        address: '123 Farm Road, Fresh Valley, CA 90210',
        vendor_type: 'produce',
        payment_terms: 'Net 30',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'vendor-002',
        user_id: this.testData.user.id,
        vendor_name: 'Mediterranean Imports',
        contact_name: 'Antonio Rossi',
        contact_email: 'antonio@medimports.com',
        contact_phone: '+1-555-0102',
        address: '456 Import Blvd, Harbor City, CA 90211',
        vendor_type: 'specialty',
        payment_terms: 'Net 15',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'vendor-003',
        user_id: this.testData.user.id,
        vendor_name: 'Local Dairy Co-op',
        contact_name: 'Sarah Johnson',
        contact_email: 'sarah@localdairy.com',
        contact_phone: '+1-555-0103',
        address: '789 Dairy Lane, Farm Town, CA 90212',
        vendor_type: 'dairy',
        payment_terms: 'COD',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]

    console.log(`🏪 Created ${vendors.length} test vendors`)
    return vendors
  }

  /**
   * Create sample recipes
   */
  private async createRecipes(): Promise<any[]> {
    const recipes = [
      {
        id: 'recipe-001',
        user_id: this.testData.user.id,
        name: 'Margherita Pizza',
        description: 'Classic Italian pizza with tomatoes, mozzarella, and basil',
        category: 'pizza',
        yield_amount: 2,
        prep_time_minutes: 30,
        cook_time_minutes: 15,
        total_cost: 8.50,
        cost_per_serving: 4.25,
        instructions: [
          'Prepare pizza dough and let rise',
          'Roll out dough to desired thickness',
          'Spread tomato sauce evenly',
          'Add fresh mozzarella pieces',
          'Bake at 450°F for 12-15 minutes',
          'Garnish with fresh basil leaves'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'recipe-002',
        user_id: this.testData.user.id,
        name: 'Fresh Pesto',
        description: 'Traditional basil pesto sauce',
        category: 'sauce',
        yield_amount: 8,
        prep_time_minutes: 10,
        cook_time_minutes: 0,
        total_cost: 12.00,
        cost_per_serving: 1.50,
        instructions: [
          'Wash and dry fresh basil leaves',
          'Combine basil, garlic, and pine nuts in food processor',
          'Slowly add olive oil while processing',
          'Add parmesan cheese and season with salt',
          'Process until smooth consistency'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'recipe-003',
        user_id: this.testData.user.id,
        name: 'Caprese Salad',
        description: 'Fresh tomatoes, mozzarella, and basil',
        category: 'salad',
        yield_amount: 4,
        prep_time_minutes: 15,
        cook_time_minutes: 0,
        total_cost: 16.00,
        cost_per_serving: 4.00,
        instructions: [
          'Slice tomatoes and mozzarella',
          'Arrange alternating on plate',
          'Drizzle with olive oil',
          'Season with salt and pepper',
          'Garnish with fresh basil'
        ],
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]

    // Create recipe ingredients
    const recipeIngredients = [
      // Margherita Pizza ingredients
      { recipe_id: 'recipe-001', inventory_item_id: 'inv-001', quantity_needed: 0.5, unit: 'lb' },
      { recipe_id: 'recipe-001', inventory_item_id: 'inv-002', quantity_needed: 0.25, unit: 'bottle' },
      { recipe_id: 'recipe-001', inventory_item_id: 'inv-003', quantity_needed: 2, unit: 'ball' },
      { recipe_id: 'recipe-001', inventory_item_id: 'inv-005', quantity_needed: 0.5, unit: 'bunch' },
      
      // Fresh Pesto ingredients
      { recipe_id: 'recipe-002', inventory_item_id: 'inv-002', quantity_needed: 0.5, unit: 'bottle' },
      { recipe_id: 'recipe-002', inventory_item_id: 'inv-005', quantity_needed: 2, unit: 'bunch' },
      
      // Caprese Salad ingredients
      { recipe_id: 'recipe-003', inventory_item_id: 'inv-001', quantity_needed: 1, unit: 'lb' },
      { recipe_id: 'recipe-003', inventory_item_id: 'inv-002', quantity_needed: 0.1, unit: 'bottle' },
      { recipe_id: 'recipe-003', inventory_item_id: 'inv-003', quantity_needed: 2, unit: 'ball' },
      { recipe_id: 'recipe-003', inventory_item_id: 'inv-005', quantity_needed: 1, unit: 'bunch' }
    ]

    this.testData.recipeIngredients = recipeIngredients

    console.log(`👩‍🍳 Created ${recipes.length} test recipes with ${recipeIngredients.length} ingredients`)
    return recipes
  }

  /**
   * Create sample barcode products
   */
  private async createBarcodeProducts(): Promise<any[]> {
    const products = [
      {
        id: 'barcode-001',
        barcode: testUtils.generateValidBarcode('100'),
        product_name: 'San Marzano Tomatoes',
        brand: 'Cento',
        category: 'canned_goods',
        description: 'Authentic Italian San Marzano tomatoes',
        size_info: '28 oz can',
        unit_of_measurement: 'can',
        data_source: 'upc_database',
        confidence_score: 0.95,
        is_verified: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'barcode-002',
        barcode: testUtils.generateValidBarcode('200'),
        product_name: 'Parmigiano Reggiano',
        brand: 'Galbani',
        category: 'dairy',
        description: 'Aged Parmigiano Reggiano cheese',
        size_info: '8 oz wedge',
        unit_of_measurement: 'wedge',
        data_source: 'manual',
        confidence_score: 1.0,
        is_verified: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'barcode-003',
        barcode: testUtils.generateValidBarcode('300'),
        product_name: 'Organic Pine Nuts',
        brand: 'Whole Foods',
        category: 'nuts_seeds',
        description: 'Raw organic pine nuts',
        size_info: '4 oz bag',
        unit_of_measurement: 'bag',
        data_source: 'open_food_facts',
        confidence_score: 0.88,
        is_verified: false,
        created_at: new Date().toISOString()
      }
    ]

    console.log(`📱 Created ${products.length} test barcode products`)
    return products
  }

  /**
   * Create sample menu items
   */
  private async createMenuItems(): Promise<any[]> {
    const menuItems = [
      {
        id: 'menu-001',
        user_id: this.testData.user.id,
        item_name: 'Margherita Pizza',
        recipe_id: 'recipe-001',
        menu_category: 'pizza',
        current_price: 18.00,
        cost_percentage: 24, // 4.25/18.00
        is_available: true,
        description: 'Our signature pizza with San Marzano tomatoes, fresh mozzarella, and basil',
        allergens: ['gluten', 'dairy'],
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-002',
        user_id: this.testData.user.id,
        item_name: 'Caprese Salad',
        recipe_id: 'recipe-003',
        menu_category: 'appetizer',
        current_price: 14.00,
        cost_percentage: 29, // 4.00/14.00
        is_available: true,
        description: 'Fresh tomatoes, mozzarella di bufala, and basil with EVOO',
        allergens: ['dairy'],
        created_at: new Date().toISOString()
      },
      {
        id: 'menu-003',
        user_id: this.testData.user.id,
        item_name: 'Pasta with Pesto',
        recipe_id: 'recipe-002',
        menu_category: 'pasta',
        current_price: 16.00,
        cost_percentage: 19, // Estimated based on pesto cost
        is_available: true,
        description: 'House-made pesto with fresh basil over linguine',
        allergens: ['gluten', 'dairy', 'nuts'],
        created_at: new Date().toISOString()
      }
    ]

    console.log(`🍽️ Created ${menuItems.length} test menu items`)
    return menuItems
  }

  /**
   * Create sample stock movements
   */
  async createStockMovements(): Promise<any[]> {
    const movements = [
      {
        id: 'movement-001',
        user_id: this.testData.user.id,
        inventory_item_id: 'inv-001',
        movement_type: 'receiving',
        direction: 'in',
        quantity: 50,
        reason: 'Weekly produce delivery',
        movement_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        created_by: this.testData.user.id
      },
      {
        id: 'movement-002',
        user_id: this.testData.user.id,
        inventory_item_id: 'inv-001',
        movement_type: 'consumption',
        direction: 'out',
        quantity: 25,
        reason: 'Used in pizza preparation',
        movement_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        created_by: this.testData.user.id
      },
      {
        id: 'movement-003',
        user_id: this.testData.user.id,
        inventory_item_id: 'inv-004',
        movement_type: 'adjustment',
        direction: 'out',
        quantity: 5,
        reason: 'Stock count correction',
        movement_date: new Date().toISOString(),
        created_by: this.testData.user.id
      }
    ]

    this.testData.stockMovements = movements
    console.log(`📊 Created ${movements.length} test stock movements`)
    return movements
  }

  /**
   * Get all test data
   */
  getTestData(): any {
    return this.testData
  }

  /**
   * Get specific test data by type
   */
  getTestDataByType(type: string): any {
    return this.testData[type] || []
  }

  /**
   * Clean up test database
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test database...')

    try {
      // In a real implementation, this would delete all test data
      // For now, we'll just clear our in-memory test data
      this.testData = {}
      
      console.log('✅ Test database cleaned up successfully')
    } catch (error) {
      console.error('❌ Failed to cleanup test database:', error)
      throw error
    }
  }

  /**
   * Reset test database to initial state
   */
  async reset(): Promise<void> {
    console.log('🔄 Resetting test database...')
    
    await this.cleanup()
    await this.initialize()
    
    console.log('✅ Test database reset complete')
  }

  /**
   * Create snapshot of current test data
   */
  createSnapshot(): any {
    return JSON.parse(JSON.stringify(this.testData))
  }

  /**
   * Restore from snapshot
   */
  restoreSnapshot(snapshot: any): void {
    this.testData = JSON.parse(JSON.stringify(snapshot))
    console.log('📸 Test database restored from snapshot')
  }
}

/**
 * Test database factory
 */
export const createTestDatabase = (config?: TestDatabaseConfig): TestDatabase => {
  const defaultConfig: TestDatabaseConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test-project.supabase.co',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key',
    testSchema: 'test',
    useInMemory: true
  }

  return TestDatabase.getInstance(config || defaultConfig)
}

/**
 * Global test database instance
 */
export const testDb = createTestDatabase()

/**
 * Test database utilities
 */
export const dbTestUtils = {
  async setupTestData() {
    await testDb.initialize()
    return testDb.getTestData()
  },

  async cleanupTestData() {
    await testDb.cleanup()
  },

  async resetTestData() {
    await testDb.reset()
  },

  getTestUser() {
    return testDb.getTestDataByType('user')
  },

  getTestInventoryItems() {
    return testDb.getTestDataByType('inventoryItems')
  },

  getTestRecipes() {
    return testDb.getTestDataByType('recipes')
  },

  getTestVendors() {
    return testDb.getTestDataByType('vendors')
  },

  createTestSnapshot() {
    return testDb.createSnapshot()
  },

  restoreTestSnapshot(snapshot: any) {
    testDb.restoreSnapshot(snapshot)
  }
}