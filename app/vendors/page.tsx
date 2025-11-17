'use client'

import { useState, useEffect, useCallback } from 'react'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { VendorsModuleHeader } from '@/app/components/VendorsModuleHeader'
import { UniversalImport, ImportConfig, ImportField } from '@/app/components/UniversalImport'
import { StatCard, ModuleCard } from '@/app/components/ModuleCard'
import { useAuth } from '@/app/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Store, Users, Search, Plus, Phone, Mail, Calendar, Package, Upload } from 'lucide-react'

interface Vendor {
  id: string
  vendor_name: string
  contact_name?: string
  phone?: string
  email?: string
  vendor_categories?: string
  item_count?: number
  last_delivery_date?: string
  is_active: boolean
}

interface VendorsResponse {
  success: boolean
  vendors: Vendor[]
  categories: string[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  lastUpdated: string
}

export default function VendorsPage() {
  const router = useRouter()
  const { session, loading: authLoading, user } = useAuth()
  const [supabaseSession, setSupabaseSession] = useState<any>(null)
  const [supabaseUser, setSupabaseUser] = useState<any>(null)
  
  // Debug auth state
  console.log('VendorsPage - Auth state:', { session: !!session, user: !!user, loading: authLoading })
  console.log('VendorsPage - Supabase auth:', { supabaseSession: !!supabaseSession, supabaseUser: !!supabaseUser })
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [userClient, setUserClient] = useState<any>(null)

  // Import configuration
  const importConfig: ImportConfig = {
    entityName: 'vendors',
    fields: [
      {
        key: 'vendor_name',
        label: 'Vendor Name',
        required: true,
        type: 'string'
      },
      {
        key: 'contact_name',
        label: 'Contact Name',
        type: 'string'
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'phone',
        validation: (value) => {
          if (value && !/^[\+\d\s\-\(\)]+$/.test(value)) {
            return 'Invalid phone number format'
          }
          return null
        }
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        validation: (value) => {
          if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Invalid email format'
          }
          return null
        }
      },
      {
        key: 'vendor_categories',
        label: 'Categories',
        type: 'string'
      },
      {
        key: 'item_count',
        label: 'Item Count',
        type: 'number'
      },
      {
        key: 'last_delivery_date',
        label: 'Last Delivery Date',
        type: 'date'
      },
      {
        key: 'is_active',
        label: 'Active',
        type: 'boolean'
      }
    ],
    sampleData: [
      {
        vendor_name: 'Sample Food Supplier',
        contact_name: 'John Doe',
        phone: '+64 9 123 4567',
        email: 'john@supplier.com',
        vendor_categories: 'Fresh Produce, Dairy',
        item_count: 25,
        last_delivery_date: '2025-11-15',
        is_active: true
      },
      {
        vendor_name: 'Quality Meats Ltd',
        contact_name: 'Jane Smith',
        phone: '+64 9 234 5678',
        email: 'jane@qualitymeats.co.nz',
        vendor_categories: 'Meat, Poultry',
        item_count: 18,
        last_delivery_date: '2025-11-12',
        is_active: true
      }
    ]
  }

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)

      // Use mock data for demo
      const mockVendors: Vendor[] = [
        {
          id: 'vendor-1',
          vendor_name: 'Premium Food Supplies',
          contact_name: 'John Smith',
          phone: '+64 9 123 4567',
          email: 'orders@premiumfood.co.nz',
          vendor_categories: 'Dry Goods, Dairy, Fresh Produce',
          item_count: 45,
          last_delivery_date: '2025-11-14',
          is_active: true
        },
        {
          id: 'vendor-2',
          vendor_name: 'Fresh Market Direct',
          contact_name: 'Sarah Wilson',
          phone: '+64 9 234 5678',
          email: 'fresh@marketdirect.co.nz',
          vendor_categories: 'Fresh Produce, Herbs, Organic',
          item_count: 32,
          last_delivery_date: '2025-11-13',
          is_active: true
        },
        {
          id: 'vendor-3',
          vendor_name: 'Wholesale Beverages Ltd',
          contact_name: 'Mike Johnson',
          phone: '+64 9 345 6789',
          email: 'mike@wholesalebev.co.nz',
          vendor_categories: 'Beverages, Alcohol',
          item_count: 28,
          last_delivery_date: '2025-11-10',
          is_active: true
        },
        {
          id: 'vendor-4',
          vendor_name: 'Artisan Bread Co',
          contact_name: 'Emma Davis',
          phone: '+64 9 456 7890',
          email: 'orders@artisanbread.co.nz',
          vendor_categories: 'Bakery, Bread, Pastries',
          item_count: 15,
          last_delivery_date: '2025-11-12',
          is_active: true
        },
        {
          id: 'vendor-5',
          vendor_name: 'Ocean Fresh Seafood',
          contact_name: 'Tom Anderson',
          phone: '+64 9 567 8901',
          email: 'tom@oceanfresh.co.nz',
          vendor_categories: 'Seafood, Fresh Fish',
          item_count: 22,
          last_delivery_date: '2025-11-11',
          is_active: false
        }
      ]

      const mockCategories = ['Dry Goods', 'Fresh Produce', 'Dairy', 'Beverages', 'Bakery', 'Seafood', 'Organic', 'Alcohol']

      setVendors(mockVendors)
      setCategories(mockCategories)
      setTotalPages(1)
      setTotalItems(mockVendors.length)
      setLoading(false)

      return

      /* Original API call (commented out for demo)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20'
      })

      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)

      const response = await fetch(`/api/stock/vendors?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch vendors')
      }

      const data: VendorsResponse = await response.json()

      if (data.success) {
        setVendors(data.vendors)
        setCategories(data.categories)
        setTotalPages(data.pagination.totalPages)
        setTotalItems(data.pagination.totalItems)
      }
      */
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setLoading(false)
    }
  }, [])

  // Handle import
  const handleImport = async (importedVendors: any[]): Promise<boolean> => {
    try {
      // In a real app, this would make an API call to save the vendors
      console.log('Importing vendors:', importedVendors)
      
      // Add imported vendors to existing list with generated IDs
      const newVendors = importedVendors.map((vendor, index) => ({
        ...vendor,
        id: `vendor-import-${Date.now()}-${index}`
      }))
      
      setVendors(prev => [...prev, ...newVendors])
      setTotalItems(prev => prev + newVendors.length)
      
      return true
    } catch (error) {
      console.error('Import failed:', error)
      return false
    }
  }

  // Get Supabase session directly
  useEffect(() => {
    const getSupabaseSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('VendorsPage - Direct Supabase session:', session)
        console.log('VendorsPage - Direct Supabase error:', error)
        
        if (session) {
          setSupabaseSession(session)
          setSupabaseUser(session.user)
        }
      } catch (error) {
        console.error('VendorsPage - Error getting Supabase session:', error)
      }
    }
    
    getSupabaseSession()
  }, [])

  // Fetch user client data - use either session.user or user
  useEffect(() => {
    const fetchUserClient = async () => {
      const currentUser = session?.user || user || supabaseUser
      console.log('VendorsPage - Trying to use user:', { 
        sessionUser: !!session?.user, 
        hookUser: !!user, 
        supabaseUser: !!supabaseUser,
        currentUser: !!currentUser 
      })
      
      if (currentUser) {
        try {
          console.log('VendorsPage - Fetching user client for userId:', currentUser.id)
          const response = await fetch(`/api/user-client?userId=${currentUser.id}`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('VendorsPage - Full API response:', data)
            console.log('VendorsPage - userClient data:', data.userClient)
            console.log('VendorsPage - userClient type:', typeof data.userClient)
            console.log('VendorsPage - userClient keys:', data.userClient ? Object.keys(data.userClient) : 'No keys')
            console.log('VendorsPage - Setting userClient state...')
            setUserClient(data.userClient)
            
            // Force re-render check
            setTimeout(() => {
              console.log('VendorsPage - userClient state after update:', data.userClient)
            }, 100)
          } else {
            const errorText = await response.text()
            console.error('VendorsPage - API response not ok:', response.status, response.statusText)
            console.error('VendorsPage - Error response body:', errorText)
          }
        } catch (error) {
          console.error('VendorsPage - Error fetching user client:', error)
        }
      } else {
        console.log('VendorsPage - No user available. Session:', !!session, 'User:', !!user, 'Auth loading:', authLoading)
      }
    }
    
    // Only fetch if we're not loading and we have a user
    if (!authLoading) {
      fetchUserClient()
    }
  }, [session, user, supabaseUser, authLoading])

  // Sign out handler
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  // Debug userClient state changes
  useEffect(() => {
    console.log('VendorsPage - userClient state changed:', userClient)
    console.log('VendorsPage - userClient name:', userClient?.name)
  }, [userClient])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])



  // Apply search and category filters
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm || 
      vendor.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.vendor_categories?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = !selectedType || 
      vendor.vendor_categories?.toLowerCase().includes(selectedType.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && vendor.is_active) ||
      (selectedStatus === 'inactive' && !vendor.is_active)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading || authLoading) {
    return (
      <div className="min-h-screen">
        <VendorsModuleHeader 
          user={user || supabaseUser}
          userClient={userClient}
          onSignOut={handleSignOut}
          className="pt-6 pb-0"
        />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <VendorsModuleHeader 
        user={user || supabaseUser}
        userClient={userClient}
        onSignOut={handleSignOut}
        className="pt-6 pb-0"
      />
      
      <div className="relative z-10 container mx-auto px-4 py-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import Vendors
          </button>
          <button
            onClick={() => console.log('Add vendor clicked')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard accentColor="blue" theme="light">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="green" theme="light">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Active Vendors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vendors.filter(v => v.is_active).length}
                </p>
              </div>
            </div>
          </StatCard>
          
          <StatCard accentColor="purple" theme="light">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </StatCard>
        </div>

        {/* Search and Filters */}
        <ModuleCard className="p-6" theme="light">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search vendors..."
                  className="block w-full pl-10 pr-3 py-3 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </ModuleCard>

        {/* Vendors Grid */}
        {filteredVendors.length === 0 ? (
          <ModuleCard className="p-8" theme="light">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedType || selectedStatus !== 'all' 
                  ? "No vendors match your current filters. Try adjusting your search criteria."
                  : "You haven't added any vendors yet. Start by adding your first supplier."}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowImport(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </button>
                <button
                  onClick={() => console.log('Add vendor clicked')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </button>
              </div>
            </div>
          </ModuleCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <ModuleCard key={vendor.id} className="p-6" theme="light">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {vendor.vendor_name}
                      </h3>
                      {vendor.contact_name && (
                        <p className="text-sm text-gray-500 mt-1">{vendor.contact_name}</p>
                      )}
                    </div>
                    
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      vendor.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {/* Categories */}
                  {vendor.vendor_categories && (
                    <div className="flex flex-wrap gap-2">
                      {vendor.vendor_categories.split(',').slice(0, 3).map((category) => (
                        <span
                          key={category.trim()}
                          className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2">
                    {vendor.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                    
                    {vendor.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>
                        {vendor.item_count || 0} {vendor.item_count === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {vendor.last_delivery_date && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(vendor.last_delivery_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </ModuleCard>
            ))}
          </div>
        )}

      </div>

      {/* Import Modal */}
      <UniversalImport
        config={importConfig}
        onImport={handleImport}
        onClose={() => setShowImport(false)}
        isOpen={showImport}
      />
    </div>
  )
}