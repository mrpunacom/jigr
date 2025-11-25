// components/ui/LoadingState.tsx
/**
 * Loading State Component
 * Professional skeleton loaders and progress indicators
 * 
 * Features:
 * - Skeleton loaders (shimmer effect)
 * - Progress bars with percentage
 * - Status messages
 * - Multiple variants (list, card, table)
 * - iPad Air optimized
 */

'use client';

import { useEffect, useState } from 'react';

export interface LoadingStateProps {
  variant?: 'skeleton' | 'spinner' | 'progress';
  message?: string;
  progress?: number; // 0-100
  total?: number; // For "X of Y" display
  items?: number; // Number of skeleton items to show
}

/**
 * Shimmer effect for skeleton loaders
 */
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }
  
  .shimmer {
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
  }
`;

/**
 * Skeleton Loader - Shows placeholder content while loading
 */
function SkeletonLoader({ items = 3 }: { items: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-4
            animate-pulse
          "
        >
          {/* Item Name Skeleton */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded-lg w-2/3 shimmer" />
              <div className="h-3 bg-white/20 rounded-lg w-1/3 shimmer" />
            </div>
          </div>
          
          {/* Price/Details Skeleton */}
          <div className="flex gap-4">
            <div className="h-6 bg-white/20 rounded-lg w-20 shimmer" />
            <div className="h-6 bg-white/20 rounded-lg w-24 shimmer" />
          </div>
        </div>
      ))}
      
      <style jsx>{shimmerStyles}</style>
    </div>
  );
}

/**
 * Spinner - Circular loading indicator
 */
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`
          ${sizes[size]}
          border-4 border-white/20
          border-t-white
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

/**
 * Progress Bar - Shows completion percentage
 */
function ProgressBar({ 
  progress = 0, 
  total,
  message 
}: { 
  progress: number; 
  total?: number;
  message?: string;
}) {
  const percentage = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="space-y-3">
      {/* Progress Message */}
      {message && (
        <div className="text-center text-white/80 text-sm">
          {message}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-xl">
        <div
          className="
            absolute top-0 left-0 h-full
            bg-gradient-to-r from-emerald-400 to-emerald-500
            transition-all duration-500 ease-out
            rounded-full
          "
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Progress Stats */}
      <div className="flex justify-between text-sm text-white/60">
        <span>{percentage.toFixed(0)}%</span>
        {total && (
          <span>{Math.round((percentage / 100) * total)} of {total} items</span>
        )}
      </div>
    </div>
  );
}

/**
 * Main Loading State Component
 */
export default function LoadingState({
  variant = 'skeleton',
  message,
  progress = 0,
  total,
  items = 3
}: LoadingStateProps) {
  const [dots, setDots] = useState('');

  // Animated dots for messages
  useEffect(() => {
    if (!message) return;
    
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="py-8 px-4">
      {/* Variant-specific content */}
      {variant === 'skeleton' && (
        <>
          {message && (
            <div className="text-center text-white/80 mb-6 text-lg">
              {message}{dots}
            </div>
          )}
          <SkeletonLoader items={items} />
        </>
      )}
      
      {variant === 'spinner' && (
        <div className="text-center space-y-6">
          <Spinner size="lg" />
          {message && (
            <div className="text-white/80 text-lg">
              {message}{dots}
            </div>
          )}
        </div>
      )}
      
      {variant === 'progress' && (
        <div className="max-w-md mx-auto">
          <ProgressBar 
            progress={progress} 
            total={total}
            message={message}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Table Skeleton - For loading table data
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header Row */}
      <div className="flex gap-4 pb-2 border-b-2 border-white/20">
        {Array.from({ length: columns }).map((_, i) => (
          <div 
            key={`header-${i}`}
            className="flex-1 h-4 bg-white/20 rounded-lg shimmer"
          />
        ))}
      </div>
      
      {/* Data Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={`cell-${rowIndex}-${colIndex}`}
              className="flex-1 h-4 bg-white/10 rounded-lg shimmer"
            />
          ))}
        </div>
      ))}
      
      <style jsx>{shimmerStyles}</style>
    </div>
  );
}

/**
 * Card Skeleton - For loading card-based content
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="
            bg-white/10 backdrop-blur-xl
            border-2 border-white/20
            rounded-2xl p-6
            space-y-4
            animate-pulse
          "
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/20 rounded-lg w-3/4 shimmer" />
              <div className="h-3 bg-white/20 rounded-lg w-1/2 shimmer" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="h-3 bg-white/20 rounded-lg w-full shimmer" />
            <div className="h-3 bg-white/20 rounded-lg w-5/6 shimmer" />
            <div className="h-3 bg-white/20 rounded-lg w-4/6 shimmer" />
          </div>
          
          {/* Footer */}
          <div className="flex gap-2 pt-2">
            <div className="h-8 bg-white/20 rounded-lg w-20 shimmer" />
            <div className="h-8 bg-white/20 rounded-lg w-24 shimmer" />
          </div>
        </div>
      ))}
      
      <style jsx>{shimmerStyles}</style>
    </div>
  );
}

/**
 * Full Page Loading - Centers content in viewport
 */
export function FullPageLoading({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center space-y-6 p-8">
        <Spinner size="lg" />
        {message && (
          <div className="text-white/80 text-xl">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Inline Loading - Small loading indicator for buttons/actions
 */
export function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="
          w-4 h-4
          border-2 border-white/40
          border-t-white
          rounded-full
          animate-spin
        "
      />
      {message && (
        <span className="text-sm text-white/80">{message}</span>
      )}
    </div>
  );
}

/**
 * Import-Specific Loading Component
 * Customized for menu import workflow
 */
export function ImportLoading({
  stage,
  progress,
  itemCount
}: {
  stage: 'connecting' | 'reading' | 'analyzing' | 'saving';
  progress?: number;
  itemCount?: number;
}) {
  const messages = {
    connecting: 'Connecting to Google Sheets',
    reading: 'Reading your spreadsheet',
    analyzing: itemCount ? `Analyzing ${itemCount} menu items` : 'Analyzing menu items',
    saving: itemCount ? `Saving ${itemCount} items to your menu` : 'Saving to your menu'
  };

  const icons = {
    connecting: '🔐',
    reading: '📊',
    analyzing: '🤖',
    saving: '💾'
  };

  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      {/* Icon */}
      <div className="text-6xl animate-bounce">
        {icons[stage]}
      </div>
      
      {/* Message */}
      <div className="text-white/90 text-xl font-medium">
        {messages[stage]}
      </div>
      
      {/* Progress */}
      {progress !== undefined && (
        <ProgressBar 
          progress={progress}
          total={itemCount}
        />
      )}
      
      {/* Tips */}
      <div className="text-white/60 text-sm">
        {stage === 'analyzing' && "This usually takes just a few seconds..."}
        {stage === 'saving' && "Almost done!"}
      </div>
    </div>
  );
}

/**
 * Example Usage:
 * 
 * ```tsx
 * // Basic skeleton loader
 * <LoadingState 
 *   variant="skeleton"
 *   message="Loading menu items"
 *   items={5}
 * />
 * 
 * // Progress bar
 * <LoadingState 
 *   variant="progress"
 *   message="Importing menu items"
 *   progress={60}
 *   total={30}
 * />
 * 
 * // Spinner
 * <LoadingState 
 *   variant="spinner"
 *   message="Processing"
 * />
 * 
 * // Table skeleton
 * <TableSkeleton rows={10} columns={5} />
 * 
 * // Card skeleton
 * <CardSkeleton count={6} />
 * 
 * // Full page loading
 * <FullPageLoading message="Loading your menu..." />
 * 
 * // Inline loading (in buttons)
 * <button disabled>
 *   <InlineLoading message="Saving..." />
 * </button>
 * 
 * // Import-specific
 * <ImportLoading 
 *   stage="analyzing"
 *   progress={45}
 *   itemCount={30}
 * />
 * ```
 */
