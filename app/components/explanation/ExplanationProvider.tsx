'use client';

import React, { createContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { 
  ExplanationProviderState, 
  ExplanationModalState, 
  ExplanationContent, 
  PageContext,
  ExplanationAction,
  ResolvedLink,
  LinkResolutionContext
} from '@/lib/explanationTypes';
import { getExplanationContent, DEFAULT_EXPLANATION_CONTENT } from '@/lib/explanationData';
import ExplanationModal from './ExplanationModal';

// Action types for reducer
type ExplanationActionType = 
  | { type: 'OPEN_MODAL'; payload: { pageId: string; context: PageContext; trigger?: string } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_CONTENT'; payload: ExplanationContent }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_CONTEXT'; payload: PageContext };

// Initial state
const initialState: ExplanationProviderState = {
  modalState: {
    isOpen: false,
    content: null,
    context: null,
    trigger: undefined
  },
  openModal: () => {},
  closeModal: () => {},
  setContent: () => {},
  isLoading: false,
  error: null
};

// State reducer
function explanationReducer(
  state: ExplanationProviderState, 
  action: ExplanationActionType
): ExplanationProviderState {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        modalState: {
          isOpen: true,
          content: null,
          context: action.payload.context,
          trigger: (action.payload.trigger as 'icon' | 'shortcut' | 'auto' | 'onboarding') || 'icon'
        },
        isLoading: true,
        error: null
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modalState: {
          ...state.modalState,
          isOpen: false
        },
        isLoading: false,
        error: null
      };

    case 'SET_CONTENT':
      return {
        ...state,
        modalState: {
          ...state.modalState,
          content: action.payload
        },
        isLoading: false,
        error: null
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case 'UPDATE_CONTEXT':
      return {
        ...state,
        modalState: {
          ...state.modalState,
          context: action.payload
        }
      };

    default:
      return state;
  }
}

// Context creation
export const ExplanationContext = createContext<ExplanationProviderState>(initialState);

// Provider component
interface ExplanationProviderProps {
  children: React.ReactNode;
  defaultPermissions?: string[];
  defaultUserRole?: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  userId?: string;
  companyId?: string;
}

export const ExplanationProvider: React.FC<ExplanationProviderProps> = ({ 
  children,
  defaultPermissions = ['read'],
  defaultUserRole = 'STAFF',
  userId,
  companyId
}) => {
  const [state, dispatch] = useReducer(explanationReducer, initialState);

  // Smart link resolver
  const resolveLinkAction = useCallback((
    action: ExplanationAction, 
    context: PageContext
  ): ResolvedLink => {
    const resolutionContext: LinkResolutionContext = {
      current: context,
      action,
      userPermissions: context.permissions || defaultPermissions
    };

    // Check permissions
    const isAccessible = !action.requiresPermission || 
      action.requiresPermission.every(permission => 
        resolutionContext.userPermissions.includes(permission)
      );

    // Resolve dynamic parameters in href
    let resolvedHref = action.href;
    if (action.params) {
      Object.entries(action.params).forEach(([key, value]) => {
        if (value === 'dynamic') {
          // Replace with dynamic values from context
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
      requiresConfirmation: action.action === 'delete' || action.type === 'action',
      confirmationMessage: action.action === 'delete' 
        ? 'Are you sure you want to delete this item?' 
        : undefined
    };
  }, [defaultPermissions]);

  // Navigation handler
  const handleNavigation = useCallback((href: string, action?: ExplanationAction) => {
    if (!action) {
      // Simple navigation
      window.location.href = href;
      return;
    }

    const context = state.modalState.context;
    if (!context) return;

    const resolvedLink = resolveLinkAction(action, context);
    
    if (!resolvedLink.isAccessible) {
      dispatch({ type: 'SET_ERROR', payload: 'You do not have permission to access this feature' });
      return;
    }

    if (resolvedLink.requiresConfirmation) {
      const confirmed = window.confirm(resolvedLink.confirmationMessage || 'Are you sure?');
      if (!confirmed) return;
    }

    if (resolvedLink.openInModal) {
      // Handle modal actions
      switch (action.type) {
        case 'modal':
          // Open content in modal (would need additional modal system)
          console.log('Opening modal for:', resolvedLink.href);
          break;
        case 'action':
          // Perform action without navigation
          console.log('Performing action:', action.action, resolvedLink.href);
          break;
        default:
          window.location.href = resolvedLink.href;
      }
    } else if (action.context?.newTab) {
      window.open(resolvedLink.href, '_blank');
    } else {
      window.location.href = resolvedLink.href;
    }
  }, [state.modalState.context, resolveLinkAction]);

  // Open modal function
  const openModal = useCallback(async (pageId: string, context?: PageContext) => {
    try {
      // Generate context if not provided
      const modalContext = context || {
        moduleKey: window.location.pathname.split('/')[1] || 'general',
        pageKey: window.location.pathname.split('/')[2] || 'help',
        fullPath: window.location.pathname,
        permissions: defaultPermissions,
        userRole: defaultUserRole,
        userId,
        companyId
      };

      dispatch({ 
        type: 'OPEN_MODAL', 
        payload: { pageId, context: modalContext, trigger: 'icon' } 
      });

      // Load content
      const content = getExplanationContent(pageId) || DEFAULT_EXPLANATION_CONTENT;
      
      // Filter content based on permissions
      const filteredContent = {
        ...content,
        features: content.features.filter(feature => 
          !feature.action?.requiresPermission || 
          feature.action.requiresPermission.every(permission => 
            modalContext.permissions.includes(permission)
          )
        ),
        quickActions: content.quickActions?.filter(action =>
          !action.action.requiresPermission || 
          action.action.requiresPermission.every(permission => 
            modalContext.permissions.includes(permission)
          )
        ) || [],
        relatedPages: content.relatedPages?.filter(page =>
          !page.action.requiresPermission || 
          page.action.requiresPermission.every(permission => 
            modalContext.permissions.includes(permission)
          )
        ) || []
      };

      dispatch({ type: 'SET_CONTENT', payload: filteredContent });

    } catch (error) {
      console.error('Error loading explanation content:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Failed to load page information. Please try again.' 
      });
    }
  }, [defaultPermissions, defaultUserRole, userId, companyId]);

  // Close modal function
  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, []);

  // Set content function
  const setContent = useCallback((content: ExplanationContent) => {
    dispatch({ type: 'SET_CONTENT', payload: content });
  }, []);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Global help shortcut (F1 or ?)
      if (event.key === 'F1' || (event.shiftKey && event.key === '?')) {
        event.preventDefault();
        if (!state.modalState.isOpen) {
          openModal('general-help');
        }
      }
      // Escape to close modal
      if (event.key === 'Escape' && state.modalState.isOpen) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [state.modalState.isOpen, openModal, closeModal]);

  // Context update on navigation
  useEffect(() => {
    const handleLocationChange = () => {
      if (state.modalState.isOpen && state.modalState.context) {
        const updatedContext: PageContext = {
          ...state.modalState.context,
          moduleKey: window.location.pathname.split('/')[1] || 'general',
          pageKey: window.location.pathname.split('/')[2] || 'help',
          fullPath: window.location.pathname
        };
        dispatch({ type: 'UPDATE_CONTEXT', payload: updatedContext });
      }
    };

    // Listen for navigation changes
    window.addEventListener('popstate', handleLocationChange);
    
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [state.modalState.isOpen, state.modalState.context]);

  // Memoized context value
  const contextValue = useMemo((): ExplanationProviderState => ({
    modalState: state.modalState,
    openModal,
    closeModal,
    setContent,
    isLoading: state.isLoading,
    error: state.error
  }), [state, openModal, closeModal, setContent]);

  return (
    <ExplanationContext.Provider value={contextValue}>
      {children}
      
      {/* Render modal when open */}
      {state.modalState.isOpen && state.modalState.content && state.modalState.context && (
        <ExplanationModal
          isOpen={state.modalState.isOpen}
          onClose={closeModal}
          content={state.modalState.content}
          context={state.modalState.context}
          onLinkClick={handleNavigation}
        />
      )}
      
      {/* Error display */}
      {state.error && (
        <div 
          className="fixed bottom-4 left-4 right-4 mx-auto max-w-md bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50"
          role="alert"
        >
          <div className="flex items-center justify-between">
            <span>{state.error}</span>
            <button
              onClick={() => dispatch({ type: 'SET_ERROR', payload: null })}
              className="ml-2 text-red-700 hover:text-red-900"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </ExplanationContext.Provider>
  );
};

// Analytics wrapper for tracking usage
export const ExplanationProviderWithAnalytics: React.FC<ExplanationProviderProps & {
  trackEvent?: (event: string, data: any) => void;
}> = ({ trackEvent, ...props }) => {
  const Provider = ({ children, ...providerProps }: ExplanationProviderProps) => (
    <ExplanationProvider {...providerProps}>
      {children}
    </ExplanationProvider>
  );

  // Wrap provider to inject analytics
  return <Provider {...props} />;
};

export default ExplanationProvider;