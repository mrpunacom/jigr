'use client'

import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { PrimaryButton, SecondaryButton } from '@/app/components/AppleButton'
import { UniversalFooter } from '@/app/components/UniversalFooter'
import { FONT_FAMILY, FONT_SIZES, FONT_WEIGHTS, IOS_COLORS, SPACING } from '@/lib/apple-design-system'

export default function VendorsAnalyticsPage() {
  // Mock analytics data for demonstration
  const analytics = {
    totalVendors: 24,
    activeVendors: 18,
    monthlySpend: 28500,
    topPerformers: [
      { name: 'Service Foods Auckland', spend: 8400, orders: 15, rating: 4.8 },
      { name: 'Fresh Direct NZ', spend: 6200, orders: 12, rating: 4.6 },
      { name: 'Premium Beverages Ltd', spend: 4100, orders: 8, rating: 4.9 }
    ],
    categories: [
      { name: 'Food Service', vendors: 8, spend: 15200 },
      { name: 'Fresh Produce', vendors: 6, spend: 7800 },
      { name: 'Beverages', vendors: 5, spend: 3900 },
      { name: 'Equipment', vendors: 5, spend: 1600 }
    ],
    recentActivity: [
      { vendor: 'Service Foods Auckland', action: 'Order completed', amount: 1240, date: '2025-11-23' },
      { vendor: 'Fresh Direct NZ', action: 'Payment processed', amount: 890, date: '2025-11-22' },
      { vendor: 'Kitchen Supplies Co', action: 'New order placed', amount: 420, date: '2025-11-21' }
    ]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', { 
      style: 'currency', 
      currency: 'NZD',
      minimumFractionDigits: 0 
    }).format(amount)
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <StandardPageWrapper moduleName="vendors" currentPage="analytics">
      {/* Development Notice */}
      <div className="bg-purple-50 border-l-4 border-purple-400" style={{ padding: SPACING.MD, marginBottom: SPACING.XL }}>
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-purple-700">
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
            Vendor Analytics
          </h1>
          <p style={{
            fontFamily: FONT_FAMILY,
            fontSize: FONT_SIZES.BODY,
            fontWeight: FONT_WEIGHTS.REGULAR,
            color: IOS_COLORS.LABEL_SECONDARY,
            margin: 0,
          }}>
            Performance insights and vendor relationship metrics
          </p>
        </div>
        <div style={{ marginTop: SPACING.MD }}>
          <PrimaryButton 
            leftIcon={<span className="icon-[tabler--download] w-4 h-4"></span>}
            aria-label="Export analytics report"
          >
            Export Report
          </PrimaryButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Total Vendors */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--building-store] h-8 w-8 text-blue-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Total Vendors
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.BLUE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              {analytics.totalVendors}
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Registered suppliers
            </p>
          </div>
        </ModuleCard>

        {/* Active Vendors */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--users] h-8 w-8 text-green-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Active Vendors
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.GREEN,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              {analytics.activeVendors}
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Currently supplying
            </p>
          </div>
        </ModuleCard>

        {/* Monthly Spend */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--currency-dollar] h-8 w-8 text-purple-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Monthly Spend
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.PURPLE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              {formatCurrency(analytics.monthlySpend)}
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              This month's total
            </p>
          </div>
        </ModuleCard>

        {/* Average Rating */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <span className="icon-[tabler--star] h-8 w-8 text-yellow-600"></span>
            </div>
            <h3 style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.HEADING_SMALL,
              fontWeight: FONT_WEIGHTS.SEMIBOLD,
              color: IOS_COLORS.LABEL_PRIMARY,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              Avg Rating
            </h3>
            <div style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.TITLE_LARGE,
              fontWeight: FONT_WEIGHTS.BOLD,
              color: IOS_COLORS.ORANGE,
              marginBottom: SPACING.SM,
              margin: 0,
            }}>
              4.7
            </div>
            <p style={{
              fontFamily: FONT_FAMILY,
              fontSize: FONT_SIZES.CAPTION,
              fontWeight: FONT_WEIGHTS.REGULAR,
              color: IOS_COLORS.LABEL_SECONDARY,
              margin: 0,
            }}>
              Vendor performance
            </p>
          </div>
        </ModuleCard>
      </div>

      {/* Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Top Performers */}
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
              Top Performing Vendors
            </h3>
            <div className="space-y-4">
              {analytics.topPerformers.map((vendor, index) => (
                <div key={vendor.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p style={{
                        fontFamily: FONT_FAMILY,
                        fontSize: FONT_SIZES.BODY,
                        fontWeight: FONT_WEIGHTS.MEDIUM,
                        color: IOS_COLORS.LABEL_PRIMARY,
                        margin: 0,
                      }}>
                        {vendor.name}
                      </p>
                      <p style={{
                        fontFamily: FONT_FAMILY,
                        fontSize: FONT_SIZES.CAPTION,
                        fontWeight: FONT_WEIGHTS.REGULAR,
                        color: IOS_COLORS.LABEL_SECONDARY,
                        margin: 0,
                      }}>
                        {vendor.orders} orders • {formatCurrency(vendor.spend)}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center ${getRatingColor(vendor.rating)}`}>
                    <span className="icon-[tabler--star] w-4 h-4 mr-1"></span>
                    <span className="font-medium">{vendor.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>

        {/* Spending by Category */}
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
              Spending by Category
            </h3>
            <div className="space-y-4">
              {analytics.categories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.BODY,
                      fontWeight: FONT_WEIGHTS.MEDIUM,
                      color: IOS_COLORS.LABEL_PRIMARY,
                      margin: 0,
                    }}>
                      {category.name}
                    </p>
                    <p style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.BODY,
                      fontWeight: FONT_WEIGHTS.SEMIBOLD,
                      color: IOS_COLORS.BLUE,
                      margin: 0,
                    }}>
                      {formatCurrency(category.spend)}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(category.spend / Math.max(...analytics.categories.map(c => c.spend))) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <p style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.CAPTION,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                    margin: 0,
                  }}>
                    {category.vendors} vendors
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ModuleCard>
      </div>

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
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mr-4">
                    <span className="icon-[tabler--check] w-5 h-5 text-green-600"></span>
                  </div>
                  <div>
                    <p style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.BODY,
                      fontWeight: FONT_WEIGHTS.MEDIUM,
                      color: IOS_COLORS.LABEL_PRIMARY,
                      margin: 0,
                    }}>
                      {activity.vendor}
                    </p>
                    <p style={{
                      fontFamily: FONT_FAMILY,
                      fontSize: FONT_SIZES.CAPTION,
                      fontWeight: FONT_WEIGHTS.REGULAR,
                      color: IOS_COLORS.LABEL_SECONDARY,
                      margin: 0,
                    }}>
                      {activity.action}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.BODY,
                    fontWeight: FONT_WEIGHTS.SEMIBOLD,
                    color: IOS_COLORS.GREEN,
                    margin: 0,
                  }}>
                    {formatCurrency(activity.amount)}
                  </p>
                  <p style={{
                    fontFamily: FONT_FAMILY,
                    fontSize: FONT_SIZES.CAPTION,
                    fontWeight: FONT_WEIGHTS.REGULAR,
                    color: IOS_COLORS.LABEL_SECONDARY,
                    margin: 0,
                  }}>
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ModuleCard>

      <UniversalFooter />
    </StandardPageWrapper>
  )
}