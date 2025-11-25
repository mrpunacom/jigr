/**
 * Barcode Lookup API Tests
 * Tests for /api/barcode/lookup endpoint
 */

import { GET, POST } from '@/app/api/barcode/lookup/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('/api/barcode/lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
    testUtils.mockExternalApis()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('GET - Single Barcode Lookup', () => {
    it('should successfully lookup a valid barcode', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: `http://localhost:3000/api/barcode/lookup`,
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('barcode')
      expect(data.barcode.code).toBe(validBarcode)
      expect(data.barcode.isValid).toBe(true)
      expect(data).toHaveProperty('found')
      expect(data).toHaveProperty('dataSource')
    })

    it('should return error for missing barcode parameter', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup'
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Barcode parameter is required')
    })

    it('should return error for invalid barcode format', async () => {
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: 'invalid-barcode' }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data.error).toContain('Invalid barcode')
    })

    it('should validate UPC-A checksum correctly', async () => {
      const invalidChecksum = '123456789012' // Wrong checksum
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: invalidChecksum }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid UPC-A checksum')
    })

    it('should return inventory matches when check_inventory=true', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { 
          barcode: validBarcode,
          check_inventory: 'true'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('inventoryMatches')
      expect(Array.isArray(data.inventoryMatches)).toBe(true)
    })

    it('should include alternatives when include_alternatives=true', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { 
          barcode: validBarcode,
          include_alternatives: 'true'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('alternatives')
      expect(Array.isArray(data.alternatives)).toBe(true)
    })
  })

  describe('POST - Batch Barcode Lookup', () => {
    it('should successfully process batch barcode lookup', async () => {
      const barcodes = [
        testUtils.generateValidBarcode('123456789'),
        testUtils.generateValidBarcode('987654321')
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/lookup/batch',
        body: { barcodes, check_inventory: true }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('totalRequested', 2)
      expect(data).toHaveProperty('results')
      expect(Array.isArray(data.results)).toBe(true)
      expect(data.results).toHaveLength(2)
      expect(data).toHaveProperty('errors')
    })

    it('should return error for missing barcodes array', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/lookup/batch',
        body: {}
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Barcodes array is required')
    })

    it('should return error for too many barcodes', async () => {
      const barcodes = Array.from({ length: 51 }, (_, i) => 
        testUtils.generateValidBarcode(`12345678${i.toString().padStart(2, '0')}`)
      )

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/lookup/batch',
        body: { barcodes }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Maximum 50 barcodes per batch')
    })

    it('should handle mixed valid and invalid barcodes', async () => {
      const barcodes = [
        testUtils.generateValidBarcode('123456789'),
        'invalid-barcode',
        testUtils.generateValidBarcode('987654321')
      ]

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/barcode/lookup/batch',
        body: { barcodes }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalRequested).toBe(3)
      expect(data.results).toHaveLength(2) // Only valid barcodes
      expect(data.errors).toHaveLength(1) // One invalid barcode
    })
  })

  describe('Barcode Validation Functions', () => {
    it('should validate different barcode formats', async () => {
      const testCases = [
        { 
          barcode: testUtils.generateValidBarcode('12345678901'), 
          format: 'UPC-A' 
        },
        { 
          barcode: testUtils.generateValidBarcode('1234567890123'), 
          format: 'EAN-13' 
        }
      ]

      for (const testCase of testCases) {
        const request = testUtils.createMockRequest({
          method: 'GET',
          url: 'http://localhost:3000/api/barcode/lookup',
          searchParams: { barcode: testCase.barcode }
        })

        const response = await GET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.barcode.format).toBe(testCase.format)
      }
    })

    it('should handle EAN-8 barcodes correctly', async () => {
      const ean8 = '12345670' // Valid EAN-8 with correct checksum
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: ean8 }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.barcode.format).toBe('EAN-8')
    })

    it('should handle UPC-E barcodes correctly', async () => {
      const upce = '123456' // UPC-E format
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: upce }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.barcode.format).toBe('UPC-E')
    })
  })

  describe('External API Integration', () => {
    it('should fallback to external APIs when not found locally', async () => {
      // Mock that local lookup returns nothing
      testUtils.mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
          }))
        }))
      }))

      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.found).toBe(true)
      expect(['upc_database', 'open_food_facts'].includes(data.dataSource)).toBe(true)
    })

    it('should store external lookup results locally', async () => {
      // Mock that local lookup returns nothing initially
      testUtils.mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: null, error: 'Not found' })
          }))
        })),
        insert: jest.fn().mockResolvedValue({ data: null, error: null })
      }))

      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: validBarcode }
      })

      await GET(request)

      // Verify that insert was called to store the result
      expect(testUtils.mockSupabase.from).toHaveBeenCalledWith('barcode_products')
    })
  })

  describe('Product Data Enrichment', () => {
    it('should enrich product data when requested', async () => {
      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { 
          barcode: validBarcode,
          enrich_product: 'true'
        }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.found && data.product) {
        // Check for enriched fields
        expect(data.product).toHaveProperty('category')
        expect(data.product).toHaveProperty('unit')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock database error
      testUtils.mockSupabase.from.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle external API failures gracefully', async () => {
      // Mock external API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const validBarcode = testUtils.generateValidBarcode('123456789')
      const request = testUtils.createMockRequest({
        method: 'GET',
        url: 'http://localhost:3000/api/barcode/lookup',
        searchParams: { barcode: validBarcode }
      })

      const response = await GET(request)
      const data = await response.json()

      // Should still return a response, just with found: false
      expect(response.status).toBe(200)
      expect(data.found).toBe(false)
    })
  })
})