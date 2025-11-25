/**
 * Smart Link Resolution and Navigation System
 * 
 * Handles intelligent routing, permission checking, and context-aware
 * navigation for the explanation system with advanced features.
 */

import {
  ExplanationAction,
  PageContext,
  ResolvedLink,
  LinkResolutionContext,
  ActionResolver,
  ExplanationError
} from './explanationTypes';

/**
 * Advanced link resolver with comprehensive permission and context handling
 */
export class SmartLinkResolver {
  private permissionChecker: (permission: string, context: PageContext) => boolean;
  private routeValidator: (href: string) => boolean;
  private analyticsTracker?: (event: string, data: any) => void;

  constructor(
    permissionChecker?: (permission: string, context: PageContext) => boolean,
    routeValidator?: (href: string) => boolean,
    analyticsTracker?: (event: string, data: any) => void
  ) {
    this.permissionChecker = permissionChecker || this.defaultPermissionChecker;
    this.routeValidator = routeValidator || this.defaultRouteValidator;
    this.analyticsTracker = analyticsTracker;
  }

  /**
   * Main resolution method with comprehensive error handling
   */
  resolveAction(action: ExplanationAction, context: PageContext): ResolvedLink {
    try {
      // Track resolution attempt
      this.analyticsTracker?.('link_resolution_attempt', {
        action: action.type,
        href: action.href,
        moduleKey: context.moduleKey,
        pageKey: context.pageKey
      });

      const resolutionContext: LinkResolutionContext = {
        current: context,
        action,
        userPermissions: context.permissions || []
      };

      // Step 1: Resolve dynamic parameters
      const resolvedHref = this.resolveDynamicParameters(action, context);

      // Step 2: Validate route exists
      if (!this.routeValidator(resolvedHref)) {
        throw new Error(`Invalid route: ${resolvedHref}`);
      }

      // Step 3: Check permissions
      const isAccessible = this.checkPermissions(action, context);

      // Step 4: Determine modal behavior
      const openInModal = this.shouldOpenInModal(action, context);

      // Step 5: Check if confirmation is required
      const { requiresConfirmation, confirmationMessage } = this.getConfirmationRequirements(action);

      const resolvedLink: ResolvedLink = {
        href: resolvedHref,
        isAccessible,
        openInModal,
        requiresConfirmation,
        confirmationMessage
      };

      // Track successful resolution
      this.analyticsTracker?.('link_resolution_success', {
        originalHref: action.href,
        resolvedHref,
        isAccessible,
        openInModal
      });

      return resolvedLink;

    } catch (error) {
      // Track resolution error
      this.analyticsTracker?.('link_resolution_error', {
        error: error instanceof Error ? error.message : String(error),
        action: action.type,
        href: action.href
      });

      // Return safe fallback
      return {
        href: '#',
        isAccessible: false,
        openInModal: false,
        requiresConfirmation: true,
        confirmationMessage: `Navigation error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Resolve dynamic parameters in href string
   */
  private resolveDynamicParameters(action: ExplanationAction, context: PageContext): string {
    let resolvedHref = action.href;

    if (action.params) {
      Object.entries(action.params).forEach(([key, value]) => {
        if (value === 'dynamic') {
          // Try to resolve from context in order of preference
          const dynamicValue = 
            context.currentData?.[key] || 
            context.itemId || 
            context.userId ||
            context.companyId ||
            '';
          
          resolvedHref = resolvedHref.replace(`{${key}}`, encodeURIComponent(dynamicValue));
        } else {
          resolvedHref = resolvedHref.replace(`{${key}}`, encodeURIComponent(value));
        }
      });
    }

    // Handle query parameters
    if (action.context?.preserveState) {
      const currentParams = new URLSearchParams(window.location.search);
      const url = new URL(resolvedHref, window.location.origin);
      
      // Preserve relevant state parameters
      ['filter', 'sort', 'view', 'page'].forEach(param => {
        if (currentParams.has(param)) {
          url.searchParams.set(param, currentParams.get(param)!);
        }
      });
      
      resolvedHref = url.pathname + url.search;
    }

    return resolvedHref;
  }

  /**
   * Check if user has required permissions for action
   */
  private checkPermissions(action: ExplanationAction, context: PageContext): boolean {
    if (!action.requiresPermission || action.requiresPermission.length === 0) {
      return true;
    }

    return action.requiresPermission.every(permission => 
      this.permissionChecker(permission, context)
    );
  }

  /**
   * Determine if action should open in modal
   */
  private shouldOpenInModal(action: ExplanationAction, context: PageContext): boolean {
    // Explicit modal flag
    if (action.openInModal !== undefined) {
      return action.openInModal;
    }

    // Type-based modal behavior
    if (action.type === 'modal') {
      return true;
    }

    // Context-based modal behavior
    if (action.type === 'action' && ['create', 'edit', 'view'].includes(action.action || '')) {
      // Small forms and views can be modals
      return true;
    }

    // Cross-module navigation should not be modal
    const targetModule = action.href.split('/')[1];
    if (targetModule && targetModule !== context.moduleKey) {
      return false;
    }

    return false;
  }

  /**
   * Get confirmation requirements for action
   */
  private getConfirmationRequirements(action: ExplanationAction): {
    requiresConfirmation: boolean;
    confirmationMessage?: string;
  } {
    if (action.action === 'delete') {
      return {
        requiresConfirmation: true,
        confirmationMessage: 'Are you sure you want to delete this item? This action cannot be undone.'
      };
    }

    if (action.action === 'export') {
      return {
        requiresConfirmation: true,
        confirmationMessage: 'This will download data to your device. Continue?'
      };
    }

    if (action.type === 'external') {
      return {
        requiresConfirmation: true,
        confirmationMessage: 'This will open an external website. Continue?'
      };
    }

    if (action.action === 'import') {
      return {
        requiresConfirmation: true,
        confirmationMessage: 'This will replace existing data. Are you sure you want to continue?'
      };
    }

    return { requiresConfirmation: false };
  }

  /**
   * Default permission checker
   */
  private defaultPermissionChecker(permission: string, context: PageContext): boolean {
    const userPermissions = context.permissions || [];
    const userRole = context.userRole || 'STAFF';

    // Role-based permission mapping
    const rolePermissions: Record<string, string[]> = {
      'OWNER': ['read', 'write', 'delete', 'admin', 'export', 'import'],
      'ADMIN': ['read', 'write', 'delete', 'export', 'import'],
      'MANAGER': ['read', 'write', 'export'],
      'STAFF': ['read']
    };

    const allowedPermissions = rolePermissions[userRole] || ['read'];
    
    return userPermissions.includes(permission) || allowedPermissions.includes(permission);
  }

  /**
   * Default route validator
   */
  private defaultRouteValidator(href: string): boolean {
    // Basic validation - check if route structure is valid
    try {
      const url = new URL(href, window.location.origin);
      const path = url.pathname;
      
      // Check for valid path structure
      if (path.startsWith('/api/')) {
        return true; // API routes are valid
      }

      // Check for valid module routes
      const segments = path.split('/').filter(Boolean);
      if (segments.length === 0) return true; // Root path

      const validModules = ['stock', 'recipes', 'count', 'admin', 'menu', 'upload', 'vendors', 'dev'];
      const moduleKey = segments[0];

      return validModules.includes(moduleKey) || moduleKey === 'api';
    } catch {
      return false;
    }
  }
}

/**
 * Navigation handler with smart routing
 */
export class SmartNavigationHandler {
  private resolver: SmartLinkResolver;
  private navigationHistory: string[] = [];

  constructor(resolver?: SmartLinkResolver) {
    this.resolver = resolver || new SmartLinkResolver();
  }

  /**
   * Handle navigation with comprehensive error handling and user feedback
   */
  async navigateToAction(
    action: ExplanationAction,
    context: PageContext,
    options: {
      onError?: (error: ExplanationError) => void;
      onSuccess?: (href: string) => void;
      onConfirmation?: (message: string) => Promise<boolean>;
    } = {}
  ): Promise<boolean> {
    try {
      const resolvedLink = this.resolver.resolveAction(action, context);

      // Check accessibility
      if (!resolvedLink.isAccessible) {
        const error: ExplanationError = {
          type: 'permission_denied',
          message: 'You do not have permission to access this feature',
          action,
          context
        };
        options.onError?.(error);
        return false;
      }

      // Handle confirmation
      if (resolvedLink.requiresConfirmation) {
        const confirmed = options.onConfirmation 
          ? await options.onConfirmation(resolvedLink.confirmationMessage || 'Are you sure?')
          : window.confirm(resolvedLink.confirmationMessage || 'Are you sure?');
          
        if (!confirmed) return false;
      }

      // Track navigation
      this.navigationHistory.push(resolvedLink.href);

      // Perform navigation
      await this.performNavigation(resolvedLink, action, context);
      
      options.onSuccess?.(resolvedLink.href);
      return true;

    } catch (error) {
      const navigationError: ExplanationError = {
        type: 'network_error',
        message: error instanceof Error ? error.message : 'Navigation failed',
        action,
        context
      };
      options.onError?.(navigationError);
      return false;
    }
  }

  /**
   * Perform the actual navigation based on link type
   */
  private async performNavigation(
    resolvedLink: ResolvedLink,
    action: ExplanationAction,
    context: PageContext
  ): Promise<void> {
    if (resolvedLink.openInModal) {
      // Handle modal navigation
      await this.handleModalNavigation(resolvedLink, action, context);
    } else if (action.context?.newTab) {
      // Open in new tab
      window.open(resolvedLink.href, '_blank');
    } else if (action.type === 'external') {
      // External link
      window.open(resolvedLink.href, '_blank', 'noopener,noreferrer');
    } else {
      // Standard navigation
      if (action.context?.preserveState) {
        // Use router if available, otherwise fallback to location
        if (typeof window !== 'undefined' && window.history?.pushState) {
          window.history.pushState({}, '', resolvedLink.href);
          // Trigger navigation event for frameworks to pick up
          window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
          window.location.href = resolvedLink.href;
        }
      } else {
        window.location.href = resolvedLink.href;
      }
    }
  }

  /**
   * Handle modal navigation (placeholder for modal system integration)
   */
  private async handleModalNavigation(
    resolvedLink: ResolvedLink,
    action: ExplanationAction,
    context: PageContext
  ): Promise<void> {
    // This would integrate with your modal system
    console.log('Opening modal for:', resolvedLink.href);
    
    // Example modal integration:
    // - For action type 'create': open creation modal
    // - For action type 'edit': open edit modal
    // - For action type 'view': open detail modal
    
    // Emit custom event for modal system to handle
    window.dispatchEvent(new CustomEvent('explanation-modal-navigation', {
      detail: { resolvedLink, action, context }
    }));
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Clear navigation history
   */
  clearNavigationHistory(): void {
    this.navigationHistory = [];
  }
}

/**
 * Factory function for creating configured resolver
 */
export function createSmartLinkResolver(options: {
  permissionChecker?: (permission: string, context: PageContext) => boolean;
  routeValidator?: (href: string) => boolean;
  analyticsTracker?: (event: string, data: any) => void;
} = {}): SmartLinkResolver {
  return new SmartLinkResolver(
    options.permissionChecker,
    options.routeValidator,
    options.analyticsTracker
  );
}

/**
 * Factory function for creating configured navigation handler
 */
export function createSmartNavigationHandler(
  resolver?: SmartLinkResolver
): SmartNavigationHandler {
  return new SmartNavigationHandler(resolver);
}

/**
 * Default export for easy use
 */
const defaultResolver = new SmartLinkResolver();
const defaultNavigationHandler = new SmartNavigationHandler(defaultResolver);

export { defaultResolver, defaultNavigationHandler };
export default SmartLinkResolver;