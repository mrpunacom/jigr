/**
 * Comprehensive Explanation Content Repository
 * 
 * Central storage for all page explanations with smart cross-linking
 * and contextual help for the JiGR platform.
 */

import { ExplanationContent, ExplanationContentMap } from './explanationTypes';

export const EXPLANATION_CONTENT: ExplanationContentMap = {
  // ============================================================================
  // STOCK MODULE - Inventory Management
  // ============================================================================
  
  'stock-console': {
    pageId: 'stock-console',
    title: 'Stock Console',
    overview: 'Central hub for inventory management and tracking. View current stock levels, monitor low inventory alerts, and access quick actions for inventory tasks.',
    features: [
      {
        title: 'Inventory Overview',
        description: 'Real-time view of all stock levels, expiring items, and inventory alerts',
        icon: '📊',
        action: {
          href: '/stock/console',
          type: 'navigation',
          label: 'Refresh View'
        },
        importance: 'high'
      },
      {
        title: 'Quick Stock Search',
        description: 'Find items instantly using search, barcode scanning, or category filters',
        icon: '🔍',
        action: {
          href: '/stock/items',
          type: 'navigation',
          label: 'Browse All Items'
        },
        importance: 'high'
      },
      {
        title: 'Low Stock Alerts',
        description: 'Automated notifications when items fall below minimum stock levels',
        icon: '⚠️',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Add New Item',
        description: 'Create a new inventory item with barcode scanning',
        action: {
          href: '/stock/items?action=create',
          type: 'modal',
          openInModal: true,
          label: 'Create Item'
        },
        icon: '➕',
        shortcut: 'Ctrl+N'
      },
      {
        label: 'Start Stocktake',
        description: 'Begin counting inventory for accuracy verification',
        action: {
          href: '/count/new',
          type: 'navigation',
          context: { module: 'count' }
        },
        icon: '📝',
        shortcut: 'Ctrl+C'
      },
      {
        label: 'Generate Report',
        description: 'Create inventory reports for analysis',
        action: {
          href: '/stock/reports',
          type: 'navigation'
        },
        icon: '📈'
      }
    ],
    tips: [
      {
        text: 'Use barcode scanning for faster item lookup and management',
        type: 'tip',
        action: {
          href: '/dev/hardware-testing',
          type: 'navigation',
          label: 'Test Hardware'
        }
      },
      {
        text: 'Set up minimum stock levels to receive automatic low stock alerts',
        type: 'info'
      },
      {
        text: 'Regular stocktakes improve inventory accuracy and reduce waste',
        type: 'success'
      }
    ],
    relatedPages: [
      {
        title: 'Stock Items',
        description: 'Detailed view and management of individual inventory items',
        action: {
          href: '/stock/items',
          type: 'navigation'
        },
        badge: 'Essential'
      },
      {
        title: 'Count Sessions',
        description: 'Physical counting and stocktake management',
        action: {
          href: '/count/console',
          type: 'navigation'
        },
        module: 'count'
      },
      {
        title: 'Recipe Integration',
        description: 'See how stock items are used in recipes',
        action: {
          href: '/recipes',
          type: 'navigation'
        },
        module: 'recipes'
      }
    ],
    lastUpdated: '2025-11-19',
    category: 'module'
  },

  'stock-items': {
    pageId: 'stock-items',
    title: 'Stock Items Management',
    overview: 'Comprehensive inventory item management with detailed tracking, categorization, and integration with counting and recipe systems.',
    features: [
      {
        title: 'Item Database',
        description: 'Complete catalog of all inventory items with photos, descriptions, and specifications',
        icon: '📦',
        importance: 'high'
      },
      {
        title: 'Barcode Integration',
        description: 'Scan or generate barcodes for efficient item identification',
        icon: '📷',
        action: {
          href: '/dev/hardware-testing',
          type: 'navigation',
          label: 'Test Scanner'
        },
        importance: 'high'
      },
      {
        title: 'Category Management',
        description: 'Organize items into logical categories for easier navigation',
        icon: '📂',
        importance: 'medium'
      },
      {
        title: 'Supplier Tracking',
        description: 'Link items to suppliers and track purchasing information',
        icon: '🏪',
        action: {
          href: '/vendors',
          type: 'navigation',
          label: 'Manage Vendors'
        },
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Add Item',
        description: 'Create new inventory item',
        action: {
          href: '/stock/items/create',
          type: 'action',
          action: 'create'
        },
        icon: '➕'
      },
      {
        label: 'Import CSV',
        description: 'Bulk import items from spreadsheet',
        action: {
          href: '/stock/items?action=import',
          type: 'modal',
          openInModal: true
        },
        icon: '📥'
      },
      {
        label: 'Export Data',
        description: 'Download item data as CSV',
        action: {
          href: '/api/stock/export',
          type: 'action',
          action: 'export'
        },
        icon: '📤'
      }
    ],
    tips: [
      {
        text: 'Use clear, descriptive names and include supplier part numbers for easy identification',
        type: 'tip'
      },
      {
        text: 'Upload photos to help staff identify items quickly during counting',
        type: 'info'
      }
    ],
    relatedPages: [
      {
        title: 'Stock Console',
        description: 'Return to inventory overview',
        action: {
          href: '/stock/console',
          type: 'navigation'
        }
      },
      {
        title: 'Vendor Management',
        description: 'Manage suppliers and purchasing',
        action: {
          href: '/vendors',
          type: 'navigation'
        }
      }
    ],
    category: 'page'
  },

  // ============================================================================
  // RECIPES MODULE - Recipe Management & Costing
  // ============================================================================

  'recipes-console': {
    pageId: 'recipes-console',
    title: 'Recipe Management',
    overview: 'Central hub for creating, managing, and costing recipes. Track ingredient usage, calculate food costs, and maintain consistent preparation standards.',
    features: [
      {
        title: 'Recipe Library',
        description: 'Complete collection of all recipes with detailed ingredients and instructions',
        icon: '👨‍🍳',
        importance: 'high'
      },
      {
        title: 'Real-time Costing',
        description: 'Automatic cost calculation based on current ingredient prices',
        icon: '💰',
        action: {
          href: '/recipes?view=costing',
          type: 'navigation',
          params: { view: 'dynamic' }
        },
        importance: 'high'
      },
      {
        title: 'Portion Control',
        description: 'Standardized serving sizes and yield calculations',
        icon: '⚖️',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'New Recipe',
        description: 'Create a new recipe with ingredients and instructions',
        action: {
          href: '/recipes/create',
          type: 'action',
          action: 'create'
        },
        icon: '📝'
      },
      {
        label: 'Sub-Recipes',
        description: 'Manage reusable recipe components',
        action: {
          href: '/recipes/sub-recipes',
          type: 'navigation'
        },
        icon: '🧩'
      },
      {
        label: 'Production Records',
        description: 'Track recipe preparation and yield',
        action: {
          href: '/recipes/production',
          type: 'navigation'
        },
        icon: '📋'
      }
    ],
    relatedPages: [
      {
        title: 'Stock Items',
        description: 'Manage ingredient inventory',
        action: {
          href: '/stock/items',
          type: 'navigation'
        },
        module: 'stock'
      },
      {
        title: 'Menu Pricing',
        description: 'Set menu prices based on recipe costs',
        action: {
          href: '/menu/pricing',
          type: 'navigation'
        },
        module: 'menu'
      }
    ],
    category: 'module'
  },

  // ============================================================================
  // COUNT MODULE - Stocktaking & Inventory Counting
  // ============================================================================

  'count-console': {
    pageId: 'count-console',
    title: 'Count Console',
    overview: 'Manage stocktaking sessions and inventory counting activities. Track counting progress, handle discrepancies, and maintain accurate inventory records.',
    features: [
      {
        title: 'Active Count Sessions',
        description: 'Monitor ongoing stocktaking activities and team progress',
        icon: '🎯',
        importance: 'high'
      },
      {
        title: 'Variance Analysis',
        description: 'Compare counted quantities with expected stock levels',
        icon: '📊',
        action: {
          href: '/count/variance',
          type: 'navigation'
        },
        importance: 'high'
      },
      {
        title: 'Hardware Integration',
        description: 'Use Bluetooth scales and barcode scanners for accurate counting',
        icon: '📱',
        action: {
          href: '/dev/hardware-testing',
          type: 'navigation',
          label: 'Test Hardware'
        },
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'New Count Session',
        description: 'Start a new stocktaking session',
        action: {
          href: '/count/new',
          type: 'action',
          action: 'create'
        },
        icon: '🆕'
      },
      {
        label: 'View History',
        description: 'Review past counting sessions',
        action: {
          href: '/count/history',
          type: 'navigation'
        },
        icon: '📚'
      }
    ],
    tips: [
      {
        text: 'Use hardware scales for accurate weight measurements of bulk items',
        type: 'tip'
      },
      {
        text: 'Count during quiet periods to minimize disruption to operations',
        type: 'info'
      }
    ],
    relatedPages: [
      {
        title: 'Stock Console',
        description: 'View current inventory levels',
        action: {
          href: '/stock/console',
          type: 'navigation'
        },
        module: 'stock'
      }
    ],
    category: 'module'
  },

  // ============================================================================
  // ADMIN MODULE - System Configuration
  // ============================================================================

  'admin-console': {
    pageId: 'admin-console',
    title: 'Admin Console',
    overview: 'System administration and configuration hub. Manage user accounts, configure system settings, and oversee platform operations.',
    features: [
      {
        title: 'User Management',
        description: 'Add team members, set roles, and manage access permissions',
        icon: '👥',
        action: {
          href: '/admin/team',
          type: 'navigation'
        },
        importance: 'high',
        requiresPermission: ['admin']
      },
      {
        title: 'System Configuration',
        description: 'Configure modules, workflows, and business settings',
        icon: '⚙️',
        action: {
          href: '/admin/configure',
          type: 'navigation'
        },
        importance: 'high',
        requiresPermission: ['admin']
      },
      {
        title: 'Analytics & Reporting',
        description: 'System usage statistics and performance metrics',
        icon: '📈',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Add Team Member',
        description: 'Invite new user to the platform',
        action: {
          href: '/admin/team?action=invite',
          type: 'modal',
          openInModal: true,
          requiresPermission: ['admin']
        },
        icon: '👤'
      },
      {
        label: 'Configure Modules',
        description: 'Set up business workflows and processes',
        action: {
          href: '/admin/configure',
          type: 'navigation',
          requiresPermission: ['admin']
        },
        icon: '🔧'
      }
    ],
    tips: [
      {
        text: 'Regular configuration reviews ensure optimal system performance',
        type: 'tip'
      },
      {
        text: 'Use role-based permissions to maintain data security',
        type: 'warning'
      }
    ],
    category: 'module'
  },

  // ============================================================================
  // MENU MODULE - Menu Engineering & Pricing
  // ============================================================================

  'menu-pricing': {
    pageId: 'menu-pricing',
    title: 'Menu Pricing',
    overview: 'Set optimal menu prices based on ingredient costs, target margins, and market positioning. Monitor profitability and adjust pricing strategies.',
    features: [
      {
        title: 'Cost-Plus Pricing',
        description: 'Calculate menu prices based on ingredient costs and desired profit margins',
        icon: '💰',
        importance: 'high'
      },
      {
        title: 'Competitive Analysis',
        description: 'Compare pricing with market rates and competitor offerings',
        icon: '🎯',
        importance: 'medium'
      },
      {
        title: 'Profitability Tracking',
        description: 'Monitor item performance and profit contribution',
        icon: '📊',
        action: {
          href: '/menu/analysis',
          type: 'navigation'
        },
        importance: 'high'
      }
    ],
    quickActions: [
      {
        label: 'Update Prices',
        description: 'Bulk update menu pricing',
        action: {
          href: '/menu/pricing?action=bulk-update',
          type: 'modal',
          openInModal: true
        },
        icon: '💵'
      },
      {
        label: 'Menu Engineering',
        description: 'Analyze item performance and positioning',
        action: {
          href: '/menu/engineering',
          type: 'navigation'
        },
        icon: '🔬'
      }
    ],
    relatedPages: [
      {
        title: 'Recipe Costs',
        description: 'View ingredient costs for accurate pricing',
        action: {
          href: '/recipes?view=costing',
          type: 'navigation'
        },
        module: 'recipes'
      }
    ],
    category: 'page'
  },

  // ============================================================================
  // UPLOAD MODULE - Document Management
  // ============================================================================

  'upload-console': {
    pageId: 'upload-console',
    title: 'Upload Console',
    overview: 'Document management and processing center. Upload delivery dockets, process compliance documents, and manage digital records.',
    features: [
      {
        title: 'Document Processing',
        description: 'AI-powered extraction of data from delivery dockets and invoices',
        icon: '🤖',
        importance: 'high'
      },
      {
        title: 'Compliance Tracking',
        description: 'Monitor document compliance and regulatory requirements',
        icon: '📋',
        importance: 'high'
      },
      {
        title: 'Digital Archive',
        description: 'Secure storage and retrieval of all business documents',
        icon: '🗄️',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Upload Document',
        description: 'Add new delivery docket or invoice',
        action: {
          href: '/upload/capture',
          type: 'navigation'
        },
        icon: '📤'
      },
      {
        label: 'View Reports',
        description: 'Generate compliance and processing reports',
        action: {
          href: '/upload/reports',
          type: 'navigation'
        },
        icon: '📊'
      }
    ],
    category: 'module'
  },

  // ============================================================================
  // VENDORS MODULE - Supplier Management
  // ============================================================================

  'vendors-management': {
    pageId: 'vendors-management',
    title: 'Vendor Management',
    overview: 'Comprehensive supplier relationship management. Track vendor performance, manage contracts, and monitor delivery schedules.',
    features: [
      {
        title: 'Supplier Database',
        description: 'Complete contact information and business details for all suppliers',
        icon: '🏪',
        importance: 'high'
      },
      {
        title: 'Performance Tracking',
        description: 'Monitor delivery times, quality scores, and reliability metrics',
        icon: '📈',
        importance: 'high'
      },
      {
        title: 'Order Management',
        description: 'Track purchase orders and delivery schedules',
        icon: '📦',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Add Vendor',
        description: 'Register new supplier',
        action: {
          href: '/vendors?action=create',
          type: 'modal',
          openInModal: true
        },
        icon: '➕'
      },
      {
        label: 'Performance Report',
        description: 'Generate vendor performance analysis',
        action: {
          href: '/vendors?report=performance',
          type: 'action',
          action: 'export'
        },
        icon: '📊'
      }
    ],
    relatedPages: [
      {
        title: 'Stock Items',
        description: 'Link suppliers to inventory items',
        action: {
          href: '/stock/items',
          type: 'navigation'
        },
        module: 'stock'
      },
      {
        title: 'Upload Documents',
        description: 'Process delivery dockets from vendors',
        action: {
          href: '/upload/capture',
          type: 'navigation'
        },
        module: 'upload'
      }
    ],
    category: 'page'
  },

  // ============================================================================
  // DEVELOPMENT MODULE - Developer Tools
  // ============================================================================

  'dev-hardware-testing': {
    pageId: 'dev-hardware-testing',
    title: 'Hardware Integration Testing',
    overview: 'Test and validate Bluetooth scales, barcode scanners, and label printers. Ensure optimal hardware performance for iPad Air 2013 compatibility.',
    features: [
      {
        title: 'Bluetooth Scale Testing',
        description: 'Connect and test Bluetooth scales for accurate weight measurements',
        icon: '⚖️',
        importance: 'high'
      },
      {
        title: 'Barcode Scanner Testing',
        description: 'Validate camera-based barcode scanning functionality',
        icon: '📷',
        importance: 'high'
      },
      {
        title: 'Label Printer Testing',
        description: 'Test label generation and printing for Brother/Dymo printers',
        icon: '🖨️',
        importance: 'medium'
      },
      {
        title: 'iPad Air 2013 Compatibility',
        description: 'Verify hardware integration works on legacy iPad devices',
        icon: '📱',
        importance: 'high'
      }
    ],
    quickActions: [
      {
        label: 'Run Diagnostics',
        description: 'Comprehensive hardware compatibility check',
        action: {
          href: '/dev/hardware-testing?action=diagnostics',
          type: 'action'
        },
        icon: '🔍'
      },
      {
        label: 'Test All Hardware',
        description: 'Full integration test sequence',
        action: {
          href: '/dev/hardware-testing?test=all',
          type: 'action'
        },
        icon: '🧪'
      }
    ],
    tips: [
      {
        text: 'Ensure HTTPS is enabled for camera and Bluetooth access',
        type: 'warning'
      },
      {
        text: 'Use manual entry fallbacks when hardware is unavailable',
        type: 'tip'
      }
    ],
    category: 'feature'
  },

  // ============================================================================
  // UNIVERSAL PAGES
  // ============================================================================

  'general-help': {
    pageId: 'general-help',
    title: 'JiGR Platform Help',
    overview: 'Welcome to JiGR - your complete hospitality compliance and inventory management platform. Get started with key features and workflows.',
    features: [
      {
        title: 'Module Navigation',
        description: 'Access different areas of the platform: Stock, Recipes, Count, Admin, Upload, and Menu',
        icon: '🧭',
        importance: 'high'
      },
      {
        title: 'User Permissions',
        description: 'Role-based access ensures you see only relevant features for your position',
        icon: '🔐',
        importance: 'medium'
      },
      {
        title: 'Mobile Optimized',
        description: 'Full functionality on iPad Air 2013 and modern mobile devices',
        icon: '📱',
        importance: 'medium'
      }
    ],
    quickActions: [
      {
        label: 'Stock Management',
        description: 'Start with inventory tracking',
        action: {
          href: '/stock/console',
          type: 'navigation'
        },
        icon: '📦'
      },
      {
        label: 'Recipe Creation',
        description: 'Build your recipe library',
        action: {
          href: '/recipes',
          type: 'navigation'
        },
        icon: '👨‍🍳'
      },
      {
        label: 'Stocktaking',
        description: 'Count your inventory',
        action: {
          href: '/count/console',
          type: 'navigation'
        },
        icon: '📝'
      }
    ],
    tips: [
      {
        text: 'Click the help icon (?) on any page for specific guidance',
        type: 'tip'
      },
      {
        text: 'Use keyboard shortcuts for faster navigation (shown in quick actions)',
        type: 'info'
      }
    ],
    category: 'workflow'
  }
};

// Helper functions for content retrieval and management
export function getExplanationContent(pageId: string): ExplanationContent | null {
  return EXPLANATION_CONTENT[pageId] || null;
}

export function getAllExplanationContent(): ExplanationContentMap {
  return EXPLANATION_CONTENT;
}

export function getModuleContent(moduleKey: string): ExplanationContent[] {
  return Object.values(EXPLANATION_CONTENT).filter(
    content => content.pageId.startsWith(moduleKey)
  );
}

export function searchExplanationContent(query: string): ExplanationContent[] {
  const normalizedQuery = query.toLowerCase();
  
  return Object.values(EXPLANATION_CONTENT).filter(content => 
    content.title.toLowerCase().includes(normalizedQuery) ||
    content.overview.toLowerCase().includes(normalizedQuery) ||
    content.features.some(feature => 
      feature.title.toLowerCase().includes(normalizedQuery) ||
      feature.description.toLowerCase().includes(normalizedQuery)
    )
  );
}

// Content validation utility
export function validateExplanationContent(content: ExplanationContent): boolean {
  return !!(
    content.pageId &&
    content.title &&
    content.overview &&
    content.features &&
    Array.isArray(content.features) &&
    content.features.length > 0
  );
}

// Default content for when specific page content is not found
export const DEFAULT_EXPLANATION_CONTENT: ExplanationContent = {
  pageId: 'default',
  title: 'Page Information',
  overview: 'This page is part of the JiGR platform. Use the navigation menu to explore different modules and features.',
  features: [
    {
      title: 'Platform Navigation',
      description: 'Use the hamburger menu to access different modules',
      icon: '🧭',
      importance: 'high'
    },
    {
      title: 'Help System',
      description: 'Click the help icon on any page for specific guidance',
      icon: '❓',
      importance: 'medium'
    }
  ],
  quickActions: [
    {
      label: 'Return to Dashboard',
      description: 'Go back to the main overview',
      action: {
        href: '/',
        type: 'navigation'
      },
      icon: '🏠'
    }
  ],
  tips: [
    {
      text: 'Each page has contextual help available through the help icon',
      type: 'tip'
    }
  ],
  category: 'page'
};