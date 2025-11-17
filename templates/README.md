# JiGRApp Import Templates

This folder contains CSV template files for bulk importing data into various JiGRApp modules.

## 📁 Available Templates

### 📦 **inventory_items_template.csv**
- **Purpose**: Bulk import inventory items for stock management
- **Module**: Stock/Inventory
- **Fields**: Item Name, Brand, Category, Count Unit, Par Level Low, Par Level High
- **Sample Records**: 30 realistic restaurant inventory items
- **Use Case**: Setting up initial inventory or adding multiple items at once

### 🏢 **vendors_template.csv**  
- **Purpose**: Bulk import vendor/supplier information
- **Module**: Vendors/Procurement
- **Fields**: Vendor Name, Contact Name, Contact Email, Contact Phone, Delivery Schedule, Minimum Order Amount, Payment Terms, Notes
- **Sample Records**: 10 New Zealand food suppliers
- **Use Case**: Setting up supplier database for procurement management

## 📋 **How to Use Templates**

1. **Download**: Click the "Download Template" button in the respective import modal
2. **Edit**: Open in Excel/Google Sheets and replace sample data with your actual data
3. **Format**: Keep the header row intact - only modify data rows
4. **Save**: Export as CSV format
5. **Import**: Upload the completed CSV through the import interface

## 🎯 **Data Guidelines**

### General Rules:
- Keep header row exactly as provided
- Use quotes around text values that contain commas
- Leave fields blank if optional (don't use "N/A" or "NULL")
- Ensure required fields are filled for all rows

### Inventory Items:
- **Item Name**: Be descriptive (e.g., "Flour - Plain" not just "Flour")
- **Count Unit**: Use standard units (kg, L, dozen, each, etc.)
- **Par Levels**: Set realistic minimum and maximum stock levels

### Vendors:
- **Contact Info**: Ensure email addresses are valid format
- **Phone Numbers**: Use consistent format (NZ format: 09-XXX-XXXX)
- **Minimum Order**: Enter as decimal number (e.g., 150.00)
- **Delivery Schedule**: Use clear descriptions (e.g., "Monday, Wednesday, Friday")

## 🚀 **Future Templates**

Additional templates will be added for:
- Recipe imports
- Menu item imports  
- User bulk creation
- Location/department setup

## 💡 **Tips for Success**

- **Test with small batches first** (5-10 records) before importing large datasets
- **Review data quality** - clean, consistent data imports better
- **Backup existing data** before large imports
- **Check for duplicates** - the system will reject duplicate entries
- **Use consistent naming** - this helps with future data management

---

**Last Updated**: November 16, 2025  
**Templates Version**: 1.0