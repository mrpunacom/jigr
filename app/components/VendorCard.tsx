import { ModuleCard } from './ModuleCard'

interface VendorCardProps {
  vendor: {
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
  onClick?: (vendorId: string) => void
  theme?: 'upload' | 'admin' | 'default' | 'light'
  className?: string
}

export function VendorCard({ 
  vendor, 
  onClick, 
  theme = 'light', 
  className = '' 
}: VendorCardProps) {
  const isClickable = !!onClick

  const categories = vendor.vendor_categories 
    ? vendor.vendor_categories.split(',').map(cat => cat.trim())
    : []

  return (
    <ModuleCard
      theme={theme}
      hover={isClickable}
      onClick={() => onClick?.(vendor.id)}
      className={`p-6 ${className}`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">
              {vendor.vendor_name}
            </h3>
            {vendor.contact_name && (
              <p className="text-sm text-white/70 mt-1">{vendor.contact_name}</p>
            )}
          </div>
          
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            vendor.is_active
              ? 'bg-green-500/20 text-green-300'
              : 'bg-gray-500/20 text-gray-400'
          }`}>
            {vendor.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300"
              >
                {category}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                +{categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Contact Info */}
        <div className="space-y-2">
          {vendor.phone && (
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <span className="icon-[tabler--phone] h-4 w-4"></span>
              <span>{vendor.phone}</span>
            </div>
          )}
          
          {vendor.email && (
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <span className="icon-[tabler--mail] h-4 w-4"></span>
              <span className="truncate">{vendor.email}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2 text-sm text-white/70">
            <span className="icon-[tabler--package] h-4 w-4"></span>
            <span>
              {vendor.item_count || 0} {vendor.item_count === 1 ? 'item' : 'items'}
            </span>
          </div>

          {vendor.last_delivery_date && (
            <div className="flex items-center space-x-2 text-sm text-white/70">
              <span className="icon-[tabler--calendar] h-4 w-4"></span>
              <span>
                {new Date(vendor.last_delivery_date).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {/* Action Hint */}
        {isClickable && (
          <div className="text-center pt-2">
            <span className="text-xs text-white/60">Click to view details →</span>
          </div>
        )}
      </div>
    </ModuleCard>
  )
}

export function ContactInfo({ 
  phone, 
  email, 
  className = '' 
}: {
  phone?: string
  email?: string
  className?: string
}) {
  if (!phone && !email) return null

  return (
    <div className={`space-y-1 ${className}`}>
      {phone && (
        <div className="flex items-center space-x-2 text-sm">
          <span className="icon-[tabler--phone] h-4 w-4 text-gray-400"></span>
          <span className="text-gray-600">{phone}</span>
        </div>
      )}
      {email && (
        <div className="flex items-center space-x-2 text-sm">
          <span className="icon-[tabler--mail] h-4 w-4 text-gray-400"></span>
          <span className="text-gray-600 truncate">{email}</span>
        </div>
      )}
    </div>
  )
}

export function CategoryTags({ 
  categories, 
  maxShow = 3,
  className = '' 
}: {
  categories: string[]
  maxShow?: number
  className?: string
}) {
  if (!categories.length) return null

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {categories.slice(0, maxShow).map((category) => (
        <span
          key={category}
          className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {category}
        </span>
      ))}
      {categories.length > maxShow && (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          +{categories.length - maxShow}
        </span>
      )}
    </div>
  )
}