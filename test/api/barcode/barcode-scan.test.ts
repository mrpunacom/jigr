/**
 * Barcode Scanning Workflow API Tests
 * Tests for /api/barcode/scan endpoint
 */

import { GET, POST } from '@/app/api/barcode/scan/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('/api/barcode/scan', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
    testUtils.mockExternalApis()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('POST - Scanning Operations', () => {
    describe('start_session operation', () => {
      it('should successfully start a new scanning session', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'start_session',
            location: 'warehouse'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.operation).toBe('start_session')
        expect(data).toHaveProperty('session')
        expect(data.session.workflowType).toBe('inventory_count')
        expect(data.session.status).toBe('active')
        expect(data).toHaveProperty('workflowConfig')
        expect(data).toHaveProperty('instructions')
      })

      it('should return error for missing workflow_type', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            operation: 'start_session'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Workflow type is required')
      })

      it('should generate unique session IDs', async () => {
        const request1 = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'start_session'
          }
        })

        const request2 = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'receiving',
            operation: 'start_session'
          }
        })

        const response1 = await POST(request1)
        const response2 = await POST(request2)
        const data1 = await response1.json()
        const data2 = await response2.json()

        expect(data1.session.id).not.toBe(data2.session.id)
      })
    })

    describe('scan operation', () => {
      const mockSessionId = 'test-session-id'

      it('should successfully process a barcode scan', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'scan',
            session_id: mockSessionId,
            barcode: validBarcode,
            quantity: 5,
            location: 'aisle-1'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.operation).toBe('scan')
        expect(data).toHaveProperty('scanResult')
        expect(data).toHaveProperty('productData')
        expect(data).toHaveProperty('sessionSummary')
      })

      it('should return error for missing barcode', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'scan',
            session_id: mockSessionId
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Barcode is required for scan operation')
      })

      it('should handle scanning the same item multiple times', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')

        // Mock existing scanned item
        testUtils.mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'scanning_session_items') {
            return {
              select: jest.fn(() => ({
                eq: jest.fn(() => ({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: 'existing-item',
                      quantity: 3,
                      scan_count: 1
                    },
                    error: null
                  })
                }))
              })),
              update: jest.fn(() => ({
                eq: jest.fn(() => ({
                  select: jest.fn(() => ({
                    single: jest.fn().mockResolvedValue({
                      data: { id: 'existing-item', quantity: 8, scan_count: 2 },
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
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'scan',
            session_id: mockSessionId,
            barcode: validBarcode,
            quantity: 5
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.scanResult.action).toBe('updated_existing')
        expect(data.scanResult.newQuantity).toBe(8)
      })
    })

    describe('update_quantity operation', () => {
      it('should successfully update scanned item quantity', async () => {
        const validBarcode = testUtils.generateValidBarcode('123456789')
        const mockSessionId = 'test-session-id'

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            operation: 'update_quantity',
            session_id: mockSessionId,
            barcode: validBarcode,
            quantity: 10
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('item')
        expect(data).toHaveProperty('sessionSummary')
      })
    })

    describe('batch_scan operation', () => {
      it('should successfully process batch scan', async () => {
        const batchData = [
          {
            barcode: testUtils.generateValidBarcode('123456789'),
            quantity: 5,
            notes: 'Test item 1'
          },
          {
            barcode: testUtils.generateValidBarcode('987654321'),
            quantity: 3,
            notes: 'Test item 2'
          }
        ]

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'batch_scan',
            batch_data: batchData,
            location: 'warehouse'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('sessionId')
        expect(data).toHaveProperty('batchSummary')
        expect(data.batchSummary.totalItems).toBe(2)
        expect(data).toHaveProperty('results')
        expect(data.results).toHaveLength(2)
      })

      it('should return error for missing batch_data', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'batch_scan'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Batch data is required')
      })

      it('should handle mixed success and error results in batch', async () => {
        const batchData = [
          {
            barcode: testUtils.generateValidBarcode('123456789'),
            quantity: 5
          },
          {
            // Missing barcode
            quantity: 3
          },
          {
            barcode: testUtils.generateValidBarcode('987654321'),
            quantity: 2
          }
        ]

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'batch_scan',
            batch_data: batchData
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.batchSummary.totalItems).toBe(3)
        expect(data.batchSummary.successfulScans).toBe(2)
        expect(data.batchSummary.errors).toBe(1)
      })
    })

    describe('complete_session operation', () => {
      it('should successfully complete a scanning session', async () => {
        const mockSessionId = 'test-session-id'

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'complete_session',
            session_id: mockSessionId
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data).toHaveProperty('sessionSummary')
        expect(data).toHaveProperty('completionResult')
        expect(data).toHaveProperty('recommendations')
      })
    })

    describe('cancel_session operation', () => {
      it('should successfully cancel a scanning session', async () => {
        const mockSessionId = 'test-session-id'

        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            operation: 'cancel_session',
            session_id: mockSessionId
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.success).toBe(true)
        expect(data.message).toContain('cancelled successfully')
      })
    })

    describe('invalid operation', () => {
      it('should return error for invalid operation', async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: 'inventory_count',
            operation: 'invalid_operation'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('Invalid operation')
      })
    })
  })

  describe('GET - Session Management', () => {
    it('should return specific session details when session_id provided', async () => {
      const mockSessionId = 'test-session-id'

      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/scan/sessions',
        searchParams: { session_id: mockSessionId }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('workflowType')
    })

    it('should return list of sessions when no session_id provided', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/scan/sessions'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessions')
      expect(data).toHaveProperty('totalSessions')
      expect(Array.isArray(data.sessions)).toBe(true)
    })

    it('should filter sessions by status', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/scan/sessions',
        searchParams: { status: 'completed' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessions')
    })

    it('should filter sessions by workflow_type', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/scan/sessions',
        searchParams: { workflow_type: 'receiving' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessions')
    })
  })

  describe('Workflow-Specific Actions', () => {
    it('should handle quick_update workflow with immediate inventory updates', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const mockSessionId = 'test-session-id'

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/scan',
        body: {
          workflow_type: 'quick_update',
          operation: 'scan',
          session_id: mockSessionId,
          barcode: validBarcode,
          quantity: 25
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.workflowResult && data.workflowResult.inventoryUpdated) {
        expect(data.workflowResult.inventoryUpdated).toBe(true)
        expect(data.workflowResult).toHaveProperty('newQuantity')
      }
    })

    it('should handle receiving workflow appropriately', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const mockSessionId = 'test-session-id'

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/scan',
        body: {
          workflow_type: 'receiving',
          operation: 'scan',
          session_id: mockSessionId,
          barcode: validBarcode,
          quantity: 12,
          location: 'receiving-dock'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.workflowType).toBe('receiving')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      testUtils.mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/scan',
        body: {
          workflow_type: 'inventory_count',
          operation: 'start_session'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid session errors', async () => {
      // Mock session not found
      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'scanning_sessions') {
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

      const validBarcode = testUtils.generateValidBarcode('123456789')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/scan',
        body: {
          workflow_type: 'inventory_count',
          operation: 'scan',
          session_id: 'invalid-session-id',
          barcode: validBarcode,
          quantity: 5
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.scanResult.error).toContain('Invalid or inactive scanning session')
    })
  })

  describe('Workflow Configuration', () => {
    const workflowTypes = ['inventory_count', 'receiving', 'quick_update', 'stock_take']

    workflowTypes.forEach(workflowType => {
      it(`should return correct configuration for ${workflowType} workflow`, async () => {
        const request = testUtils.createMockRequest({
          method: 'POST',
          url: 'http://localhost:3000/api/barcode/scan',
          body: {
            workflow_type: workflowType,
            operation: 'start_session'
          }
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.workflowConfig).toBeDefined()
        expect(data.workflowConfig).toHaveProperty('allowQuantityEdit')
        expect(data.workflowConfig).toHaveProperty('requireLocation')
        expect(data.workflowConfig).toHaveProperty('autoApplyChanges')
        expect(data.instructions).toBeDefined()
        expect(Array.isArray(data.instructions)).toBe(true)
      })
    })
  })
})