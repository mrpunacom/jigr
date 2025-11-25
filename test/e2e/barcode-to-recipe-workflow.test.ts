/**
 * End-to-End Barcode to Recipe Workflow Tests
 * Tests complete workflows from barcode scanning to recipe creation and costing
 */

import { testUtils, testAssertions } from '../utils/api-test-utils'

describe('E2E: Barcode to Recipe Workflow', () => {
  let testFixtures: any

  beforeEach(async () => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
    testUtils.mockExternalApis()
    testFixtures = await testUtils.createTestFixtures()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('Complete Inventory Management Workflow', () => {
    it('should complete full workflow: barcode scan → inventory update → recipe creation → cost calculation', async () => {
      // Step 1: Scan a new barcode
      const newBarcode = testUtils.generateValidBarcode('987654321')
      
      // Mock barcode lookup - new product found
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            code: 'OK',
            items: [{
              title: 'Premium Olive Oil',
              brand: 'Mediterranean Gold',
              category: 'Oils & Vinegars',
              size: '500ml'
            }]
          })
        })
      
      const lookupResponse = await fetch(`http://localhost:3000/api/barcode/lookup?barcode=${newBarcode}`)
      const lookupData = await lookupResponse.json()
      
      expect(lookupData.found).toBe(true)
      expect(lookupData.product.name).toBe('Premium Olive Oil')

      // Step 2: Create inventory item from barcode
      const createItemResponse = await fetch('http://localhost:3000/api/barcode/stock-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: newBarcode,
          operation: 'create_item',
          quantity: 24,
          item_data: {
            item_name: 'Premium Olive Oil',
            category: 'condiments_spices',
            unit_of_measurement: 'bottle',
            cost_per_unit: 12.50,
            par_level_low: 5,
            par_level_high: 50
          },
          location: 'pantry'
        })
      })
      
      const createItemData = await createItemResponse.json()
      expect(createItemData.success).toBe(true)
      expect(createItemData.action).toBe('item_created')
      
      const inventoryItemId = createItemData.item.id

      // Step 3: Create a recipe that uses this ingredient
      const recipeData = {
        name: 'Mediterranean Salad Dressing',
        description: 'Light vinaigrette with olive oil',
        yield_amount: 8,
        prep_time_minutes: 5,
        category: 'dressings',
        ingredients: [
          {
            inventory_item_id: inventoryItemId,
            quantity_needed: 0.25, // 1/4 bottle
            unit: 'bottle',
            is_optional: false
          },
          {
            // Mock second ingredient
            inventory_item_id: 'vinegar-item-id',
            quantity_needed: 2,
            unit: 'tbsp',
            is_optional: false
          }
        ],
        instructions: [
          'Combine olive oil and vinegar',
          'Whisk until emulsified',
          'Season to taste'
        ]
      }

      const recipeResponse = await fetch('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipeData)
      })
      
      const recipeResult = await recipeResponse.json()
      expect(recipeResult.success).toBe(true)
      expect(recipeResult.recipe.name).toBe('Mediterranean Salad Dressing')
      
      // Verify cost calculation
      expect(recipeResult.recipe.total_cost).toBeDefined()
      expect(recipeResult.recipe.cost_per_serving).toBeDefined()
      expect(recipeResult.costBreakdown).toBeDefined()

      // Step 4: Verify stock movement was recorded
      const movementsResponse = await fetch(`http://localhost:3000/api/stock/movements?inventory_item_id=${inventoryItemId}`)
      const movementsData = await movementsResponse.json()
      
      expect(movementsData.movements.length).toBeGreaterThan(0)
      expect(movementsData.movements[0].movement_type).toBe('adjustment')
      expect(movementsData.movements[0].quantity).toBe(24)
      expect(movementsData.movements[0].direction).toBe('in')

      // Step 5: Check stock levels
      const stockLevelsResponse = await fetch('http://localhost:3000/api/stock/levels')
      const stockLevelsData = await stockLevelsResponse.json()
      
      const oliveOilStock = stockLevelsData.stockLevels.find(
        item => item.id === inventoryItemId
      )
      expect(oliveOilStock).toBeDefined()
      expect(oliveOilStock.current_quantity).toBe(24)
      expect(oliveOilStock.stockStatus).toBe('optimal')
    })

    it('should handle workflow with existing inventory item linkage', async () => {
      const existingBarcode = testUtils.generateValidBarcode('123456789')
      const existingItemId = 'existing-tomato-item'

      // Step 1: Link barcode to existing inventory item
      const linkResponse = await fetch('http://localhost:3000/api/barcode/stock-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: existingBarcode,
          operation: 'link_item',
          inventory_item_id: existingItemId
        })
      })
      
      const linkData = await linkResponse.json()
      expect(linkData.success).toBe(true)
      expect(linkData.action).toBe('barcode_linked')

      // Step 2: Update quantity via barcode scan
      const updateResponse = await fetch('http://localhost:3000/api/barcode/stock-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: existingBarcode,
          operation: 'add_quantity',
          quantity: 15,
          reason: 'Fresh delivery received'
        })
      })
      
      const updateData = await updateResponse.json()
      expect(updateData.success).toBe(true)
      expect(updateData.action).toBe('quantity_updated')
      expect(updateData.quantityChange).toBe(15)

      // Step 3: Create recipe using this ingredient
      const tomatoSauceRecipe = {
        name: 'Basic Tomato Sauce',
        yield_amount: 4,
        ingredients: [
          {
            inventory_item_id: existingItemId,
            quantity_needed: 6,
            unit: 'whole',
            is_optional: false
          }
        ],
        instructions: ['Dice tomatoes', 'Simmer for 30 minutes']
      }

      const recipeResponse = await fetch('http://localhost:3000/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tomatoSauceRecipe)
      })
      
      const recipeData = await recipeResponse.json()
      expect(recipeData.success).toBe(true)

      // Step 4: Check recipe availability based on current stock
      const availabilityResponse = await fetch(`http://localhost:3000/api/integration/stock-impact?analysis_type=availability&recipe_id=${recipeData.recipe.id}`)
      const availabilityData = await availabilityResponse.json()
      
      expect(availabilityData.availability).toBeDefined()
      expect(availabilityData.availability.recipes.length).toBe(1)
      
      const recipeAvailability = availabilityData.availability.recipes[0]
      expect(recipeAvailability.status).toBe('available')
      expect(recipeAvailability.maxServings).toBeGreaterThan(0)
    })
  })

  describe('Scanning Session to Recipe Costing Workflow', () => {
    it('should complete inventory count session and update recipe costs', async () => {
      // Step 1: Start inventory counting session
      const sessionResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'start_session',
          location: 'main-kitchen'
        })
      })
      
      const sessionData = await sessionResponse.json()
      expect(sessionData.success).toBe(true)
      expect(sessionData.session.status).toBe('active')
      
      const sessionId = sessionData.session.id

      // Step 2: Scan multiple items in the session
      const itemsToScan = [
        { 
          barcode: testUtils.generateValidBarcode('111111111'),
          quantity: 12,
          productName: 'Fresh Basil'
        },
        { 
          barcode: testUtils.generateValidBarcode('222222222'),
          quantity: 8,
          productName: 'Mozzarella Cheese'
        },
        { 
          barcode: testUtils.generateValidBarcode('333333333'),
          quantity: 20,
          productName: 'Cherry Tomatoes'
        }
      ]

      const scanResults = []
      
      for (const item of itemsToScan) {
        const scanResponse = await fetch('http://localhost:3000/api/barcode/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_type: 'inventory_count',
            operation: 'scan',
            session_id: sessionId,
            barcode: item.barcode,
            quantity: item.quantity,
            notes: `Counted ${item.productName}`
          })
        })
        
        const scanData = await scanResponse.json()
        expect(scanData.success).toBe(true)
        scanResults.push(scanData)
      }

      // Step 3: Complete the session
      const completeResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'complete_session',
          session_id: sessionId
        })
      })
      
      const completeData = await completeResponse.json()
      expect(completeData.success).toBe(true)
      expect(completeData.sessionSummary.totalItems).toBe(3)
      expect(completeData.sessionSummary.totalQuantity).toBe(40)

      // Step 4: Check if recipe costs were updated due to new stock levels
      const recalculateResponse = await fetch('http://localhost:3000/api/stock/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculation_type: 'recipe_costs',
          update_all: true,
          reason: `Inventory count session ${sessionId} completed`
        })
      })
      
      const recalculateData = await recalculateResponse.json()
      expect(recalculateData.success).toBe(true)
      expect(recalculateData.processedRecipes).toBeGreaterThan(0)

      // Step 5: Verify specific recipe cost impact
      const impactResponse = await fetch('http://localhost:3000/api/integration/stock-impact?analysis_type=cost_impact')
      const impactData = await impactResponse.json()
      
      expect(impactData.costImpact).toBeDefined()
      expect(impactData.costImpact.affectedItems).toBeDefined()
    })

    it('should handle receiving workflow with automatic inventory updates', async () => {
      // Step 1: Start receiving session
      const receivingSession = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'receiving',
          operation: 'start_session',
          location: 'receiving-dock'
        })
      })
      
      const sessionData = await receivingSession.json()
      const sessionId = sessionData.session.id

      // Step 2: Scan received items
      const receivedItems = [
        { barcode: testUtils.generateValidBarcode('444444444'), quantity: 50 },
        { barcode: testUtils.generateValidBarcode('555555555'), quantity: 30 },
        { barcode: testUtils.generateValidBarcode('666666666'), quantity: 25 }
      ]

      for (const item of receivedItems) {
        const scanResponse = await fetch('http://localhost:3000/api/barcode/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_type: 'receiving',
            operation: 'scan',
            session_id: sessionId,
            barcode: item.barcode,
            quantity: item.quantity,
            location: 'cold-storage'
          })
        })
        
        const scanData = await scanResponse.json()
        expect(scanData.success).toBe(true)
      }

      // Step 3: Complete receiving session (should auto-update inventory)
      const completeResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'receiving',
          operation: 'complete_session',
          session_id: sessionId
        })
      })
      
      const completeData = await completeResponse.json()
      expect(completeData.success).toBe(true)
      expect(completeData.inventoryUpdates).toBeDefined()
      expect(completeData.inventoryUpdates.length).toBe(3)

      // Step 4: Verify stock movements were recorded
      const movementsResponse = await fetch('http://localhost:3000/api/stock/movements?movement_type=receiving')
      const movementsData = await movementsResponse.json()
      
      const sessionMovements = movementsData.movements.filter(
        movement => movement.reference_id === sessionId
      )
      expect(sessionMovements.length).toBe(3)

      // Step 5: Check that stock levels are updated
      const stockResponse = await fetch('http://localhost:3000/api/stock/levels')
      const stockData = await stockResponse.json()
      
      expect(stockData.summary.totalItems).toBeGreaterThan(0)
    })
  })

  describe('Purchase Order to Stock Update Workflow', () => {
    it('should complete purchase order creation, receiving, and stock update workflow', async () => {
      // Step 1: Create purchase order
      const vendorId = testFixtures.vendors[0].id
      
      const poResponse = await fetch('http://localhost:3000/api/stock/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_id: vendorId,
          order_items: [
            {
              inventory_item_id: testFixtures.inventoryItems[0].id,
              quantity_ordered: 100,
              unit_cost: 5.50,
              notes: 'Weekly restock'
            },
            {
              inventory_item_id: testFixtures.inventoryItems[1].id,
              quantity_ordered: 50,
              unit_cost: 8.75,
              notes: 'Monthly order'
            }
          ],
          expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: 'Standard weekly order'
        })
      })
      
      const poData = await poResponse.json()
      expect(poData.success).toBe(true)
      expect(poData.purchaseOrder.status).toBe('pending')
      
      const purchaseOrderId = poData.purchaseOrder.id

      // Step 2: Mark PO as shipped
      const shipResponse = await fetch(`http://localhost:3000/api/stock/purchase-orders/${purchaseOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          tracking_number: 'TRK123456789',
          shipped_date: new Date().toISOString()
        })
      })
      
      const shipData = await shipResponse.json()
      expect(shipData.success).toBe(true)

      // Step 3: Start receiving process when delivery arrives
      const receivingSession = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'receiving',
          operation: 'start_session',
          location: 'receiving-dock',
          reference_id: purchaseOrderId
        })
      })
      
      const sessionData = await receivingSession.json()
      const sessionId = sessionData.session.id

      // Step 4: Scan received items (assuming they have barcodes)
      const receivedBarcodes = [
        testUtils.generateValidBarcode('777777777'),
        testUtils.generateValidBarcode('888888888')
      ]

      // Link barcodes to inventory items first
      for (let i = 0; i < receivedBarcodes.length; i++) {
        await fetch('http://localhost:3000/api/barcode/stock-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: receivedBarcodes[i],
            operation: 'link_item',
            inventory_item_id: testFixtures.inventoryItems[i].id
          })
        })
      }

      // Now scan the items
      for (let i = 0; i < receivedBarcodes.length; i++) {
        const scanResponse = await fetch('http://localhost:3000/api/barcode/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workflow_type: 'receiving',
            operation: 'scan',
            session_id: sessionId,
            barcode: receivedBarcodes[i],
            quantity: i === 0 ? 100 : 50, // Match PO quantities
            location: 'main-storage'
          })
        })
        
        const scanData = await scanResponse.json()
        expect(scanData.success).toBe(true)
      }

      // Step 5: Complete receiving and update PO status
      const completeResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'receiving',
          operation: 'complete_session',
          session_id: sessionId,
          update_purchase_order: true,
          purchase_order_id: purchaseOrderId
        })
      })
      
      const completeData = await completeResponse.json()
      expect(completeData.success).toBe(true)

      // Step 6: Verify PO is marked as received
      const updatedPOResponse = await fetch(`http://localhost:3000/api/stock/purchase-orders/${purchaseOrderId}`)
      const updatedPOData = await updatedPOResponse.json()
      
      expect(updatedPOData.purchaseOrder.status).toBe('received')
      expect(updatedPOData.purchaseOrder.received_date).toBeDefined()

      // Step 7: Verify inventory levels were updated correctly
      const finalStockResponse = await fetch('http://localhost:3000/api/stock/levels')
      const finalStockData = await finalStockResponse.json()
      
      // Check that the received quantities were added to inventory
      const updatedItems = finalStockData.stockLevels.filter(item =>
        testFixtures.inventoryItems.some(fixture => fixture.id === item.id)
      )
      
      expect(updatedItems.length).toBe(2)
      updatedItems.forEach(item => {
        expect(item.current_quantity).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Scenarios and Recovery', () => {
    it('should handle failed barcode lookup gracefully and allow manual entry', async () => {
      const unknownBarcode = testUtils.generateValidBarcode('999999999')

      // Step 1: Attempt barcode lookup (fails)
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          code: 'NOT_FOUND',
          items: []
        })
      })

      const lookupResponse = await fetch(`http://localhost:3000/api/barcode/lookup?barcode=${unknownBarcode}`)
      const lookupData = await lookupResponse.json()
      
      expect(lookupData.found).toBe(false)

      // Step 2: Get suggestions for manual item creation
      const suggestionsResponse = await fetch(`http://localhost:3000/api/barcode/stock-update?barcode=${unknownBarcode}`)
      const suggestionsData = await suggestionsResponse.json()
      
      expect(suggestionsData.suggestions).toBeDefined()
      expect(suggestionsData.quickActions.some(action => action.type === 'create_item_manual')).toBe(true)

      // Step 3: Create item manually
      const createResponse = await fetch('http://localhost:3000/api/barcode/stock-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode: unknownBarcode,
          operation: 'create_item',
          quantity: 10,
          item_data: {
            item_name: 'Unknown Product',
            category: 'general',
            unit_of_measurement: 'each',
            cost_per_unit: 0.00,
            par_level_low: 1,
            par_level_high: 20
          }
        })
      })
      
      const createData = await createResponse.json()
      expect(createData.success).toBe(true)
      expect(createData.action).toBe('item_created')
    })

    it('should handle session recovery after interruption', async () => {
      // Step 1: Start session
      const sessionResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'start_session'
        })
      })
      
      const sessionData = await sessionResponse.json()
      const sessionId = sessionData.session.id

      // Step 2: Scan some items
      await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'scan',
          session_id: sessionId,
          barcode: testUtils.generateValidBarcode('123456789'),
          quantity: 5
        })
      })

      // Step 3: Simulate interruption - get session details to recover
      const recoveryResponse = await fetch(`http://localhost:3000/api/barcode/scan/sessions?session_id=${sessionId}`)
      const recoveryData = await recoveryResponse.json()
      
      expect(recoveryData.sessionId).toBe(sessionId)
      expect(recoveryData.status).toBe('active')
      expect(recoveryData.totalItems).toBe(1)
      expect(recoveryData.items.length).toBe(1)

      // Step 4: Continue session after recovery
      await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'scan',
          session_id: sessionId,
          barcode: testUtils.generateValidBarcode('987654321'),
          quantity: 3
        })
      })

      // Step 5: Complete session successfully
      const completeResponse = await fetch('http://localhost:3000/api/barcode/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflow_type: 'inventory_count',
          operation: 'complete_session',
          session_id: sessionId
        })
      })
      
      const completeData = await completeResponse.json()
      expect(completeData.success).toBe(true)
      expect(completeData.sessionSummary.totalItems).toBe(2)
    })
  })
})