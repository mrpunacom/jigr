'use client'

import { useRouter } from 'next/navigation'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { ClipboardList, Clock, CheckCircle, TrendingUp, Plus, Eye } from 'lucide-react'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function CountConsolePage() {
  const router = useRouter()
  return (
    <ConsolePageWrapper moduleName="count">
      {/* Count Overview Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Active Counts */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <ClipboardList className="h-8 w-8 text-blue-600" />
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Active Counts
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.BLUE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              3
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Counts in progress
            </p>
          </div>
        </ModuleCard>

        {/* Completed Today */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Completed Today
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.GREEN,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              2
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Stocktakes finished
            </p>
          </div>
        </ModuleCard>

        {/* Avg Accuracy */}
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
              Accuracy Rate
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.PURPLE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              94.2%
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Last 30 days
            </p>
          </div>
        </ModuleCard>
      </div>

      {/* Recent Counts & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Count Activity */}
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
              Recent Counts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Dry Storage - Weekly</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Complete</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Cold Storage - Daily</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Progress</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Bar Inventory - Monthly</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">Pending</span>
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
                aria-label="Start a new stock count"
                onClick={() => router.push('/count/new')}
              >
                Start New Count
              </PrimaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<ClipboardList size={16} />}
                aria-label="View currently active stock counts"
                onClick={() => router.push('/count/history')}
              >
                View Active Counts
              </SecondaryButton>
              
              <SecondaryButton 
                fullWidth 
                leftIcon={<Eye size={16} />}
                aria-label="View historical count data"
                onClick={() => router.push('/count/history')}
              >
                Count History
              </SecondaryButton>
            </div>
          </div>
        </ModuleCard>
      </div>
    </ConsolePageWrapper>
  )
}