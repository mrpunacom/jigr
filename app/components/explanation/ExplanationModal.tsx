'use client';

import React, { useEffect, useRef } from 'react';
// Removed Lucide React imports - using Tabler icons via CSS classes
import { ExplanationContent, ExplanationFeature, ExplanationQuickAction, ExplanationTip, PageContext } from '@/lib/explanationTypes';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: ExplanationContent;
  context: PageContext;
  onLinkClick?: (href: string, action?: any) => void;
}

export default function ExplanationModal({
  isOpen,
  onClose,
  content,
  context,
  onLinkClick
}: ExplanationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard navigation and accessibility
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleTabTrap = (event: KeyboardEvent) => {
      if (!modalRef.current || event.key !== 'Tab') return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0] as HTMLElement;
      const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabTrap);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabTrap);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  // Handle link clicks with context awareness
  const handleActionClick = (action: any) => {
    if (onLinkClick) {
      onLinkClick(action.href, action);
    }
    // Close modal after navigation unless specified otherwise
    if (!action.keepModalOpen) {
      onClose();
    }
  };

  // Get icon for feature importance
  const getFeatureIcon = (feature: ExplanationFeature) => {
    if (feature.icon) return feature.icon;
    
    switch (feature.importance) {
      case 'high': return '⭐';
      case 'medium': return '💡';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  // Get icon for tip type
  const getTipIcon = (tip: ExplanationTip) => {
    switch (tip.type) {
      case 'warning': return <span className="icon-[tabler--alert-triangle] w-4 h-4 text-yellow-500"></span>;
      case 'success': return <span className="icon-[tabler--circle-check] w-4 h-4 text-green-500"></span>;
      case 'info': return <span className="icon-[tabler--info-circle] w-4 h-4 text-blue-500"></span>;
      case 'tip':
      default: return <span className="icon-[tabler--bulb] w-4 h-4 text-purple-500"></span>;
    }
  };

  // Get style for tip type
  const getTipStyle = (tip: ExplanationTip) => {
    switch (tip.type) {
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'tip':
      default: return 'bg-purple-50 border-purple-200 text-purple-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ 
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)' // Safari 12 compatibility
      }}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{
          minHeight: '60vh',
          // iPad Air 2013 specific optimizations
          transform: 'translateZ(0)', // Force hardware acceleration
          WebkitTransform: 'translateZ(0)'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explanation-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex-1">
            <h2 
              id="explanation-title"
              className="text-2xl font-bold text-gray-900 mb-1"
            >
              {content.title}
            </h2>
            <p className="text-sm text-gray-600">
              {context.moduleKey.toUpperCase()} Module • {context.pageKey} Page
            </p>
          </div>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            style={{ 
              minHeight: '48px', 
              minWidth: '48px' // iPad Air 2013 touch targets
            }}
            aria-label="Close explanation"
          >
            <span className="icon-[tabler--x] w-6 h-6 text-gray-500"></span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Overview */}
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-500">📖</span>
              What this page does
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {content.overview}
            </p>
          </div>

          {/* Features */}
          {content.features && content.features.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-green-500">⚡</span>
                Key Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.features.map((feature, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">
                        {getFeatureIcon(feature)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                          {feature.title}
                          {feature.importance === 'high' && (
                            <span className="icon-[tabler--star] w-4 h-4 text-yellow-500"></span>
                          )}
                          {feature.isNew && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              New
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {feature.description}
                        </p>
                        {feature.action && (
                          <button
                            onClick={() => handleActionClick(feature.action)}
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            style={{ minHeight: '32px' }} // Touch target
                          >
                            {feature.action.label || 'Learn More'}
                            <span className="icon-[tabler--arrow-right] w-3 h-3"></span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {content.quickActions && content.quickActions.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="icon-[tabler--bolt] w-5 h-5 text-purple-500"></span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {content.quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action.action)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left group"
                    style={{ minHeight: '80px' }} // iPad touch target
                  >
                    <div className="flex items-start gap-3">
                      {action.icon && (
                        <span className="text-xl flex-shrink-0">{action.icon}</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-purple-700 mb-1 flex items-center gap-2">
                          {action.label}
                          {action.shortcut && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {action.shortcut}
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {content.tips && content.tips.length > 0 && (
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="icon-[tabler--bulb] w-5 h-5 text-yellow-500"></span>
                Tips & Tricks
              </h3>
              <div className="space-y-3">
                {content.tips.map((tip, index) => (
                  <div 
                    key={index}
                    className={`p-3 border rounded-lg ${getTipStyle(tip)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getTipIcon(tip)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          {tip.text}
                        </p>
                        {tip.action && (
                          <button
                            onClick={() => handleActionClick(tip.action)}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                            style={{ minHeight: '32px' }} // Touch target
                          >
                            {tip.action.label || 'Learn More'}
                            <span className="icon-[tabler--external-link] w-3 h-3"></span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Pages */}
          {content.relatedPages && content.relatedPages.length > 0 && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-orange-500">🔗</span>
                Related Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.relatedPages.map((page, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(page.action)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-all text-left group"
                    style={{ minHeight: '80px' }} // iPad touch target
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 group-hover:text-orange-700 mb-1 flex items-center gap-2">
                          {page.title}
                          {page.badge && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                              {page.badge}
                            </span>
                          )}
                          {page.module && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {page.module.toUpperCase()}
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {page.description}
                        </p>
                      </div>
                      <span className="icon-[tabler--arrow-right] w-4 h-4 text-gray-400 group-hover:text-orange-500 flex-shrink-0 ml-2"></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {content.lastUpdated && (
              <span>Last updated: {content.lastUpdated}</span>
            )}
            {content.version && (
              <span className="ml-2">• Version {content.version}</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
            style={{ minHeight: '44px' }} // iPad Air 2013 touch target
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}