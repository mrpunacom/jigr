// Jest Testing Setup for Hospitality Compliance SaaS
// Global test configuration and mocks

// import '@testing-library/jest-dom' // Commented out for now to test basic functionality

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    upsert: jest.fn(() => Promise.resolve({ data: null, error: null })),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
      getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://test-url.com' } })),
      remove: jest.fn(() => Promise.resolve({ data: null, error: null })),
    }))
  },
  auth: {
    getUser: jest.fn(() => Promise.resolve({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    })),
    signOut: jest.fn(() => Promise.resolve({ error: null })),
  }
}

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/test',
  query: {},
  asPath: '/test',
  route: '/test',
  isReady: true,
}

// Global mocks
global.fetch = jest.fn()
global.FormData = jest.fn(() => ({
  append: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
}))

// Mock window.performance for Safari 12 compatibility tests (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'performance', {
    value: {
      memory: {
        usedJSHeapSize: 1024 * 1024 * 50, // 50MB mock
      },
      now: jest.fn(() => Date.now()),
    },
    writable: true,
  })
}

// Mock File and FileReader for upload tests
global.File = class MockFile {
  constructor(parts: any[], name: string, options: any = {}) {
    this.name = name
    this.size = options.size || 1024
    this.type = options.type || 'image/jpeg'
  }
  name: string
  size: number
  type: string
}

global.FileReader = class MockFileReader {
  result: string | null = null
  onload: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  readAsDataURL(file: File) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD'
      if (this.onload) {
        this.onload({ target: { result: this.result } })
      }
    }, 10)
  }
}

// Mock Canvas for image compression tests
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    clearRect: jest.fn(),
  })),
  toBlob: jest.fn((callback) => {
    const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' })
    callback(mockBlob)
  }),
  width: 800,
  height: 600,
  remove: jest.fn(),
}

if (typeof document !== 'undefined') {
  Object.defineProperty(document, 'createElement', {
    value: jest.fn((tagName) => {
      if (tagName === 'canvas') {
        return mockCanvas
      }
      return document.createElement.call(document, tagName)
    }),
    writable: true,
  })
}

// Mock Image for Safari 12 compression
global.Image = class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  src: string = ''
  width: number = 1024
  height: number = 768

  set src(value: string) {
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 10)
  }
}

// Mock URL.createObjectURL and revokeObjectURL for Safari tests
global.URL.createObjectURL = jest.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = jest.fn()

// Console suppression for cleaner test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Suppress expected console errors in tests
  console.error = jest.fn((message) => {
    if (!message.includes('Warning:') && !message.includes('Test error')) {
      originalConsoleError(message)
    }
  })
  
  console.warn = jest.fn((message) => {
    if (!message.includes('Stage') && !message.includes('fallback')) {
      originalConsoleWarn(message)
    }
  })
})

afterEach(() => {
  // Restore console functions
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Test utilities
export const TestUtils = {
  // Mock a successful AI processing response
  mockSuccessfulAIResponse: () => ({
    supplier: { value: 'Test Supplier', confidence: 0.95, extractionMethod: 'entity_recognition' },
    deliveryDate: { value: '2025-08-15T00:00:00.000Z', confidence: 0.88, format: 'DD/MM/YYYY' },
    temperatureData: {
      readings: [{ value: 4, unit: 'C', confidence: 0.92, complianceStatus: 'pass', riskLevel: 'low' }],
      overallCompliance: 'pass'
    },
    analysis: {
      overallConfidence: 0.84,
      estimatedValue: 24.99,
      itemCount: 1,
      processingTime: 2500
    }
  }),

  // Mock a failed AI processing response
  mockFailedAIResponse: () => ({
    supplier: { value: 'Processing Failed', confidence: 0.0, extractionMethod: 'emergency_fallback' },
    temperatureData: { readings: [], overallCompliance: 'unknown' },
    analysis: { overallConfidence: 0.0, estimatedValue: 0, itemCount: 0, processingTime: 1000 }
  }),

  // Create a mock file for testing
  createMockFile: (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
    return new File(['mock file content'], name, { type, size })
  },

  // Wait for async operations in tests
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
}

export { mockSupabase, mockRouter }