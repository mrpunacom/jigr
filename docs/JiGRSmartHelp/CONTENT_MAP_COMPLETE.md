# JiGR Smart Help System - Complete Content Map

**All Page Topics, Quick Actions & Cross-Links**  
**Version:** 2.0  
**Date:** November 20, 2025  
**Status:** Production Ready ✅

---

## 📋 **Content Structure Overview**

Each help modal contains 5 key sections:
1. **Overview** - What this page does
2. **Key Features** - Important functionality with importance levels
3. **Quick Actions** - One-click common tasks with keyboard shortcuts
4. **Tips & Tricks** - Best practices, warnings, and helpful hints  
5. **Related Pages** - Smart cross-links to connected features

---

## 📦 **STOCK MODULE**

### **Stock Console** (`/stock/console`)
**Overview:** Central hub for inventory management and tracking. View current stock levels, monitor low inventory alerts, and access quick actions for inventory tasks.

#### **Key Features:**
- 📊 **Inventory Overview** (High) - Real-time view of all stock levels, expiring items, and inventory alerts
  - *Link:* Refresh View → `/stock/console`
- 🔍 **Quick Stock Search** (High) - Find items instantly using search, barcode scanning, or category filters
  - *Link:* Browse All Items → `/stock/items`
- ⚠️ **Low Stock Alerts** (Medium) - Automated notifications when items fall below minimum stock levels

#### **Quick Actions:**
- ➕ **Add New Item** (Ctrl+N) - Create a new inventory item with barcode scanning
  - *Link:* `/stock/items?action=create` (Modal)
- 📝 **Start Stocktake** (Ctrl+C) - Begin counting inventory for accuracy verification
  - *Link:* `/count/new` → Count Module
- 📈 **Generate Report** - Create inventory reports for analysis
  - *Link:* `/stock/reports`

#### **Tips & Tricks:**
- 💡 **Tip:** Use barcode scanning for faster item lookup and management
  - *Link:* Test Hardware → `/dev/hardware-testing`
- ℹ️ **Info:** Set up minimum stock levels to receive automatic low stock alerts
- ✅ **Success:** Regular stocktakes improve inventory accuracy and reduce waste

#### **Related Pages:**
- **Stock Items** (Essential) - Detailed view and management of individual inventory items → `/stock/items`
- **Count Sessions** (Count Module) - Physical counting and stocktake management → `/count/console`  
- **Recipe Integration** (Recipes Module) - See how stock items are used in recipes → `/recipes`

---

### **Stock Items Management** (`/stock/items`)
**Overview:** Comprehensive inventory item management with detailed tracking, categorization, and integration with counting and recipe systems.

#### **Key Features:**
- 📦 **Item Database** (High) - Complete catalog of all inventory items with photos, descriptions, and specifications
- 📷 **Barcode Integration** (High) - Scan or generate barcodes for efficient item identification
  - *Link:* Test Scanner → `/dev/hardware-testing`
- 📂 **Category Management** (Medium) - Organize items into logical categories for easier navigation
- 🏪 **Supplier Tracking** (Medium) - Link items to suppliers and track purchasing information
  - *Link:* Manage Vendors → `/vendors`

#### **Quick Actions:**
- ➕ **Add Item** - Create new inventory item → `/stock/items/create`
- 📥 **Import CSV** - Bulk import items from spreadsheet (Modal) → `/stock/items?action=import`
- 📤 **Export Data** - Download item data as CSV → `/api/stock/export`

#### **Tips & Tricks:**
- 💡 **Tip:** Use clear, descriptive names and include supplier part numbers for easy identification
- ℹ️ **Info:** Upload photos to help staff identify items quickly during counting

#### **Related Pages:**
- **Stock Console** - Return to inventory overview → `/stock/console`
- **Vendor Management** - Manage suppliers and purchasing → `/vendors`

---

## 👨‍🍳 **RECIPES MODULE**

### **Recipe Management** (`/recipes`)
**Overview:** Central hub for creating, managing, and costing recipes. Track ingredient usage, calculate food costs, and maintain consistent preparation standards.

#### **Key Features:**
- 👨‍🍳 **Recipe Library** (High) - Complete collection of all recipes with detailed ingredients and instructions
- 💰 **Real-time Costing** (High) - Automatic cost calculation based on current ingredient prices
  - *Link:* View Costing → `/recipes?view=costing`
- ⚖️ **Portion Control** (Medium) - Standardized serving sizes and yield calculations

#### **Quick Actions:**
- 📝 **New Recipe** - Create a new recipe with ingredients and instructions → `/recipes/create`
- 🧩 **Sub-Recipes** - Manage reusable recipe components → `/recipes/sub-recipes`
- 📋 **Production Records** - Track recipe preparation and yield → `/recipes/production`

#### **Related Pages:**
- **Stock Items** (Stock Module) - Manage ingredient inventory → `/stock/items`
- **Menu Pricing** (Menu Module) - Set menu prices based on recipe costs → `/menu/pricing`

---

## 📝 **COUNT MODULE**

### **Count Console** (`/count/console`)
**Overview:** Manage stocktaking sessions and inventory counting activities. Track counting progress, handle discrepancies, and maintain accurate inventory records.

#### **Key Features:**
- 🎯 **Active Count Sessions** (High) - Monitor ongoing stocktaking activities and team progress
- 📊 **Variance Analysis** (High) - Compare counted quantities with expected stock levels
  - *Link:* View Variance → `/count/variance`
- 📱 **Hardware Integration** (Medium) - Use Bluetooth scales and barcode scanners for accurate counting
  - *Link:* Test Hardware → `/dev/hardware-testing`

#### **Quick Actions:**
- 🆕 **New Count Session** - Start a new stocktaking session → `/count/new`
- 📚 **View History** - Review past counting sessions → `/count/history`

#### **Tips & Tricks:**
- 💡 **Tip:** Use hardware scales for accurate weight measurements of bulk items
- ℹ️ **Info:** Count during quiet periods to minimize disruption to operations

#### **Related Pages:**
- **Stock Console** (Stock Module) - View current inventory levels → `/stock/console`

---

## ⚙️ **ADMIN MODULE**

### **Admin Console** (`/admin/console`)
**Overview:** System administration and configuration hub. Manage user accounts, configure system settings, and oversee platform operations.

#### **Key Features:**
- 👥 **User Management** (High) - Add team members, set roles, and manage access permissions
  - *Link:* Manage Team → `/admin/team`
  - *Requires:* Admin permissions
- ⚙️ **System Configuration** (High) - Configure modules, workflows, and business settings
  - *Link:* Configure → `/admin/configure`
  - *Requires:* Admin permissions
- 📈 **Analytics & Reporting** (Medium) - System usage statistics and performance metrics

#### **Quick Actions:**
- 👤 **Add Team Member** - Invite new user to the platform (Modal) → `/admin/team?action=invite`
  - *Requires:* Admin permissions
- 🔧 **Configure Modules** - Set up business workflows and processes → `/admin/configure`
  - *Requires:* Admin permissions

#### **Tips & Tricks:**
- 💡 **Tip:** Regular configuration reviews ensure optimal system performance
- ⚠️ **Warning:** Use role-based permissions to maintain data security

---

## 💰 **MENU MODULE**

### **Menu Pricing** (`/menu/pricing`)
**Overview:** Set optimal menu prices based on ingredient costs, target margins, and market positioning. Monitor profitability and adjust pricing strategies.

#### **Key Features:**
- 💰 **Cost-Plus Pricing** (High) - Calculate menu prices based on ingredient costs and desired profit margins
- 🎯 **Competitive Analysis** (Medium) - Compare pricing with market rates and competitor offerings
- 📊 **Profitability Tracking** (High) - Monitor item performance and profit contribution
  - *Link:* View Analysis → `/menu/analysis`

#### **Quick Actions:**
- 💵 **Update Prices** - Bulk update menu pricing (Modal) → `/menu/pricing?action=bulk-update`
- 🔬 **Menu Engineering** - Analyze item performance and positioning → `/menu/engineering`

#### **Related Pages:**
- **Recipe Costs** (Recipes Module) - View ingredient costs for accurate pricing → `/recipes?view=costing`

---

## 📤 **UPLOAD MODULE**

### **Upload Console** (`/upload/console`)
**Overview:** Document management and processing center. Upload delivery dockets, process compliance documents, and manage digital records.

#### **Key Features:**
- 🤖 **Document Processing** (High) - AI-powered extraction of data from delivery dockets and invoices
- 📋 **Compliance Tracking** (High) - Monitor document compliance and regulatory requirements
- 🗄️ **Digital Archive** (Medium) - Secure storage and retrieval of all business documents

#### **Quick Actions:**
- 📤 **Upload Document** - Add new delivery docket or invoice → `/upload/capture`
- 📊 **View Reports** - Generate compliance and processing reports → `/upload/reports`

---

## 🏪 **VENDORS MODULE**

### **Vendor Management** (`/vendors`)
**Overview:** Comprehensive supplier relationship management. Track vendor performance, manage contracts, and monitor delivery schedules.

#### **Key Features:**
- 🏪 **Supplier Database** (High) - Complete contact information and business details for all suppliers
- 📈 **Performance Tracking** (High) - Monitor delivery times, quality scores, and reliability metrics
- 📦 **Order Management** (Medium) - Track purchase orders and delivery schedules

#### **Quick Actions:**
- ➕ **Add Vendor** - Register new supplier (Modal) → `/vendors?action=create`
- 📊 **Performance Report** - Generate vendor performance analysis → `/vendors?report=performance`

#### **Related Pages:**
- **Stock Items** (Stock Module) - Link suppliers to inventory items → `/stock/items`
- **Upload Documents** (Upload Module) - Process delivery dockets from vendors → `/upload/capture`

---

## 🛠️ **DEVELOPMENT MODULE**

### **Hardware Integration Testing** (`/dev/hardware-testing`)
**Overview:** Test and validate Bluetooth scales, barcode scanners, and label printers. Ensure optimal hardware performance for iPad Air 2013 compatibility.

#### **Key Features:**
- ⚖️ **Bluetooth Scale Testing** (High) - Connect and test Bluetooth scales for accurate weight measurements
- 📷 **Barcode Scanner Testing** (High) - Validate camera-based barcode scanning functionality
- 🖨️ **Label Printer Testing** (Medium) - Test label generation and printing for Brother/Dymo printers
- 📱 **iPad Air 2013 Compatibility** (High) - Verify hardware integration works on legacy iPad devices

#### **Quick Actions:**
- 🔍 **Run Diagnostics** - Comprehensive hardware compatibility check → `/dev/hardware-testing?action=diagnostics`
- 🧪 **Test All Hardware** - Full integration test sequence → `/dev/hardware-testing?test=all`

#### **Tips & Tricks:**
- ⚠️ **Warning:** Ensure HTTPS is enabled for camera and Bluetooth access
- 💡 **Tip:** Use manual entry fallbacks when hardware is unavailable

---

## 🌐 **UNIVERSAL PAGES**

### **General Platform Help** (`general-help`)
**Overview:** Welcome to JiGR - your complete hospitality compliance and inventory management platform. Get started with key features and workflows.

#### **Key Features:**
- 🧭 **Module Navigation** (High) - Access different areas of the platform: Stock, Recipes, Count, Admin, Upload, and Menu
- 🔐 **User Permissions** (Medium) - Role-based access ensures you see only relevant features for your position
- 📱 **Mobile Optimized** (Medium) - Full functionality on iPad Air 2013 and modern mobile devices

#### **Quick Actions:**
- 📦 **Stock Management** - Start with inventory tracking → `/stock/console`
- 👨‍🍳 **Recipe Creation** - Build your recipe library → `/recipes`
- 📝 **Stocktaking** - Count your inventory → `/count/console`

#### **Tips & Tricks:**
- 💡 **Tip:** Click the help icon (?) on any page for specific guidance
- ℹ️ **Info:** Use keyboard shortcuts for faster navigation (shown in quick actions)

---

## 🔗 **Cross-Module Linking Map**

### **Smart Navigation Flow:**
```
Stock Console ←→ Stock Items ←→ Vendors
     ↓                ↓           ↓
Count Console → Variance Analysis  Upload Documents
     ↓
Recipe Management ←→ Menu Pricing
     ↓                    ↓
Production Records → Menu Engineering

Admin Console → Team Management
     ↓
Hardware Testing ← All Modules (for testing)
```

### **Permission-Based Content:**
- **OWNER:** All features and actions visible
- **ADMIN:** Management features + configuration access
- **MANAGER:** Operational features + reporting
- **STAFF:** Essential daily operations only

---

## 📊 **Content Statistics**

### **Total Content Available:**
- **12 Main Page Modals** with full content
- **45+ Key Features** across all modules
- **25+ Quick Actions** with keyboard shortcuts
- **20+ Tips & Tricks** for best practices
- **30+ Cross-Module Links** for smart navigation
- **100% Permission-Aware** content filtering

### **Content Categories:**
- **Module Pages:** 6 main modules (Stock, Recipes, Count, etc.)
- **Feature Pages:** 4 specific functionality pages  
- **Workflow Pages:** 1 general platform help
- **Development Pages:** 1 hardware testing page

### **Keyboard Shortcuts Available:**
- **Ctrl+N** - Add New Item (from Stock Console)
- **Ctrl+C** - Start Stocktake (from Stock Console)
- **F1** - Open help for current page (Global)
- **Shift+?** - Alternative help shortcut (Global)

---

## 🎯 **Content Maintenance**

### **Regular Updates Needed:**
- **Feature additions** when new functionality is released
- **Link updates** when page URLs change
- **Permission updates** when role structure changes
- **Tip updates** based on user feedback and best practices

### **Content is stored in:** `/lib/explanationData.ts`
### **Easy to update:** No code changes needed, just content updates

**All help content is production-ready and actively helping users navigate the JiGR platform!** 🚀