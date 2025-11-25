// Dummy data for REPAIRS module
// This file contains realistic sample data for development and testing

export interface SafetyIssue {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'in_progress' | 'resolved'
  reportedBy: string
  reportedAt: string
  location: string
  photos: string[]
  assignedTo?: string
  actions: Array<{
    date: string
    user: string
    action: string
  }>
}

export interface RepairTask {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed'
  equipment: string
  reportedBy: string
  reportedAt: string
  assignedTo: string | null
  estimatedCost: number
  notes: string
  dueDate: string
}

export interface MaintenanceItem {
  id: string
  title: string
  equipment: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'
  lastCompleted: string
  nextDue: string
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
  assignedTo: string
  estimatedTime: number // minutes
  instructions: string
}

export interface InspectionTemplate {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'per_service'
  items: Array<{
    id: number
    category: string
    item: string
    required: boolean
  }>
}

export interface InspectionLog {
  id: string
  template: string
  completedBy: string
  completedAt: string
  results: Array<{
    itemId: number
    status: 'pass' | 'fail' | 'needs_attention'
    notes?: string
    value?: string
  }>
}

export const REPAIRS_DASHBOARD_DATA = {
  metrics: {
    openIssues: 8,
    openIssuesTrend: 'up' as const,
    pendingRepairs: 5,
    pendingRepairsTrend: 'stable' as const,
    overdueMaintenance: 2,
    overdueMaintenanceTrend: 'up' as const
  },
  recentActivity: [
    {
      id: 1,
      type: 'safety',
      title: 'Wet floor near dishwasher',
      severity: 'high',
      status: 'open',
      reportedBy: 'Sarah Chen',
      reportedAt: '2025-11-21T08:30:00Z'
    },
    {
      id: 2,
      type: 'repair',
      title: 'Walk-in cooler temperature fluctuating',
      priority: 'urgent',
      status: 'in_progress',
      assignedTo: 'CoolTech Services',
      reportedAt: '2025-11-20T14:15:00Z'
    },
    {
      id: 3,
      type: 'maintenance',
      title: 'Monthly deep fryer oil change',
      status: 'overdue',
      dueDate: '2025-11-19T00:00:00Z',
      assignedTo: 'Kitchen Team'
    },
    {
      id: 4,
      type: 'safety',
      title: 'Loose electrical outlet near prep station',
      severity: 'critical',
      status: 'in_progress',
      reportedBy: 'Mike Torres',
      reportedAt: '2025-11-20T16:45:00Z'
    },
    {
      id: 5,
      type: 'repair',
      title: 'Oven door seal replacement needed',
      priority: 'high',
      status: 'pending',
      assignedTo: null,
      reportedAt: '2025-11-19T11:30:00Z'
    },
    {
      id: 6,
      type: 'maintenance',
      title: 'Grease trap cleaning',
      status: 'upcoming',
      dueDate: '2025-11-25T00:00:00Z',
      assignedTo: 'GreaseTech Services'
    },
    {
      id: 7,
      type: 'safety',
      title: 'Fire extinguisher inspection overdue',
      severity: 'medium',
      status: 'open',
      reportedBy: 'System',
      reportedAt: '2025-11-18T00:00:00Z'
    },
    {
      id: 8,
      type: 'repair',
      title: 'Replace broken shelf in dry storage',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Internal - Maintenance',
      reportedAt: '2025-11-18T09:00:00Z'
    }
  ]
}

export const SAFETY_ISSUES: SafetyIssue[] = [
  {
    id: 'SAF-001',
    title: 'Wet floor near dishwasher',
    description: 'Water pooling under dishwasher, slip hazard for staff',
    severity: 'high',
    status: 'open',
    reportedBy: 'Sarah Chen',
    reportedAt: '2025-11-21T08:30:00Z',
    location: 'Kitchen - Dishwashing Area',
    photos: ['photo-placeholder-1.jpg'],
    actions: [
      { date: '2025-11-21T08:30:00Z', user: 'Sarah Chen', action: 'Reported issue' }
    ]
  },
  {
    id: 'SAF-002',
    title: 'Loose electrical outlet near prep station',
    description: 'Outlet cover loose, potential electrical shock hazard',
    severity: 'critical',
    status: 'in_progress',
    reportedBy: 'Mike Torres',
    reportedAt: '2025-11-20T16:45:00Z',
    location: 'Kitchen - Prep Area',
    photos: ['photo-placeholder-2.jpg'],
    assignedTo: 'ABC Electrical',
    actions: [
      { date: '2025-11-20T16:45:00Z', user: 'Mike Torres', action: 'Reported issue' },
      { date: '2025-11-21T09:00:00Z', user: 'System', action: 'Assigned to ABC Electrical' }
    ]
  },
  {
    id: 'SAF-003',
    title: 'Fire extinguisher inspection overdue',
    description: 'Annual fire extinguisher inspection due 3 days ago',
    severity: 'medium',
    status: 'open',
    reportedBy: 'System',
    reportedAt: '2025-11-18T00:00:00Z',
    location: 'Kitchen - Main Area',
    photos: [],
    actions: [
      { date: '2025-11-18T00:00:00Z', user: 'System', action: 'Automatic detection - inspection overdue' }
    ]
  },
  {
    id: 'SAF-004',
    title: 'Broken glass in walk-in cooler',
    description: 'Shattered jar on floor, sharp glass pieces scattered',
    severity: 'high',
    status: 'resolved',
    reportedBy: 'Emma Rodriguez',
    reportedAt: '2025-11-17T14:20:00Z',
    location: 'Walk-in Cooler',
    photos: ['photo-placeholder-3.jpg'],
    assignedTo: 'Kitchen Team',
    actions: [
      { date: '2025-11-17T14:20:00Z', user: 'Emma Rodriguez', action: 'Reported issue' },
      { date: '2025-11-17T14:25:00Z', user: 'Mike Torres', action: 'Cleaned up glass debris' },
      { date: '2025-11-17T14:30:00Z', user: 'Sarah Chen', action: 'Area sanitized and cleared for use' }
    ]
  },
  {
    id: 'SAF-005',
    title: 'Hot surface warning sign missing',
    description: 'Grill area missing warning signage for hot surfaces',
    severity: 'medium',
    status: 'open',
    reportedBy: 'Tom Wilson',
    reportedAt: '2025-11-16T10:15:00Z',
    location: 'Kitchen - Grill Station',
    photos: [],
    actions: [
      { date: '2025-11-16T10:15:00Z', user: 'Tom Wilson', action: 'Noted during inspection' }
    ]
  }
]

export const REPAIR_TASKS: RepairTask[] = [
  {
    id: 'REP-001',
    title: 'Walk-in cooler temperature fluctuating',
    description: 'Temperature ranging between 2°C and 8°C, needs stabilization at 2-4°C',
    priority: 'urgent',
    status: 'in_progress',
    equipment: 'Walk-in Cooler #1',
    reportedBy: 'Tom Wilson',
    reportedAt: '2025-11-20T14:15:00Z',
    assignedTo: 'CoolTech Services',
    estimatedCost: 450,
    notes: 'Technician scheduled for tomorrow morning. May need compressor adjustment.',
    dueDate: '2025-11-22T10:00:00Z'
  },
  {
    id: 'REP-002',
    title: 'Oven door seal replacement',
    description: 'Main oven door seal deteriorating, heat escaping affecting cooking times',
    priority: 'high',
    status: 'pending',
    equipment: 'Commercial Oven #1',
    reportedBy: 'Sarah Chen',
    reportedAt: '2025-11-19T11:30:00Z',
    assignedTo: null,
    estimatedCost: 180,
    notes: 'Waiting for replacement part delivery from supplier.',
    dueDate: '2025-11-25T00:00:00Z'
  },
  {
    id: 'REP-003',
    title: 'Replace broken shelf in dry storage',
    description: 'Metal shelf collapsed under weight, need heavy-duty replacement',
    priority: 'medium',
    status: 'pending',
    equipment: 'Dry Storage Shelving Unit #2',
    reportedBy: 'Mike Torres',
    reportedAt: '2025-11-18T09:00:00Z',
    assignedTo: 'Internal - Maintenance',
    estimatedCost: 75,
    notes: 'Can be done in-house. Parts ordered from restaurant supply.',
    dueDate: '2025-11-24T00:00:00Z'
  },
  {
    id: 'REP-004',
    title: 'Ice machine making unusual noise',
    description: 'Grinding sound during ice production cycle, may indicate bearing issue',
    priority: 'medium',
    status: 'pending',
    equipment: 'Ice Machine #1',
    reportedBy: 'Emma Rodriguez',
    reportedAt: '2025-11-17T16:20:00Z',
    assignedTo: null,
    estimatedCost: 320,
    notes: 'Need to contact ice machine service company for diagnosis.',
    dueDate: '2025-11-26T00:00:00Z'
  },
  {
    id: 'REP-005',
    title: 'Dishwasher spray arm clogged',
    description: 'Poor cleaning performance, spray arms need descaling',
    priority: 'medium',
    status: 'completed',
    equipment: 'Commercial Dishwasher',
    reportedBy: 'Mike Torres',
    reportedAt: '2025-11-16T08:45:00Z',
    assignedTo: 'Kitchen Team',
    estimatedCost: 0,
    notes: 'Completed in-house. Spray arms cleaned and descaled.',
    dueDate: '2025-11-17T00:00:00Z'
  }
]

export const MAINTENANCE_SCHEDULE: MaintenanceItem[] = [
  {
    id: 'MAINT-001',
    title: 'Deep fryer oil change',
    equipment: 'Deep Fryer #1',
    frequency: 'weekly',
    lastCompleted: '2025-11-14T00:00:00Z',
    nextDue: '2025-11-21T00:00:00Z',
    status: 'overdue',
    assignedTo: 'Kitchen Team',
    estimatedTime: 30,
    instructions: '1. Turn off fryer and allow to cool\n2. Drain old oil into disposal container\n3. Clean fryer basket and interior\n4. Refill with fresh oil\n5. Test heating cycle'
  },
  {
    id: 'MAINT-002',
    title: 'Dishwasher descaling',
    equipment: 'Commercial Dishwasher',
    frequency: 'monthly',
    lastCompleted: '2025-10-20T00:00:00Z',
    nextDue: '2025-11-20T00:00:00Z',
    status: 'overdue',
    assignedTo: 'Kitchen Team',
    estimatedTime: 45,
    instructions: '1. Run descaling cycle with approved chemicals\n2. Rinse thoroughly with clean water\n3. Check and clean spray arms\n4. Verify proper drainage'
  },
  {
    id: 'MAINT-003',
    title: 'Grease trap cleaning',
    equipment: 'Kitchen Grease Trap',
    frequency: 'weekly',
    lastCompleted: '2025-11-18T00:00:00Z',
    nextDue: '2025-11-25T00:00:00Z',
    status: 'upcoming',
    assignedTo: 'GreaseTech Services',
    estimatedTime: 60,
    instructions: 'Professional service - vendor handles all aspects of cleaning and disposal'
  },
  {
    id: 'MAINT-004',
    title: 'Hood and vent system cleaning',
    equipment: 'Kitchen Exhaust System',
    frequency: 'monthly',
    lastCompleted: '2025-10-25T00:00:00Z',
    nextDue: '2025-11-25T00:00:00Z',
    status: 'upcoming',
    assignedTo: 'VentClean Pro',
    estimatedTime: 180,
    instructions: 'Professional deep cleaning of hood, ductwork, and exhaust fan'
  },
  {
    id: 'MAINT-005',
    title: 'Refrigeration coil cleaning',
    equipment: 'Walk-in Cooler #1',
    frequency: 'quarterly',
    lastCompleted: '2025-08-15T00:00:00Z',
    nextDue: '2025-11-15T00:00:00Z',
    status: 'overdue',
    assignedTo: 'CoolTech Services',
    estimatedTime: 120,
    instructions: 'Clean condenser coils, check refrigerant levels, inspect door seals'
  }
]

export const INSPECTION_TEMPLATES: { [key: string]: InspectionTemplate } = {
  opening: {
    id: 'INSP-OPEN',
    name: 'Opening Inspection Checklist',
    frequency: 'daily',
    items: [
      { id: 1, category: 'Safety', item: 'Fire exits clear and unlocked', required: true },
      { id: 2, category: 'Safety', item: 'Fire extinguishers accessible', required: true },
      { id: 3, category: 'Safety', item: 'First aid kit stocked', required: true },
      { id: 4, category: 'Equipment', item: 'Walk-in cooler temperature (0-4°C)', required: true },
      { id: 5, category: 'Equipment', item: 'Freezer temperature (-18°C or below)', required: true },
      { id: 6, category: 'Equipment', item: 'Hot water temperature (60°C+)', required: true },
      { id: 7, category: 'Cleanliness', item: 'Floors clean and dry', required: true },
      { id: 8, category: 'Cleanliness', item: 'Prep surfaces sanitized', required: true },
      { id: 9, category: 'Equipment', item: 'Gas connections secure', required: true },
      { id: 10, category: 'Equipment', item: 'Electrical outlets functioning', required: false }
    ]
  },
  preService: {
    id: 'INSP-PRESERVICE',
    name: 'Pre-Service Checklist',
    frequency: 'per_service',
    items: [
      { id: 1, category: 'Kitchen', item: 'All stations stocked and ready', required: true },
      { id: 2, category: 'Kitchen', item: 'Hot line equipment at temperature', required: true },
      { id: 3, category: 'Kitchen', item: 'Fryers at correct temperature (175°C)', required: true },
      { id: 4, category: 'Front of House', item: 'Dining area clean and set', required: true },
      { id: 5, category: 'Front of House', item: 'Restrooms stocked and clean', required: true },
      { id: 6, category: 'Kitchen', item: 'Ice machine working properly', required: true },
      { id: 7, category: 'Kitchen', item: 'Dishwasher operational and stocked', required: true }
    ]
  },
  weekly: {
    id: 'INSP-WEEKLY',
    name: 'Weekly Deep Inspection',
    frequency: 'weekly',
    items: [
      { id: 1, category: 'Deep Cleaning', item: 'Behind equipment cleaned', required: true },
      { id: 2, category: 'Deep Cleaning', item: 'Drain covers removed and cleaned', required: true },
      { id: 3, category: 'Deep Cleaning', item: 'Light fixtures cleaned', required: true },
      { id: 4, category: 'Maintenance', item: 'Equipment inspected for wear', required: true },
      { id: 5, category: 'Maintenance', item: 'Door seals and gaskets checked', required: true },
      { id: 6, category: 'Safety', item: 'Emergency equipment tested', required: true }
    ]
  }
}

export const RECENT_INSPECTIONS: InspectionLog[] = [
  {
    id: 'LOG-001',
    template: 'opening',
    completedBy: 'Sarah Chen',
    completedAt: '2025-11-21T07:00:00Z',
    results: [
      { itemId: 1, status: 'pass' },
      { itemId: 2, status: 'pass' },
      { itemId: 3, status: 'needs_attention', notes: 'Low on bandages, restocked' },
      { itemId: 4, status: 'pass', value: '2°C' },
      { itemId: 5, status: 'pass', value: '-20°C' },
      { itemId: 6, status: 'pass', value: '65°C' },
      { itemId: 7, status: 'pass' },
      { itemId: 8, status: 'pass' },
      { itemId: 9, status: 'pass' },
      { itemId: 10, status: 'pass' }
    ]
  },
  {
    id: 'LOG-002',
    template: 'preService',
    completedBy: 'Mike Torres',
    completedAt: '2025-11-20T16:30:00Z',
    results: [
      { itemId: 1, status: 'pass' },
      { itemId: 2, status: 'pass' },
      { itemId: 3, status: 'fail', notes: 'Fryer temperature low, adjusting' },
      { itemId: 4, status: 'pass' },
      { itemId: 5, status: 'needs_attention', notes: 'Restroom soap dispenser empty' },
      { itemId: 6, status: 'pass' },
      { itemId: 7, status: 'pass' }
    ]
  },
  {
    id: 'LOG-003',
    template: 'opening',
    completedBy: 'Emma Rodriguez',
    completedAt: '2025-11-20T07:15:00Z',
    results: [
      { itemId: 1, status: 'pass' },
      { itemId: 2, status: 'pass' },
      { itemId: 3, status: 'pass' },
      { itemId: 4, status: 'needs_attention', value: '6°C', notes: 'Temperature slightly high, monitoring' },
      { itemId: 5, status: 'pass', value: '-19°C' },
      { itemId: 6, status: 'pass', value: '62°C' },
      { itemId: 7, status: 'pass' },
      { itemId: 8, status: 'pass' },
      { itemId: 9, status: 'pass' },
      { itemId: 10, status: 'pass' }
    ]
  }
]