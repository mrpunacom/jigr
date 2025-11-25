/**
 * Module Configuration System
 * 
 * Centralized configuration for all hospitality compliance modules
 * including icons, descriptions, and standard page structures.
 * 
 * Integrates with SmartHelp system for personalized taglines and purpose statements.
 */

import { getModuleDefinition, getPersonalizedTagline, getModulePurpose, getCompanyName, DEFAULT_COMPANY_NAME } from './moduleDefinitions'

export interface ModulePage {
  key: string
  label: string
  href: string
}

export interface ModuleLayoutConfig {
  variant: 'default' | 'fullwidth' | 'centered' | 'dashboard'
  padding: 'standard' | 'compact' | 'none'
  maxWidth: 'container' | 'full' | 'narrow'
  backgroundBehavior: 'universal' | 'none' | 'custom'
}

export interface ModuleConfig {
  key: string
  title: string
  description: string
  iconUrl: string
  pages: ModulePage[]
  isActive: boolean
  layoutConfig?: ModuleLayoutConfig
  
  // SmartHelp integration
  getPersonalizedTitle?: (companyName?: string) => string
  getPurpose?: (useShort?: boolean) => string
}

// Standard 3-page structure for each module
const createModulePages = (moduleKey: string): ModulePage[] => [
  {
    key: 'console',
    label: 'Console', 
    href: `/${moduleKey}/console`
  },
  {
    key: 'capture',
    label: moduleKey === 'upload' ? 'Capture' : 'Action',
    href: `/${moduleKey}/${moduleKey === 'upload' ? 'capture' : 'action'}`
  },
  {
    key: 'reports',
    label: 'Reports',
    href: `/${moduleKey}/reports`
  }
]

// Module configuration registry
export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  upload: {
    key: 'upload',
    title: 'UPLOAD',
    description: 'Document upload, processing, and compliance management',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleUpload.webp',
    pages: createModulePages('upload'),
    isActive: true
  },
  
  stock: {
    key: 'stock', 
    title: 'STOCK',
    description: 'Inventory management and tracking',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleStock.webp',
    pages: [
      {
        key: 'items',
        label: 'Items',
        href: '/stock/items'
      },
      {
        key: 'console',
        label: 'Console', 
        href: '/stock/console'
      },
      {
        key: 'reports',
        label: 'Reports',
        href: '/stock/reports'
      }
    ],
    isActive: true
  },
  
  temperature: {
    key: 'temperature',
    title: 'TEMPERATURE', 
    description: 'Fridge and freezer monitoring',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRtemp.png',
    pages: createModulePages('temperature'),
    isActive: false
  },
  
  admin: {
    key: 'admin',
    title: 'ADMIN',
    description: 'Configuring your operation',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleAdmin.webp', 
    pages: [
      { key: 'console', label: 'Console', href: '/admin/console' },
      { key: 'configure', label: 'Configure', href: '/admin/configure' },
      { key: 'team', label: 'Team', href: '/admin/team' }
    ],
    isActive: true,
    layoutConfig: {
      variant: 'default',
      padding: 'standard',
      maxWidth: 'container',
      backgroundBehavior: 'universal'
    }
  },
  
  repairs: {
    key: 'repairs',
    title: 'REPAIRS',
    description: 'Equipment maintenance and repair tracking',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/JiGRModuleRepair',
    pages: [
      { key: 'console', label: 'Console', href: '/repairs/console' },
      { key: 'safety', label: 'Safety', href: '/repairs/safety' },
      { key: 'reports', label: 'Reports', href: '/repairs/reports' }
    ],
    isActive: true
  },
  
  diary: {
    key: 'diary',
    title: 'DIARY',
    description: 'Daily logs and incident reporting', 
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/JiGRModuleDiary',
    pages: [
      { key: 'console', label: 'Console', href: '/diary/console' },
      { key: 'expiring', label: 'Expiring', href: '/diary/expiring' },
      { key: 'reports', label: 'Reports', href: '/diary/reports' }
    ],
    isActive: true
  },
  
  recipes: {
    key: 'recipes',
    title: 'RECIPES',
    description: 'Recipe management and costing',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleRecipe.webp',
    pages: [
      {
        key: 'list',
        label: 'Recipes',
        href: '/recipes'
      },
      {
        key: 'sub-recipes',
        label: 'Sub-Recipes',
        href: '/recipes/sub-recipes'
      },
      {
        key: 'production',
        label: 'Production',
        href: '/recipes/production'
      }
    ], 
    isActive: true
  },
  
  count: {
    key: 'count',
    title: 'COUNT',
    description: 'Stocktake and inventory counting',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleCount.webp',
    pages: [
      {
        key: 'console',
        label: 'Console',
        href: '/count/console'
      },
      {
        key: 'history',
        label: 'History',
        href: '/count/history'
      },
      {
        key: 'variance',
        label: 'Variance',
        href: '/count/variance'
      }
    ],
    isActive: true
  },

  menu: {
    key: 'menu',
    title: 'MENU',
    description: 'Menu pricing and engineering analytics',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleMenus.webp',
    pages: [
      {
        key: 'pricing',
        label: 'Pricing',
        href: '/menu/pricing'
      },
      {
        key: 'engineering',
        label: 'Engineering',
        href: '/menu/engineering'
      },
      {
        key: 'analysis',
        label: 'Analysis',
        href: '/menu/analysis'
      }
    ],
    isActive: true
  },

  vendors: {
    key: 'vendors',
    title: 'VENDORS',
    description: 'Supplier and vendor management',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/icons/JiGRModuleVendors.webp',
    pages: [
      {
        key: 'console',
        label: 'Console',
        href: '/vendors/console'
      },
      {
        key: 'list',
        label: 'List',
        href: '/vendors/list'
      },
      {
        key: 'analytics',
        label: 'Analytics',
        href: '/vendors/analytics'
      }
    ],
    isActive: true,
    layoutConfig: {
      variant: 'default',
      padding: 'standard',
      maxWidth: 'container',
      backgroundBehavior: 'universal'
    }
  },

  dev: {
    key: 'dev',
    title: 'DEV',
    description: 'Development tools and configuration management',
    iconUrl: 'https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/module-assets/icons/JiGRModuleAdmin.png',
    pages: [
      { key: 'architecture-testing', label: 'Architecture', href: '/dev/architecture-testing' },
      { key: 'configcard-planner', label: 'ConfigCard Planner', href: '/dev/configcard-planner' },
      { key: 'configcard-designer', label: 'ConfigCard Designer', href: '/dev/configcard-designer' },
      { key: 'console', label: 'Console', href: '/dev/console' }
    ],
    isActive: true
  }
}

/**
 * Get module configuration by key
 */
export function getModuleConfig(moduleKey: string): ModuleConfig | null {
  return MODULE_CONFIGS[moduleKey] || null
}

/**
 * Get all active modules
 */
export function getActiveModules(): ModuleConfig[] {
  return Object.values(MODULE_CONFIGS).filter(module => module.isActive)
}

/**
 * Get all modules (active and inactive)
 */
export function getAllModules(): ModuleConfig[] {
  return Object.values(MODULE_CONFIGS)
}

/**
 * Check if a module is active
 */
export function isModuleActive(moduleKey: string): boolean {
  const config = getModuleConfig(moduleKey)
  return config ? config.isActive : false
}