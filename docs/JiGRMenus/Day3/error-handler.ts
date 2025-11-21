// lib/menu-import/error-handler.ts
/**
 * Error Handler for MENU Import System
 * Provides user-friendly error messages and recovery suggestions
 * 
 * Design Philosophy:
 * - Never show technical errors to users
 * - Always suggest corrective actions
 * - Maintain supportive, non-punitive tone
 * - Provide clear recovery paths
 */

export type ErrorType = 
  | 'auth_failed'
  | 'sheet_not_found'
  | 'invalid_format'
  | 'missing_columns'
  | 'invalid_prices'
  | 'empty_data'
  | 'duplicate_items'
  | 'network_error'
  | 'server_error'
  | 'permission_denied'
  | 'unknown';

export interface ErrorResult {
  type: ErrorType;
  title: string;
  message: string;
  suggestions: string[];
  recoverable: boolean;
  technical?: string; // For logging only
}

/**
 * Main error handler - converts technical errors to user-friendly messages
 */
export function handleImportError(error: any): ErrorResult {
  console.error('Import error:', error); // Log for debugging

  // OAuth/Authentication errors
  if (error.message?.includes('auth') || error.message?.includes('token')) {
    return {
      type: 'auth_failed',
      title: 'Connection Lost',
      message: 'We lost connection to your Google account. This happens if you\'ve been away for a while.',
      suggestions: [
        'Click "Reconnect Google Sheets" to sign in again',
        'Make sure you\'re allowing pop-ups from JiGR',
        'Try refreshing the page if the issue persists'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Spreadsheet not found
  if (error.message?.includes('not found') || error.message?.includes('404')) {
    return {
      type: 'sheet_not_found',
      title: 'Spreadsheet Not Found',
      message: 'We couldn\'t access this spreadsheet. It may have been deleted, or you no longer have permission to view it.',
      suggestions: [
        'Check that the spreadsheet still exists in your Google Drive',
        'Verify you have "View" or "Edit" access to the sheet',
        'Try selecting a different spreadsheet'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Invalid data format
  if (error.message?.includes('format') || error.message?.includes('parse')) {
    return {
      type: 'invalid_format',
      title: 'Unable to Read Spreadsheet',
      message: 'The spreadsheet format isn\'t quite what we expected. This usually means the data is organized differently than anticipated.',
      suggestions: [
        'Check that your spreadsheet has columns like "Item Name" and "Price"',
        'Make sure the first row contains column headers',
        'View our example format for guidance'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Missing required columns
  if (error.message?.includes('column') || error.message?.includes('required')) {
    return {
      type: 'missing_columns',
      title: 'Missing Required Information',
      message: 'We need at least "Item Name" and "Price" columns to import your menu.',
      suggestions: [
        'Add a "Price" column to your spreadsheet',
        'Make sure column headers are in the first row',
        'Column names can vary (e.g., "Price", "Cost", "Amount")',
        'View example format'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Invalid prices
  if (error.message?.includes('price') || error.message?.includes('numeric')) {
    return {
      type: 'invalid_prices',
      title: 'Invalid Price Format',
      message: 'Some prices couldn\'t be understood. Prices should be numbers like 12.00 or $15.50.',
      suggestions: [
        'Check for prices like "TBD", "Market Price", or blank cells',
        'Remove currency symbols except $ (we\'ll handle formatting)',
        'Use numbers only: 12.00 (not "twelve dollars")',
        'Fix invalid prices and try again'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Empty spreadsheet
  if (error.message?.includes('empty') || error.message?.includes('no data')) {
    return {
      type: 'empty_data',
      title: 'No Menu Items Found',
      message: 'The selected spreadsheet appears to be empty, or we couldn\'t find any menu items to import.',
      suggestions: [
        'Check that the selected tab contains menu data',
        'Make sure there\'s at least one row of data below the headers',
        'Try selecting a different tab if your menu is on another sheet'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Duplicate items
  if (error.message?.includes('duplicate')) {
    return {
      type: 'duplicate_items',
      title: 'Duplicate Items Detected',
      message: 'We found menu items with the same name. This might be intentional (different sizes) or an error.',
      suggestions: [
        'Review the preview to see which items are duplicated',
        'Keep both if they\'re different sizes (e.g., "Small Pizza", "Large Pizza")',
        'Remove duplicates from your spreadsheet if they\'re errors',
        'You can edit item names during preview'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      type: 'network_error',
      title: 'Connection Problem',
      message: 'We\'re having trouble connecting to Google Sheets. This could be a temporary network issue.',
      suggestions: [
        'Check your internet connection',
        'Try again in a moment',
        'If this persists, try refreshing the page'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Permission denied
  if (error.message?.includes('permission') || error.message?.includes('403')) {
    return {
      type: 'permission_denied',
      title: 'Permission Required',
      message: 'You don\'t have permission to access this spreadsheet.',
      suggestions: [
        'Ask the spreadsheet owner to share it with you',
        'Make sure you\'re signed in with the correct Google account',
        'Request "View" or "Edit" access to the spreadsheet'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Server errors
  if (error.message?.includes('500') || error.message?.includes('server')) {
    return {
      type: 'server_error',
      title: 'Something Went Wrong',
      message: 'We encountered an unexpected problem on our end. This is rare, and usually temporary.',
      suggestions: [
        'Please try again in a moment',
        'If this keeps happening, contact support',
        'Your data is safe - nothing was changed'
      ],
      recoverable: true,
      technical: error.message
    };
  }

  // Unknown errors (fallback)
  return {
    type: 'unknown',
    title: 'Unexpected Error',
    message: 'Something unexpected happened. We\'re not sure what went wrong, but we\'re here to help.',
    suggestions: [
      'Try the import again',
      'If this keeps happening, please contact support',
      'Include the time this happened to help us investigate',
      'Your data is safe - nothing was changed'
    ],
    recoverable: true,
    technical: error.message || String(error)
  };
}

/**
 * Validation-specific error messages
 */
export function getValidationMessage(
  issue: 'missing_price' | 'invalid_price' | 'extreme_price' | 'missing_name',
  itemName?: string,
  value?: any
): string {
  switch (issue) {
    case 'missing_price':
      return `"${itemName || 'This item'}" is missing a price. Please add a numeric price value.`;
    
    case 'invalid_price':
      return `"${itemName || 'This item'}" has an invalid price: "${value}". Please use a number like 12.00`;
    
    case 'extreme_price':
      return `"${itemName || 'This item'}" has an unusual price: $${value}. Please verify this is correct.`;
    
    case 'missing_name':
      return `Row has a price but no item name. Please add an item name or remove this row.`;
    
    default:
      return 'This item has a validation issue. Please review and correct.';
  }
}

/**
 * Success messages for different import scenarios
 */
export function getSuccessMessage(itemCount: number): {
  title: string;
  message: string;
  nextSteps: string[];
} {
  if (itemCount === 0) {
    return {
      title: 'Import Complete',
      message: 'No new items were imported.',
      nextSteps: [
        'Check if items already exist in your menu',
        'Verify the spreadsheet has data',
        'Try importing a different spreadsheet'
      ]
    };
  }

  if (itemCount === 1) {
    return {
      title: 'Success!',
      message: '1 menu item imported successfully',
      nextSteps: [
        'View your menu',
        'Link this item to a recipe to calculate food cost',
        'Set up pricing strategy'
      ]
    };
  }

  return {
    title: 'Great Job!',
    message: `${itemCount} menu items imported successfully`,
    nextSteps: [
      'View your complete menu',
      'Link items to recipes for food cost tracking',
      'Run pricing analysis to optimize profits',
      'Review any warnings or validation messages'
    ]
  };
}

/**
 * Get helpful tips based on error type
 */
export function getHelpfulTips(errorType: ErrorType): string[] {
  const commonTips = {
    auth_failed: [
      'Pop-up blockers can prevent Google sign-in',
      'Clearing browser cache sometimes helps',
      'Try using a different browser if issues persist'
    ],
    invalid_format: [
      'First row should contain column headers like "Item Name", "Price"',
      'Data should start from row 2',
      'Avoid merged cells in your data area'
    ],
    invalid_prices: [
      'Prices should be numeric: 12.00 or $12.00',
      'Avoid text like "Market Price" or "TBD"',
      'Leave cells blank for items without prices yet'
    ],
    empty_data: [
      'Check you\'re on the correct tab/sheet',
      'Make sure there\'s data below the header row',
      'Hidden rows/columns are ignored during import'
    ],
    duplicate_items: [
      'Different sizes? Add size to name: "Pizza (Large)"',
      'Seasonal items? Add period: "Summer Salad"',
      'You can always edit names after import'
    ]
  };

  return commonTips[errorType] || [
    'If you need help, we\'re here for you',
    'Contact support with details about what happened',
    'Screenshots help us understand the issue'
  ];
}

/**
 * Format error for display in UI
 */
export function formatErrorForUI(errorResult: ErrorResult): {
  icon: string;
  color: string;
  actions: { label: string; action: string }[];
} {
  const baseActions = [
    { label: 'Try Again', action: 'retry' },
    { label: 'View Example Format', action: 'show_example' },
    { label: 'Get Help', action: 'contact_support' }
  ];

  switch (errorResult.type) {
    case 'auth_failed':
      return {
        icon: '🔐',
        color: 'amber',
        actions: [
          { label: 'Reconnect Google Sheets', action: 'reconnect' },
          { label: 'Get Help', action: 'contact_support' }
        ]
      };

    case 'invalid_prices':
      return {
        icon: '💰',
        color: 'red',
        actions: [
          { label: 'View Invalid Items', action: 'show_errors' },
          { label: 'Fix in Spreadsheet', action: 'open_sheet' },
          { label: 'Try Again', action: 'retry' }
        ]
      };

    case 'duplicate_items':
      return {
        icon: '⚠️',
        color: 'yellow',
        actions: [
          { label: 'Review Duplicates', action: 'show_duplicates' },
          { label: 'Keep All', action: 'keep_all' },
          { label: 'Fix in Spreadsheet', action: 'open_sheet' }
        ]
      };

    case 'empty_data':
      return {
        icon: '📭',
        color: 'gray',
        actions: [
          { label: 'Select Different Tab', action: 'select_tab' },
          { label: 'View Example Format', action: 'show_example' }
        ]
      };

    default:
      return {
        icon: '❌',
        color: 'red',
        actions: baseActions
      };
  }
}

/**
 * Log error for monitoring/debugging
 */
export function logError(errorResult: ErrorResult, context?: any) {
  // In production, this would send to error monitoring service
  console.group(`🚨 Import Error: ${errorResult.type}`);
  console.error('Title:', errorResult.title);
  console.error('Message:', errorResult.message);
  console.error('Technical:', errorResult.technical);
  if (context) {
    console.error('Context:', context);
  }
  console.groupEnd();

  // Example: Send to error monitoring service
  // if (typeof window !== 'undefined' && window.analytics) {
  //   window.analytics.track('Import Error', {
  //     errorType: errorResult.type,
  //     errorTitle: errorResult.title,
  //     technical: errorResult.technical,
  //     ...context
  //   });
  // }
}
