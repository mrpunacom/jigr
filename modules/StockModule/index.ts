/**
 * JiGR Stock Module - Hybrid Inventory Counting System
 * 
 * Main entry point for the Stock Module providing:
 * - 5 counting workflows (unit, container, bottle, keg, batch)
 * - Smart container management with barcode generation
 * - Anomaly detection and validation
 * - Real-time count submission and tracking
 * - iPad Air 2013 optimized interface
 */

import React from 'react'
import { StockModuleCore } from './StockModuleCore'
import { StockDashboard } from './components/StockDashboard'

// ============================================================================
// MODULE REGISTRATION
// ============================================================================

export const StockModule = {
  id: 'stock-module',
  name: 'JiGR Stock',
  version: '1.0.0',
  description: 'Hybrid Inventory Counting System for Hospitality',
  
  // Module capabilities
  capabilities: [
    'inventory-counting',
    'container-management', 
    'anomaly-detection',
    'workflow-automation',
    'barcode-scanning',
    'weight-integration'
  ],
  
  // Main component
  component: StockDashboard,
  
  // Module configuration
  config: {
    requiresAuth: true,
    supportedWorkflows: [
      'unit_count',
      'container_weight', 
      'bottle_hybrid',
      'keg_weight',
      'batch_weight'
    ],
    features: {
      barcodeScanning: true,
      weightIntegration: true,
      anomalyDetection: true,
      realTimeSync: true,
      offlineSupport: false // Future enhancement
    }
  },
  
  // Module routes
  routes: [
    {
      path: '/stock',
      component: 'StockDashboard',
      title: 'Stock Overview'
    },
    {
      path: '/stock/items',
      component: 'StockItemsList', 
      title: 'Manage Items'
    },
    {
      path: '/stock/count',
      component: 'CountSubmission',
      title: 'Submit Count'
    },
    {
      path: '/stock/containers',
      component: 'ContainerManagement',
      title: 'Manage Containers'
    },
    {
      path: '/stock/history',
      component: 'CountHistory',
      title: 'Count History'
    }
  ],
  
  // Permissions required
  permissions: [
    'stock:read',
    'stock:write',
    'stock:manage_containers',
    'stock:submit_counts'
  ]
}

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

// Main components
export { StockDashboard } from './components/StockDashboard'
export { StockItemsList } from './components/StockItemsList'
export { CountSubmission } from './components/CountSubmission'
export { ContainerManagement } from './components/ContainerManagement'
export { CountHistory } from './components/CountHistory'

// Specialized components
export { ItemDetailModal } from './components/ItemDetailModal'
export { AddItemModal } from './components/AddItemModal'
export { ContainerAssignment } from './components/ContainerAssignment'
export { AnomalyDisplay } from './components/AnomalyDisplay'
export { BottleHybridInterface } from './components/BottleHybridInterface'
export { KegWeightInterface } from './components/KegWeightInterface'

// Utility components
export { WorkflowSelector } from './components/WorkflowSelector'
export { BarcodeScanner } from './components/BarcodeScanner'

// ============================================================================
// HOOK EXPORTS  
// ============================================================================

export { useStockItems } from './hooks/useStockItems'
export { useContainers } from './hooks/useContainers'
export { useCountSubmission } from './hooks/useCountSubmission'
export { useAnomalyDetection } from './hooks/useAnomalyDetection'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  CountingWorkflow,
  InventoryItem,
  ContainerInstance,
  InventoryCount,
  WeightAnomaly,
  CountSubmissionRequest,
  CountSubmissionResponse
} from '@/types/stock'

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { StockApiClient } from './utils/StockApiClient'
export { WorkflowValidator } from './utils/WorkflowValidator'
export { AnomalyAnalyzer } from './utils/AnomalyAnalyzer'

// Default export for module registration
export default StockModule