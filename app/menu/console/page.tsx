'use client'

import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { Menu, DollarSign, TrendingUp, BarChart3, Plus, Eye, FileText } from 'lucide-react'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function MenuConsolePage() {
  return (
    <ConsolePageWrapper moduleName="menu">
      {/* Menu Overview Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Active Menu Items */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Menu className="h-8 w-8 text-blue-600" />
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Menu Items
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.BLUE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              127
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Active menu items
            </p>
          </div>
        </ModuleCard>

        {/* Average Food Cost */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Food Cost
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.GREEN,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              28.5%
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Average food cost percentage
            </p>
          </div>
        </ModuleCard>

        {/* Top Performers */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Top Performers
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.PURPLE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              12
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              High profit items
            </p>
          </div>
        </ModuleCard>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Menu Activity */}
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
              Recent Changes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Fish & Chips - Price Update</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Updated</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Caesar Salad - Recipe Modified</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Modified</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Summer Special - Added</span>
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">New</span>
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
                leftIcon={<Plus size={16} />}
                aria-label="Add a new menu item"
              >
                Add Menu Item
              </PrimaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<Eye size={16} />}
                aria-label="View all menu items"
              >
                View All Items
              </SecondaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<BarChart3 size={16} />}
                aria-label="Generate menu analysis reports"
              >
                Menu Analysis
              </SecondaryButton>
            </div>
          </div>
        </ModuleCard>
      </div>
    </ConsolePageWrapper>
  )
}