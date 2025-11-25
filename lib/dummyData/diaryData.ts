// Dummy data for DIARY module
// This file contains realistic sample data for development and testing

export interface ExpiringItem {
  id: string
  itemName: string
  category: string
  batchNumber: string
  quantity: number
  unit: string
  bestBefore: string
  daysUntilExpiry: number
  unitCost: number
  totalValue: number
  location: string
  supplier: string
  status: 'expiring_today' | 'expiring_tomorrow' | 'expiring_this_week' | 'expired'
}

export interface ActivityLogEntry {
  id: string
  timestamp: string
  user: string
  userRole: string
  action: string
  details: string
  ipAddress?: string
  device?: string
  module?: string
}

export interface AuditTrailEntry {
  id: string
  timestamp: string
  user: string
  module: string
  action: string
  entityType: string
  entityId: string
  entityName: string
  changeType: 'create' | 'update' | 'delete' | 'complete'
  before?: any
  after?: any
  details?: any
  reason?: string
  ipAddress?: string
}

export interface TimelineEvent {
  time: string
  type: 'login' | 'logout' | 'inspection' | 'expiring' | 'inventory' | 'repair' | 'safety' | 'system'
  user: string
  action: string
  icon: string
  severity?: 'info' | 'warning' | 'error'
}

export const DIARY_DASHBOARD_DATA = {
  metrics: {
    expiringToday: 3,
    expiringThisWeek: 12,
    activeUsersToday: 12,
    systemEventsToday: 47
  },
  todaysTimeline: [
    {
      time: '2025-11-21T07:00:00Z',
      type: 'login' as const,
      user: 'Sarah Chen',
      action: 'Logged in to start morning shift',
      icon: '👤'
    },
    {
      time: '2025-11-21T07:15:00Z',
      type: 'inspection' as const,
      user: 'Sarah Chen',
      action: 'Completed opening inspection checklist',
      icon: '📋'
    },
    {
      time: '2025-11-21T07:30:00Z',
      type: 'system' as const,
      user: 'System',
      action: 'Automated backup completed successfully',
      icon: '💾'
    },
    {
      time: '2025-11-21T08:00:00Z',
      type: 'login' as const,
      user: 'Mike Torres',
      action: 'Logged in for prep shift',
      icon: '👤'
    },
    {
      time: '2025-11-21T08:15:00Z',
      type: 'expiring' as const,
      user: 'System',
      action: '3 items detected expiring today',
      icon: '⏰',
      severity: 'warning' as const
    },
    {
      time: '2025-11-21T08:30:00Z',
      type: 'safety' as const,
      user: 'Sarah Chen',
      action: 'Reported wet floor safety issue',
      icon: '⚠️',
      severity: 'warning' as const
    },
    {
      time: '2025-11-21T09:00:00Z',
      type: 'inventory' as const,
      user: 'Mike Torres',
      action: 'Stock adjustment: Tomatoes (-2kg)',
      icon: '📦'
    },
    {
      time: '2025-11-21T09:15:00Z',
      type: 'login' as const,
      user: 'Emma Rodriguez',
      action: 'Logged in for kitchen prep',
      icon: '👤'
    },
    {
      time: '2025-11-21T09:30:00Z',
      type: 'inventory' as const,
      user: 'Emma Rodriguez',
      action: 'Started morning stock count',
      icon: '📦'
    },
    {
      time: '2025-11-21T10:00:00Z',
      type: 'login' as const,
      user: 'Tom Wilson',
      action: 'Manager login - daily oversight',
      icon: '👤'
    },
    {
      time: '2025-11-21T10:15:00Z',
      type: 'repair' as const,
      user: 'System',
      action: 'CoolTech Services assigned to cooler repair',
      icon: '🔧'
    },
    {
      time: '2025-11-21T10:30:00Z',
      type: 'system' as const,
      user: 'System',
      action: 'Daily compliance report generated',
      icon: '📊'
    }
  ]
}

export const EXPIRING_ITEMS: ExpiringItem[] = [
  {
    id: 'EXP-001',
    itemName: 'Organic Heavy Cream',
    category: 'Dairy',
    batchNumber: 'BATCH-2025-11-001',
    quantity: 2,
    unit: 'L',
    bestBefore: '2025-11-21T00:00:00Z',
    daysUntilExpiry: 0,
    unitCost: 8.50,
    totalValue: 17.00,
    location: 'Walk-in Cooler - Shelf 2',
    supplier: 'Local Dairy Co',
    status: 'expiring_today'
  },
  {
    id: 'EXP-002',
    itemName: 'Free Range Chicken Breast',
    category: 'Proteins',
    batchNumber: 'BATCH-2025-11-002',
    quantity: 5,
    unit: 'kg',
    bestBefore: '2025-11-21T00:00:00Z',
    daysUntilExpiry: 0,
    unitCost: 18.00,
    totalValue: 90.00,
    location: 'Walk-in Cooler - Shelf 1',
    supplier: 'Premium Meats Ltd',
    status: 'expiring_today'
  },
  {
    id: 'EXP-003',
    itemName: 'Fresh Salmon Fillets',
    category: 'Seafood',
    batchNumber: 'BATCH-2025-11-003',
    quantity: 3,
    unit: 'kg',
    bestBefore: '2025-11-21T00:00:00Z',
    daysUntilExpiry: 0,
    unitCost: 32.00,
    totalValue: 96.00,
    location: 'Walk-in Cooler - Seafood Section',
    supplier: 'Ocean Fresh Seafood',
    status: 'expiring_today'
  },
  {
    id: 'EXP-004',
    itemName: 'Baby Spinach',
    category: 'Produce',
    batchNumber: 'BATCH-2025-11-004',
    quantity: 1.5,
    unit: 'kg',
    bestBefore: '2025-11-22T00:00:00Z',
    daysUntilExpiry: 1,
    unitCost: 12.00,
    totalValue: 18.00,
    location: 'Walk-in Cooler - Produce Drawer',
    supplier: 'Fresh Veg Suppliers',
    status: 'expiring_tomorrow'
  },
  {
    id: 'EXP-005',
    itemName: 'Roma Tomatoes',
    category: 'Produce',
    batchNumber: 'BATCH-2025-11-005',
    quantity: 4,
    unit: 'kg',
    bestBefore: '2025-11-22T00:00:00Z',
    daysUntilExpiry: 1,
    unitCost: 6.50,
    totalValue: 26.00,
    location: 'Walk-in Cooler - Produce Drawer',
    supplier: 'Fresh Veg Suppliers',
    status: 'expiring_tomorrow'
  },
  {
    id: 'EXP-006',
    itemName: 'Artisan Bread',
    category: 'Bakery',
    batchNumber: 'BATCH-2025-11-006',
    quantity: 8,
    unit: 'loaves',
    bestBefore: '2025-11-23T00:00:00Z',
    daysUntilExpiry: 2,
    unitCost: 4.50,
    totalValue: 36.00,
    location: 'Dry Storage - Bakery Shelf',
    supplier: 'Village Bakery',
    status: 'expiring_this_week'
  },
  {
    id: 'EXP-007',
    itemName: 'Fresh Mozzarella',
    category: 'Dairy',
    batchNumber: 'BATCH-2025-11-007',
    quantity: 6,
    unit: 'balls',
    bestBefore: '2025-11-23T00:00:00Z',
    daysUntilExpiry: 2,
    unitCost: 5.25,
    totalValue: 31.50,
    location: 'Walk-in Cooler - Cheese Section',
    supplier: 'Artisan Cheese Co',
    status: 'expiring_this_week'
  },
  {
    id: 'EXP-008',
    itemName: 'Organic Herbs Mix',
    category: 'Herbs',
    batchNumber: 'BATCH-2025-11-008',
    quantity: 200,
    unit: 'g',
    bestBefore: '2025-11-24T00:00:00Z',
    daysUntilExpiry: 3,
    unitCost: 0.08,
    totalValue: 16.00,
    location: 'Walk-in Cooler - Herbs Compartment',
    supplier: 'Herb Garden Supplies',
    status: 'expiring_this_week'
  },
  {
    id: 'EXP-009',
    itemName: 'Greek Yogurt',
    category: 'Dairy',
    batchNumber: 'BATCH-2025-11-009',
    quantity: 12,
    unit: 'containers',
    bestBefore: '2025-11-25T00:00:00Z',
    daysUntilExpiry: 4,
    unitCost: 3.50,
    totalValue: 42.00,
    location: 'Walk-in Cooler - Dairy Section',
    supplier: 'Local Dairy Co',
    status: 'expiring_this_week'
  },
  {
    id: 'EXP-010',
    itemName: 'Smoked Bacon',
    category: 'Proteins',
    batchNumber: 'BATCH-2025-11-010',
    quantity: 2.5,
    unit: 'kg',
    bestBefore: '2025-11-26T00:00:00Z',
    daysUntilExpiry: 5,
    unitCost: 14.00,
    totalValue: 35.00,
    location: 'Walk-in Cooler - Cured Meats Section',
    supplier: 'Premium Meats Ltd',
    status: 'expiring_this_week'
  }
]

export const ACTIVITY_LOG: ActivityLogEntry[] = [
  {
    id: 'ACT-001',
    timestamp: '2025-11-21T07:00:15Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'login',
    details: 'Logged in from iPad to start morning shift',
    ipAddress: '192.168.1.45',
    device: 'iPad Air (2013) - Safari 12'
  },
  {
    id: 'ACT-002',
    timestamp: '2025-11-21T07:15:30Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'inspection_completed',
    details: 'Completed opening inspection checklist - all items passed',
    module: 'repairs'
  },
  {
    id: 'ACT-003',
    timestamp: '2025-11-21T08:00:00Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'login',
    details: 'Logged in from kitchen iPad for prep shift',
    ipAddress: '192.168.1.46',
    device: 'iPad Air (2013) - Safari 12'
  },
  {
    id: 'ACT-004',
    timestamp: '2025-11-21T08:30:22Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'count_started',
    details: 'Started stocktake session for Produce category',
    module: 'stock'
  },
  {
    id: 'ACT-005',
    timestamp: '2025-11-21T09:00:00Z',
    user: 'Tom Wilson',
    userRole: 'Owner',
    action: 'login',
    details: 'Manager login for daily oversight and reporting',
    ipAddress: '192.168.1.10',
    device: 'iPad Pro - Safari 17'
  },
  {
    id: 'ACT-006',
    timestamp: '2025-11-21T09:15:45Z',
    user: 'Emma Rodriguez',
    userRole: 'Staff',
    action: 'login',
    details: 'Logged in for kitchen prep duties',
    ipAddress: '192.168.1.47',
    device: 'iPad Air (2013) - Safari 12'
  },
  {
    id: 'ACT-007',
    timestamp: '2025-11-21T09:30:12Z',
    user: 'Emma Rodriguez',
    userRole: 'Staff',
    action: 'recipe_viewed',
    details: 'Accessed Classic Caesar Salad recipe for lunch prep',
    module: 'recipes'
  },
  {
    id: 'ACT-008',
    timestamp: '2025-11-21T10:00:30Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'count_completed',
    details: 'Completed produce stocktake - 15 items counted',
    module: 'stock'
  },
  {
    id: 'ACT-009',
    timestamp: '2025-11-21T10:15:00Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'safety_issue_reported',
    details: 'Reported wet floor safety issue near dishwasher',
    module: 'repairs'
  },
  {
    id: 'ACT-010',
    timestamp: '2025-11-21T10:30:45Z',
    user: 'Tom Wilson',
    userRole: 'Owner',
    action: 'report_generated',
    details: 'Generated daily compliance report for regulatory filing',
    module: 'admin'
  },
  {
    id: 'ACT-011',
    timestamp: '2025-11-20T18:30:00Z',
    user: 'Emma Rodriguez',
    userRole: 'Staff',
    action: 'logout',
    details: 'Logged out after evening shift completion',
    ipAddress: '192.168.1.47'
  },
  {
    id: 'ACT-012',
    timestamp: '2025-11-20T18:15:22Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'cleanup_completed',
    details: 'Completed end-of-day kitchen cleaning checklist',
    module: 'repairs'
  },
  {
    id: 'ACT-013',
    timestamp: '2025-11-20T17:45:15Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'inventory_adjustment',
    details: 'Adjusted stock levels for end-of-day reconciliation',
    module: 'stock'
  },
  {
    id: 'ACT-014',
    timestamp: '2025-11-20T16:30:00Z',
    user: 'Tom Wilson',
    userRole: 'Owner',
    action: 'vendor_invoice_approved',
    details: 'Approved CoolTech Services invoice for cooler maintenance',
    module: 'vendors'
  },
  {
    id: 'ACT-015',
    timestamp: '2025-11-20T15:20:30Z',
    user: 'System',
    userRole: 'System',
    action: 'backup_completed',
    details: 'Automated daily database backup completed successfully'
  }
]

export const AUDIT_TRAIL: AuditTrailEntry[] = [
  {
    id: 'AUD-001',
    timestamp: '2025-11-21T09:00:15Z',
    user: 'Mike Torres',
    module: 'stock',
    action: 'inventory_adjustment',
    entityType: 'inventory_item',
    entityId: 'ITEM-123',
    entityName: 'Tomatoes, Roma',
    changeType: 'update',
    before: { quantity: 15, unit: 'kg', lastUpdated: '2025-11-20T18:00:00Z' },
    after: { quantity: 13, unit: 'kg', lastUpdated: '2025-11-21T09:00:15Z' },
    reason: 'Damaged items identified and removed during morning prep',
    ipAddress: '192.168.1.46'
  },
  {
    id: 'AUD-002',
    timestamp: '2025-11-21T09:15:30Z',
    user: 'Sarah Chen',
    module: 'recipes',
    action: 'recipe_updated',
    entityType: 'recipe',
    entityId: 'RECIPE-045',
    entityName: 'Classic Caesar Salad',
    changeType: 'update',
    before: { 
      ingredients: ['lettuce', 'croutons', 'parmesan', 'dressing'], 
      costPerPortion: 4.50,
      lastModified: '2025-11-15T10:30:00Z'
    },
    after: { 
      ingredients: ['lettuce', 'croutons', 'parmesan', 'dressing', 'anchovies'], 
      costPerPortion: 4.75,
      lastModified: '2025-11-21T09:15:30Z'
    },
    reason: 'Added anchovies to traditional recipe, updated cost calculation',
    ipAddress: '192.168.1.45'
  },
  {
    id: 'AUD-003',
    timestamp: '2025-11-21T10:00:00Z',
    user: 'Tom Wilson',
    module: 'admin',
    action: 'user_permission_changed',
    entityType: 'user',
    entityId: 'USER-008',
    entityName: 'Emma Rodriguez',
    changeType: 'update',
    before: { role: 'STAFF', permissions: ['read:recipes', 'read:stock'] },
    after: { role: 'MANAGER', permissions: ['read:recipes', 'read:stock', 'write:reports', 'manage:team'] },
    reason: 'Promotion to shift manager role effective immediately',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'AUD-004',
    timestamp: '2025-11-21T11:30:00Z',
    user: 'Mike Torres',
    module: 'stock',
    action: 'count_session_completed',
    entityType: 'count_session',
    entityId: 'COUNT-2025-11-21',
    entityName: 'Produce Stocktake Session',
    changeType: 'complete',
    details: {
      itemsCounted: 45,
      totalVariance: -125.50,
      duration: 90, // minutes
      categories: ['Produce', 'Herbs'],
      startTime: '2025-11-21T10:00:00Z',
      endTime: '2025-11-21T11:30:00Z'
    },
    reason: 'Regular morning stock count for produce section',
    ipAddress: '192.168.1.46'
  },
  {
    id: 'AUD-005',
    timestamp: '2025-11-21T12:00:00Z',
    user: 'Sarah Chen',
    module: 'repairs',
    action: 'safety_issue_created',
    entityType: 'safety_issue',
    entityId: 'SAF-001',
    entityName: 'Wet floor near dishwasher',
    changeType: 'create',
    after: {
      severity: 'high',
      status: 'open',
      location: 'Kitchen - Dishwashing Area',
      description: 'Water pooling under dishwasher, slip hazard for staff'
    },
    reason: 'Immediate safety concern identified during shift',
    ipAddress: '192.168.1.45'
  },
  {
    id: 'AUD-006',
    timestamp: '2025-11-20T16:45:00Z',
    user: 'Mike Torres',
    module: 'repairs',
    action: 'safety_issue_created',
    entityType: 'safety_issue',
    entityId: 'SAF-002',
    entityName: 'Loose electrical outlet near prep station',
    changeType: 'create',
    after: {
      severity: 'critical',
      status: 'open',
      location: 'Kitchen - Prep Area',
      description: 'Outlet cover loose, potential electrical shock hazard'
    },
    reason: 'Electrical safety hazard discovered during equipment check',
    ipAddress: '192.168.1.46'
  },
  {
    id: 'AUD-007',
    timestamp: '2025-11-20T14:15:00Z',
    user: 'Tom Wilson',
    module: 'repairs',
    action: 'repair_task_created',
    entityType: 'repair_task',
    entityId: 'REP-001',
    entityName: 'Walk-in cooler temperature fluctuating',
    changeType: 'create',
    after: {
      priority: 'urgent',
      status: 'pending',
      equipment: 'Walk-in Cooler #1',
      estimatedCost: 450,
      dueDate: '2025-11-22T10:00:00Z'
    },
    reason: 'Temperature control issue affecting food safety',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'AUD-008',
    timestamp: '2025-11-20T13:30:00Z',
    user: 'System',
    module: 'vendors',
    action: 'vendor_payment_processed',
    entityType: 'payment',
    entityId: 'PAY-2025-11-001',
    entityName: 'Fresh Veg Suppliers - Invoice #INV-2025-456',
    changeType: 'create',
    details: {
      amount: 785.50,
      paymentMethod: 'Bank Transfer',
      invoiceDate: '2025-11-18T00:00:00Z',
      dueDate: '2025-11-25T00:00:00Z',
      status: 'paid'
    }
  },
  {
    id: 'AUD-009',
    timestamp: '2025-11-19T11:30:00Z',
    user: 'Sarah Chen',
    module: 'menu',
    action: 'menu_item_price_updated',
    entityType: 'menu_item',
    entityId: 'MENU-034',
    entityName: 'Grilled Salmon with Quinoa',
    changeType: 'update',
    before: { price: 24.50, cost: 8.75, margin: 64.3 },
    after: { price: 26.00, cost: 8.75, margin: 66.3 },
    reason: 'Price adjustment due to increased salmon costs',
    ipAddress: '192.168.1.45'
  },
  {
    id: 'AUD-010',
    timestamp: '2025-11-18T09:00:00Z',
    user: 'Tom Wilson',
    module: 'admin',
    action: 'system_backup_scheduled',
    entityType: 'backup_schedule',
    entityId: 'BACKUP-001',
    entityName: 'Daily Database Backup',
    changeType: 'update',
    before: { frequency: 'daily', time: '02:00', retention: 30 },
    after: { frequency: 'daily', time: '01:30', retention: 45 },
    reason: 'Adjusted backup time to avoid peak system usage',
    ipAddress: '192.168.1.10'
  }
]