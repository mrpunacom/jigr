/**
 * TypeScript Type Definitions for Universal Explanation Modal System
 * 
 * Defines interfaces and types for contextual help and navigation
 * throughout the JiGR platform with smart cross-linking capabilities.
 */

export interface ExplanationAction {
  href: string;
  type: 'navigation' | 'action' | 'modal' | 'external';
  action?: 'create' | 'edit' | 'view' | 'delete' | 'export' | 'import';
  openInModal?: boolean;
  requiresPermission?: string[];
  params?: Record<string, string | 'dynamic'>;
  context?: {
    module?: string;
    preserveState?: boolean;
    newTab?: boolean;
  };
  label?: string; // For display in UI
}

export interface ExplanationFeature {
  title: string;
  description: string;
  icon?: string; // Emoji or icon name
  action?: ExplanationAction;
  importance?: 'high' | 'medium' | 'low';
  isNew?: boolean; // Highlight new features
}

export interface ExplanationQuickAction {
  label: string;
  description: string;
  action: ExplanationAction;
  shortcut?: string; // Keyboard shortcut
  icon?: string;
}

export interface ExplanationTip {
  text: string;
  type?: 'tip' | 'warning' | 'info' | 'success';
  action?: ExplanationAction; // Optional link for more info
}

export interface ExplanationRelatedPage {
  title: string;
  description: string;
  action: ExplanationAction;
  module?: string; // For cross-module links
  badge?: string; // e.g., "New", "Updated", "Popular"
}

export interface ExplanationContent {
  pageId: string;
  title: string;
  overview: string;
  features: ExplanationFeature[];
  quickActions?: ExplanationQuickAction[];
  tips?: ExplanationTip[];
  relatedPages?: ExplanationRelatedPage[];
  lastUpdated?: string;
  version?: string;
  category?: 'module' | 'page' | 'workflow' | 'feature';
}

export interface PageContext {
  moduleKey: string;
  pageKey: string;
  fullPath: string;
  itemId?: string;
  userId?: string;
  permissions: string[];
  currentData?: any;
  userRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  companyId?: string;
}

export interface ExplanationModalState {
  isOpen: boolean;
  content: ExplanationContent | null;
  context: PageContext | null;
  trigger?: 'icon' | 'shortcut' | 'auto' | 'onboarding';
}

export interface ExplanationProviderState {
  modalState: ExplanationModalState;
  openModal: (pageId: string, context?: PageContext) => void;
  closeModal: () => void;
  setContent: (content: ExplanationContent) => void;
  isLoading: boolean;
  error: string | null;
}

export interface ExplanationTriggerProps {
  pageId?: string; // Auto-detect if not provided
  position?: 'header' | 'floating' | 'inline' | 'custom';
  variant?: 'icon' | 'button' | 'text';
  size?: 'small' | 'medium' | 'large';
  placement?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  showTooltip?: boolean;
  tooltipText?: string;
  customContent?: ExplanationContent;
  className?: string;
  style?: React.CSSProperties;
  onTrigger?: (pageId: string) => void;
}

export interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ExplanationContent;
  context: PageContext;
  className?: string;
}

// Smart link resolution interfaces
export interface LinkResolutionContext {
  current: PageContext;
  action: ExplanationAction;
  userPermissions: string[];
}

export interface ResolvedLink {
  href: string;
  isAccessible: boolean;
  openInModal: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

// Content storage interfaces
export interface ContentRepository {
  getContent: (pageId: string) => Promise<ExplanationContent | null>;
  getAllContent: () => Promise<Record<string, ExplanationContent>>;
  updateContent: (pageId: string, content: ExplanationContent) => Promise<void>;
  searchContent: (query: string) => Promise<ExplanationContent[]>;
}

// Analytics and tracking interfaces
export interface ExplanationAnalytics {
  pageId: string;
  action: 'open' | 'close' | 'link_click' | 'tip_view' | 'search';
  timestamp: number;
  userId?: string;
  context?: PageContext;
  metadata?: Record<string, any>;
}

// Configuration interfaces
export interface ExplanationConfig {
  enableAnalytics: boolean;
  defaultPosition: ExplanationTriggerProps['position'];
  animationDuration: number;
  maxModalWidth: string;
  enableKeyboardShortcuts: boolean;
  globalShortcut?: string; // e.g., "?" or "F1"
  enableAutoShow?: boolean; // Show help automatically for new users
  contentCacheTTL?: number; // Cache duration in minutes
}

// Module-specific configuration
export interface ModuleExplanationConfig {
  moduleKey: string;
  defaultPageId?: string;
  customTriggerPosition?: ExplanationTriggerProps['position'];
  hiddenFeatures?: string[]; // Hide certain features based on module context
  customActions?: Record<string, ExplanationAction>;
  priority?: number; // For content ordering
}

// Permission and role-based content filtering
export interface ContentFilter {
  includePermissions?: string[];
  excludePermissions?: string[];
  includeRoles?: string[];
  excludeRoles?: string[];
  requiresFeatureFlag?: string;
  customFilter?: (context: PageContext) => boolean;
}

export interface FilteredExplanationContent extends ExplanationContent {
  filteredFeatures: ExplanationFeature[];
  filteredQuickActions: ExplanationQuickAction[];
  filteredRelatedPages: ExplanationRelatedPage[];
  accessibleLinksCount: number;
}

// Error handling
export interface ExplanationError {
  type: 'content_not_found' | 'permission_denied' | 'network_error' | 'invalid_link';
  message: string;
  pageId?: string;
  action?: ExplanationAction;
  context?: PageContext;
}

// Search and discovery
export interface ExplanationSearchResult {
  content: ExplanationContent;
  relevanceScore: number;
  matchedFields: string[];
  snippet?: string;
}

// Dynamic content loading
export interface DynamicContentLoader {
  pageId: string;
  loader: (context: PageContext) => Promise<Partial<ExplanationContent>>;
  dependencies?: string[]; // Re-load when these context values change
  cacheable?: boolean;
}

// Onboarding and guided tours
export interface OnboardingStep {
  pageId: string;
  elementSelector?: string; // For highlighting specific elements
  content: Pick<ExplanationContent, 'title' | 'overview'>;
  action?: ExplanationAction;
  order: number;
  optional?: boolean;
}

export interface OnboardingTour {
  id: string;
  title: string;
  description: string;
  steps: OnboardingStep[];
  targetRole?: string[];
  triggerCondition?: 'first_login' | 'feature_access' | 'manual';
}

// Export utility type for comprehensive content definition
export type ComprehensiveExplanationContent = ExplanationContent & {
  contentFilter?: ContentFilter;
  moduleConfig?: ModuleExplanationConfig;
  dynamicLoaders?: DynamicContentLoader[];
  onboardingSteps?: OnboardingStep[];
  analytics?: Partial<ExplanationAnalytics>;
};

// Helper types for better development experience
export type ExplanationContentMap = Record<string, ExplanationContent>;
export type ModuleContentMap = Record<string, Record<string, ExplanationContent>>;
export type ActionResolver = (action: ExplanationAction, context: PageContext) => ResolvedLink;
export type ContentProvider = (pageId: string, context: PageContext) => Promise<ExplanationContent | null>;