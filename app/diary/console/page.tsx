'use client'

import Link from 'next/link'
import { DIARY_DASHBOARD_DATA } from '@/lib/dummyData/diaryData'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function DiaryConsolePage() {
  const { metrics, todaysTimeline } = DIARY_DASHBOARD_DATA

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'login': return '👤'
      case 'logout': return '👋'
      case 'inspection': return '📋'
      case 'expiring': return '⏰'
      case 'inventory': return '📦'
      case 'repair': return '🔧'
      case 'safety': return '⚠️'
      case 'system': return '💾'
      default: return '📌'
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'warning': return 'border-l-orange-400 bg-orange-50'
      case 'error': return 'border-l-red-400 bg-red-50'
      default: return 'border-l-blue-400 bg-blue-50'
    }
  }


  return (
    <ConsolePageWrapper moduleName="diary" currentPage="console">
        <div className="bg-teal-50 border-l-4 border-teal-400 p-4 mb-8">
          <p className="text-sm text-teal-700">
            <strong>Development Module</strong> - Using realistic dummy data for demonstration
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Expiring Today */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--clock-alert] h-8 w-8 text-orange-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                Expiring Today
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.ORANGE,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.expiringToday}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Items expiring today
              </p>
            </div>
          </ModuleCard>

          {/* Expiring This Week */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--calendar-week] h-8 w-8 text-yellow-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                Expiring This Week
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.ORANGE,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.expiringThisWeek}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Items expiring this week
              </p>
            </div>
          </ModuleCard>

          {/* Active Users */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--users] h-8 w-8 text-blue-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                Active Users
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.BLUE,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.activeUsersToday}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Users active today
              </p>
            </div>
          </ModuleCard>

          {/* System Events */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--activity] h-8 w-8 text-green-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                System Events
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.GREEN,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.systemEventsToday}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                System events today
              </p>
            </div>
          </ModuleCard>
        </div>

        {/* Today's Activity & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Today's Activity */}
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
                Today's Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">User login: Sarah Johnson</span>
                  <span className="text-xs text-blue-600">8:30 AM</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Stock count updated: Milk</span>
                  <span className="text-xs text-green-600">9:45 AM</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">System backup completed</span>
                  <span className="text-xs text-blue-600">12:00 PM</span>
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
                  leftIcon={<span className="icon-[tabler--clock-alert] w-4 h-4"></span>}
                  aria-label="View expiring items"
                >
                  View Expiring Items
                </PrimaryButton>
                
                <SecondaryButton 
                  fullWidth 
                  leftIcon={<span className="icon-[tabler--users] w-4 h-4"></span>}
                  aria-label="View user activity"
                >
                  User Activity
                </SecondaryButton>
                
                <SecondaryButton 
                  fullWidth 
                  leftIcon={<span className="icon-[tabler--file-text] w-4 h-4"></span>}
                  aria-label="View audit trail"
                >
                  Audit Trail
                </SecondaryButton>
              </div>
            </div>
          </ModuleCard>
        </div>
        
        <UniversalFooter />
    </ConsolePageWrapper>
  )
}