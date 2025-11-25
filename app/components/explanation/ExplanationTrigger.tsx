'use client';

import React, { useEffect, useState, useRef } from 'react';
// Removed Lucide React imports - using Tabler icons via CSS classes
import { ExplanationTriggerProps, PageContext } from '@/lib/explanationTypes';

interface ExplanationTriggerComponent extends React.FC<ExplanationTriggerProps> {
  onTrigger?: (pageId: string, context: PageContext) => void;
}

const ExplanationTrigger: ExplanationTriggerComponent = ({
  pageId,
  position = 'floating',
  variant = 'icon',
  size = 'medium',
  placement = 'bottom-right',
  showTooltip: enableTooltip = true,
  tooltipText,
  customContent,
  className = '',
  style,
  onTrigger
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(pageId);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-detect page ID from URL if not provided
  useEffect(() => {
    if (!pageId) {
      const detectPageId = () => {
        const path = window.location.pathname;
        const segments = path.split('/').filter(Boolean);
        
        if (segments.length === 0) return 'general-help';
        if (segments.length === 1) return `${segments[0]}-console`;
        return `${segments[0]}-${segments[1]}`;
      };
      
      setCurrentPageId(detectPageId());
    }
  }, [pageId]);

  // Generate context from current page
  const generateContext = (): PageContext => {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    
    return {
      moduleKey: segments[0] || 'general',
      pageKey: segments[1] || 'help',
      fullPath: path,
      permissions: ['read'], // Default permissions - should be replaced with actual user permissions
      userRole: 'STAFF' // Default role - should be replaced with actual user role
    };
  };

  const handleClick = () => {
    const context = generateContext();
    const targetPageId = currentPageId || 'general-help';
    
    if (onTrigger) {
      onTrigger(targetPageId);
    }
  };

  const handleMouseEnter = () => {
    if (enableTooltip) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setIsTooltipVisible(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Icon selection based on variant and context
  const getIcon = () => {
    switch (variant) {
      case 'icon':
        return <span className="icon-[tabler--help-circle] w-full h-full"></span>;
      case 'button':
        return <span className="icon-[tabler--book-open] w-4 h-4"></span>;
      case 'text':
        return <span className="icon-[tabler--bulb] w-4 h-4"></span>;
      default:
        return <span className="icon-[tabler--info-circle] w-full h-full"></span>;
    }
  };

  // Size classes for different sizes
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-8 h-8 p-1';
      case 'medium':
        return 'w-10 h-10 p-2';
      case 'large':
        return 'w-12 h-12 p-2.5';
      default:
        return 'w-10 h-10 p-2';
    }
  };

  // Position classes for different positions
  const getPositionClasses = () => {
    switch (position) {
      case 'header':
        return 'relative inline-flex';
      case 'floating':
        return `fixed ${getPlacementClasses()} z-40`;
      case 'inline':
        return 'inline-flex';
      case 'custom':
        return '';
      default:
        return 'relative inline-flex';
    }
  };

  // Placement classes for floating position
  const getPlacementClasses = () => {
    switch (placement) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  // Variant-specific styling
  const getVariantClasses = () => {
    switch (variant) {
      case 'icon':
        return 'rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200';
      case 'button':
        return 'rounded-lg bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-300 shadow-md hover:shadow-lg transition-all duration-200 px-3 py-2';
      case 'text':
        return 'rounded-md bg-transparent text-gray-600 hover:text-blue-600 hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 transition-colors duration-200 px-2 py-1';
      default:
        return 'rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 shadow-lg hover:shadow-xl transition-all duration-200';
    }
  };

  // Tooltip text selection
  const getTooltipText = () => {
    if (tooltipText) return tooltipText;
    
    switch (variant) {
      case 'icon':
        return 'Page Help & Information';
      case 'button':
        return 'View page guide';
      case 'text':
        return 'Learn about this page';
      default:
        return 'Help';
    }
  };

  const baseClasses = [
    'flex items-center justify-center',
    'focus:outline-none',
    'cursor-pointer',
    'user-select-none',
    // iPad Air 2013 touch optimizations
    'touch-manipulation',
    // Safari 12 compatibility
    'transform-gpu'
  ].join(' ');

  const buttonClasses = [
    baseClasses,
    getPositionClasses(),
    variant === 'icon' ? getSizeClasses() : '',
    getVariantClasses(),
    className
  ].filter(Boolean).join(' ');

  const buttonStyle = {
    // iPad Air 2013 minimum touch targets
    minHeight: variant === 'text' ? '32px' : '48px',
    minWidth: variant === 'text' ? '32px' : '48px',
    // Hardware acceleration for smooth animations
    willChange: 'transform',
    WebkitTransform: 'translateZ(0)',
    transform: 'translateZ(0)',
    ...style
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => enableTooltip && setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
        className={buttonClasses}
        style={buttonStyle}
        aria-label={getTooltipText()}
        title={enableTooltip ? '' : getTooltipText()} // Hide native tooltip when custom tooltip is shown
        role="button"
        tabIndex={0}
      >
        {variant === 'button' || variant === 'text' ? (
          <div className="flex items-center gap-2">
            {getIcon()}
            {variant === 'text' && <span className="text-sm font-medium">Help</span>}
          </div>
        ) : (
          getIcon()
        )}
      </button>

      {/* Custom Tooltip */}
      {enableTooltip && isTooltipVisible && (
        <div
          className="fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none"
          style={{
            // Position tooltip near the trigger
            ...(triggerRef.current && (() => {
              const rect = triggerRef.current.getBoundingClientRect();
              const tooltipWidth = 200; // Estimated tooltip width
              const tooltipHeight = 32; // Estimated tooltip height
              
              let top = rect.bottom + 8;
              let left = rect.left + rect.width / 2 - tooltipWidth / 2;
              
              // Adjust if tooltip would go off screen
              if (left < 8) left = 8;
              if (left + tooltipWidth > window.innerWidth - 8) {
                left = window.innerWidth - tooltipWidth - 8;
              }
              if (top + tooltipHeight > window.innerHeight - 8) {
                top = rect.top - tooltipHeight - 8;
              }
              
              return { top, left };
            })()),
            // Safari 12 compatibility
            WebkitTransform: 'translateZ(0)',
            transform: 'translateZ(0)'
          }}
        >
          {getTooltipText()}
          {/* Tooltip arrow */}
          <div
            className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            style={{
              top: '-4px',
              left: '50%',
              marginLeft: '-4px'
            }}
          />
        </div>
      )}
    </>
  );
};

// Smart positioning hook for automatic trigger placement
export const useSmartTriggerPosition = (
  containerRef: React.RefObject<HTMLElement>
): ExplanationTriggerProps['position'] => {
  const [position, setPosition] = useState<ExplanationTriggerProps['position']>('floating');

  useEffect(() => {
    if (!containerRef.current) return;

    const updatePosition = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const hasHeader = container.querySelector('header, .header, [role="banner"]');
      
      if (hasHeader) {
        setPosition('header');
      } else if (rect.height > window.innerHeight * 0.6) {
        setPosition('floating');
      } else {
        setPosition('inline');
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => window.removeEventListener('resize', updatePosition);
  }, [containerRef]);

  return position;
};

// Context-aware trigger that automatically detects the best content to show
export const SmartExplanationTrigger: React.FC<{
  onTrigger: (pageId: string, context: PageContext) => void;
  containerRef?: React.RefObject<HTMLElement>;
  overrideProps?: Partial<ExplanationTriggerProps>;
}> = ({ onTrigger, containerRef, overrideProps = {} }) => {
  const smartPosition = useSmartTriggerPosition(containerRef || { current: document.body });

  const handleTrigger = (pageId: string) => {
    // Generate context for smart trigger
    const context: PageContext = {
      moduleKey: window.location.pathname.split('/')[1] || 'general',
      pageKey: window.location.pathname.split('/')[2] || 'help',
      fullPath: window.location.pathname,
      permissions: ['read'],
      userRole: 'STAFF'
    };
    onTrigger(pageId, context);
  };

  return (
    <ExplanationTrigger
      position={smartPosition}
      variant="icon"
      size="medium"
      placement="bottom-right"
      showTooltip={true}
      onTrigger={handleTrigger}
      {...overrideProps}
    />
  );
};

export default ExplanationTrigger;