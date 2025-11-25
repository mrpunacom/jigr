'use client'

import Link from 'next/link'
import { REPAIRS_DASHBOARD_DATA } from '@/lib/dummyData/repairsData'
import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function RepairsConsolePage() {
  const { metrics, recentActivity } = REPAIRS_DASHBOARD_DATA

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'medium': return 'text-yellow-700 bg-yellow-100'
      case 'low': return 'text-green-700 bg-green-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100'
      case 'high': return 'text-orange-700 bg-orange-100'
      case 'medium': return 'text-yellow-700 bg-yellow-100'
      case 'low': return 'text-green-700 bg-green-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-700 bg-red-100'
      case 'in_progress': return 'text-blue-700 bg-blue-100'
      case 'pending': return 'text-yellow-700 bg-yellow-100'
      case 'completed': return 'text-green-700 bg-green-100'
      case 'overdue': return 'text-red-700 bg-red-100'
      case 'upcoming': return 'text-blue-700 bg-blue-100'
      default: return 'text-gray-700 bg-gray-100'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'safety': return '⚠️'
      case 'repair': return '🔧'
      case 'maintenance': return '🔄'
      default: return '📋'
    }
  }

  return (
    <ConsolePageWrapper moduleName="repairs">
        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400" style={{ padding: SPACING.MD, marginBottom: SPACING.XL }}>
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Module</strong> - Using realistic dummy data for demonstration
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Safety Issues */}
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
                Safety Issues
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.RED,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.openIssues}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Critical issues requiring attention
              </p>
            </div>
          </ModuleCard>
          {/* Pending Repairs */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--tools] h-8 w-8 text-yellow-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                Pending Repairs
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.ORANGE,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.pendingRepairs}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Items awaiting repair
              </p>
            </div>
          </ModuleCard>
          {/* Overdue Tasks */}
          <ModuleCard>
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <span className="icon-[tabler--clock-exclamation] h-8 w-8 text-red-600"></span>
              </div>
              <h3 style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.HEADING_SMALL,
                fontWeight: FONT_WEIGHTS.SEMIBOLD,
                color: IOS_COLORS.LABEL_PRIMARY,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                Overdue Tasks
              </h3>
              <div style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.TITLE_LARGE,
                fontWeight: FONT_WEIGHTS.BOLD,
                color: IOS_COLORS.RED,
                marginBottom: SPACING.SM,
                margin: 0,
              }}>
                {metrics.overdueMaintenance}
              </div>
              <p style={{
                fontFamily: FONT_FAMILY,
                fontSize: FONT_SIZES.CAPTION,
                fontWeight: FONT_WEIGHTS.REGULAR,
                color: IOS_COLORS.LABEL_SECONDARY,
                margin: 0,
              }}>
                Overdue maintenance items
              </p>
            </div>
          </ModuleCard>
        </div>

        {/* Recent Activity & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Recent Activity */}
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
                  <span className="text-sm text-gray-600">Wet floor near dishwasher</span>
                  <span className="text-xs text-red-600">high</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Freezer door seal replaced</span>
                  <span className="text-xs text-green-600">completed</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Oven temperature calibration</span>
                  <span className="text-xs text-orange-600">in progress</span>
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
                  aria-label="Report a safety issue"
                >
                  Report Safety Issue
                </PrimaryButton>
                
                <SecondaryButton 
                  fullWidth 
                  leftIcon={<span className="icon-[tabler--tools] w-4 h-4"></span>}
                  aria-label="Schedule a repair"
                >
                  Schedule Repair
                </SecondaryButton>
                
                <SecondaryButton 
                  fullWidth 
                  leftIcon={<span className="icon-[tabler--clipboard-check] w-4 h-4"></span>}
                  aria-label="View inspection checklist"
                >
                  Inspection Checklist
                </SecondaryButton>
              </div>
            </div>
          </ModuleCard>
        </div>
        
        <UniversalFooter />
    </ConsolePageWrapper>
  )
}