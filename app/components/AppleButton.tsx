/**
 * Apple HIG Compliant Button Component
 * 
 * Follows Apple Human Interface Guidelines for iPad/iOS
 * - 44pt minimum touch targets
 * - Proper visual feedback states
 * - SF Pro typography
 * - iOS semantic colors
 * - Accessibility support
 * 
 * Optimized for iPad Air 2013 / Safari 12
 */

'use client'

import React, { forwardRef } from 'react'
import { 
  TOUCH_TARGETS, 
  FONT_FAMILY, 
  FONT_SIZES, 
  FONT_WEIGHTS, 
  IOS_COLORS, 
  BUTTON_STATES, 
  ANIMATIONS,
  SPACING,
  getSemanticColor,
} from '@/lib/apple-design-system'

// Button variants following Apple HIG
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive'
type ButtonSize = 'standard' | 'large' | 'hospitality'

interface AppleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  'aria-label'?: string
}

/**
 * Apple HIG compliant button component
 * 
 * @param variant - Button style: 'primary' | 'secondary' | 'tertiary' | 'destructive'
 * @param size - Button size: 'standard' | 'large' | 'hospitality'
 * @param loading - Shows spinner and disables interaction
 * @param disabled - Disabled state with reduced opacity
 * @param fullWidth - Stretch to full container width
 * @param leftIcon - Icon component to show on left
 * @param rightIcon - Icon component to show on right
 */
export const AppleButton = forwardRef<HTMLButtonElement, AppleButtonProps>(
  ({ 
    children, 
    variant = 'primary', 
    size = 'standard',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = '',
    style = {},
    onClick,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    
    // Get size-specific dimensions
    const getSizeStyles = () => {
      switch (size) {
        case 'large':
          return {
            minHeight: TOUCH_TARGETS.IDEAL,
            minWidth: TOUCH_TARGETS.IDEAL,
            fontSize: FONT_SIZES.HEADING_SMALL,
            padding: `${SPACING.MD} ${SPACING.XL}`,
          }
        case 'hospitality':
          return {
            minHeight: TOUCH_TARGETS.HOSPITALITY,
            minWidth: TOUCH_TARGETS.HOSPITALITY,
            fontSize: FONT_SIZES.HEADING_SMALL,
            padding: `${SPACING.LG} ${SPACING.XXL}`,
          }
        default: // 'standard'
          return {
            minHeight: TOUCH_TARGETS.MINIMUM,
            minWidth: TOUCH_TARGETS.MINIMUM,
            fontSize: FONT_SIZES.BUTTON_LABEL,
            padding: `${SPACING.MD} ${SPACING.XL}`,
          }
      }
    }

    // Get variant-specific styles
    const getVariantStyles = () => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: IOS_COLORS.BLUE,
            color: 'white',
            border: 'none',
            fontWeight: FONT_WEIGHTS.SEMIBOLD,
          }
        case 'secondary':
          return {
            backgroundColor: 'transparent',
            color: IOS_COLORS.BLUE,
            border: `2px solid ${IOS_COLORS.BLUE}`,
            fontWeight: FONT_WEIGHTS.MEDIUM,
          }
        case 'tertiary':
          return {
            backgroundColor: 'transparent',
            color: IOS_COLORS.BLUE,
            border: 'none',
            fontWeight: FONT_WEIGHTS.REGULAR,
          }
        case 'destructive':
          return {
            backgroundColor: IOS_COLORS.RED,
            color: 'white',
            border: 'none',
            fontWeight: FONT_WEIGHTS.SEMIBOLD,
          }
        default:
          return {}
      }
    }

    // Combined styles
    const buttonStyles = {
      // Base styles
      fontFamily: FONT_FAMILY,
      borderRadius: '12pt',
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.SM,
      width: fullWidth ? '100%' : 'auto',
      textAlign: 'center' as const,
      textDecoration: 'none',
      
      // Apple HIG touch optimizations
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      
      // Accessibility
      outline: 'none',
      
      // Animation
      transition: `all ${ANIMATIONS.QUICK} ease`,
      
      // State handling
      opacity: loading || disabled ? BUTTON_STATES.DISABLED : BUTTON_STATES.DEFAULT,
      
      // Size and variant styles
      ...getSizeStyles(),
      ...getVariantStyles(),
      
      // User custom styles
      ...style,
    }

    // Handle click events
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault()
        return
      }
      
      // Add haptic feedback (if supported)
      if (navigator.vibrate) {
        navigator.vibrate(10) // Light haptic for button press
      }
      
      onClick?.(event)
    }

    // Loading spinner component
    const LoadingSpinner = () => (
      <div
        style={{
          width: '16pt',
          height: '16pt',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
    )

    return (
      <>
        {/* Add spinner keyframes to document head if not already added */}
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        
        <button
          ref={ref}
          className={`apple-button ${className}`}
          style={buttonStyles}
          onClick={handleClick}
          disabled={loading || disabled}
          aria-label={ariaLabel || (typeof children === 'string' ? children : 'Button')}
          aria-busy={loading}
          {...props}
          onMouseDown={(e) => {
            // Immediate visual feedback on press
            const target = e.currentTarget
            target.style.opacity = String(BUTTON_STATES.ACTIVE)
          }}
          onMouseUp={(e) => {
            // Restore opacity on release
            const target = e.currentTarget
            target.style.opacity = String(loading || disabled ? BUTTON_STATES.DISABLED : BUTTON_STATES.DEFAULT)
          }}
          onMouseLeave={(e) => {
            // Restore opacity if mouse leaves during press
            const target = e.currentTarget
            target.style.opacity = String(loading || disabled ? BUTTON_STATES.DISABLED : BUTTON_STATES.DEFAULT)
          }}
          onTouchStart={(e) => {
            // Touch feedback for mobile/iPad
            const target = e.currentTarget
            target.style.opacity = String(BUTTON_STATES.ACTIVE)
          }}
          onTouchEnd={(e) => {
            // Restore on touch end
            const target = e.currentTarget
            target.style.opacity = String(loading || disabled ? BUTTON_STATES.DISABLED : BUTTON_STATES.DEFAULT)
          }}
          onFocus={(e) => {
            // Keyboard focus ring (accessibility)
            e.currentTarget.style.outline = `3px solid rgba(0, 122, 255, 0.5)`
            e.currentTarget.style.outlineOffset = '2px'
          }}
          onBlur={(e) => {
            // Remove focus ring
            e.currentTarget.style.outline = 'none'
            e.currentTarget.style.outlineOffset = '0'
          }}
        >
          {/* Left Icon */}
          {leftIcon && !loading && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {leftIcon}
            </span>
          )}
          
          {/* Loading Spinner */}
          {loading && <LoadingSpinner />}
          
          {/* Button Text */}
          <span style={{ 
            display: 'flex', 
            alignItems: 'center',
            opacity: loading ? 0.7 : 1,
          }}>
            {children}
          </span>
          
          {/* Right Icon */}
          {rightIcon && !loading && (
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {rightIcon}
            </span>
          )}
        </button>
      </>
    )
  }
)

AppleButton.displayName = 'AppleButton'

// Convenience components for specific use cases
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<AppleButtonProps, 'variant'>>(
  (props, ref) => <AppleButton ref={ref} variant="primary" {...props} />
)

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<AppleButtonProps, 'variant'>>(
  (props, ref) => <AppleButton ref={ref} variant="secondary" {...props} />
)

export const TextButton = forwardRef<HTMLButtonElement, Omit<AppleButtonProps, 'variant'>>(
  (props, ref) => <AppleButton ref={ref} variant="tertiary" {...props} />
)

export const DestructiveButton = forwardRef<HTMLButtonElement, Omit<AppleButtonProps, 'variant'>>(
  (props, ref) => <AppleButton ref={ref} variant="destructive" {...props} />
)

// JiGR Hospitality-optimized button (larger targets for gloved hands)
export const HospitalityButton = forwardRef<HTMLButtonElement, Omit<AppleButtonProps, 'size'>>(
  (props, ref) => <AppleButton ref={ref} size="hospitality" {...props} />
)

PrimaryButton.displayName = 'PrimaryButton'
SecondaryButton.displayName = 'SecondaryButton'
TextButton.displayName = 'TextButton'
DestructiveButton.displayName = 'DestructiveButton'
HospitalityButton.displayName = 'HospitalityButton'

export default AppleButton