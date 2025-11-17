/**
 * Apple Human Interface Guidelines Design System
 * 
 * Constants and utilities following Apple HIG specifications
 * Optimized for iPad Air 2013 / Safari 12 compatibility
 * 
 * Based on Apple HIG 2024-2025
 */

// ============================================================================
// TYPOGRAPHY SYSTEM
// ============================================================================

/**
 * Apple HIG Font Size Scale (in pt units)
 * These are the official Apple sizes - use only these values
 */
export const FONT_SIZES = {
  // Critical minimum for accessibility
  MINIMUM: '11pt',
  
  // Standard text sizes
  CAPTION: '12pt',        // Secondary info, captions
  BODY: '15pt',           // Standard body text
  BUTTON_LABEL: '17pt',   // Button labels, list titles
  HEADING_SMALL: '17pt',  // Small headings
  HEADING_MEDIUM: '20pt', // Medium headings
  HEADING_LARGE: '28pt',  // Large headings
  TITLE_LARGE: '34pt',    // Page titles, nav bar large titles
} as const

/**
 * Apple HIG Font Weight Scale
 * Use sparingly - limit to 2-3 weights per screen
 */
export const FONT_WEIGHTS = {
  LIGHT: '300',      // Secondary content only
  REGULAR: '400',    // Body text standard
  MEDIUM: '500',     // Subtle emphasis
  SEMIBOLD: '600',   // Headings, important info
  BOLD: '700',       // Strong emphasis, CTAs
} as const

/**
 * SF Pro Font Stack for iPad/Safari 12
 * Always use this for consistent Apple typography
 */
export const FONT_FAMILY = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"

// ============================================================================
// TOUCH TARGET SYSTEM
// ============================================================================

/**
 * Apple HIG Touch Target Requirements
 * CRITICAL: All interactive elements must meet these minimums
 */
export const TOUCH_TARGETS = {
  MINIMUM: '44pt',        // Absolute minimum (Apple requirement)
  IDEAL: '48pt',          // Ideal for comfort
  SPACING: '8pt',         // Minimum space between touch targets
  
  // JiGR Hospitality-specific (wet hands, gloves)
  HOSPITALITY: '52pt',    // Recommended for restaurant environment
} as const

// ============================================================================
// SPACING SYSTEM (4pt Grid)
// ============================================================================

/**
 * Apple HIG Spacing Scale
 * All spacing must use these values for consistency
 */
export const SPACING = {
  XS: '4pt',       // Tight elements
  SM: '8pt',       // Small spacing, related items
  MD: '12pt',      // Medium spacing, grouped content
  LG: '16pt',      // Standard spacing, between sections
  XL: '20pt',      // Large spacing, major separators  
  XXL: '24pt',     // Extra large spacing, distinct sections
  MAX: '32pt',     // Maximum spacing, page-level separation
} as const

/**
 * Safe Area Constants for iPad
 */
export const SAFE_AREAS = {
  NAV_BAR_HEIGHT: '50pt',      // iPad navigation bar
  TAB_BAR_HEIGHT: '50pt',      // iPad tab bar
  STATUS_BAR: '20pt',          // Standard status bar
  MARGIN_PHONE: '16pt',        // iPhone margins
  MARGIN_IPAD_PORTRAIT: '20pt', // iPad portrait margins
  MARGIN_IPAD_LANDSCAPE: '24pt', // iPad landscape margins
} as const

// ============================================================================
// COLOR SYSTEM (iOS Semantic Colors)
// ============================================================================

/**
 * Apple iOS System Colors
 * Use these for semantic meaning consistency
 */
export const IOS_COLORS = {
  // Primary System Colors
  BLUE: 'rgb(0, 122, 255)',      // Default tint, primary actions
  GREEN: 'rgb(52, 199, 89)',     // Success, positive actions
  RED: 'rgb(255, 59, 48)',       // Errors, destructive actions
  ORANGE: 'rgb(255, 149, 0)',    // Warnings, alerts
  YELLOW: 'rgb(255, 204, 0)',    // Caution, highlights
  PURPLE: 'rgb(175, 82, 222)',   // Special features (4.6:1 contrast - GOOD)
  TEAL: 'rgb(90, 200, 250)',     // Alternative accents
  
  // WCAG AA Accessible Variants (4.5:1+ contrast ratio)
  BLUE_ACCESSIBLE: 'rgb(0, 100, 210)',    // Accessible blue for normal text
  GREEN_ACCESSIBLE: 'rgb(40, 160, 70)',   // Accessible green for normal text  
  RED_ACCESSIBLE: 'rgb(200, 45, 35)',     // Accessible red for normal text
  ORANGE_ACCESSIBLE: 'rgb(200, 115, 0)',  // Accessible orange for normal text
  
  // Neutral Colors (Light Mode) - WCAG AA Compliant
  LABEL_PRIMARY: 'rgb(0, 0, 0)',           // Primary text (21:1 contrast)
  LABEL_SECONDARY: 'rgba(60, 60, 67, 0.8)', // Secondary text (4.8:1 contrast - IMPROVED)
  LABEL_TERTIARY: 'rgba(60, 60, 67, 0.3)',  // Tertiary text (decorative only)
  
  // Background Colors (Light Mode)
  BACKGROUND_PRIMARY: 'rgb(255, 255, 255)',     // Primary background
  BACKGROUND_SECONDARY: 'rgb(242, 242, 247)',   // Secondary background
  BACKGROUND_GROUPED: 'rgb(242, 242, 247)',     // Grouped table background
  
  // Separator Colors
  SEPARATOR: 'rgba(60, 60, 67, 0.12)',         // Thin separators
  SEPARATOR_OPAQUE: 'rgb(198, 198, 200)',      // Opaque separators
} as const

/**
 * Contrast Ratios (WCAG Compliance)
 */
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,        // WCAG AA standard for normal text
  AA_LARGE: 3.0,         // WCAG AA for large text (18pt+)
  AAA_NORMAL: 7.0,       // WCAG AAA preferred
} as const

/**
 * Color Usage Guidelines for Accessibility
 */
export const COLOR_USAGE = {
  // Use these for normal text (any size) - meets 4.5:1 contrast
  ACCESSIBLE_TEXT: ['LABEL_PRIMARY', 'PURPLE', 'BLUE_ACCESSIBLE', 'GREEN_ACCESSIBLE', 'RED_ACCESSIBLE', 'ORANGE_ACCESSIBLE'],
  
  // Use these only for large text (18pt+) or interactive elements - meets 3.0:1 contrast  
  LARGE_TEXT_ONLY: ['BLUE', 'RED'],
  
  // These need icons/borders for accessibility - insufficient contrast alone
  NEEDS_SUPPORT: ['GREEN', 'ORANGE', 'TEAL'],
  
  // For decorative purposes only
  DECORATIVE: ['LABEL_TERTIARY', 'YELLOW']
} as const

// ============================================================================
// COMPONENT STATES
// ============================================================================

/**
 * Apple HIG Button State Values
 * Standard opacity values for consistent feedback
 */
export const BUTTON_STATES = {
  DEFAULT: 1.0,          // Normal state
  ACTIVE: 0.7,           // Pressed/touched (Apple standard)
  DISABLED: 0.4,         // Disabled state
  LOADING: 0.8,          // Loading state
} as const

/**
 * Animation Durations (Apple Standards)
 */
export const ANIMATIONS = {
  QUICK: '0.15s',        // Button highlights, small changes
  STANDARD: '0.3s',      // Screen transitions, reveals
  SLOW: '0.4s',          // Complex transitions, emphasis
  EASING: 'ease',        // Standard easing
} as const

// ============================================================================
// LAYOUT SYSTEMS
// ============================================================================

/**
 * iPad-Specific Layout Constants
 */
export const IPAD_LAYOUT = {
  MAX_WIDTH: '1024pt',           // iPad max content width
  CONTENT_MARGIN: '20pt',        // Standard content margins
  CARD_RADIUS: '12pt',           // Standard card border radius
  MODAL_RADIUS: '14pt',          // Modal border radius
  
  // Split View Sizes (iPad multitasking)
  SPLIT_1_3: '320pt',            // 1/3 width in split view
  SPLIT_1_2: '512pt',            // 1/2 width in split view  
  SPLIT_2_3: '683pt',            // 2/3 width in split view
} as const

// ============================================================================
// REACT COMPATIBILITY NOTES
// ============================================================================

/**
 * CRITICAL: React Inline Style Compatibility
 * 
 * ⚠️  IMPORTANT: When using design system constants in React inline styles,
 *     be aware that React expects specific value formats:
 * 
 * ❌ WRONG: style={{ minHeight: TOUCH_TARGETS.MINIMUM }}  // '44pt' causes NaN error
 * ✅ CORRECT: style={{ minHeight: '44px' }}               // Valid CSS string
 * ✅ CORRECT: style={getTouchTarget()}                     // Use utility function
 * ✅ CORRECT: className="min-h-[44px]"                     // Use Tailwind classes
 * 
 * WHY: React's style prop parser expects:
 * - Numbers (interpreted as px): { width: 44 }
 * - Valid CSS strings: { width: '44px' }
 * - NOT design system strings with 'pt': { width: '44pt' } → causes NaN
 * 
 * SOLUTIONS:
 * 1. Use getTouchTarget() utility function (converts pt → px automatically)
 * 2. Use Tailwind classes instead of inline styles
 * 3. Convert manually: TOUCH_TARGETS.MINIMUM.replace('pt', 'px')
 * 4. Use CSS custom properties (see CSS_VARIABLES below)
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get proper font styling for Apple HIG compliance
 */
export function getAppleFont(size: keyof typeof FONT_SIZES, weight: keyof typeof FONT_WEIGHTS = 'REGULAR') {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZES[size],
    fontWeight: FONT_WEIGHTS[weight],
  }
}

/**
 * Get touch-friendly styling with proper targets
 * 
 * IMPORTANT: Returns CSS-compatible values for React inline styles
 * Automatically converts 'pt' units to 'px' for browser compatibility
 */
export function getTouchTarget(size: keyof typeof TOUCH_TARGETS = 'MINIMUM') {
  const pixelValue = TOUCH_TARGETS[size].replace('pt', 'px')
  return {
    minWidth: pixelValue,
    minHeight: pixelValue,
    // Remove iOS tap highlight
    WebkitTapHighlightColor: 'transparent',
    // Improve touch responsiveness
    touchAction: 'manipulation',
  }
}

/**
 * Get button state styling
 */
export function getButtonState(state: keyof typeof BUTTON_STATES) {
  return {
    opacity: BUTTON_STATES[state],
    transition: `opacity ${ANIMATIONS.QUICK} ${ANIMATIONS.EASING}`,
  }
}

/**
 * Get Apple-compliant spacing
 */
export function getSpacing(size: keyof typeof SPACING) {
  return SPACING[size]
}

/**
 * Get semantic color by purpose
 */
export function getSemanticColor(purpose: 'primary' | 'success' | 'error' | 'warning' | 'info') {
  const colorMap = {
    primary: IOS_COLORS.BLUE,
    success: IOS_COLORS.GREEN,
    error: IOS_COLORS.RED,
    warning: IOS_COLORS.ORANGE,
    info: IOS_COLORS.TEAL,
  }
  return colorMap[purpose]
}

/**
 * Safe area CSS for iPad compatibility
 */
export function getSafeAreaPadding() {
  return {
    paddingTop: `env(safe-area-inset-top, ${SAFE_AREAS.NAV_BAR_HEIGHT})`,
    paddingRight: `env(safe-area-inset-right, ${SPACING.LG})`,
    paddingBottom: `env(safe-area-inset-bottom, ${SAFE_AREAS.TAB_BAR_HEIGHT})`,
    paddingLeft: `env(safe-area-inset-left, ${SPACING.LG})`,
  }
}

/**
 * Convert design system values to React-compatible CSS strings
 * Safely handles 'pt' to 'px' conversion for inline styles
 */
export function toReactStyleValue(designSystemValue: string): string {
  return designSystemValue.replace('pt', 'px')
}

/**
 * Get React-compatible touch targets with specific size
 * Alternative to getTouchTarget() with explicit size parameter
 */
export function getReactTouchTarget(size: keyof typeof TOUCH_TARGETS = 'MINIMUM') {
  const pixelValue = toReactStyleValue(TOUCH_TARGETS[size])
  return {
    minWidth: pixelValue,
    minHeight: pixelValue,
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  } as React.CSSProperties
}

/**
 * Get React-compatible spacing value
 * Converts 'pt' units to 'px' for inline styles
 */
export function getReactSpacing(size: keyof typeof SPACING): string {
  return toReactStyleValue(SPACING[size])
}

/**
 * Get React-compatible font size
 * Converts 'pt' units to 'px' for inline styles
 */
export function getReactFontSize(size: keyof typeof FONT_SIZES): string {
  return toReactStyleValue(FONT_SIZES[size])
}

// ============================================================================
// CSS CUSTOM PROPERTIES (CSS Variables)
// ============================================================================

/**
 * CSS Custom Properties for Apple HIG
 * Use in CSS files for consistent theming
 */
export const CSS_VARIABLES = `
  :root {
    /* Typography */
    --font-family: ${FONT_FAMILY};
    --font-size-caption: ${FONT_SIZES.CAPTION};
    --font-size-body: ${FONT_SIZES.BODY};
    --font-size-button: ${FONT_SIZES.BUTTON_LABEL};
    --font-size-heading-small: ${FONT_SIZES.HEADING_SMALL};
    --font-size-heading-medium: ${FONT_SIZES.HEADING_MEDIUM};
    --font-size-heading-large: ${FONT_SIZES.HEADING_LARGE};
    --font-size-title: ${FONT_SIZES.TITLE_LARGE};
    
    /* Touch Targets */
    --touch-target-min: ${TOUCH_TARGETS.MINIMUM};
    --touch-target-ideal: ${TOUCH_TARGETS.IDEAL};
    --touch-target-hospitality: ${TOUCH_TARGETS.HOSPITALITY};
    
    /* Spacing */
    --spacing-xs: ${SPACING.XS};
    --spacing-sm: ${SPACING.SM};
    --spacing-md: ${SPACING.MD};
    --spacing-lg: ${SPACING.LG};
    --spacing-xl: ${SPACING.XL};
    --spacing-xxl: ${SPACING.XXL};
    --spacing-max: ${SPACING.MAX};
    
    /* Colors */
    --ios-blue: ${IOS_COLORS.BLUE};
    --ios-green: ${IOS_COLORS.GREEN};
    --ios-red: ${IOS_COLORS.RED};
    --ios-orange: ${IOS_COLORS.ORANGE};
    --ios-yellow: ${IOS_COLORS.YELLOW};
    --ios-purple: ${IOS_COLORS.PURPLE};
    --ios-teal: ${IOS_COLORS.TEAL};
    
    /* Text Colors */
    --label-primary: ${IOS_COLORS.LABEL_PRIMARY};
    --label-secondary: ${IOS_COLORS.LABEL_SECONDARY};
    --label-tertiary: ${IOS_COLORS.LABEL_TERTIARY};
    
    /* Background Colors */
    --background-primary: ${IOS_COLORS.BACKGROUND_PRIMARY};
    --background-secondary: ${IOS_COLORS.BACKGROUND_SECONDARY};
    --separator: ${IOS_COLORS.SEPARATOR};
    
    /* Button States */
    --button-opacity-default: ${BUTTON_STATES.DEFAULT};
    --button-opacity-active: ${BUTTON_STATES.ACTIVE};
    --button-opacity-disabled: ${BUTTON_STATES.DISABLED};
    
    /* Animations */
    --animation-quick: ${ANIMATIONS.QUICK};
    --animation-standard: ${ANIMATIONS.STANDARD};
    --animation-slow: ${ANIMATIONS.SLOW};
  }
`

// ============================================================================
// ACCESSIBILITY HELPERS
// ============================================================================

/**
 * Accessibility requirements for Apple HIG compliance
 */
export const ACCESSIBILITY = {
  MINIMUM_FONT_SIZE: FONT_SIZES.MINIMUM,
  MINIMUM_TOUCH_TARGET: TOUCH_TARGETS.MINIMUM,
  MINIMUM_CONTRAST: CONTRAST_RATIOS.AA_NORMAL,
  
  // Dynamic Type support
  SUPPORTS_DYNAMIC_TYPE: true,
  
  // VoiceOver requirements
  REQUIRES_ARIA_LABELS: true,
  
  // Reduce Motion support
  SUPPORTS_REDUCE_MOTION: true,
} as const

// ============================================================================
// JIGR-SPECIFIC EXTENSIONS
// ============================================================================

/**
 * JiGR Hospitality Environment Adaptations
 * Larger targets and higher contrast for restaurant use
 */
export const JIGR_HOSPITALITY = {
  // Enhanced touch targets for gloved/wet hands
  TOUCH_TARGET_ENHANCED: '56pt',
  
  // High contrast for bright kitchen environments
  CONTRAST_ENHANCED: 6.0,
  
  // Fast interaction timing (busy service)
  MAX_TASK_TIME: '30s',
  ANIMATION_FASTER: '0.1s',
  
  // Simplified language (minimal tech training)
  REQUIRES_SIMPLE_LANGUAGE: true,
  
  // Offline capability considerations
  SUPPORTS_OFFLINE: true,
} as const

export default {
  FONT_SIZES,
  FONT_WEIGHTS,
  FONT_FAMILY,
  TOUCH_TARGETS,
  SPACING,
  SAFE_AREAS,
  IOS_COLORS,
  CONTRAST_RATIOS,
  BUTTON_STATES,
  ANIMATIONS,
  IPAD_LAYOUT,
  ACCESSIBILITY,
  JIGR_HOSPITALITY,
  // Utility functions
  getAppleFont,
  getTouchTarget,
  getButtonState,
  getSpacing,
  getSemanticColor,
  getSafeAreaPadding,
  // React-specific utility functions
  toReactStyleValue,
  getReactTouchTarget,
  getReactSpacing,
  getReactFontSize,
}