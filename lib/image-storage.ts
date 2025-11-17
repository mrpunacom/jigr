/**
 * Supabase Storage Image Management Utility
 * 
 * Provides optimized image URLs with automatic WebP conversion,
 * dynamic sizing, and CDN delivery for improved performance.
 */

interface ImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'png' | 'jpg' | 'auto'
}

// Supabase Storage Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const STORAGE_BUCKETS = {
  UI_ICONS: 'ui-icons',
  MODULE_ASSETS: 'module-assets', 
  BRANDING: 'branding'
} as const

/**
 * Generate optimized Supabase Storage URL with transforms
 */
export function getStorageImageUrl(
  bucket: string, 
  path: string, 
  options: ImageOptions = {}
): string {
  if (!SUPABASE_URL) {
    console.warn('SUPABASE_URL not configured, falling back to local images')
    return `/fallback-${path}`
  }

  const { width, height, quality = 85, format = 'webp' } = options
  
  let url = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  
  // Add optimization transforms
  const transforms = []
  if (width) transforms.push(`width=${width}`)
  if (height) transforms.push(`height=${height}`)
  if (quality !== 85) transforms.push(`quality=${quality}`)
  if (format !== 'auto') transforms.push(`format=${format}`)
  
  if (transforms.length > 0) {
    url += `?${transforms.join('&')}`
  }
  
  return url
}

/**
 * Get optimized UI icon with standard sizing
 */
export function getUIIcon(iconName: string, size: number = 24): string {
  // Remove file extension if provided
  const cleanName = iconName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
  
  return getStorageImageUrl(
    STORAGE_BUCKETS.UI_ICONS,
    `${cleanName}.png`,
    {
      width: size,
      height: size,
      format: 'webp',
      quality: 90
    }
  )
}

/**
 * Get optimized module asset (large graphics, backgrounds)
 */
export function getModuleAsset(
  assetName: string, 
  options: ImageOptions = {}
): string {
  // Remove file extension if provided
  const cleanName = assetName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
  
  return getStorageImageUrl(
    STORAGE_BUCKETS.MODULE_ASSETS,
    `${cleanName}.png`,
    {
      format: 'webp',
      quality: 85,
      ...options
    }
  )
}

/**
 * Get background image with responsive sizing
 */
export function getBackgroundImage(
  imageName: string,
  size: 'sm' | 'md' | 'lg' | 'xl' = 'lg'
): string {
  const sizeSuffix = size === 'lg' ? '' : `-${size}`
  const cleanName = imageName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
  
  return getStorageImageUrl(
    STORAGE_BUCKETS.MODULE_ASSETS,
    `backgrounds/${cleanName}${sizeSuffix}.jpg`,
    {
      format: 'webp',
      quality: 80
    }
  )
}

/**
 * Get optimized chef workspace background for upload layouts
 */
export function getChefWorkspaceBackground(): string {
  return getStorageImageUrl(
    STORAGE_BUCKETS.MODULE_ASSETS,
    'backgrounds/chef-workspace.jpg',
    {
      format: 'webp',
      quality: 75,
      width: 1920,
      height: 1080
    }
  )
}

/**
 * Get optimized admin background for admin layouts
 */
export function getAdminBackground(): string {
  return getStorageImageUrl(
    STORAGE_BUCKETS.MODULE_ASSETS,
    'backgrounds/Home-Chef-Chicago-8.webp',
    {
      format: 'webp',
      quality: 75,
      width: 1920,
      height: 1080
    }
  )
}

/**
 * Get optimized public background for public pages
 */
export function getPublicBackground(): string {
  return getStorageImageUrl(
    STORAGE_BUCKETS.MODULE_ASSETS,
    'backgrounds/CafeWindow.jpg',
    {
      format: 'webp',
      quality: 75,
      width: 1920,
      height: 1080
    }
  )
}

/**
 * Get branding asset (logos, company graphics)
 */
export function getBrandingAsset(
  assetName: string,
  options: ImageOptions = {}
): string {
  const cleanName = assetName.replace(/\.(png|jpg|jpeg|webp|svg)$/i, '')
  
  return getStorageImageUrl(
    STORAGE_BUCKETS.BRANDING,
    `${cleanName}.png`,
    {
      format: 'webp',
      quality: 90,
      ...options
    }
  )
}

/**
 * Fallback function for local development or storage unavailable
 */
export function getLocalImageFallback(path: string): string {
  return `/${path}`
}

/**
 * Smart image URL with automatic fallback
 */
export function getImageUrl(
  bucket: string,
  path: string,
  options: ImageOptions = {},
  fallbackPath?: string
): string {
  if (!SUPABASE_URL) {
    return getLocalImageFallback(fallbackPath || path)
  }
  
  return getStorageImageUrl(bucket, path, options)
}

// Export bucket constants for direct usage
export { STORAGE_BUCKETS }

// Icon mapping for easy migration
export const ICON_MAPPING = {
  // Navigation Icons
  'JiGRupload': 'navigation/JiGRupload',
  'JiGRcamera': 'navigation/JiGRcamera', 
  'JiGRmodules': 'navigation/JiGRmodules',
  'JiGRadmin': 'navigation/JiGRadmin',
  'JiGRsignout': 'navigation/JiGRsignout',
  
  // Action Icons
  'JiGRbulk': 'actions/JiGRbulk',
  'JiGRqueue': 'actions/JiGRqueue',
  'JiGRsummary': 'actions/JiGRsummary',
  'JiGRwarning': 'actions/JiGRwarning',
  'JiGRStats': 'actions/JiGRStats',
  
  // Module Icons  
  'JiGRdiaryWhite': 'modules/JiGRdiaryWhite',
  'JiGRstockWhite': 'modules/JiGRstockWhite',
  'JiGRuploadWhite': 'modules/JiGRuploadWhite',
  'JiGRtemp': 'modules/JiGRtemp',
  'JiGRrepairs': 'modules/JiGRrepairs',
  'JiGRmenus': 'modules/JiGRmenus',
  'JiGRrecipes': 'modules/JiGRrecipes',
  'JiGRstocktake': 'modules/JiGRstocktake',
  'JiGRadmin2': 'modules/JiGRadmin2',
  'JiGRcompliance': 'modules/JiGRcompliance',
  'JiGRmenu': 'modules/JiGRmenu',
  'JiGRcount': 'modules/JiGRcount'
} as const

/**
 * Get mapped icon with organized path structure
 */
export function getMappedIcon(iconKey: keyof typeof ICON_MAPPING, size: number = 24): string {
  // Special case for JiGRcount - use direct URL
  if (iconKey === 'JiGRcount') {
    return 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/ui-icons/modules/JiGRcount.png'
  }
  
  const mappedPath = ICON_MAPPING[iconKey]
  if (!mappedPath) {
    console.warn(`Icon mapping not found for: ${iconKey}`)
    return getUIIcon(iconKey, size)
  }
  
  // Special handling for branding bucket icons
  if (mappedPath.startsWith('../branding/')) {
    const cleanPath = mappedPath.replace('../branding/', '')
    return getStorageImageUrl(
      STORAGE_BUCKETS.BRANDING,
      cleanPath,
      {
        width: size,
        height: size,
        format: 'webp',
        quality: 90
      }
    )
  }
  
  return getStorageImageUrl(
    STORAGE_BUCKETS.UI_ICONS,
    `${mappedPath}.png`,
    {
      width: size,
      height: size,
      format: 'webp',
      quality: 90
    }
  )
}