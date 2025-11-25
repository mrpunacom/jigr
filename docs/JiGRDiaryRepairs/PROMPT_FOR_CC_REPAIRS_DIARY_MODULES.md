# Prompt for Claude Code: Build REPAIRS & DIARY Dummy Modules

**Date:** November 21, 2025  
**Task:** Create two new dummy modules with realistic placeholder content  
**Status:** Ready for Implementation

---

## 🎯 **OBJECTIVE**

Build two new modules for the JiGR platform following established architectural patterns. These should be **functional dummy modules** with realistic placeholder data that demonstrate the module structure, navigation, and UI patterns without requiring full backend implementation.

---

## ðŸ"‹ **MODULE SPECIFICATIONS**

### **MODULE 1: REPAIRS (Maintenance & Safety Management)**

**Module Key:** `repairs`  
**Tagline:** `${companyName}'s Maintenance Manager`  
**Purpose:** Track equipment repairs, log safety issues, and manage preventive maintenance.

**Pages to Create:**
1. **REPAIRS Console** (`/repairs/console`) - Dashboard/Overview
2. **Safety Issues** (`/repairs/safety`) - Safety issue logging
3. **Repairs To-Do** (`/repairs/todo`) - Active repair tasks
4. **Maintenance Schedule** (`/repairs/schedule`) - Preventive maintenance calendar
5. **Inspection Checklist** (`/repairs/inspection`) - Daily/weekly checks
6. **Reports** (`/repairs/reports`) - Maintenance reports

---

### **MODULE 2: DIARY (Daily Operations Log)**

**Module Key:** `diary`  
**Tagline:** `${companyName}'s Daily Operations Journal`  
**Purpose:** Your kitchen's black box recorder - track expiring items, logins, and system changes.

**Pages to Create:**
1. **DIARY Console** (`/diary/console`) - Dashboard/Overview
2. **Best Before Dates** (`/diary/expiring`) - Items expiring today/soon
3. **Activity Log** (`/diary/activity`) - Team logins and system events
4. **Audit Trail** (`/diary/audit`) - All system changes with timestamps
5. **Reports** (`/diary/reports`) - Compliance and activity reports

---

## 🏗️ **ARCHITECTURAL REQUIREMENTS**

### **Follow Existing JiGR Patterns:**

1. **Three-Page Module Architecture:**
   - **CONSOLE** - Dashboard with overview metrics and quick actions
   - **ACTION/DETAIL** - Main functionality pages (safety logs, repairs, etc.)
   - **REPORTS** - Viewing and exporting data

2. **Navigation Structure:**
   ```typescript
   // Add to existing navigation dropdown structure
   REPAIRS ▾
   â"œâ"€ Console      → /repairs/console
   â"œâ"€ Safety Issues → /repairs/safety
   â"œâ"€ To-Do List   → /repairs/todo
   â"œâ"€ Schedule     → /repairs/schedule
   â"œâ"€ Inspection   → /repairs/inspection
   â""â"€ Reports      → /repairs/reports

   DIARY ▾
   â"œâ"€ Console      → /diary/console
   â"œâ"€ Expiring     → /diary/expiring
   â"œâ"€ Activity     → /diary/activity
   â"œâ"€ Audit Trail  → /diary/audit
   â""â"€ Reports      → /diary/reports
   ```

3. **Page Layout Pattern:**
   - Sticky header with module title and actions
   - Glass morphism card containers
   - Responsive grid for metric cards
   - Data tables with search/filter
   - Action buttons (44px min touch target)

4. **File Structure:**
   ```
   app/
   â"œâ"€ repairs/
   â"‚  â"œâ"€ console/
   â"‚  â"‚  â""â"€ page.tsx
   â"‚  â"œâ"€ safety/
   â"‚  â"‚  â""â"€ page.tsx
   â"‚  â"œâ"€ todo/
   â"‚  â"‚  â""â"€ page.tsx
   â"‚  â"œâ"€ schedule/
   â"‚  â"‚  â""â"€ page.tsx
   â"‚  â"œâ"€ inspection/
   â"‚  â"‚  â""â"€ page.tsx
   â"‚  â""â"€ reports/
   â"‚     â""â"€ page.tsx
   â"‚
   â""â"€ diary/
      â"œâ"€ console/
      â"‚  â""â"€ page.tsx
      â"œâ"€ expiring/
      â"‚  â""â"€ page.tsx
      â"œâ"€ activity/
      â"‚  â""â"€ page.tsx
      â"œâ"€ audit/
      â"‚  â""â"€ page.tsx
      â""â"€ reports/
         â""â"€ page.tsx
   ```

---

## ðŸ"¦ **REPAIRS MODULE - DETAILED REQUIREMENTS**

### **Page 1: REPAIRS Console (`/repairs/console`)**

**Layout:**
```typescript
// Header with module tagline
<PageHeader
  title="The Merchant's Maintenance Manager"
  subtitle="Track equipment repairs, safety issues, and preventive maintenance"
  icon="🔧"
/>

// Metric Cards (3 columns on desktop, stack on mobile)
<MetricGrid>
  <MetricCard
    title="Open Issues"
    value={8}
    trend="up"
    icon="âš ï¸"
    severity="warning"
  />
  <MetricCard
    title="Pending Repairs"
    value={5}
    trend="stable"
    icon="🔧"
  />
  <MetricCard
    title="Overdue Maintenance"
    value={2}
    trend="up"
    icon="⏰"
    severity="critical"
  />
</MetricGrid>

// Quick Actions
<QuickActions>
  <Button icon="âš ï¸" href="/repairs/safety">Log Safety Issue</Button>
  <Button icon="🔧" href="/repairs/todo">Add Repair Task</Button>
  <Button icon="ðŸ"‹" href="/repairs/inspection">Start Inspection</Button>
</QuickActions>

// Recent Activity Table
<RecentActivity>
  {/* Last 10 safety issues, repairs, maintenance items */}
</RecentActivity>
```

**Dummy Data:**
```typescript
const REPAIRS_DASHBOARD_DATA = {
  metrics: {
    openIssues: 8,
    openIssuesTrend: 'up',
    pendingRepairs: 5,
    pendingRepairsTrend: 'stable',
    overdueMaintenance: 2,
    overdueMaintenanceTrend: 'up'
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
    }
    // Add 7-10 more realistic entries
  ]
};
```

---

### **Page 2: Safety Issues (`/repairs/safety`)**

**Features:**
- List of all safety issues (open, in-progress, resolved)
- Filter by severity (low, medium, high, critical)
- Add new safety issue button
- Photo upload capability (dummy)
- Status badges with colors

**Dummy Data:**
```typescript
const SAFETY_ISSUES = [
  {
    id: 'SAF-001',
    title: 'Wet floor near dishwasher',
    description: 'Water pooling under dishwasher, slip hazard',
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
    description: 'Outlet cover loose, potential shock hazard',
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
    description: 'Annual inspection due 3 days ago',
    severity: 'medium',
    status: 'open',
    reportedBy: 'System',
    reportedAt: '2025-11-18T00:00:00Z',
    location: 'Kitchen - Main',
    photos: []
  }
  // Add 10-15 more entries
];
```

**Table Columns:**
- ID (clickable)
- Title
- Severity (badge with color)
- Status (badge)
- Reported By
- Date
- Actions (View, Edit, Resolve buttons)

---

### **Page 3: Repairs To-Do (`/repairs/todo`)**

**Features:**
- List of repair tasks
- Priority sorting (urgent, high, medium, low)
- Status tracking (pending, in_progress, completed)
- Add new repair button
- Assign to vendor

**Dummy Data:**
```typescript
const REPAIR_TASKS = [
  {
    id: 'REP-001',
    title: 'Walk-in cooler temperature fluctuating',
    description: 'Temperature ranging between 2°C and 8°C, needs stabilization',
    priority: 'urgent',
    status: 'in_progress',
    equipment: 'Walk-in Cooler #1',
    reportedBy: 'Tom Wilson',
    reportedAt: '2025-11-20T14:15:00Z',
    assignedTo: 'CoolTech Services',
    estimatedCost: 450,
    notes: 'Technician scheduled for tomorrow morning',
    dueDate: '2025-11-22T10:00:00Z'
  },
  {
    id: 'REP-002',
    title: 'Oven door seal replacement',
    description: 'Main oven door seal deteriorating, heat escaping',
    priority: 'high',
    status: 'pending',
    equipment: 'Commercial Oven #1',
    reportedBy: 'Sarah Chen',
    reportedAt: '2025-11-19T11:30:00Z',
    assignedTo: null,
    estimatedCost: 180,
    notes: 'Waiting for part delivery',
    dueDate: '2025-11-25T00:00:00Z'
  },
  {
    id: 'REP-003',
    title: 'Replace broken shelf in dry storage',
    description: 'Metal shelf collapsed under weight',
    priority: 'medium',
    status: 'pending',
    equipment: 'Dry Storage Shelving',
    reportedBy: 'Mike Torres',
    reportedAt: '2025-11-18T09:00:00Z',
    assignedTo: 'Internal - Maintenance',
    estimatedCost: 75,
    notes: 'Can be done in-house',
    dueDate: '2025-11-24T00:00:00Z'
  }
  // Add 10-15 more entries
];
```

---

### **Page 4: Maintenance Schedule (`/repairs/schedule`)**

**Features:**
- Calendar view of scheduled maintenance
- Filter by equipment type
- Add new maintenance task
- Recurring task support (daily, weekly, monthly)
- Completion tracking

**Dummy Data:**
```typescript
const MAINTENANCE_SCHEDULE = [
  {
    id: 'MAINT-001',
    title: 'Deep fryer oil change',
    equipment: 'Deep Fryer #1',
    frequency: 'weekly',
    lastCompleted: '2025-11-14T00:00:00Z',
    nextDue: '2025-11-21T00:00:00Z',
    status: 'overdue',
    assignedTo: 'Kitchen Team',
    estimatedTime: 30, // minutes
    instructions: '1. Turn off fryer and cool\n2. Drain old oil\n3. Clean basket\n4. Refill with fresh oil'
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
    instructions: '1. Run descaling cycle\n2. Rinse thoroughly\n3. Check spray arms'
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
    instructions: 'Professional service - vendor handles'
  }
  // Add 10-15 more entries
];
```

---

### **Page 5: Inspection Checklist (`/repairs/inspection`)**

**Features:**
- Daily/weekly inspection checklists
- Checklist templates (open, pre-service, close)
- Pass/fail/needs attention checkboxes
- Photo documentation for failures
- Print functionality

**Dummy Data:**
```typescript
const INSPECTION_TEMPLATES = {
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
      { id: 3, category: 'Kitchen', item: 'Fryers at correct temperature', required: true },
      { id: 4, category: 'Front of House', item: 'Dining area clean and set', required: true },
      { id: 5, category: 'Front of House', item: 'Restrooms stocked and clean', required: true }
    ]
  }
};

const RECENT_INSPECTIONS = [
  {
    id: 'LOG-001',
    template: 'opening',
    completedBy: 'Sarah Chen',
    completedAt: '2025-11-21T07:00:00Z',
    results: [
      { itemId: 1, status: 'pass' },
      { itemId: 2, status: 'pass' },
      { itemId: 3, status: 'needs_attention', notes: 'Low on bandages' },
      { itemId: 4, status: 'pass', value: '2°C' },
      { itemId: 5, status: 'pass', value: '-20°C' }
      // ... rest of checklist
    ]
  }
  // Add 10-15 more completed inspections
];
```

---

## ðŸ"" **DIARY MODULE - DETAILED REQUIREMENTS**

### **Page 1: DIARY Console (`/diary/console`)**

**Layout:**
```typescript
<PageHeader
  title="The Merchant's Daily Operations Journal"
  subtitle="Your kitchen's black box recorder"
  icon="ðŸ"""
/>

<MetricGrid>
  <MetricCard
    title="Items Expiring Today"
    value={3}
    icon="⏰"
    severity="warning"
  />
  <MetricCard
    title="Active Users Today"
    value={12}
    icon="ðŸ'¤"
  />
  <MetricCard
    title="System Events Today"
    value={47}
    icon="ðŸ"Š"
  />
</MetricGrid>

<QuickActions>
  <Button icon="⏰" href="/diary/expiring">View Expiring Items</Button>
  <Button icon="ðŸ'¤" href="/diary/activity">Activity Log</Button>
  <Button icon="ðŸ"„" href="/diary/audit">Audit Trail</Button>
</QuickActions>

<RecentActivity>
  {/* Timeline of today's events */}
</RecentActivity>
```

**Dummy Data:**
```typescript
const DIARY_DASHBOARD_DATA = {
  metrics: {
    expiringToday: 3,
    expiringThisWeek: 12,
    activeUsersToday: 12,
    systemEventsToday: 47
  },
  todaysTimeline: [
    {
      time: '2025-11-21T07:00:00Z',
      type: 'login',
      user: 'Sarah Chen',
      action: 'Logged in',
      icon: 'ðŸ'¤'
    },
    {
      time: '2025-11-21T07:15:00Z',
      type: 'inspection',
      user: 'Sarah Chen',
      action: 'Completed opening inspection',
      icon: 'ðŸ"‹'
    },
    {
      time: '2025-11-21T08:30:00Z',
      type: 'expiring',
      user: 'System',
      action: '3 items expiring today',
      icon: '⏰'
    },
    {
      time: '2025-11-21T09:00:00Z',
      type: 'inventory',
      user: 'Mike Torres',
      action: 'Adjusted stock: Tomatoes (-2kg)',
      icon: 'ðŸ"¦'
    }
    // Add 20-30 more timeline events
  ]
};
```

---

### **Page 2: Best Before Dates (`/diary/expiring`)**

**Features:**
- Items expiring today/this week/this month
- Sort by value (most expensive first)
- Filter by category
- Mark as used/wasted
- Export for reports

**Dummy Data:**
```typescript
const EXPIRING_ITEMS = [
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
    bestBefore: '2025-11-22T00:00:00Z',
    daysUntilExpiry: 1,
    unitCost: 18.00,
    totalValue: 90.00,
    location: 'Walk-in Cooler - Shelf 1',
    supplier: 'Premium Meats Ltd',
    status: 'expiring_tomorrow'
  },
  {
    id: 'EXP-003',
    itemName: 'Baby Spinach',
    category: 'Produce',
    batchNumber: 'BATCH-2025-11-003',
    quantity: 1.5,
    unit: 'kg',
    bestBefore: '2025-11-23T00:00:00Z',
    daysUntilExpiry: 2,
    unitCost: 12.00,
    totalValue: 18.00,
    location: 'Walk-in Cooler - Produce Drawer',
    supplier: 'Fresh Veg Suppliers',
    status: 'expiring_this_week'
  }
  // Add 15-20 more items with varying expiry dates
];
```

**Display Options:**
- Group by: Today | This Week | This Month
- Sort by: Expiry Date | Value | Category
- Color coding: Red (today), Orange (tomorrow), Yellow (this week)

---

### **Page 3: Activity Log (`/diary/activity`)**

**Features:**
- Team login/logout tracking
- Filter by user, date range, action type
- Export logs for compliance
- Search functionality

**Dummy Data:**
```typescript
const ACTIVITY_LOG = [
  {
    id: 'ACT-001',
    timestamp: '2025-11-21T07:00:15Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'login',
    details: 'Logged in from iPad',
    ipAddress: '192.168.1.45',
    device: 'iPad Air (2013) - Safari 12'
  },
  {
    id: 'ACT-002',
    timestamp: '2025-11-21T07:15:30Z',
    user: 'Sarah Chen',
    userRole: 'Manager',
    action: 'inspection_completed',
    details: 'Completed opening inspection checklist',
    module: 'repairs'
  },
  {
    id: 'ACT-003',
    timestamp: '2025-11-21T08:00:00Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'login',
    details: 'Logged in from iPad',
    ipAddress: '192.168.1.46',
    device: 'iPad Air (2013) - Safari 12'
  },
  {
    id: 'ACT-004',
    timestamp: '2025-11-21T08:30:22Z',
    user: 'Mike Torres',
    userRole: 'Staff',
    action: 'count_started',
    details: 'Started stocktake: Produce category',
    module: 'count'
  },
  {
    id: 'ACT-005',
    timestamp: '2025-11-21T09:00:00Z',
    user: 'Tom Wilson',
    userRole: 'Owner',
    action: 'login',
    details: 'Logged in from iPad',
    ipAddress: '192.168.1.10',
    device: 'iPad Pro - Safari 17'
  }
  // Add 50-100 more activity entries
];
```

---

### **Page 4: Audit Trail (`/diary/audit`)**

**Features:**
- Comprehensive change log
- Filter by module, action type, user
- Show before/after values for changes
- Export for compliance audits

**Dummy Data:**
```typescript
const AUDIT_TRAIL = [
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
    before: { quantity: 15, unit: 'kg' },
    after: { quantity: 13, unit: 'kg' },
    reason: 'Damaged items removed',
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
    before: { ingredients: [...], costPerPortion: 4.50 },
    after: { ingredients: [...], costPerPortion: 4.75 },
    reason: 'Updated ingredient quantities',
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
    before: { role: 'STAFF' },
    after: { role: 'MANAGER' },
    reason: 'Promotion',
    ipAddress: '192.168.1.10'
  },
  {
    id: 'AUD-004',
    timestamp: '2025-11-21T11:30:00Z',
    user: 'Mike Torres',
    module: 'count',
    action: 'count_completed',
    entityType: 'count_session',
    entityId: 'COUNT-2025-11-21',
    entityName: 'Produce Stocktake',
    changeType: 'complete',
    details: {
      itemsCounted: 45,
      totalVariance: -125.50,
      duration: 90 // minutes
    },
    ipAddress: '192.168.1.46'
  }
  // Add 50-100 more audit entries
];
```

---

### **Page 5: Reports (Both Modules)**

**Features:**
- Pre-defined report templates
- Date range selector
- Export to PDF/CSV
- Print functionality
- Email scheduling (dummy)

**Report Types - REPAIRS:**
- Monthly Maintenance Summary
- Safety Issues Report
- Repair Costs by Equipment
- Compliance Checklist Completion

**Report Types - DIARY:**
- Daily Activity Summary
- Expiration Waste Report
- User Activity Report
- System Audit Log

---

## 🎨 **DESIGN REQUIREMENTS**

### **Visual Style:**
- **Glass Morphism Cards** - Follow existing JiGR design system
- **Color Coding:**
  - REPAIRS: Red/Orange theme (#EF4444)
  - DIARY: Teal theme (#14B8A6)
- **Status Badges:**
  - Open/Pending: Blue
  - In Progress: Yellow
  - Completed/Resolved: Green
  - Overdue/Critical: Red
- **Icons:** Use emoji icons consistently throughout

### **Components to Reuse:**
- `MetricCard` - Dashboard metrics
- `DataTable` - All list views
- `StatusBadge` - Status indicators
- `ActionButton` - CTAs (44px min height)
- `FilterBar` - Search and filtering
- `PageHeader` - Consistent headers

### **Responsive Behavior:**
- **Portrait (768px):** Stack cards vertically
- **Landscape (1024px):** 3-column grid
- **Touch Targets:** Minimum 44px × 44px
- **Tables:** Horizontal scroll on mobile

---

## ⚙️ **TECHNICAL IMPLEMENTATION**

### **Data Management:**

**Option 1: Static JSON (Recommended for Dummy Module)**
```typescript
// lib/dummyData/repairsData.ts
export const REPAIRS_DATA = {
  dashboard: { ... },
  safetyIssues: [ ... ],
  repairTasks: [ ... ],
  maintenance: [ ... ],
  inspections: [ ... ]
};

// lib/dummyData/diaryData.ts
export const DIARY_DATA = {
  dashboard: { ... },
  expiring: [ ... ],
  activity: [ ... ],
  audit: [ ... ]
};
```

**Option 2: Local State Management**
```typescript
// Use React useState/useReducer for dummy data
// No API calls needed for dummy modules
```

### **No Database Integration Required:**
- Use static JSON files for dummy data
- Implement UI state management only
- Add "Coming Soon" badges for actions that would require backend
- Mock any filtering/sorting client-side

### **Navigation Integration:**

Update existing navigation component:
```typescript
// app/components/Navigation.tsx

const moduleGroups = [
  // ... existing modules (stock, recipes, count, menu, upload, vendors, admin)
  {
    title: 'REPAIRS',
    icon: '🔧',
    basePath: '/repairs',
    status: 'development', // Show badge
    items: [
      { label: 'Console', path: '/repairs/console' },
      { label: 'Safety Issues', path: '/repairs/safety' },
      { label: 'To-Do List', path: '/repairs/todo' },
      { label: 'Schedule', path: '/repairs/schedule' },
      { label: 'Inspection', path: '/repairs/inspection' },
      { label: 'Reports', path: '/repairs/reports' }
    ]
  },
  {
    title: 'DIARY',
    icon: 'ðŸ""',
    basePath: '/diary',
    status: 'development',
    items: [
      { label: 'Console', path: '/diary/console' },
      { label: 'Expiring Items', path: '/diary/expiring' },
      { label: 'Activity Log', path: '/diary/activity' },
      { label: 'Audit Trail', path: '/diary/audit' },
      { label: 'Reports', path: '/diary/reports' }
    ]
  }
];
```

---

## âœ… **ACCEPTANCE CRITERIA**

### **Must Have:**
- [x] All pages accessible via navigation
- [x] Module taglines display correctly with company name
- [x] Dummy data displays in realistic formats
- [x] Responsive layout (portrait/landscape)
- [x] Glass morphism styling consistent with existing modules
- [x] 44px minimum touch targets on all interactive elements
- [x] Status badges with appropriate colors
- [x] Tables with search/filter (client-side)
- [x] "Development" badges visible on navigation items

### **Nice to Have:**
- [ ] Smooth transitions between pages
- [ ] Loading skeleton states
- [ ] Empty state designs ("No data yet")
- [ ] Toast notifications for dummy actions
- [ ] Print stylesheet for reports
- [ ] Dark mode support

### **Not Required:**
- Database integration
- API endpoints
- Real data persistence
- User authentication checks
- Actual file uploads
- Email functionality

---

## ðŸ"‹ **IMPLEMENTATION CHECKLIST**

**Phase 1: File Structure (30 minutes)**
- [ ] Create `/app/repairs/` directory with subdirectories
- [ ] Create `/app/diary/` directory with subdirectories
- [ ] Create `page.tsx` in each subdirectory
- [ ] Create `/lib/dummyData/repairsData.ts`
- [ ] Create `/lib/dummyData/diaryData.ts`

**Phase 2: Navigation Integration (15 minutes)**
- [ ] Update navigation component with REPAIRS module
- [ ] Update navigation component with DIARY module
- [ ] Add "Development" status badges
- [ ] Test navigation dropdown functionality

**Phase 3: REPAIRS Module (2-3 hours)**
- [ ] Build Console page with metrics and activity
- [ ] Build Safety Issues page with table
- [ ] Build Repairs To-Do page with table
- [ ] Build Maintenance Schedule page with calendar view
- [ ] Build Inspection Checklist page
- [ ] Build Reports page with templates

**Phase 4: DIARY Module (2-3 hours)**
- [ ] Build Console page with metrics and timeline
- [ ] Build Expiring Items page with table
- [ ] Build Activity Log page with table
- [ ] Build Audit Trail page with change tracking
- [ ] Build Reports page with templates

**Phase 5: Polish & Testing (1 hour)**
- [ ] Test responsive layouts (portrait/landscape)
- [ ] Verify touch targets meet 44px minimum
- [ ] Check color consistency with design system
- [ ] Test navigation between all pages
- [ ] Verify dummy data displays correctly
- [ ] Test on iPad Air Safari 12 (if available)

**Total Estimated Time: 6-8 hours**

---

## ðŸš€ **READY TO BUILD**

This prompt contains:
✅ Complete module specifications  
✅ Page-by-page requirements  
✅ Realistic dummy data structures  
✅ Design guidelines  
✅ Technical implementation approach  
✅ Acceptance criteria  
✅ Step-by-step checklist

**Claude Code can start immediately with Phase 1 and work through systematically.**

Let me know when you're ready to implement, and I'll be available for any questions or clarifications!
