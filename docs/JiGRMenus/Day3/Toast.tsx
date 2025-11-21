// components/ui/Toast.tsx
/**
 * Toast Notification Component
 * Beautiful, animated notifications for success, error, warning, and info messages
 * 
 * Features:
 * - Auto-dismiss after configurable duration
 * - Smooth slide-in animation
 * - Color-coded by type
 * - Click to dismiss
 * - Stack multiple toasts
 * - Mobile-responsive
 */

'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Get color scheme for toast type
 */
function getToastColors(type: ToastType) {
  const colors = {
    success: {
      bg: 'bg-emerald-50/95',
      border: 'border-emerald-200',
      icon: 'text-emerald-600',
      text: 'text-emerald-900',
      button: 'text-emerald-700 hover:text-emerald-900'
    },
    error: {
      bg: 'bg-red-50/95',
      border: 'border-red-200',
      icon: 'text-red-600',
      text: 'text-red-900',
      button: 'text-red-700 hover:text-red-900'
    },
    warning: {
      bg: 'bg-amber-50/95',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      text: 'text-amber-900',
      button: 'text-amber-700 hover:text-amber-900'
    },
    info: {
      bg: 'bg-blue-50/95',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      button: 'text-blue-700 hover:text-blue-900'
    }
  };
  return colors[type];
}

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastType) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  return icons[type];
}

/**
 * Toast Component
 */
export default function Toast({
  type,
  title,
  message,
  duration = 5000,
  onDismiss,
  action
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const colors = getToastColors(type);
  const icon = getToastIcon(type);

  // Slide in on mount
  useEffect(() => {
    // Small delay for smooth animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration === 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.();
    }, 300); // Match animation duration
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        max-w-md w-full
        transition-all duration-300 ease-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Toast Container */}
      <div
        className={`
          ${colors.bg} ${colors.border}
          border-2 rounded-2xl shadow-lg
          backdrop-blur-xl
          p-4
          cursor-pointer
          hover:shadow-xl
          transition-shadow duration-200
        `}
        onClick={handleDismiss}
      >
        {/* Content */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`text-2xl ${colors.icon} flex-shrink-0`}>
            {icon}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <div className={`font-semibold ${colors.text} mb-1`}>
                {title}
              </div>
            )}
            <div className={`${colors.text} text-sm`}>
              {message}
            </div>

            {/* Action Button (if provided) */}
            {action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  handleDismiss();
                }}
                className={`
                  mt-2 text-sm font-medium underline
                  ${colors.button}
                  transition-colors duration-150
                `}
              >
                {action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className={`
              ${colors.icon}
              hover:opacity-70
              transition-opacity duration-150
              flex-shrink-0
              text-xl
              leading-none
            `}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>

        {/* Progress Bar (if auto-dismiss) */}
        {duration > 0 && (
          <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.icon.replace('text-', 'bg-')} transition-all ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Toast Manager Hook
 * Manage multiple toasts in your component
 * 
 * Usage:
 * ```tsx
 * const { toasts, showToast, removeToast } = useToasts();
 * 
 * // Show a toast
 * showToast({
 *   type: 'success',
 *   message: 'Import completed!',
 *   title: 'Success'
 * });
 * 
 * // Render toasts
 * {toasts.map(toast => (
 *   <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
 * ))}
 * ```
 */
export function useToasts() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = (toast: ToastProps) => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
}

/**
 * Toast Container Component
 * Renders all active toasts with proper stacking
 * 
 * Usage:
 * ```tsx
 * const { toasts, showToast, removeToast } = useToasts();
 * 
 * return (
 *   <>
 *     <YourContent />
 *     <ToastContainer toasts={toasts} onDismiss={removeToast} />
 *   </>
 * );
 * ```
 */
export function ToastContainer({
  toasts,
  onDismiss
}: {
  toasts: (ToastProps & { id: string })[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{
            transform: `translateY(${index * 8}px)`,
            transition: 'transform 300ms ease-out'
          }}
        >
          <Toast
            {...toast}
            onDismiss={() => onDismiss(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * Convenience Functions
 * Quick ways to show common toast types
 */
export const toast = {
  success: (message: string, title?: string, action?: ToastProps['action']) => {
    // Note: You'll need to call this from a component that has the useToasts hook
    // This is just a helper for consistent API
    return { type: 'success' as ToastType, message, title, action };
  },
  
  error: (message: string, title?: string, action?: ToastProps['action']) => {
    return { type: 'error' as ToastType, message, title, action };
  },
  
  warning: (message: string, title?: string, action?: ToastProps['action']) => {
    return { type: 'warning' as ToastType, message, title, action };
  },
  
  info: (message: string, title?: string, action?: ToastProps['action']) => {
    return { type: 'info' as ToastType, message, title, action };
  }
};

/**
 * Example Usage:
 * 
 * ```tsx
 * 'use client';
 * 
 * import Toast, { useToasts, ToastContainer } from '@/components/ui/Toast';
 * 
 * export default function MyComponent() {
 *   const { toasts, showToast, removeToast } = useToasts();
 * 
 *   const handleImport = async () => {
 *     try {
 *       // ... import logic
 *       showToast({
 *         type: 'success',
 *         title: 'Success!',
 *         message: '30 menu items imported successfully',
 *         action: {
 *           label: 'View Menu',
 *           onClick: () => router.push('/menu')
 *         }
 *       });
 *     } catch (error) {
 *       showToast({
 *         type: 'error',
 *         title: 'Import Failed',
 *         message: 'We encountered an error importing your menu. Please try again.',
 *         duration: 0, // Don't auto-dismiss errors
 *         action: {
 *           label: 'Try Again',
 *           onClick: () => handleImport()
 *         }
 *       });
 *     }
 *   };
 * 
 *   return (
 *     <>
 *       <button onClick={handleImport}>Import Menu</button>
 *       <ToastContainer toasts={toasts} onDismiss={removeToast} />
 *     </>
 *   );
 * }
 * ```
 */
