/**
 * JiGR Core System - Main Entry Point
 * Unified interface for all Core modules and system orchestration
 * 
 * SAFETY: This creates NEW orchestration layer - ZERO RISK to existing code
 */

// =============================================================================
// CORE SYSTEM EXPORTS
// =============================================================================

export { getJiGRCoreSystem } from './JiGRCoreSystem'
export type { JiGRCoreSystemConfig, CoreSystemStatus, ModuleStatus } from './JiGRCoreSystem'

// =============================================================================
// INDIVIDUAL CORE MODULE EXPORTS
// =============================================================================

// Authentication Core
export { 
  getAuthenticationCore,
  initializeAuthenticationModule,
  getAuthenticationCapability,
  getAuthorizationCapability,
  getProfileManagementCapability,
  getTeamManagementCapability
} from './Authentication'

// Database Core
// export { 
//   getDatabaseModule,
//   initializeDatabaseModule,
//   getDatabaseQueryCapability,
//   getDatabaseStorageCapability,
//   getDatabaseSchemaCapability,
//   getDatabaseConnectionCapability
// } from './Database'

// Design System Core
export { 
  getDesignSystemModule,
  initializeDesignSystemModule,
  getDesignTokenCapability,
  getComponentStyleCapability,
  getThemeManagerCapability,
  getAccessibilityCapability
} from './DesignSystem'

// =============================================================================
// UNIFIED CORE SYSTEM INTERFACE
// =============================================================================

import { getJiGRCoreSystem } from './JiGRCoreSystem'
import type { JiGRCoreSystemConfig } from './JiGRCoreSystem'

/**
 * Initialize the complete JiGR Core System with Event Communication
 * This is the primary function to bootstrap all Core modules and event system
 */
export const initializeJiGRCoreSystem = async (
  config?: Partial<JiGRCoreSystemConfig & { 
    enableEventCommunication?: boolean 
    enableWorkflows?: boolean 
  }>
) => {
  const coreSystem = getJiGRCoreSystem()
  
  if (config) {
    await coreSystem.configure(config)
  }
  
  if (!coreSystem.isLoaded) {
    await coreSystem.initialize()
  }
  
  if (!coreSystem.isActive) {
    await coreSystem.activate()
  }
  
  // Initialize event communication system if enabled (default: true)
  if (config?.enableEventCommunication !== false) {
    try {
      const { initializeModuleEventSystem } = await import('./ModuleEventIntegration')
      await initializeModuleEventSystem()
      console.log('📡 Event Communication System active')
    } catch (error) {
      console.warn('⚠️ Event Communication System initialization failed:', error)
    }
  }
  
  console.log('🚀 JiGR Core System fully initialized and active')
  return coreSystem
}

/**
 * Get the Core System orchestration capability
 * Provides system-level management functions
 */
export const getCoreOrchestrationCapability = () => {
  const coreSystem = getJiGRCoreSystem()
  return coreSystem.getCapabilityInterface('core-orchestration')
}

/**
 * Get the System Health capability
 * Provides health monitoring and diagnostics
 */
export const getSystemHealthCapability = () => {
  const coreSystem = getJiGRCoreSystem()
  return coreSystem.getCapabilityInterface('system-health')
}

/**
 * Get the Module Communication capability
 * Provides inter-module communication and event routing
 */
export const getModuleCommunicationCapability = () => {
  const coreSystem = getJiGRCoreSystem()
  return coreSystem.getCapabilityInterface('module-communication')
}

/**
 * Quick system status check
 * Returns current status of all Core modules
 */
export const getSystemStatus = () => {
  const coreSystem = getJiGRCoreSystem()
  return coreSystem.getCapabilityInterface('core-orchestration').getSystemStatus()
}

/**
 * Emergency system restart
 * Restarts all Core modules in proper sequence
 */
export const emergencySystemRestart = async () => {
  console.log('🚨 Emergency system restart initiated')
  
  const coreSystem = getJiGRCoreSystem()
  
  try {
    // Deactivate and cleanup
    if (coreSystem.isActive) {
      await coreSystem.deactivate()
    }
    
    if (coreSystem.isLoaded) {
      await coreSystem.cleanup()
    }
    
    // Re-initialize with event system
    await coreSystem.initialize()
    await coreSystem.activate()
    
    // Restart event communication system
    try {
      const { initializeModuleEventSystem } = await import('./ModuleEventIntegration')
      await initializeModuleEventSystem()
      console.log('📡 Event Communication System restarted')
    } catch (error) {
      console.warn('⚠️ Event Communication System restart failed:', error)
    }
    
    console.log('✅ Emergency system restart completed successfully')
    return true
    
  } catch (error) {
    console.error('❌ Emergency system restart failed:', error)
    return false
  }
}

/**
 * Get Event Communication System status and metrics
 */
export const getEventSystemStatus = () => {
  try {
    const { getEnhancedCommunicationSystem } = require('../EnhancedModuleCommunication')
    const communicationSystem = getEnhancedCommunicationSystem()
    
    return {
      available: true,
      metrics: communicationSystem.getMetrics(),
      subscriptions: communicationSystem.getActiveSubscriptions()
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Initialize JiGR Suite with full event-driven architecture
 */
export const initializeJiGRSuiteWithEvents = async (options?: {
  enablePredictiveAnalytics?: boolean
  enableRealTimeNotifications?: boolean
  enableAutomaticWorkflows?: boolean
  enableAdvancedReporting?: boolean
}) => {
  console.log('🎯 Initializing complete JiGR Suite with Event-Driven Architecture...')
  
  const config = {
    // Core system configuration
    enableAutoInitialization: true,
    enableHealthMonitoring: true,
    enableParallelInitialization: true,
    
    // Event system configuration
    enableEventCommunication: true,
    enableWorkflows: true,
    
    // Feature flags based on options
    ...options
  }
  
  // Initialize Core System with Events
  const coreSystem = await initializeJiGRCoreSystem(config)
  
  // Initialize AddOn modules if requested
  if (options?.enableAdvancedReporting) {
    try {
      const { setupEnterpriseAnalytics } = await import('../modules/ReportingAnalyticsModule')
      await setupEnterpriseAnalytics()
      console.log('📊 Enterprise Analytics enabled')
    } catch (error) {
      console.warn('⚠️ Enterprise Analytics setup failed:', error)
    }
  }
  
  const eventStatus = getEventSystemStatus()
  
  console.log('🎉 JiGR Suite with Event-Driven Architecture ready!')
  console.log(`📊 Event System: ${eventStatus.available ? 'Active' : 'Unavailable'}`)
  
  if (eventStatus.available) {
    console.log(`📡 Active Subscriptions: ${Object.keys(eventStatus.subscriptions || {}).length}`)
    console.log(`⚡ Events Processed: ${eventStatus.metrics?.totalEvents || 0}`)
  }
  
  return {
    coreSystem,
    eventSystem: eventStatus,
    features: {
      predictiveAnalytics: options?.enablePredictiveAnalytics ?? false,
      realTimeNotifications: options?.enableRealTimeNotifications ?? false,
      automaticWorkflows: options?.enableAutomaticWorkflows ?? false,
      advancedReporting: options?.enableAdvancedReporting ?? false
    }
  }
}

// =============================================================================
// DEVELOPMENT AND DEBUGGING
// =============================================================================

/**
 * Development helper to get all module statuses
 * Only available in development mode
 */
export const getDetailedSystemDiagnostics = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('System diagnostics only available in development mode')
    return null
  }
  
  const coreSystem = getJiGRCoreSystem()
  const systemStatus = getSystemStatus()
  const healthStatus = getSystemHealthCapability().getHealthStatus()
  
  return {
    system: {
      initialized: coreSystem.isLoaded,
      active: coreSystem.isActive,
      version: coreSystem.manifest.version
    },
    modules: systemStatus.moduleStatuses,
    health: healthStatus,
    performance: {
      initializationTime: systemStatus.initializationTime,
      lastHealthCheck: systemStatus.lastHealthCheck
    }
  }
}

/**
 * Register the Core System with Module Registry
 */
export const registerJiGRCoreSystem = async () => {
  try {
    const { moduleRegistry } = await import('@/lib/ModuleRegistry')
    const registry = moduleRegistry
    const coreSystem = getJiGRCoreSystem()
    
    await registry.registerModule(coreSystem)
    
    console.log('✅ JiGR Core System registered with Module Registry')
    return true
    
  } catch (error) {
    console.error('❌ Failed to register JiGR Core System:', error)
    return false
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

const JiGRCore = {
  // System orchestration
  getJiGRCoreSystem,
  initializeJiGRCoreSystem,
  registerJiGRCoreSystem,
  
  // System management
  getCoreOrchestrationCapability,
  getSystemHealthCapability,
  getModuleCommunicationCapability,
  getSystemStatus,
  emergencySystemRestart,
  
  // Development
  getDetailedSystemDiagnostics
}

export default JiGRCore