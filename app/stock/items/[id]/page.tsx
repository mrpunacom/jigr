'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard, StatCard, ActionCard } from '@/app/components/ModuleCard'
import { DataTable } from '@/app/components/DataTable'
import { StockLevelIndicator } from '@/app/components/StockLevelIndicator'
import { InventoryItem, InventoryBatch, InventoryCount, VendorItem } from '@/types/InventoryTypes'

export default function StockItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const itemId = params.id as string

  const [item, setItem] = useState<InventoryItem | null>(null)
  const [batches, setBatches] = useState<InventoryBatch[]>([])
  const [vendors, setVendors] = useState<VendorItem[]>([])
  const [countHistory, setCountHistory] = useState<InventoryCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    if (itemId) {
      loadItemDetails()
    }
  }, [itemId])

  const loadItemDetails = async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.push('/login')
        return
      }

      const userId = session.user.id

      // Load item details
      const { data: itemData, error: itemError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          inventory_categories!left(name),
          inventory_count!left(
            quantity_on_hand,
            count_date,
            counted_by
          )
        `)
        .eq('id', itemId)
        .eq('client_id', userId)
        .single()

      if (itemError) throw itemError

      if (!itemData) {
        setError('Item not found')
        return
      }

      // Process item with latest count
      const processedItem: InventoryItem = {
        ...itemData,
        category_name: itemData.inventory_categories?.name,
        quantity_on_hand: itemData.inventory_count?.[0]?.quantity_on_hand || 0,
        count_date: itemData.inventory_count?.[0]?.count_date,
        counted_by: itemData.inventory_count?.[0]?.counted_by
      }

      setItem(processedItem)

      // Load active batches
      const { data: batchData, error: batchError } = await supabase
        .from('inventory_batches')
        .select(`
          *,
          vendor_companies!left(name)
        `)
        .eq('item_id', itemId)
        .eq('client_id', userId)
        .eq('status', 'active')
        .order('expiration_date', { ascending: true, nullsFirst: false })

      if (batchError) throw batchError

      setBatches(batchData?.map(batch => ({
        ...batch,
        vendor_name: batch.vendor_companies?.name
      })) || [])

      // Load vendor relationships
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_items')
        .select(`
          *,
          vendor_companies!inner(name, email, phone)
        `)
        .eq('item_id', itemId)
        .eq('client_id', userId)
        .order('is_preferred', { ascending: false })

      if (vendorError) throw vendorError

      setVendors(vendorData?.map(vendor => ({
        ...vendor,
        vendor_name: vendor.vendor_companies?.name
      })) || [])

      // Load count history
      const { data: historyData, error: historyError } = await supabase
        .from('inventory_count')
        .select('*')
        .eq('item_id', itemId)
        .eq('client_id', userId)
        .order('count_date', { ascending: false })
        .limit(10)

      if (historyError) throw historyError

      setCountHistory(historyData || [])

      setError(null)
    } catch (error) {
      console.error('Error loading item details:', error)
      setError('Failed to load item details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCountItem = () => {
    if (item) {
      router.push(`/count/new?item_id=${item.id}&item_name=${encodeURIComponent(item.item_name)}`)
    }
  }

  const getExpirationStatus = (expirationDate: string) => {
    const today = new Date()
    const expiry = new Date(expirationDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry <= 1) {
      return { color: 'text-red-600 bg-red-50', label: 'Critical', days: daysUntilExpiry }
    } else if (daysUntilExpiry <= 3) {
      return { color: 'text-amber-600 bg-amber-50', label: 'Warning', days: daysUntilExpiry }
    } else {
      return { color: 'text-green-600 bg-green-50', label: 'Good', days: daysUntilExpiry }
    }
  }

  // Table columns for batches
  const batchColumns = [
    {
      key: 'batch_number' as keyof InventoryBatch,
      label: 'Batch #',
      sortable: true
    },
    {
      key: 'quantity' as keyof InventoryBatch,
      label: 'Quantity',
      render: (value: number, batch: InventoryBatch) => `${value} ${batch.unit}`
    },
    {
      key: 'expiration_date' as keyof InventoryBatch,
      label: 'Expiration',
      render: (value: string) => {
        if (!value) return 'No expiry'
        const status = getExpirationStatus(value)
        return (
          <div className="flex items-center space-x-2">
            <span>{new Date(value).toLocaleDateString()}</span>
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.days > 0 ? `${status.days}d` : 'Expired'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'vendor_name' as keyof InventoryBatch,
      label: 'Vendor',
      render: (value: string) => value || '-'
    }
  ]

  // Table columns for vendors
  const vendorColumns = [
    {
      key: 'vendor_name' as keyof VendorItem,
      label: 'Vendor',
      render: (value: string, vendor: VendorItem) => (
        <div className="flex items-center space-x-2">
          <span>{value}</span>
          {vendor.is_preferred && (
            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Preferred
            </span>
          )}
        </div>
      )
    },
    {
      key: 'cost_per_unit' as keyof VendorItem,
      label: 'Cost per Unit',
      render: (value: number, vendor: VendorItem) => `$${value.toFixed(2)}/${vendor.unit}`
    },
    {
      key: 'minimum_order' as keyof VendorItem,
      label: 'Min Order',
      render: (value: number, vendor: VendorItem) => value ? `${value} ${vendor.unit}` : '-'
    },
    {
      key: 'lead_time_days' as keyof VendorItem,
      label: 'Lead Time',
      render: (value: number) => value ? `${value} days` : '-'
    }
  ]

  // Table columns for count history
  const historyColumns = [
    {
      key: 'count_date' as keyof InventoryCount,
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'quantity_on_hand' as keyof InventoryCount,
      label: 'Count',
      render: (value: number, count: InventoryCount) => `${value} ${count.count_unit}`
    },
    {
      key: 'location_name' as keyof InventoryCount,
      label: 'Location',
      render: (value: string) => value || '-'
    },
    {
      key: 'notes' as keyof InventoryCount,
      label: 'Notes',
      render: (value: string) => value || '-'
    }
  ]

  if (loading) {
    return (
      <StandardPageWrapper moduleName="STOCK" currentPage="item-detail">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </StandardPageWrapper>
    )
  }

  if (error || !item) {
    return (
      <StandardPageWrapper moduleName="STOCK" currentPage="item-detail">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error || 'Item not found'}
        </div>
      </StandardPageWrapper>
    )
  }

  return (
    <StandardPageWrapper moduleName="STOCK" currentPage="item-detail">
        <div className="space-y-6">
          {/* Header with back button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <span className="icon-[tabler--arrow-left] h-5 w-5"></span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">{item.item_name}</h1>
              {item.brand && (
                <p className="text-sm text-gray-300">{item.brand}</p>
              )}
            </div>
          </div>

          {/* Item Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <StatCard theme="light" className="lg:col-span-2">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Item Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">Category:</span>
                        <p className="text-white font-medium">{item.category_name || 'Uncategorized'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Unit:</span>
                        <p className="text-white font-medium">{item.count_unit}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Par Level (Low):</span>
                        <p className="text-white font-medium">{item.par_level_low || '-'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Par Level (High):</span>
                        <p className="text-white font-medium">{item.par_level_high || '-'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Storage Location:</span>
                        <p className="text-white font-medium">{item.storage_location || '-'}</p>
                      </div>
                      <div>
                        <span className="text-white/70">Item Code:</span>
                        <p className="text-white font-medium">{item.item_code || '-'}</p>
                      </div>
                    </div>
                    {item.description && (
                      <div className="mt-4">
                        <span className="text-white/70">Description:</span>
                        <p className="text-white font-medium">{item.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </StatCard>

            {/* Current Stock */}
            <div className="space-y-4">
              <StatCard theme="light">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-4">Current Stock</h3>
                  <div className="space-y-4">
                    <StockLevelIndicator
                      current={item.quantity_on_hand || 0}
                      parLow={item.par_level_low || null}
                      parHigh={item.par_level_high || null}
                      unit={item.count_unit}
                    />
                    {item.count_date && (
                      <div className="text-sm text-white/70">
                        <div className="flex items-center justify-center space-x-2">
                          <span className="icon-[tabler--clock] h-4 w-4"></span>
                          <span>Last counted: {new Date(item.count_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </StatCard>

              <ActionCard
                theme="light"
                onClick={handleCountItem}
                className="text-center"
              >
                <div className="flex items-center justify-center space-x-2 text-white">
                  <span className="icon-[tabler--clipboard] h-5 w-5"></span>
                  <span className="font-medium">Count This Item</span>
                </div>
              </ActionCard>
            </div>
          </div>

          {/* Active Batches */}
          <ModuleCard theme="light" className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="icon-[tabler--package] h-5 w-5 text-white"></span>
              <h3 className="text-lg font-semibold text-white">Active Batches</h3>
            </div>
            <DataTable
              columns={batchColumns}
              data={batches}
              emptyMessage="No active batches found for this item"
            />
          </ModuleCard>

          {/* Vendor Information */}
          <ModuleCard theme="light" className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="icon-[tabler--users] h-5 w-5 text-white"></span>
              <h3 className="text-lg font-semibold text-white">Vendors</h3>
            </div>
            <DataTable
              columns={vendorColumns}
              data={vendors}
              emptyMessage="No vendor information available for this item"
            />
          </ModuleCard>

          {/* Count History */}
          <ModuleCard theme="light" className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <span className="icon-[tabler--history] h-5 w-5 text-white"></span>
              <h3 className="text-lg font-semibold text-white">Count History</h3>
              <span className="text-sm text-white/70">(Last 10 counts)</span>
            </div>
            <DataTable
              columns={historyColumns}
              data={countHistory}
              emptyMessage="No count history available for this item"
            />
          </ModuleCard>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <ActionCard
              theme="light"
              onClick={() => {/* Edit functionality */}}
              className="sm:flex-1"
            >
              <div className="flex items-center justify-center space-x-2 text-white">
                <span className="icon-[tabler--edit] h-5 w-5"></span>
                <span className="font-medium">Edit Item</span>
              </div>
            </ActionCard>

            <ActionCard
              theme="light"
              onClick={() => {/* More options */}}
              className="sm:flex-1"
            >
              <div className="flex items-center justify-center space-x-2 text-white">
                <span className="icon-[tabler--dots] h-5 w-5"></span>
                <span className="font-medium">More Options</span>
              </div>
            </ActionCard>
          </div>
        </div>
    </StandardPageWrapper>
  )
}