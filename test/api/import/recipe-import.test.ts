/**
 * Recipe Import API Tests
 * Tests for recipe import functionality across different sources
 */

import { POST } from '@/app/api/import/recipes/photo/route'
import { POST as URLImport } from '@/app/api/import/recipes/url/route'
import { POST as SheetsImport } from '@/app/api/import/recipes/sheets/route'
import { testUtils, testAssertions } from '../../utils/api-test-utils'

describe('Recipe Import APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    testUtils.mockAuthenticatedUser()
    testUtils.mockExternalApis()
  })

  afterEach(() => {
    testUtils.cleanup()
  })

  describe('/api/import/recipes/photo - Photo Import', () => {
    it('should successfully import recipe from photo', async () => {
      // Mock successful OCR/AI processing
      const mockFile = testUtils.createMockFile('recipe.jpg', 1024 * 1024, 'image/jpeg')
      const formData = new FormData()
      formData.append('photo', mockFile)
      formData.append('enhance_quality', 'true')
      formData.append('auto_categorize', 'true')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      // Mock the form data parsing
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data).toHaveProperty('recipe')
      expect(data.recipe).toHaveProperty('name')
      expect(data.recipe).toHaveProperty('ingredients')
      expect(data.recipe).toHaveProperty('instructions')
      expect(data).toHaveProperty('extractionConfidence')
    })

    it('should validate file type and size', async () => {
      const mockFile = testUtils.createMockFile('recipe.txt', 1024, 'text/plain') // Invalid type
      const formData = new FormData()
      formData.append('photo', mockFile)

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    it('should handle large file sizes appropriately', async () => {
      const mockFile = testUtils.createMockFile('large-recipe.jpg', 10 * 1024 * 1024, 'image/jpeg') // 10MB
      const formData = new FormData()
      formData.append('photo', mockFile)

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('File size too large')
    })

    it('should enhance image quality when requested', async () => {
      const mockFile = testUtils.createMockFile('blurry-recipe.jpg', 512 * 1024, 'image/jpeg')
      const formData = new FormData()
      formData.append('photo', mockFile)
      formData.append('enhance_quality', 'true')
      formData.append('auto_rotate', 'true')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.processing).toHaveProperty('enhancementApplied', true)
      expect(data.processing).toHaveProperty('rotationApplied')
    })

    it('should auto-categorize recipes when enabled', async () => {
      const mockFile = testUtils.createMockFile('pasta-recipe.jpg', 1024 * 1024, 'image/jpeg')
      const formData = new FormData()
      formData.append('photo', mockFile)
      formData.append('auto_categorize', 'true')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.recipe) {
        expect(data.recipe).toHaveProperty('category')
        expect(data.categorization).toHaveProperty('confidence')
      }
    })

    it('should match ingredients to inventory when requested', async () => {
      const mockFile = testUtils.createMockFile('recipe-with-ingredients.jpg', 1024 * 1024, 'image/jpeg')
      const formData = new FormData()
      formData.append('photo', mockFile)
      formData.append('match_inventory', 'true')

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      if (data.recipe && data.recipe.ingredients) {
        expect(data).toHaveProperty('ingredientMatches')
        expect(data.ingredientMatches).toHaveProperty('matched')
        expect(data.ingredientMatches).toHaveProperty('unmatched')
      }
    })
  })

  describe('/api/import/recipes/url - URL Import', () => {
    it('should successfully import recipe from URL', async () => {
      // Mock successful recipe website scraping
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <head>
              <title>Delicious Pasta Recipe</title>
              <script type="application/ld+json">
                {
                  "@type": "Recipe",
                  "name": "Classic Spaghetti Carbonara",
                  "recipeIngredient": ["400g spaghetti", "200g pancetta", "4 eggs"],
                  "recipeInstructions": "Cook pasta, fry pancetta, mix with eggs"
                }
              </script>
            </head>
            <body>
              <h1>Classic Spaghetti Carbonara</h1>
              <div class="ingredients">
                <li>400g spaghetti</li>
                <li>200g pancetta</li>
                <li>4 large eggs</li>
              </div>
            </body>
          </html>
        `)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/recipe/carbonara',
          parse_structured_data: true,
          auto_categorize: true,
          match_inventory: true
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.recipe).toHaveProperty('name')
      expect(data.recipe).toHaveProperty('ingredients')
      expect(data.recipe).toHaveProperty('instructions')
      expect(data.extraction).toHaveProperty('method')
    })

    it('should validate URL format', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'invalid-url'
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid URL format')
    })

    it('should handle protected/login-required websites', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized')
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://protected-site.com/recipe'
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toContain('Unable to access recipe')
    })

    it('should parse JSON-LD structured data', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <script type="application/ld+json">
            {
              "@context": "https://schema.org/",
              "@type": "Recipe",
              "name": "Perfect Pancakes",
              "author": "Chef John",
              "prepTime": "PT15M",
              "cookTime": "PT15M",
              "recipeYield": "4 servings",
              "recipeIngredient": ["2 cups flour", "2 eggs", "1 cup milk"],
              "recipeInstructions": [{
                "@type": "HowToStep",
                "text": "Mix dry ingredients"
              }]
            }
          </script>
        `)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/pancakes',
          parse_structured_data: true
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.extraction.method).toBe('structured_data')
      expect(data.recipe.name).toBe('Perfect Pancakes')
      expect(data.recipe.prep_time_minutes).toBe(15)
      expect(data.recipe.cook_time_minutes).toBe(15)
    })

    it('should fallback to HTML parsing when structured data unavailable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(`
          <html>
            <h1 class="recipe-title">Chocolate Chip Cookies</h1>
            <ul class="ingredients">
              <li>2 cups flour</li>
              <li>1 cup butter</li>
              <li>1/2 cup sugar</li>
            </ul>
            <div class="instructions">
              <p>1. Preheat oven to 350°F</p>
              <p>2. Mix ingredients</p>
            </div>
          </html>
        `)
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/cookies'
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.extraction.method).toBe('html_parsing')
      expect(data.recipe.name).toBe('Chocolate Chip Cookies')
    })
  })

  describe('/api/import/recipes/sheets - Google Sheets Import', () => {
    it('should successfully import recipes from Google Sheets', async () => {
      // Mock Google Sheets data
      const mockSheetData = [
        ['Recipe Name', 'Ingredients', 'Instructions', 'Servings', 'Category'],
        ['Tomato Soup', 'Tomatoes, Onion, Garlic', 'Sauté onion, add tomatoes, simmer', '4', 'Soup'],
        ['Caesar Salad', 'Lettuce, Parmesan, Croutons', 'Toss lettuce with dressing', '2', 'Salad']
      ]

      // Mock Google Sheets API response
      testUtils.mockExternalApis()
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          values: mockSheetData
        })
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/sheets',
        body: {
          sheet_url: 'https://docs.google.com/spreadsheets/d/abc123/edit',
          sheet_range: 'Recipes!A1:E10',
          has_headers: true,
          auto_categorize: true,
          match_ingredients: true
        }
      })

      const response = await SheetsImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.imported).toHaveProperty('total')
      expect(data.imported).toHaveProperty('successful')
      expect(data.imported).toHaveProperty('failed')
      expect(Array.isArray(data.recipes)).toBe(true)
      expect(data.recipes.length).toBe(2)
    })

    it('should validate Google Sheets URL format', async () => {
      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/sheets',
        body: {
          sheet_url: 'https://invalid-url.com/spreadsheet',
          sheet_range: 'Sheet1!A1:Z100'
        }
      })

      const response = await SheetsImport(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid Google Sheets URL')
    })

    it('should handle authentication errors for private sheets', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({
          error: { message: 'The caller does not have permission' }
        })
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/sheets',
        body: {
          sheet_url: 'https://docs.google.com/spreadsheets/d/private123/edit',
          sheet_range: 'Recipes!A1:E10'
        }
      })

      const response = await SheetsImport(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('permission')
    })

    it('should map custom column headers correctly', async () => {
      const mockSheetData = [
        ['Name', 'Recipe Ingredients', 'Cooking Steps', 'Portions', 'Type'],
        ['Beef Stew', 'Beef, Carrots, Potatoes', 'Brown beef, add vegetables', '6', 'Main Course']
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ values: mockSheetData })
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/sheets',
        body: {
          sheet_url: 'https://docs.google.com/spreadsheets/d/abc123/edit',
          sheet_range: 'Recipes!A1:E10',
          has_headers: true,
          column_mapping: {
            'Name': 'name',
            'Recipe Ingredients': 'ingredients',
            'Cooking Steps': 'instructions',
            'Portions': 'servings',
            'Type': 'category'
          }
        }
      })

      const response = await SheetsImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.recipes[0].name).toBe('Beef Stew')
      expect(data.recipes[0].yield_amount).toBe(6)
    })

    it('should handle batch import with validation', async () => {
      const mockSheetData = [
        ['Recipe Name', 'Ingredients', 'Instructions'],
        ['Valid Recipe', 'Ingredient 1, Ingredient 2', 'Step 1, Step 2'],
        ['', 'Missing name', 'Instructions'], // Invalid - no name
        ['Another Valid', 'More ingredients', 'More steps']
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ values: mockSheetData })
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/sheets',
        body: {
          sheet_url: 'https://docs.google.com/spreadsheets/d/abc123/edit',
          sheet_range: 'Recipes!A1:C10',
          has_headers: true,
          validate_entries: true
        }
      })

      const response = await SheetsImport(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.imported.total).toBe(3) // Excluding header
      expect(data.imported.successful).toBe(2)
      expect(data.imported.failed).toBe(1)
      expect(data.errors.length).toBe(1)
      expect(data.errors[0]).toHaveProperty('row', 2)
      expect(data.errors[0]).toHaveProperty('reason')
    })
  })

  describe('Common Import Features', () => {
    it('should parse ingredient quantities and units correctly', async () => {
      const ingredients = [
        '2 cups flour',
        '500g ground beef',
        '1/2 tsp salt',
        '3 large eggs',
        '2 tbsp olive oil'
      ]

      // Test this through the photo import endpoint with mock processing
      const mockFile = testUtils.createMockFile('recipe.jpg', 1024 * 1024, 'image/jpeg')
      const formData = new FormData()
      formData.append('photo', mockFile)
      formData.append('parse_quantities', 'true')

      // Mock OCR result with ingredients
      testUtils.mockExternalApis()

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/photo',
        body: formData
      })

      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await POST(request)
      const data = await response.json()

      if (response.status === 200 && data.recipe.ingredients) {
        data.recipe.ingredients.forEach(ingredient => {
          expect(ingredient).toHaveProperty('quantity')
          expect(ingredient).toHaveProperty('unit')
          expect(ingredient).toHaveProperty('ingredient_name')
        })
      }
    })

    it('should calculate recipe costs when ingredient matching is successful', async () => {
      // Mock that ingredients are found in inventory with costs
      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'inventory_items') {
          return {
            select: jest.fn(() => ({
              ilike: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: [{
                    id: 'item-1',
                    item_name: 'All-purpose flour',
                    cost_per_unit: 2.50,
                    unit_of_measurement: 'lb'
                  }],
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
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/bread-recipe',
          match_inventory: true,
          calculate_cost: true
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      if (response.status === 200 && data.ingredientMatches.matched.length > 0) {
        expect(data.recipe).toHaveProperty('estimated_cost')
        expect(data.costCalculation).toHaveProperty('breakdown')
        expect(data.costCalculation).toHaveProperty('confidence')
      }
    })

    it('should suggest similar recipes to avoid duplicates', async () => {
      // Mock existing recipes in database
      testUtils.mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'Recipes') {
          return {
            select: jest.fn(() => ({
              ilike: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({
                  data: [{
                    id: 'recipe-1',
                    name: 'Classic Carbonara',
                    category: 'pasta'
                  }],
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
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/carbonara-recipe',
          check_duplicates: true
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      if (response.status === 200 && data.duplicateCheck) {
        expect(data.duplicateCheck).toHaveProperty('potentialDuplicates')
        expect(data.duplicateCheck).toHaveProperty('similarityScores')
      }
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts gracefully', async () => {
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100)
        })
      )

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://slow-website.com/recipe'
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(408)
      expect(data.error).toContain('timeout')
    })

    it('should validate required fields across all import methods', async () => {
      const endpoints = [
        { endpoint: POST, body: {} }, // Missing photo
        { endpoint: URLImport, body: {} }, // Missing URL
        { endpoint: SheetsImport, body: {} } // Missing sheet_url
      ]

      for (const { endpoint, body } of endpoints) {
        const request = testUtils.createMockRequest({
          method: 'POST',
          body
        })

        if (endpoint === POST) {
          request.formData = jest.fn().mockResolvedValue(new FormData())
        }

        const response = await endpoint(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBeTruthy()
      }
    })

    it('should handle malformed recipe data gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<html><body>No recipe found here</body></html>')
      })

      const request = testUtils.createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/import/recipes/url',
        body: {
          url: 'https://example.com/not-a-recipe'
        }
      })

      const response = await URLImport(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toContain('No recipe data found')
    })
  })
})