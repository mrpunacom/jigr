/**
 * Module Taglines & Purpose Statements
 * Part of JiGR SmartHelp System
 * 
 * Personalized module descriptions with dynamic company name insertion
 * and comprehensive purpose statements for user guidance.
 */

export interface ModuleDefinition {
  moduleKey: string;
  tagline: (companyName: string) => string;
  purpose: string;
  purposeShort: string;
  icon: string;
  color: string; // Primary brand color
  status: 'active' | 'development' | 'planned';
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    moduleKey: 'stock',
    tagline: (companyName) => `${companyName}'s Inventory Command Center`,
    purpose: `Track everything in your kitchen, coolers, and dry storage. Know what you have, what's running low, and what's about to expire—without touching a spreadsheet.`,
    purposeShort: `Real-time inventory tracking with low-stock alerts and expiration warnings.`,
    icon: '📦',
    color: '#3B82F6', // Blue
    status: 'active'
  },
  {
    moduleKey: 'recipes',
    tagline: (companyName) => `${companyName}'s Recipe Library & Costing Engine`,
    purpose: `Create recipes, calculate real-time costs, and maintain consistency. When ingredient prices change, your recipe costs update automatically—no more manual spreadsheet updates.`,
    purposeShort: `Recipe management with automatic costing based on current ingredient prices.`,
    icon: '👨‍🍳',
    color: '#10B981', // Green
    status: 'active'
  },
  {
    moduleKey: 'count',
    tagline: (companyName) => `${companyName}'s Stocktaking System`,
    purpose: `Count inventory faster with Bluetooth scales and barcode scanning. Works offline in walk-in coolers, syncs automatically when you're back online. Find discrepancies before they hurt your bottom line.`,
    purposeShort: `Fast, accurate inventory counting with offline support and variance analysis.`,
    icon: '📋',
    color: '#F59E0B', // Amber
    status: 'active'
  },
  {
    moduleKey: 'menu',
    tagline: (companyName) => `${companyName}'s Menu Pricing Intelligence`,
    purpose: `Set profitable menu prices based on actual ingredient costs. Analyze which dishes make money and which don't. Adjust pricing confidently when costs change.`,
    purposeShort: `Data-driven menu pricing with profitability analysis and cost-plus calculations.`,
    icon: '💰',
    color: '#8B5CF6', // Purple
    status: 'active'
  },
  {
    moduleKey: 'upload',
    tagline: (companyName) => `${companyName}'s Digital Filing Cabinet`,
    purpose: `Snap photos of delivery dockets and invoices. AI extracts the data automatically—no more typing supplier details or prices. Keep digital records for compliance without filing cabinets.`,
    purposeShort: `AI-powered document processing for delivery dockets, invoices, and compliance records.`,
    icon: '📤',
    color: '#06B6D4', // Cyan
    status: 'active'
  },
  {
    moduleKey: 'vendors',
    tagline: (companyName) => `${companyName}'s Supplier Hub`,
    purpose: `Manage all your suppliers in one place. Track delivery performance, compare prices, and see who's reliable and who's not. Make better purchasing decisions with actual data.`,
    purposeShort: `Centralized supplier management with performance tracking and price comparison.`,
    icon: '🏪',
    color: '#EC4899', // Pink
    status: 'active'
  },
  {
    moduleKey: 'admin',
    tagline: (companyName) => `${companyName}'s Control Panel`,
    purpose: `Manage your team, configure workflows, and control who sees what. Set up the system to match how your kitchen actually operates—not the other way around.`,
    purposeShort: `System administration, team management, and workflow configuration.`,
    icon: '⚙️',
    color: '#6B7280', // Gray
    status: 'active'
  },
  {
    moduleKey: 'repairs',
    tagline: (companyName) => `${companyName}'s Maintenance Manager`,
    purpose: `Track equipment repairs, log safety issues, and manage preventive maintenance. Never miss a health inspector item or let a broken oven surprise you mid-service. Stay on top of what needs fixing.`,
    purposeShort: `Equipment maintenance tracking, safety issue logging, and repair management.`,
    icon: '🔧',
    color: '#EF4444', // Red
    status: 'development'
  },
  {
    moduleKey: 'diary',
    tagline: (companyName) => `${companyName}'s Daily Operations Journal`,
    purpose: `Your kitchen's black box recorder. See what expired today, who logged in, what changed, and when. Perfect for troubleshooting issues or proving compliance during audits.`,
    purposeShort: `Comprehensive activity log for expiring items, team logins, and system changes.`,
    icon: '📓',
    color: '#14B8A6', // Teal
    status: 'development'
  }
];

/**
 * Get module definition by key
 */
export function getModuleDefinition(moduleKey: string): ModuleDefinition | null {
  return MODULE_DEFINITIONS.find(module => module.moduleKey === moduleKey) || null;
}

/**
 * Get all active module definitions
 */
export function getActiveModuleDefinitions(): ModuleDefinition[] {
  return MODULE_DEFINITIONS.filter(module => module.status === 'active');
}

/**
 * Get all module definitions (active, development, planned)
 */
export function getAllModuleDefinitions(): ModuleDefinition[] {
  return MODULE_DEFINITIONS;
}

/**
 * Generate personalized tagline for a module
 */
export function getPersonalizedTagline(moduleKey: string, companyName: string): string {
  const module = getModuleDefinition(moduleKey);
  return module ? module.tagline(companyName) : `${companyName}'s ${moduleKey.toUpperCase()} Module`;
}

/**
 * Get module purpose statement
 */
export function getModulePurpose(moduleKey: string, useShort: boolean = false): string {
  const module = getModuleDefinition(moduleKey);
  if (!module) return '';
  return useShort ? module.purposeShort : module.purpose;
}

/**
 * Default company name fallback for development/testing
 */
export const DEFAULT_COMPANY_NAME = "The Merchant";

/**
 * Helper to get company name from user context (with fallback)
 */
export function getCompanyName(user?: any): string {
  // Try to get from user object
  if (user?.company?.name) {
    return user.company.name;
  }
  
  // Try alternative user data structures
  if (user?.user_metadata?.company_name) {
    return user.user_metadata.company_name;
  }
  
  if (user?.app_metadata?.company_name) {
    return user.app_metadata.company_name;
  }
  
  // Fallback to default
  return DEFAULT_COMPANY_NAME;
}