'use client';

import { useContext, useCallback, useMemo, useEffect, useState } from 'react';
import { 
  ExplanationProviderState,
  ExplanationContent,
  PageContext,
  ExplanationAction,
  ResolvedLink
} from '@/lib/explanationTypes';
import { ExplanationContext } from './ExplanationProvider';
import { getExplanationContent, searchExplanationContent } from '@/lib/explanationData';

/**
 * Main hook for accessing the explanation system
 */
export const useExplanation = () => {
  const context = useContext(ExplanationContext);
  
  if (!context) {
    throw new Error('useExplanation must be used within an ExplanationProvider');
  }
  
  return context;
};

/**
 * Hook for easy page-specific explanation access
 */
export const usePageExplanation = (pageId?: string, customContext?: Partial<PageContext>) => {
  const { openModal, modalState, isLoading, error } = useExplanation();
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [pageContext, setPageContext] = useState<PageContext | null>(null);

  // Auto-detect page ID and context
  useEffect(() => {
    const detectPageInfo = () => {
      const path = window.location.pathname;
      const segments = path.split('/').filter(Boolean);
      
      const detectedPageId = pageId || (() => {
        if (segments.length === 0) return 'general-help';
        if (segments.length === 1) return `${segments[0]}-console`;
        return `${segments[0]}-${segments[1]}`;
      })();
      
      const detectedContext: PageContext = {
        moduleKey: segments[0] || 'general',
        pageKey: segments[1] || 'help',
        fullPath: path,
        permissions: ['read'],
        userRole: 'STAFF',
        ...customContext
      };
      
      setCurrentPageId(detectedPageId);
      setPageContext(detectedContext);
    };

    detectPageInfo();
  }, [pageId, customContext]);

  const openPageHelp = useCallback(() => {
    if (currentPageId && pageContext) {
      openModal(currentPageId, pageContext);
    }
  }, [openModal, currentPageId, pageContext]);

  return {
    openPageHelp,
    isModalOpen: modalState.isOpen,
    currentContent: modalState.content,
    isLoading,
    error,
    pageId: currentPageId,
    context: pageContext
  };
};

/**
 * Hook for content search and discovery
 */
export const useExplanationSearch = () => {
  const [searchResults, setSearchResults] = useState<ExplanationContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      const results = searchExplanationContent(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchQuery('');
  }, []);

  return {
    search,
    clearSearch,
    searchResults,
    isSearching,
    searchQuery
  };
};

/**
 * Hook for smart link resolution with permission checking
 */
export const useExplanationLinks = () => {
  const resolveAction = useCallback((
    action: ExplanationAction,
    context: PageContext,
    userPermissions: string[] = ['read']
  ): ResolvedLink => {
    // Check permissions
    const isAccessible = !action.requiresPermission || 
      action.requiresPermission.every(permission => 
        userPermissions.includes(permission)
      );

    // Resolve dynamic parameters
    let resolvedHref = action.href;
    if (action.params) {
      Object.entries(action.params).forEach(([key, value]) => {
        if (value === 'dynamic') {
          const dynamicValue = context.currentData?.[key] || context.itemId || '';
          resolvedHref = resolvedHref.replace(`{${key}}`, encodeURIComponent(dynamicValue));
        } else {
          resolvedHref = resolvedHref.replace(`{${key}}`, encodeURIComponent(value));
        }
      });
    }

    return {
      href: resolvedHref,
      isAccessible,
      openInModal: action.openInModal || action.type === 'modal',
      requiresConfirmation: action.action === 'delete' || 
                           (action.type === 'action' && ['delete', 'export'].includes(action.action || '')),
      confirmationMessage: action.action === 'delete' 
        ? 'Are you sure you want to delete this item?' 
        : action.action === 'export'
        ? 'This will download data to your device. Continue?'
        : undefined
    };
  }, []);

  const navigateToAction = useCallback((
    action: ExplanationAction,
    context: PageContext,
    userPermissions: string[] = ['read']
  ) => {
    const resolvedLink = resolveAction(action, context, userPermissions);
    
    if (!resolvedLink.isAccessible) {
      alert('You do not have permission to access this feature');
      return false;
    }

    if (resolvedLink.requiresConfirmation) {
      const confirmed = window.confirm(resolvedLink.confirmationMessage || 'Are you sure?');
      if (!confirmed) return false;
    }

    if (resolvedLink.openInModal) {
      // Handle modal actions
      console.log('Opening modal for:', resolvedLink.href);
      return true;
    } else if (action.context?.newTab) {
      window.open(resolvedLink.href, '_blank');
      return true;
    } else {
      window.location.href = resolvedLink.href;
      return true;
    }
  }, [resolveAction]);

  return {
    resolveAction,
    navigateToAction
  };
};

/**
 * Hook for content management and caching
 */
export const useExplanationContent = (pageId: string) => {
  const [content, setContent] = useState<ExplanationContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async (id: string = pageId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const explanationContent = getExplanationContent(id);
      setContent(explanationContent);
    } catch (err) {
      setError('Failed to load content');
      console.error('Content loading error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  useEffect(() => {
    if (pageId) {
      loadContent();
    }
  }, [pageId, loadContent]);

  const refreshContent = useCallback(() => {
    loadContent();
  }, [loadContent]);

  return {
    content,
    isLoading,
    error,
    refreshContent,
    loadContent
  };
};

/**
 * Hook for keyboard shortcuts and accessibility
 */
export const useExplanationKeyboard = () => {
  const { openModal, closeModal, modalState } = useExplanation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Help shortcut (F1 or Shift + ?)
      if (event.key === 'F1' || (event.shiftKey && event.key === '?')) {
        event.preventDefault();
        if (!modalState.isOpen) {
          openModal('general-help');
        }
      }
      
      // Close modal with Escape
      if (event.key === 'Escape' && modalState.isOpen) {
        event.preventDefault();
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openModal, closeModal, modalState.isOpen]);

  return {
    openHelpShortcut: 'F1 or Shift + ?',
    closeModalShortcut: 'Escape'
  };
};

/**
 * Hook for contextual help suggestions
 */
export const useContextualHelp = (context: PageContext) => {
  const [suggestions, setSuggestions] = useState<ExplanationContent[]>([]);
  const { openModal } = useExplanation();

  useEffect(() => {
    const generateSuggestions = () => {
      const currentModule = context.moduleKey;
      const currentPage = context.pageKey;
      
      // Get related content suggestions based on current context
      const moduleSuggestions = searchExplanationContent(currentModule).slice(0, 3);
      const pageSuggestions = searchExplanationContent(currentPage).slice(0, 2);
      
      // Combine and deduplicate
      const allSuggestions = [...moduleSuggestions, ...pageSuggestions];
      const uniqueSuggestions = allSuggestions.filter(
        (content, index, array) => 
          array.findIndex(c => c.pageId === content.pageId) === index
      );
      
      setSuggestions(uniqueSuggestions.slice(0, 5));
    };

    generateSuggestions();
  }, [context]);

  const openSuggestion = useCallback((suggestionId: string) => {
    openModal(suggestionId, context);
  }, [openModal, context]);

  return {
    suggestions,
    openSuggestion
  };
};

/**
 * Hook for explanation analytics and tracking
 */
export const useExplanationAnalytics = () => {
  const trackEvent = useCallback((
    action: 'open' | 'close' | 'link_click' | 'search',
    data: {
      pageId?: string;
      context?: PageContext;
      searchQuery?: string;
      linkHref?: string;
      timestamp?: number;
    }
  ) => {
    // Track explanation usage for analytics
    const event = {
      action,
      timestamp: Date.now(),
      ...data
    };
    
    // Send to analytics service (placeholder)
    console.log('Explanation Analytics:', event);
    
    // Could integrate with services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics endpoint
  }, []);

  return { trackEvent };
};

/**
 * Combined hook for easy setup
 */
export const useExplanationSystem = (pageId?: string, customContext?: Partial<PageContext>) => {
  const explanation = useExplanation();
  const pageHelp = usePageExplanation(pageId, customContext);
  const search = useExplanationSearch();
  const links = useExplanationLinks();
  const keyboard = useExplanationKeyboard();
  const analytics = useExplanationAnalytics();

  return {
    ...explanation,
    ...pageHelp,
    search,
    links,
    keyboard,
    analytics
  };
};

export default useExplanation;