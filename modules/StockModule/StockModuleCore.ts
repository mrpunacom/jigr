/**
 * JiGR Stock Module Core - Architecture & Design System
 * 
 * Provides the foundational architecture for the Stock Module including:
 * - Design tokens and styling system
 * - Module configuration and state management
 * - API client integration
 * - Event handling and workflow coordination
 */

import React from 'react'
import { BaseJiGRModule } from '@/lib/BaseJiGRModule'

// ============================================================================
// STOCK MODULE DESIGN TOKENS
// ============================================================================

export const StockDesignTokens = {
  // Color system optimized for inventory management
  colors: {
    // Workflow-specific colors
    workflows: {
      unit_count: {
        primary: '#3B82F6',     // Blue - traditional counting
        secondary: '#DBEAFE',
        accent: '#1E40AF'
      },
      container_weight: {
        primary: '#10B981',     // Green - weight-based
        secondary: '#D1FAE5', 
        accent: '#047857'
      },
      bottle_hybrid: {
        primary: '#8B5CF6',     // Purple - wine/spirits
        secondary: '#EDE9FE',
        accent: '#6D28D9'
      },
      keg_weight: {
        primary: '#F59E0B',     // Amber - beer kegs
        secondary: '#FEF3C7',
        accent: '#D97706'
      },
      batch_weight: {
        primary: '#EF4444',     // Red - batch tracking
        secondary: '#FEE2E2',
        accent: '#DC2626'
      }
    },
    
    // Status indicators
    status: {
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#EF4444',
      info: '#3B82F6',
      neutral: '#6B7280'
    },
    
    // Anomaly severity colors
    anomaly: {
      critical: '#DC2626',     // Red
      error: '#EA580C',        // Orange
      warning: '#D97706',      // Amber
      info: '#0284C7'          // Blue
    },
    
    // Container status colors
    container: {
      available: '#10B981',
      in_use: '#F59E0B',
      needs_cleaning: '#EF4444',
      verification_due: '#8B5CF6'
    }
  },
  
  // Typography system
  typography: {
    // Inventory-focused text styles
    itemName: {
      fontSize: '1.125rem',
      fontWeight: '600',
      lineHeight: '1.5'
    },
    quantity: {
      fontSize: '1.5rem',
      fontWeight: '700',
      lineHeight: '1.2'
    },
    workflow: {
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25'
    },
    barcode: {
      fontSize: '0.75rem',
      fontWeight: '400',
      fontFamily: 'monospace'
    }
  },
  
  // Spacing system optimized for touch interfaces
  spacing: {
    // Component spacing
    cardPadding: '1.5rem',
    listItemPadding: '1rem',
    buttonPadding: '0.75rem 1.5rem',
    
    // Touch-friendly spacing for iPad Air 2013
    touchTarget: '44px',      // Apple's recommended minimum
    touchSpacing: '8px',      // Between touch targets
    
    // Layout spacing
    sectionGap: '2rem',
    gridGap: '1rem'
  },
  
  // Border radius system
  borderRadius: {
    small: '0.375rem',
    medium: '0.5rem', 
    large: '0.75rem',
    pill: '9999px'
  },
  
  // Shadow system for depth
  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    modal: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    floating: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  }
}

// ============================================================================
// COMPONENT STYLE GENERATORS
// ============================================================================

export const getWorkflowStyles = (workflow: string) => {
  const workflowColors = StockDesignTokens.colors.workflows[workflow as keyof typeof StockDesignTokens.colors.workflows]
  
  if (!workflowColors) {
    return StockDesignTokens.colors.workflows.unit_count
  }
  
  return {
    primary: workflowColors.primary,
    secondary: workflowColors.secondary,
    accent: workflowColors.accent,
    
    // Tailwind classes
    bgPrimary: `bg-[${workflowColors.primary}]`,
    bgSecondary: `bg-[${workflowColors.secondary}]`,
    textPrimary: `text-[${workflowColors.primary}]`,
    borderPrimary: `border-[${workflowColors.primary}]`
  }
}

export const getAnomalyStyles = (severity: string) => {
  const severityColors = {
    critical: StockDesignTokens.colors.anomaly.critical,
    error: StockDesignTokens.colors.anomaly.error,
    warning: StockDesignTokens.colors.anomaly.warning,
    info: StockDesignTokens.colors.anomaly.info
  }
  
  const color = severityColors[severity as keyof typeof severityColors] || severityColors.info
  
  return {
    backgroundColor: color,
    borderColor: color,
    textColor: '#FFFFFF',
    
    // Tailwind classes
    bgClass: `bg-[${color}]`,
    borderClass: `border-[${color}]`,
    textClass: 'text-white'
  }
}

export const getContainerStyles = (status: string) => {
  const statusColors = StockDesignTokens.colors.container
  const color = statusColors[status as keyof typeof statusColors] || statusColors.available
  
  return {
    backgroundColor: color,
    borderColor: color,
    
    // Tailwind classes
    bgClass: `bg-[${color}]`,
    borderClass: `border-[${color}]`,
    textClass: 'text-white'
  }
}

// ============================================================================
// RESPONSIVE UTILITIES
// ============================================================================

export const StockResponsiveUtils = {
  // Grid configurations for different screen sizes
  getGridCols: (screenSize: 'mobile' | 'tablet' | 'desktop') => {
    switch (screenSize) {
      case 'mobile':
        return 'grid-cols-1'
      case 'tablet':
        return 'grid-cols-2'
      case 'desktop':
        return 'grid-cols-3'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  },
  
  // iPad-specific responsive classes
  ipadOptimized: {
    // Card layouts
    cardGrid: 'grid-cols-1 ipad-portrait:grid-cols-2 ipad-landscape:grid-cols-3',
    listLayout: 'flex-col ipad-landscape:flex-row',
    
    // Touch targets
    button: 'min-h-[44px] min-w-[44px]', // Apple's minimum touch target
    input: 'min-h-[44px]',
    
    // Modal sizes
    modal: 'w-full max-w-lg ipad:max-w-2xl',
    fullscreenModal: 'w-full h-full ipad:w-[90vw] ipad:h-[90vh] ipad:rounded-lg'
  }
}

// ============================================================================
// STOCK MODULE CORE CLASS
// ============================================================================

export class StockModuleCore extends BaseJiGRModule {
  constructor() {
    super('stock-module')
    this.setupStockCapabilities()
  }
  
  private setupStockCapabilities() {
    // Register stock-specific capabilities
    this.addCapability('inventory-counting', {
      workflows: ['unit_count', 'container_weight', 'bottle_hybrid', 'keg_weight', 'batch_weight'],
      anomalyDetection: true,
      realTimeValidation: true
    })
    
    this.addCapability('container-management', {
      barcodeGeneration: true,
      tareWeightTracking: true,
      verificationScheduling: true,
      smartAssignment: true
    })
    
    this.addCapability('workflow-automation', {
      autoContainerRecommendation: true,
      anomalyPreventionRules: true,
      intelligentDefaults: true
    })
  }
  
  // Get design tokens for components
  getDesignTokens() {
    return StockDesignTokens
  }
  
  // Get workflow-specific styling
  getWorkflowStyling(workflow: string) {
    return getWorkflowStyles(workflow)
  }
  
  // Get responsive utilities
  getResponsiveUtils() {
    return StockResponsiveUtils
  }
}

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

export const WorkflowConfig = {
  unit_count: {
    name: 'Manual Count',
    description: 'Traditional manual counting',
    icon: 'Calculator',
    requiredFields: ['counted_quantity'],
    optionalFields: ['notes'],
    validation: {
      minQuantity: 0,
      maxQuantity: 999999
    }
  },
  
  container_weight: {
    name: 'Container Weight',
    description: 'Bulk items in labeled containers',
    icon: 'Scale',
    requiredFields: ['container_instance_id', 'gross_weight_grams'],
    optionalFields: ['tare_weight_grams', 'notes'],
    validation: {
      minWeight: 0,
      maxWeight: 50000, // 50kg
      requiresContainer: true
    }
  },
  
  bottle_hybrid: {
    name: 'Bottle Hybrid',
    description: 'Wine/spirits with full + partial counting',
    icon: 'Wine',
    requiredFields: ['full_bottles_count'],
    optionalFields: ['partial_bottles_weight', 'notes'],
    validation: {
      minBottles: 0,
      maxBottles: 1000,
      requiresBottleConfig: true
    }
  },
  
  keg_weight: {
    name: 'Keg Weight',
    description: 'Beer kegs with freshness tracking',
    icon: 'Beer',
    requiredFields: ['gross_weight_grams'],
    optionalFields: ['keg_temperature_celsius', 'keg_tapped_date', 'notes'],
    validation: {
      minWeight: 5000,  // 5kg (empty keg minimum)
      maxWeight: 80000, // 80kg (full keg maximum)
      requiresKegConfig: true
    }
  },
  
  batch_weight: {
    name: 'Batch Weight',
    description: 'In-house prep with expiration tracking',
    icon: 'ChefHat',
    requiredFields: ['container_instance_id', 'gross_weight_grams'],
    optionalFields: ['batch_date', 'use_by_date', 'notes'],
    validation: {
      minWeight: 0,
      maxWeight: 25000, // 25kg
      requiresContainer: true,
      requiresBatchTracking: true
    }
  }
}

// Export singleton instance
export const stockModuleCore = new StockModuleCore()