'use client'

import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function StockConsolePage() {
  return (
    <ConsolePageWrapper moduleName="stock">
      {/* Stock Overview Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Total Items */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--package] h-8 w-8 text-blue-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Total Items
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.BLUE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              847
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Items in inventory
            </p>
          </div>
        </ModuleCard>

        {/* Low Stock Items */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--trending-down] h-8 w-8 text-orange-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Low Stock
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.ORANGE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              23
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Items below minimum
            </p>
          </div>
        </ModuleCard>

        {/* Out of Stock */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--alert-triangle] h-8 w-8 text-red-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Out of Stock
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.RED,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              7
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Items requiring reorder
            </p>
          </div>
        </ModuleCard>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Stock Movements */}
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
              Recent Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Tomatoes - Stock Count</span>
                <span className="text-xs text-green-600">+15 units</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Olive Oil - Delivery</span>
                <span className="text-xs text-blue-600">+24 bottles</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Salmon - Usage</span>
                <span className="text-xs text-red-600">-12 portions</span>
              </div>
            </div>
          </div>
        </ModuleCard>

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
              display: 'flex', 
              flexDirection: 'column', 
              gap: SPACING.MD 
            }}>
              <PrimaryButton 
                fullWidth 
                leftIcon={<span className="icon-[tabler--plus] w-4 h-4"></span>}
                aria-label="Add a new inventory item"
              >
                Add New Item
              </PrimaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<span className="icon-[tabler--chart-bar] w-4 h-4"></span>}
                aria-label="View all inventory items"
              >
                View All Items
              </SecondaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<span className="icon-[tabler--file-text] w-4 h-4"></span>}
                aria-label="Generate and view stock reports"
              >
                Stock Reports
              </SecondaryButton>
            </div>
          </div>
        </ModuleCard>
      </div>
      
      <UniversalFooter />
    </ConsolePageWrapper>
  )
}