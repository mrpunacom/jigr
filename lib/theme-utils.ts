/**
 * Theme Utilities for Hospitality Compliance System
 * 
 * Provides consistent styling based on module themes:
 * - 'light' theme: Light text on dark backgrounds (Upload module)
 * - 'dark' theme: Dark text on light backgrounds (Admin module)
 */

export type ThemeMode = 'light' | 'dark'

export interface CardStyleConfig {
  borderRadius: string
  backgroundColor: string
  backdropFilter: string
  border: string
  boxShadow: string
  transition: string
  position: string
  overflow: string
}

export interface TextColorConfig {
  title: string
  body: string
  secondary: string
  accent: string
}

/**
 * Get card styling based on theme
 * @param theme - 'light' for dark backgrounds, 'dark' for light backgrounds
 * @returns CSS-in-JS style object for cards
 */
export function getCardStyle(theme: ThemeMode): CardStyleConfig {
  const baseStyle: Omit<CardStyleConfig, 'backgroundColor'> = {
    borderRadius: '38px',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden'
  }

  if (theme === 'light') {
    // Light theme: Much stronger cards for watermark backgrounds - need excellent contrast
    return {
      ...baseStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.92)', // Increased from 0.18 to 0.92 for strong contrast against watermarks
      border: '1px solid rgba(255, 255, 255, 0.3)', // Stronger border
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)' // Enhanced shadow
    }
  } else {
    // Dark theme: Much darker cards for light backgrounds - need strong contrast
    return {
      ...baseStyle,
      backgroundColor: 'rgba(255, 255, 255, 0.95)', // Even stronger for dark theme
      border: '1px solid rgba(0, 0, 0, 0.12)', // Subtle dark border
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' // Enhanced shadow
    }
  }
}

/**
 * Get text colors based on theme
 * @param theme - 'light' for dark backgrounds, 'dark' for light backgrounds
 * @returns Tailwind CSS classes for text colors
 */
export function getTextColors(theme: ThemeMode): TextColorConfig {
  if (theme === 'light') {
    // Light theme: Dark text for strong white cards (since cards are now 0.92 white)
    return {
      title: 'text-gray-900',
      body: 'text-gray-800', 
      secondary: 'text-gray-600',
      accent: 'text-gray-700'
    }
  } else {
    // Dark theme: Dark text for light backgrounds
    return {
      title: 'text-gray-900',
      body: 'text-gray-800', 
      secondary: 'text-gray-600',
      accent: 'text-gray-700'
    }
  }
}

/**
 * Get complete themed style for a card component
 * @param theme - Theme mode
 * @param variant - Card variant for additional styling
 * @returns Complete styling object with CSS-in-JS and text classes
 */
export function getThemedCardStyles(theme: ThemeMode, variant: 'primary' | 'secondary' = 'primary') {
  const cardStyle = getCardStyle(theme)
  const textColors = getTextColors(theme)
  
  return {
    cardStyle,
    textColors,
    // Helper function to get combined inline styles
    getInlineStyles: () => ({
      borderRadius: cardStyle.borderRadius,
      backgroundColor: cardStyle.backgroundColor,
      backdropFilter: cardStyle.backdropFilter,
      border: cardStyle.border,
      boxShadow: cardStyle.boxShadow,
      transition: cardStyle.transition,
      position: cardStyle.position as 'relative',
      overflow: cardStyle.overflow as 'hidden'
    })
  }
}

/**
 * Helper to determine theme from module key
 * @param moduleKey - Module identifier (admin, upload, etc.)
 * @returns Theme mode for the module
 */
export function getModuleTheme(moduleKey: string): ThemeMode {
  // Import here to avoid circular dependencies
  const { getModuleConfig } = require('./module-config')
  const moduleConfig = getModuleConfig(moduleKey)
  return moduleConfig?.theme || 'light'
}