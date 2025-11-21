/**
 * Context Detection System for Page/Module Awareness
 * 
 * Intelligent system for detecting current page context, user permissions,
 * and system state to provide contextual help and explanations.
 */

import { PageContext, ExplanationContent } from './explanationTypes';
import { MODULE_CONFIGS, getModuleConfig } from './module-config';

/**
 * Enhanced context detector with deep page analysis
 */
export class ExplanationContextDetector {
  private observers: MutationObserver[] = [];
  private contextCache: Map<string, PageContext> = new Map();
  private lastDetectedContext: PageContext | null = null;

  /**
   * Detect comprehensive page context from URL, DOM, and state
   */
  detectPageContext(options: {
    userId?: string;
    companyId?: string;
    userRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
    permissions?: string[];
    customData?: any;
  } = {}): PageContext {
    const cacheKey = this.generateCacheKey(window.location.href, options);
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const context = this.performContextDetection(options);
    this.contextCache.set(cacheKey, context);
    this.lastDetectedContext = context;
    
    return context;
  }

  /**
   * Perform actual context detection with comprehensive analysis
   */
  private performContextDetection(options: any): PageContext {
    const urlContext = this.detectFromURL();
    const domContext = this.detectFromDOM();
    const stateContext = this.detectFromApplicationState();
    const moduleContext = this.detectModuleSpecificContext(urlContext.moduleKey);

    return {
      ...urlContext,
      ...domContext,
      ...stateContext,
      ...moduleContext,
      userId: options.userId,
      companyId: options.companyId,
      userRole: options.userRole || this.detectUserRole(),
      permissions: options.permissions || this.detectUserPermissions(),
      currentData: {
        ...stateContext.currentData,
        ...options.customData
      }
    };
  }

  /**
   * Extract context from URL structure
   */
  private detectFromURL(): Partial<PageContext> {
    const path = window.location.pathname;
    const search = window.location.search;
    const segments = path.split('/').filter(Boolean);

    let moduleKey = 'general';
    let pageKey = 'help';
    let itemId: string | undefined;

    if (segments.length >= 1) {
      moduleKey = segments[0];
    }

    if (segments.length >= 2) {
      pageKey = segments[1];
    }

    // Extract item ID from various URL patterns
    if (segments.length >= 3) {
      // Pattern: /module/page/itemId
      itemId = segments[2];
    } else {
      // Extract from query parameters
      const params = new URLSearchParams(search);
      itemId = params.get('id') || params.get('itemId') || undefined;
    }

    return {
      moduleKey,
      pageKey,
      fullPath: path + search,
      itemId
    };
  }

  /**
   * Extract context from DOM elements and data attributes
   */
  private detectFromDOM(): Partial<PageContext> {
    const currentData: any = {};

    // Look for data attributes on body or main content
    const bodyEl = document.body;
    const mainEl = document.querySelector('main, [role="main"], .main-content');
    
    const extractDataAttributes = (element: Element | null) => {
      if (!element) return {};
      
      const data: any = {};
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('data-')) {
          const key = attr.name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
          data[key] = attr.value;
        }
      });
      return data;
    };

    Object.assign(currentData, extractDataAttributes(bodyEl));
    Object.assign(currentData, extractDataAttributes(mainEl));

    // Look for specific data in forms or content areas
    const formData = this.extractFormContext();
    const tableData = this.extractTableContext();
    const cardData = this.extractCardContext();

    Object.assign(currentData, formData, tableData, cardData);

    return { currentData };
  }

  /**
   * Extract form context (for create/edit pages)
   */
  private extractFormContext(): any {
    const forms = document.querySelectorAll('form');
    const context: any = {};

    forms.forEach(form => {
      // Extract form type
      if (form.action?.includes('create')) {
        context.action = 'create';
      } else if (form.action?.includes('edit')) {
        context.action = 'edit';
      }

      // Extract form data
      const formData = new FormData(form);
      formData.forEach((value, key) => {
        if (value && typeof value === 'string' && value.trim()) {
          context[key] = value;
        }
      });
    });

    return context;
  }

  /**
   * Extract table context (for list/index pages)
   */
  private extractTableContext(): any {
    const tables = document.querySelectorAll('table, [role="table"]');
    const context: any = {};

    if (tables.length > 0) {
      context.hasTable = true;
      context.tableCount = tables.length;
      
      // Extract pagination info
      const pagination = document.querySelector('.pagination, [aria-label*="pagination"]');
      if (pagination) {
        context.hasPagination = true;
        const currentPage = pagination.querySelector('.current, .active, [aria-current="page"]');
        if (currentPage) {
          context.currentPage = parseInt(currentPage.textContent || '1');
        }
      }

      // Extract search/filter info
      const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]');
      if (searchInput && (searchInput as HTMLInputElement).value) {
        context.searchQuery = (searchInput as HTMLInputElement).value;
      }

      const filters = document.querySelectorAll('select[name*="filter"], .filter-select');
      if (filters.length > 0) {
        context.hasFilters = true;
      }
    }

    return context;
  }

  /**
   * Extract card/item context
   */
  private extractCardContext(): any {
    const context: any = {};

    // Look for item cards or detail views
    const cards = document.querySelectorAll('.card, [role="article"], .item-card');
    if (cards.length > 0) {
      context.hasCards = true;
      context.cardCount = cards.length;
    }

    // Look for item details
    const titleEl = document.querySelector('h1, .page-title, .item-title');
    if (titleEl?.textContent) {
      context.pageTitle = titleEl.textContent.trim();
    }

    return context;
  }

  /**
   * Extract context from application state (localStorage, sessionStorage, etc.)
   */
  private detectFromApplicationState(): Partial<PageContext> {
    const context: any = {};

    try {
      // Check localStorage for user preferences
      const userPrefs = localStorage.getItem('user-preferences');
      if (userPrefs) {
        const prefs = JSON.parse(userPrefs);
        context.userPreferences = prefs;
      }

      // Check sessionStorage for temporary state
      const sessionData = sessionStorage.getItem('current-session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        Object.assign(context, session);
      }

      // Check for authentication state
      const authData = localStorage.getItem('auth-data') || sessionStorage.getItem('auth-data');
      if (authData) {
        const auth = JSON.parse(authData);
        context.userId = auth.userId;
        context.userRole = auth.role;
        context.companyId = auth.companyId;
      }

    } catch (error) {
      console.warn('Error reading application state:', error);
    }

    return context;
  }

  /**
   * Get module-specific context information
   */
  private detectModuleSpecificContext(moduleKey: string): Partial<PageContext> {
    const moduleConfig = getModuleConfig(moduleKey);
    const context: any = {
      moduleConfig: moduleConfig || null
    };

    // Module-specific detection logic
    switch (moduleKey) {
      case 'stock':
        context.currentData = {
          ...context.currentData,
          ...this.detectStockContext()
        };
        break;
        
      case 'recipes':
        context.currentData = {
          ...context.currentData,
          ...this.detectRecipeContext()
        };
        break;
        
      case 'count':
        context.currentData = {
          ...context.currentData,
          ...this.detectCountContext()
        };
        break;
        
      case 'admin':
        context.currentData = {
          ...context.currentData,
          ...this.detectAdminContext()
        };
        break;

      default:
        break;
    }

    return context;
  }

  /**
   * Stock module specific context detection
   */
  private detectStockContext(): any {
    const context: any = {};

    // Look for barcode scanner elements
    if (document.querySelector('[data-barcode-scanner], .barcode-input')) {
      context.hasBarcodeScanner = true;
    }

    // Look for inventory levels
    const inventoryElements = document.querySelectorAll('[data-stock-level], .stock-level');
    if (inventoryElements.length > 0) {
      context.hasInventoryData = true;
      context.inventoryItemCount = inventoryElements.length;
    }

    // Check for low stock alerts
    const lowStockAlerts = document.querySelectorAll('.low-stock, [data-stock-status="low"]');
    if (lowStockAlerts.length > 0) {
      context.hasLowStockAlerts = true;
      context.lowStockCount = lowStockAlerts.length;
    }

    return context;
  }

  /**
   * Recipe module specific context detection
   */
  private detectRecipeContext(): any {
    const context: any = {};

    // Look for recipe ingredients
    const ingredientElements = document.querySelectorAll('.ingredient, [data-ingredient]');
    if (ingredientElements.length > 0) {
      context.hasIngredients = true;
      context.ingredientCount = ingredientElements.length;
    }

    // Look for cost calculations
    if (document.querySelector('.recipe-cost, [data-recipe-cost]')) {
      context.hasCostCalculation = true;
    }

    // Check for portion information
    if (document.querySelector('.portion-size, [data-portions]')) {
      context.hasPortionInfo = true;
    }

    return context;
  }

  /**
   * Count module specific context detection
   */
  private detectCountContext(): any {
    const context: any = {};

    // Look for counting interface
    if (document.querySelector('.count-input, [data-count-session]')) {
      context.isCountingSession = true;
    }

    // Look for variance indicators
    const varianceElements = document.querySelectorAll('.variance, [data-variance]');
    if (varianceElements.length > 0) {
      context.hasVarianceData = true;
      context.varianceCount = varianceElements.length;
    }

    // Check for hardware integration
    if (document.querySelector('[data-bluetooth-scale], [data-hardware]')) {
      context.hasHardwareIntegration = true;
    }

    return context;
  }

  /**
   * Admin module specific context detection
   */
  private detectAdminContext(): any {
    const context: any = {};

    // Look for user management elements
    if (document.querySelector('.user-list, [data-user-management]')) {
      context.hasUserManagement = true;
    }

    // Look for configuration settings
    if (document.querySelector('.settings, .config, [data-settings]')) {
      context.hasSettings = true;
    }

    // Check for system status
    if (document.querySelector('.system-status, [data-system-health]')) {
      context.hasSystemStatus = true;
    }

    return context;
  }

  /**
   * Detect user role from various sources
   */
  private detectUserRole(): 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' {
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam && ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'].includes(roleParam.toUpperCase())) {
      return roleParam.toUpperCase() as any;
    }

    // Check body data attributes
    const bodyRole = document.body.dataset.userRole;
    if (bodyRole && ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'].includes(bodyRole.toUpperCase())) {
      return bodyRole.toUpperCase() as any;
    }

    // Check localStorage
    try {
      const authData = localStorage.getItem('auth-data');
      if (authData) {
        const auth = JSON.parse(authData);
        return auth.role || 'STAFF';
      }
    } catch {
      // Ignore errors
    }

    // Default to STAFF
    return 'STAFF';
  }

  /**
   * Detect user permissions from various sources
   */
  private detectUserPermissions(): string[] {
    const permissions = new Set<string>();

    // Role-based permissions
    const role = this.detectUserRole();
    const rolePermissions = {
      'OWNER': ['read', 'write', 'delete', 'admin', 'export', 'import'],
      'ADMIN': ['read', 'write', 'delete', 'export', 'import'],
      'MANAGER': ['read', 'write', 'export'],
      'STAFF': ['read']
    };

    rolePermissions[role].forEach(p => permissions.add(p));

    // Check for additional permissions in localStorage
    try {
      const authData = localStorage.getItem('auth-data');
      if (authData) {
        const auth = JSON.parse(authData);
        if (auth.permissions && Array.isArray(auth.permissions)) {
          auth.permissions.forEach((p: string) => permissions.add(p));
        }
      }
    } catch {
      // Ignore errors
    }

    return Array.from(permissions);
  }

  /**
   * Generate cache key for context caching
   */
  private generateCacheKey(url: string, options: any): string {
    return `${url}:${JSON.stringify(options)}`;
  }

  /**
   * Check if cached context is still valid
   */
  private isCacheValid(context: PageContext): boolean {
    // Cache is valid for 30 seconds
    const cacheTimeout = 30 * 1000;
    const now = Date.now();
    const contextTime = (context as any)._timestamp || 0;
    
    return (now - contextTime) < cacheTimeout;
  }

  /**
   * Set up observers for dynamic context changes
   */
  setupDynamicDetection(callback: (context: PageContext) => void): void {
    // URL change observer
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        this.contextCache.clear();
        const newContext = this.detectPageContext();
        callback(newContext);
      }
    });

    urlObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-page', 'data-module', 'data-context']
    });

    this.observers.push(urlObserver);

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      this.contextCache.clear();
      const newContext = this.detectPageContext();
      callback(newContext);
    });
  }

  /**
   * Clean up observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.contextCache.clear();
  }

  /**
   * Get last detected context
   */
  getLastDetectedContext(): PageContext | null {
    return this.lastDetectedContext;
  }

  /**
   * Force refresh of context cache
   */
  refreshContext(options?: any): PageContext {
    this.contextCache.clear();
    return this.detectPageContext(options);
  }
}

/**
 * Singleton instance for easy global access
 */
export const contextDetector = new ExplanationContextDetector();

/**
 * Utility function for quick context detection
 */
export function detectCurrentPageContext(options?: any): PageContext {
  return contextDetector.detectPageContext(options);
}

/**
 * Hook for React components to get current context
 */
export function useCurrentPageContext(options?: any) {
  return detectCurrentPageContext(options);
}

export default ExplanationContextDetector;