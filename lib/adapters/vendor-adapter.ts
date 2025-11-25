/**
 * Vendor Data Adapter
 * 
 * Transforms vendor data between database/API format and component format
 * Handles data structure mismatches and provides type safety
 */

// API Database format (what comes from Supabase)
export interface VendorApiData {
  id: string
  name: string
  business_name?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  website?: string
  vendor_code?: string
  category?: string           // Single category string
  payment_terms?: string
  minimum_order_amount?: number
  delivery_days?: number
  is_preferred?: boolean
  is_active?: boolean
  rating?: number
  total_orders?: number
  last_order_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Component format (what VendorManagement expects)
export interface VendorComponentData {
  id: string
  name: string
  contact_name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  website?: string
  tax_id?: string
  payment_terms?: string
  credit_limit?: number
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  rating: number
  total_orders: number
  total_spent: number
  average_order_value: number
  on_time_delivery_rate: number
  last_order_date?: string
  created_at: string
  updated_at: string
  categories: string[]        // Array of categories
  lead_time_days?: number
  minimum_order_amount?: number
  discount_rate?: number
}

export interface VendorStatsData {
  totalVendors: number
  activeVendors: number
  totalSpent: number
  averageRating: number
  onTimeDeliveryRate: number
  topPerformers: number
}

/**
 * Transform API vendor data to component format
 */
export function transformVendorApiToComponent(apiData: VendorApiData): VendorComponentData {
  return {
    id: apiData.id,
    name: apiData.name,
    contact_name: apiData.contact_person,
    email: apiData.email,
    phone: apiData.phone,
    address: apiData.address,
    city: '', // Not in API - would need separate address parsing
    state: '',
    zip_code: '',
    country: 'New Zealand', // Default for NZ hospitality
    website: apiData.website,
    tax_id: '', // Not in current API
    payment_terms: apiData.payment_terms || 'Net 30',
    credit_limit: 0, // Not in current API
    status: getVendorStatus(apiData),
    rating: apiData.rating || 0,
    total_orders: apiData.total_orders || 0,
    total_spent: calculateTotalSpent(apiData), // Would need order data
    average_order_value: calculateAverageOrderValue(apiData),
    on_time_delivery_rate: calculateOnTimeDeliveryRate(apiData),
    last_order_date: apiData.last_order_date,
    created_at: apiData.created_at,
    updated_at: apiData.updated_at,
    categories: apiData.category ? [apiData.category] : ['General'],
    lead_time_days: apiData.delivery_days,
    minimum_order_amount: apiData.minimum_order_amount,
    discount_rate: 0 // Not in current API
  }
}

/**
 * Transform component format back to API format
 */
export function transformVendorComponentToApi(componentData: Partial<VendorComponentData>): Partial<VendorApiData> {
  return {
    id: componentData.id,
    name: componentData.name,
    business_name: componentData.name, // Use name as business name if not separate
    contact_person: componentData.contact_name,
    email: componentData.email,
    phone: componentData.phone,
    address: componentData.address,
    website: componentData.website,
    category: componentData.categories?.[0] || 'General', // Take first category
    payment_terms: componentData.payment_terms,
    minimum_order_amount: componentData.minimum_order_amount,
    delivery_days: componentData.lead_time_days,
    is_preferred: false, // Would need additional logic
    is_active: componentData.status === 'active',
    rating: componentData.rating,
    total_orders: componentData.total_orders,
    last_order_date: componentData.last_order_date,
    notes: '',
    updated_at: new Date().toISOString()
  }
}

/**
 * Generate realistic mock vendor stats for development
 */
export function generateMockVendorStats(vendors: VendorComponentData[]): VendorStatsData {
  const activeVendors = vendors.filter(v => v.status === 'active')
  const totalSpent = vendors.reduce((sum, v) => sum + v.total_spent, 0)
  const averageRating = vendors.length > 0 
    ? vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length 
    : 0
  const onTimeDeliveryRate = vendors.length > 0
    ? vendors.reduce((sum, v) => sum + v.on_time_delivery_rate, 0) / vendors.length
    : 0
  const topPerformers = vendors.filter(v => v.on_time_delivery_rate >= 95).length

  return {
    totalVendors: vendors.length,
    activeVendors: activeVendors.length,
    totalSpent: Math.round(totalSpent),
    averageRating: Math.round(averageRating * 10) / 10,
    onTimeDeliveryRate: Math.round(onTimeDeliveryRate * 10) / 10,
    topPerformers
  }
}

/**
 * Create realistic test vendors data
 */
export function createTestVendorsData(): VendorComponentData[] {
  return [
    {
      id: 'vnd-001',
      name: 'Service Foods Auckland',
      contact_name: 'Sarah Chen',
      email: 'orders@servicefoods.co.nz',
      phone: '+64 9 123 4567',
      address: '123 Quay Street, Auckland',
      city: 'Auckland',
      state: 'Auckland',
      zip_code: '1010',
      country: 'New Zealand',
      website: 'https://servicefoods.co.nz',
      payment_terms: 'Net 30',
      credit_limit: 10000,
      status: 'active',
      rating: 4.8,
      total_orders: 42,
      total_spent: 25600,
      average_order_value: 610,
      on_time_delivery_rate: 96.2,
      last_order_date: '2025-11-20',
      created_at: '2024-08-15T00:00:00Z',
      updated_at: '2025-11-20T00:00:00Z',
      categories: ['Food Service', 'Dry Goods'],
      lead_time_days: 2,
      minimum_order_amount: 250,
      discount_rate: 5
    },
    {
      id: 'vnd-002', 
      name: 'Fresh Direct NZ',
      contact_name: 'Marcus Williams',
      email: 'supply@freshdirect.co.nz',
      phone: '+64 9 234 5678',
      address: '456 Market Road, Auckland',
      city: 'Auckland',
      state: 'Auckland', 
      zip_code: '1021',
      country: 'New Zealand',
      website: 'https://freshdirect.co.nz',
      payment_terms: 'Net 14',
      credit_limit: 8000,
      status: 'active',
      rating: 4.6,
      total_orders: 28,
      total_spent: 18900,
      average_order_value: 675,
      on_time_delivery_rate: 89.3,
      last_order_date: '2025-11-18',
      created_at: '2024-09-01T00:00:00Z',
      updated_at: '2025-11-18T00:00:00Z',
      categories: ['Fresh Produce', 'Dairy'],
      lead_time_days: 1,
      minimum_order_amount: 150,
      discount_rate: 3
    },
    {
      id: 'vnd-003',
      name: 'Premium Beverages Ltd',
      contact_name: 'Lisa Park',
      email: 'orders@premiumbev.co.nz',
      phone: '+64 9 345 6789', 
      address: '789 Industrial Ave, Manukau',
      city: 'Manukau',
      state: 'Auckland',
      zip_code: '2104',
      country: 'New Zealand',
      website: 'https://premiumbeverages.co.nz',
      payment_terms: 'Net 30',
      credit_limit: 5000,
      status: 'active',
      rating: 4.9,
      total_orders: 15,
      total_spent: 8300,
      average_order_value: 553,
      on_time_delivery_rate: 100.0,
      last_order_date: '2025-10-15',
      created_at: '2024-10-10T00:00:00Z',
      updated_at: '2025-10-15T00:00:00Z',
      categories: ['Beverages', 'Alcohol'],
      lead_time_days: 3,
      minimum_order_amount: 300,
      discount_rate: 2
    },
    {
      id: 'vnd-004',
      name: 'Kitchen Supplies Co',
      contact_name: 'David Brown',
      email: 'sales@kitchensupplies.co.nz',
      phone: '+64 9 456 7890',
      address: '321 Trade Street, Hamilton',
      city: 'Hamilton',
      state: 'Waikato',
      zip_code: '3204',
      country: 'New Zealand', 
      website: 'https://kitchensupplies.co.nz',
      payment_terms: 'Net 45',
      credit_limit: 15000,
      status: 'pending',
      rating: 4.2,
      total_orders: 8,
      total_spent: 4200,
      average_order_value: 525,
      on_time_delivery_rate: 87.5,
      last_order_date: '2025-11-19',
      created_at: '2024-11-01T00:00:00Z',
      updated_at: '2025-11-19T00:00:00Z',
      categories: ['Equipment', 'Supplies'],
      lead_time_days: 5,
      minimum_order_amount: 500,
      discount_rate: 8
    }
  ]
}

// Helper functions for data transformation
function getVendorStatus(apiData: VendorApiData): 'active' | 'inactive' | 'pending' | 'suspended' {
  if (!apiData.is_active) return 'inactive'
  return 'active' // Could add more logic based on other fields
}

function calculateTotalSpent(apiData: VendorApiData): number {
  // In real implementation, this would sum order amounts
  // For now, use a calculated estimate based on order count
  return (apiData.total_orders || 0) * 550 // Average order estimate
}

function calculateAverageOrderValue(apiData: VendorApiData): number {
  const totalSpent = calculateTotalSpent(apiData)
  const orders = apiData.total_orders || 0
  return orders > 0 ? totalSpent / orders : 0
}

function calculateOnTimeDeliveryRate(apiData: VendorApiData): number {
  // In real implementation, would calculate from delivery data
  // For now, use estimate based on delivery days and rating
  const baseRate = (apiData.rating || 3) * 20 // 3.0 rating = 60% base
  const deliveryPenalty = Math.max(0, (apiData.delivery_days || 3) - 2) * 5 // Penalty for longer delivery
  return Math.min(100, Math.max(70, baseRate - deliveryPenalty))
}

export default {
  transformVendorApiToComponent,
  transformVendorComponentToApi,
  generateMockVendorStats,
  createTestVendorsData
}