# JiGR Module Taglines & Purpose Statements

**For Immediate Implementation by Claude Code**  
**Date:** November 21, 2025  
**Status:** Ready to Deploy

---

## 🎯 **IMPLEMENTATION NOTES**

### **Personalization Variable:**
```typescript
const companyName = user.company.name; // e.g., "The Merchant", "Sazio", "Ortolana"
```

### **Usage in UI:**
```typescript
<ModuleHeader>
  <h1>{module.tagline}</h1>
  <p>{module.purpose}</p>
</ModuleHeader>
```

---

## ðŸ"¦ **MODULE 1: STOCK (Inventory Management)**

### **Tagline:**
```typescript
`${companyName}'s Inventory Command Center`
```

**Renders as:**
- "The Merchant's Inventory Command Center"
- "Sazio's Inventory Command Center"
- "Ortolana's Inventory Command Center"

### **Purpose Statement:**
```
Track everything in your kitchen, coolers, and dry storage. 
Know what you have, what's running low, and what's about to expire—
without touching a spreadsheet.
```

### **Alternative Purpose (Shorter):**
```
Real-time inventory tracking with low-stock alerts and expiration warnings.
```

---

## ðŸ'¨â€ðŸ³ **MODULE 2: RECIPES (Recipe Management)**

### **Tagline:**
```typescript
`${companyName}'s Recipe Library & Costing Engine`
```

**Renders as:**
- "The Merchant's Recipe Library & Costing Engine"
- "Sazio's Recipe Library & Costing Engine"

### **Purpose Statement:**
```
Create recipes, calculate real-time costs, and maintain consistency. 
When ingredient prices change, your recipe costs update automatically—
no more manual spreadsheet updates.
```

### **Alternative Purpose (Shorter):**
```
Recipe management with automatic costing based on current ingredient prices.
```

---

## ðŸ" **MODULE 3: COUNT (Stocktaking)**

### **Tagline:**
```typescript
`${companyName}'s Stocktaking System`
```

**Renders as:**
- "The Merchant's Stocktaking System"
- "Sazio's Stocktaking System"

### **Purpose Statement:**
```
Count inventory faster with Bluetooth scales and barcode scanning. 
Works offline in walk-in coolers, syncs automatically when you're back online.
Find discrepancies before they hurt your bottom line.
```

### **Alternative Purpose (Shorter):**
```
Fast, accurate inventory counting with offline support and variance analysis.
```

---

## ðŸ'° **MODULE 4: MENU (Menu Pricing & Engineering)**

### **Tagline:**
```typescript
`${companyName}'s Menu Pricing Intelligence`
```

**Renders as:**
- "The Merchant's Menu Pricing Intelligence"
- "Sazio's Menu Pricing Intelligence"

### **Purpose Statement:**
```
Set profitable menu prices based on actual ingredient costs. 
Analyze which dishes make money and which don't. Adjust pricing 
confidently when costs change.
```

### **Alternative Purpose (Shorter):**
```
Data-driven menu pricing with profitability analysis and cost-plus calculations.
```

---

## ðŸ"¤ **MODULE 5: UPLOAD (Document Processing)**

### **Tagline:**
```typescript
`${companyName}'s Digital Filing Cabinet`
```

**Renders as:**
- "The Merchant's Digital Filing Cabinet"
- "Sazio's Digital Filing Cabinet"

### **Purpose Statement:**
```
Snap photos of delivery dockets and invoices. AI extracts the data automatically—
no more typing supplier details or prices. Keep digital records for 
compliance without filing cabinets.
```

### **Alternative Purpose (Shorter):**
```
AI-powered document processing for delivery dockets, invoices, and compliance records.
```

---

## ðŸª **MODULE 6: VENDORS (Supplier Management)**

### **Tagline:**
```typescript
`${companyName}'s Supplier Hub`
```

**Renders as:**
- "The Merchant's Supplier Hub"
- "Sazio's Supplier Hub"

### **Purpose Statement:**
```
Manage all your suppliers in one place. Track delivery performance, 
compare prices, and see who's reliable and who's not. Make better 
purchasing decisions with actual data.
```

### **Alternative Purpose (Shorter):**
```
Centralized supplier management with performance tracking and price comparison.
```

---

## âš™ï¸ **MODULE 7: ADMIN (System Configuration)**

### **Tagline:**
```typescript
`${companyName}'s Control Panel`
```

**Renders as:**
- "The Merchant's Control Panel"
- "Sazio's Control Panel"

### **Purpose Statement:**
```
Manage your team, configure workflows, and control who sees what. 
Set up the system to match how your kitchen actually operates—
not the other way around.
```

### **Alternative Purpose (Shorter):**
```
System administration, team management, and workflow configuration.
```

---

## 🔧 **MODULE 8: REPAIRS (Maintenance & Safety)** ⭐ NEW

### **Tagline:**
```typescript
`${companyName}'s Maintenance Manager`
```

**Renders as:**
- "The Merchant's Maintenance Manager"
- "Sazio's Maintenance Manager"

### **Purpose Statement:**
```
Track equipment repairs, log safety issues, and manage preventive maintenance. 
Never miss a health inspector item or let a broken oven surprise you 
mid-service. Stay on top of what needs fixing.
```

### **Alternative Purpose (Shorter):**
```
Equipment maintenance tracking, safety issue logging, and repair management.
```

### **Key Features (For Development):**
- **Safety Issues Log** - Track hazards and resolution status
- **Repairs To-Do List** - Equipment repairs and priority levels
- **Maintenance Schedule** - Preventive maintenance calendar
- **Inspection Checklist** - Pre-shift safety checks
- **Vendor Contacts** - Repair contractors and service providers
- **Photo Documentation** - Visual records of issues/repairs
- **Compliance Tracking** - Health & safety requirements

### **Natural Links:**
- **From ADMIN** → "Manage equipment maintenance schedules"
- **To DIARY** → "Log maintenance activities"
- **To VENDORS** → "Contact repair contractors"

---

## ðŸ"" **MODULE 9: DIARY (Daily Operations Log)** ⭐ NEW

### **Tagline:**
```typescript
`${companyName}'s Daily Operations Journal`
```

**Renders as:**
- "The Merchant's Daily Operations Journal"
- "Sazio's Daily Operations Journal"

### **Purpose Statement:**
```
Your kitchen's black box recorder. See what expired today, who logged in, 
what changed, and when. Perfect for troubleshooting issues or proving 
compliance during audits.
```

### **Alternative Purpose (Shorter):**
```
Comprehensive activity log for expiring items, team logins, and system changes.
```

### **Key Features (For Development):**
- **Best Before Dates (BBD) Log** - Daily list of expiring items
- **Team Login Activity** - Who accessed the system and when
- **Audit Trail** - All system changes with timestamps
- **Inventory Adjustments** - Record of manual stock corrections
- **Document Uploads** - Log of processed delivery dockets
- **Variance History** - Stocktake discrepancies over time
- **Export Logs** - Download logs for compliance/audits

### **Natural Links:**
- **From STOCK** → "View inventory adjustment history"
- **From COUNT** → "Review past variance patterns"
- **From UPLOAD** → "See document processing timeline"
- **From ADMIN** → "Audit team activity"
- **From REPAIRS** → "Track maintenance activities"

---

## ðŸ"Š **IMPLEMENTATION FORMAT FOR CLAUDE CODE**

### **TypeScript Interface:**

```typescript
interface ModuleConfig {
  moduleKey: string;
  tagline: (companyName: string) => string;
  purpose: string;
  purposeShort: string;
  icon: string;
  color: string; // Primary brand color
  status: 'active' | 'development' | 'planned';
}

export const MODULE_DEFINITIONS: ModuleConfig[] = [
  {
    moduleKey: 'stock',
    tagline: (companyName) => `${companyName}'s Inventory Command Center`,
    purpose: `Track everything in your kitchen, coolers, and dry storage. Know what you have, what's running low, and what's about to expire—without touching a spreadsheet.`,
    purposeShort: `Real-time inventory tracking with low-stock alerts and expiration warnings.`,
    icon: 'ðŸ"¦',
    color: '#3B82F6', // Blue
    status: 'active'
  },
  {
    moduleKey: 'recipes',
    tagline: (companyName) => `${companyName}'s Recipe Library & Costing Engine`,
    purpose: `Create recipes, calculate real-time costs, and maintain consistency. When ingredient prices change, your recipe costs update automatically—no more manual spreadsheet updates.`,
    purposeShort: `Recipe management with automatic costing based on current ingredient prices.`,
    icon: '👨‍🍳',
    color: '#10B981', // Green
    status: 'active'
  },
  {
    moduleKey: 'count',
    tagline: (companyName) => `${companyName}'s Stocktaking System`,
    purpose: `Count inventory faster with Bluetooth scales and barcode scanning. Works offline in walk-in coolers, syncs automatically when you're back online. Find discrepancies before they hurt your bottom line.`,
    purposeShort: `Fast, accurate inventory counting with offline support and variance analysis.`,
    icon: 'ðŸ"‹',
    color: '#F59E0B', // Amber
    status: 'active'
  },
  {
    moduleKey: 'menu',
    tagline: (companyName) => `${companyName}'s Menu Pricing Intelligence`,
    purpose: `Set profitable menu prices based on actual ingredient costs. Analyze which dishes make money and which don't. Adjust pricing confidently when costs change.`,
    purposeShort: `Data-driven menu pricing with profitability analysis and cost-plus calculations.`,
    icon: 'ðŸ'°',
    color: '#8B5CF6', // Purple
    status: 'active'
  },
  {
    moduleKey: 'upload',
    tagline: (companyName) => `${companyName}'s Digital Filing Cabinet`,
    purpose: `Snap photos of delivery dockets and invoices. AI extracts the data automatically—no more typing supplier details or prices. Keep digital records for compliance without filing cabinets.`,
    purposeShort: `AI-powered document processing for delivery dockets, invoices, and compliance records.`,
    icon: 'ðŸ"¤',
    color: '#06B6D4', // Cyan
    status: 'active'
  },
  {
    moduleKey: 'vendors',
    tagline: (companyName) => `${companyName}'s Supplier Hub`,
    purpose: `Manage all your suppliers in one place. Track delivery performance, compare prices, and see who's reliable and who's not. Make better purchasing decisions with actual data.`,
    purposeShort: `Centralized supplier management with performance tracking and price comparison.`,
    icon: 'ðŸª',
    color: '#EC4899', // Pink
    status: 'active'
  },
  {
    moduleKey: 'admin',
    tagline: (companyName) => `${companyName}'s Control Panel`,
    purpose: `Manage your team, configure workflows, and control who sees what. Set up the system to match how your kitchen actually operates—not the other way around.`,
    purposeShort: `System administration, team management, and workflow configuration.`,
    icon: 'âš™ï¸',
    color: '#6B7280', // Gray
    status: 'active'
  },
  {
    moduleKey: 'repairs',
    tagline: (companyName) => `${companyName}'s Maintenance Manager`,
    purpose: `Track equipment repairs, log safety issues, and manage preventive maintenance. Never miss a health inspector item or let a broken oven surprise you mid-service. Stay on top of what needs fixing.`,
    purposeShort: `Equipment maintenance tracking, safety issue logging, and repair management.`,
    icon: '🔧',
    color: '#EF4444', // Red
    status: 'development'
  },
  {
    moduleKey: 'diary',
    tagline: (companyName) => `${companyName}'s Daily Operations Journal`,
    purpose: `Your kitchen's black box recorder. See what expired today, who logged in, what changed, and when. Perfect for troubleshooting issues or proving compliance during audits.`,
    purposeShort: `Comprehensive activity log for expiring items, team logins, and system changes.`,
    icon: 'ðŸ""',
    color: '#14B8A6', // Teal
    status: 'development'
  }
];
```

---

## 🎨 **USAGE EXAMPLES**

### **In Navigation Sidebar:**

```typescript
import { MODULE_DEFINITIONS } from '@/lib/moduleDefinitions';

function ModuleNavItem({ moduleKey, companyName }) {
  const module = MODULE_DEFINITIONS.find(m => m.moduleKey === moduleKey);
  
  return (
    <div className="module-nav-item">
      <span className="icon">{module.icon}</span>
      <div>
        <h3>{module.tagline(companyName)}</h3>
        <p className="text-sm opacity-70">{module.purposeShort}</p>
      </div>
    </div>
  );
}
```

### **In Module Landing Pages:**

```typescript
function ModuleLandingPage({ moduleKey, companyName }) {
  const module = MODULE_DEFINITIONS.find(m => m.moduleKey === moduleKey);
  
  return (
    <header className="module-header">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{module.icon}</span>
        <h1 className="text-3xl font-bold">{module.tagline(companyName)}</h1>
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        {module.purpose}
      </p>
    </header>
  );
}
```

### **In Help/Explanation Modals:**

```typescript
function ExplanationModal({ moduleKey, companyName }) {
  const module = MODULE_DEFINITIONS.find(m => m.moduleKey === moduleKey);
  
  return (
    <div className="explanation-modal">
      <h2>{module.tagline(companyName)}</h2>
      <p className="tagline-purpose">{module.purpose}</p>
      {/* Rest of help content */}
    </div>
  );
}
```

---

## ðŸš€ **READY FOR CLAUDE CODE**

**Steve, here's what you're getting:**

✅ **9 Module Taglines** - Personalized with `{companyName}` variable  
✅ **Purpose Statements** - Restaurant-voice, value-focused  
✅ **Alternative Short Versions** - For space-constrained UI  
✅ **2 New Modules Defined** - REPAIRS and DIARY with full descriptions  
✅ **TypeScript Implementation** - Ready to drop into code  
✅ **Usage Examples** - Shows how to use in different contexts  
✅ **Icon + Color Suggestions** - Visual identity for each module

**Implementation Checklist for Claude Code:**

```bash
1. Create /lib/moduleDefinitions.ts with MODULE_DEFINITIONS array
```

```bash
2. Update navigation components to use module.tagline(companyName)
```

```bash
3. Add purpose statements to module landing pages
```

```bash
4. Update ExplanationModal to show tagline + purpose
```

```bash
5. Test with different company names
```

**All taglines use the pattern:**
- `[Company Name]'s [Module Purpose]`
- Examples: "The Merchant's Inventory Command Center"
- Examples: "Sazio's Recipe Library & Costing Engine"

**Ready to hand to Claude Code?** 🎯
