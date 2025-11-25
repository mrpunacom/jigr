'use client'

import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function VendorsListPage() {
  // Mock vendor data for demonstration
  const vendors = [
    {
      id: 1,
      name: 'Service Foods Auckland',
      category: 'Food Service',
      contact: 'suppliers@servicefoods.co.nz',
      phone: '+64 9 123 4567',
      status: 'active',
      lastOrder: '2025-11-20',
      totalOrders: 42
    },
    {
      id: 2,
      name: 'Fresh Direct NZ',
      category: 'Fresh Produce',
      contact: 'orders@freshdirect.co.nz',
      phone: '+64 9 234 5678',
      status: 'active',
      lastOrder: '2025-11-18',
      totalOrders: 28
    },
    {
      id: 3,
      name: 'Premium Beverages Ltd',
      category: 'Beverages',
      contact: 'sales@premiumbev.co.nz',
      phone: '+64 9 345 6789',
      status: 'pending',
      lastOrder: '2025-10-15',
      totalOrders: 15
    },
    {
      id: 4,
      name: 'Kitchen Supplies Co',
      category: 'Equipment',
      contact: 'info@kitchensupplies.co.nz',
      phone: '+64 9 456 7890',
      status: 'active',
      lastOrder: '2025-11-19',
      totalOrders: 8
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-700 bg-green-100'
      case 'pending':
        return 'text-orange-700 bg-orange-100'
      case 'inactive':
        return 'text-red-700 bg-red-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food Service':
        return 'icon-[tabler--chef-hat]'
      case 'Fresh Produce':
        return 'icon-[tabler--apple]'
      case 'Beverages':
        return 'icon-[tabler--bottle]'
      case 'Equipment':
        return 'icon-[tabler--tools]'
      default:
        return 'icon-[tabler--building-store]'
    }
  }

  return (
    <StandardPageWrapper moduleName="vendors" currentPage="list">
      {/* Development Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400" style={{ padding: SPACING.MD, marginBottom: SPACING.XL }}>
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Development Module</strong> - Using realistic dummy data for demonstration
            </p>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 style={{
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZES.TITLE_LARGE,
            fontWeight: FONT_WEIGHTS.BOLD,
            color: IOS_COLORS.LABEL_PRIMARY,
            marginBottom: SPACING.SM,
            margin: 0,
          }}>
            Vendor Directory
          </h1>
          <p style={{
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZES.BODY,
            fontWeight: FONT_WEIGHTS.REGULAR,
            color: IOS_COLORS.LABEL_SECONDARY,
            margin: 0,
          }}>
            Manage supplier relationships and vendor information
          </p>
        </div>
        <div style={{ marginTop: SPACING.MD }}>
          <PrimaryButton 
            leftIcon={<span className="icon-[tabler--plus] w-4 h-4"></span>}
            aria-label="Add new vendor"
          >
            Add Vendor
          </PrimaryButton>
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {vendors.map((vendor) => (
          <ModuleCard key={vendor.id}>
            <div className="p-6">
              {/* Vendor Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 mr-3">
                    <span className={`${getCategoryIcon(vendor.category)} h-6 w-6 text-blue-600`}></span>
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.HEADING_SMALL,
                      fontWeight: FONT_WEIGHTS.SEMIBOLD,
                      color: IOS_COLORS.LABEL_PRIMARY,
                      marginBottom: SPACING.XS,
                      margin: 0,
                    }}>
                      {vendor.name}
                    </h3>
                    <p style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.CAPTION,
                      fontWeight: FONT_WEIGHTS.REGULAR,
                      color: IOS_COLORS.LABEL_SECONDARY,
                      margin: 0,
                    }}>
                      {vendor.category}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                  {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                </span>
              </div>

              {/* Vendor Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center">
                  <span className="icon-[tabler--mail] h-4 w-4 text-gray-400 mr-2"></span>
                  <span style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.CAPTION,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                  }}>
                    {vendor.contact}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="icon-[tabler--phone] h-4 w-4 text-gray-400 mr-2"></span>
                  <span style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.CAPTION,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                  }}>
                    {vendor.phone}
                  </span>
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.TITLE_MEDIUM,
                    fontWeight: FONT_WEIGHTS.BOLD,
                    color: IOS_COLORS.BLUE,
                    margin: 0,
                  }}>
                    {vendor.totalOrders}
                  </div>
                  <div style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.MINIMUM,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                    margin: 0,
                  }}>
                    Total Orders
                  </div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.CAPTION,
                    fontWeight: FONT_WEIGHTS.SEMIBOLD,
                    color: IOS_COLORS.GREEN,
                    margin: 0,
                  }}>
                    {new Date(vendor.lastOrder).toLocaleDateString()}
                  </div>
                  <div style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.MINIMUM,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                    margin: 0,
                  }}>
                    Last Order
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: SPACING.SM 
              }}>
                <SecondaryButton 
                  fullWidth
                  leftIcon={<span className="icon-[tabler--eye] w-4 h-4"></span>}
                  aria-label={`View ${vendor.name} details`}
                >
                  View
                </SecondaryButton>
                <SecondaryButton 
                  fullWidth
                  leftIcon={<span className="icon-[tabler--edit] w-4 h-4"></span>}
                  aria-label={`Edit ${vendor.name}`}
                >
                  Edit
                </SecondaryButton>
              </div>
            </div>
          </ModuleCard>
        ))}
      </div>

      {/* Quick Actions */}
      <ModuleCard>
        <div className="p-6">
          <h3 style={{
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZES.HEADING_SMALL,
            fontWeight: FONT_WEIGHTS.SEMIBOLD,
            color: IOS_COLORS.LABEL_PRIMARY,
            marginBottom: SPACING.LG,
            margin: 0,
          }}>
            Quick Actions
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: SPACING.MD 
          }}>
            <SecondaryButton 
              fullWidth 
              leftIcon={<span className="icon-[tabler--download] w-4 h-4"></span>}
              aria-label="Export vendor list"
            >
              Export List
            </SecondaryButton>
            
            <SecondaryButton 
              fullWidth 
              leftIcon={<span className="icon-[tabler--upload] w-4 h-4"></span>}
              aria-label="Import vendors"
            >
              Import Vendors
            </SecondaryButton>
            
            <SecondaryButton 
              fullWidth 
              leftIcon={<span className="icon-[tabler--chart-bar] w-4 h-4"></span>}
              aria-label="View vendor analytics"
            >
              View Analytics
            </SecondaryButton>
          </div>
        </div>
      </ModuleCard>

      <UniversalFooter />
    </StandardPageWrapper>
  )
}