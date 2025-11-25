# SQL Files - Complete Reference Guide

**Date:** November 20, 2025  
**Project:** JiGR Menu Import System  
**Total Files:** 2

---

## 📁 Available SQL Files

### **1. Basic Migration** (Recommended for Production)
**File:** `033_menu_import_enhancements.sql`  
**Size:** 1.9 KB  
**Purpose:** Clean database migration only

**Contains:**
- ALTER TABLE statements to add new columns
- CREATE INDEX statements for performance
- Column comments for documentation

**Use When:**
- First-time installation
- Production deployment
- You just need the schema changes

**Installation:**
```sql
-- In Supabase SQL Editor:
-- 1. Copy contents of 033_menu_import_enhancements.sql
-- 2. Paste into SQL Editor
-- 3. Click "Run"
-- 4. Verify success message
```

---

### **2. Complete SQL Bundle** (Recommended for Development)
**File:** `MENU_IMPORT_COMPLETE_SQL_BUNDLE.sql`  
**Size:** 12 KB  
**Purpose:** Everything you need in one file

**Contains 7 Parts:**

#### **Part 1: Migration** ✅
- Same as 033_menu_import_enhancements.sql
- Wrapped in BEGIN/COMMIT transaction

#### **Part 2: Verification Queries** 🔍
- Check columns were created
- Verify indexes exist
- Confirm migration success

#### **Part 3: Test Data** 🧪
- Sample INSERT statement
- Test validation scenarios
- Quick start data

#### **Part 4: Management Queries** 📊
- View imported menu items
- Statistics by validation status
- Find high food cost items
- Find items without recipes
- Import statistics by method
- Recent imports report
- Menu pricing analysis by category

#### **Part 5: Data Cleanup** 🧹
- Remove test data
- Reset validation status
- Update validation after linking recipes
- Bulk data operations

#### **Part 6: Rollback Script** ↩️
- Emergency rollback procedure
- Drop indexes
- Remove columns (commented for safety)
- Restore to pre-migration state

#### **Part 7: Performance Optimization** ⚡
- ANALYZE table command
- Check table size
- Monitor index usage
- Performance statistics

---

## 🚀 Quick Start Guide

### **For Production Installation:**

```sql
-- Step 1: Run the migration
-- Copy/paste contents of 033_menu_import_enhancements.sql

-- Step 2: Verify (from complete bundle)
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'menupricing'
  AND column_name IN (
    'import_method',
    'validation_status',
    'actual_food_cost_pct'
  );

-- Should return 3 rows ✅
```

### **For Development/Testing:**

```sql
-- Step 1: Run Part 1 from complete bundle
-- (Migration section)

-- Step 2: Insert test data from Part 3
-- (Update client_id and recipe_id)

-- Step 3: Run management queries from Part 4
-- (View and analyze test data)

-- Step 4: Clean up with Part 5
-- (Remove test data when done)
```

---

## 📊 New Database Schema

### **Columns Added to MenuPricing Table:**

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `import_method` | VARCHAR(50) | 'manual' | How item was imported |
| `source_url` | TEXT | NULL | Original URL if from website |
| `source_name` | VARCHAR(255) | NULL | Name of source (spreadsheet, etc.) |
| `target_food_cost_pct` | DECIMAL(5,2) | NULL | User's target % |
| `actual_food_cost_pct` | DECIMAL(5,2) | NULL | Calculated actual % |
| `price_recommendation` | DECIMAL(10,2) | NULL | System suggestion |
| `import_notes` | TEXT | NULL | Additional notes |
| `import_confidence` | DECIMAL(3,2) | NULL | AI confidence (0.00-1.00) |
| `validation_status` | VARCHAR(20) | 'pending' | Status code |
| `validation_message` | TEXT | NULL | Human-readable message |

### **Indexes Created:**

```sql
idx_menu_pricing_validation_status (validation_status)
idx_menu_pricing_import_method (import_method)
idx_menu_pricing_client_id (client_id)
```

---

## 🔍 Useful Management Queries

### **View All Menu Items with Validation:**
```sql
SELECT 
  item_name,
  menu_price,
  actual_food_cost_pct,
  validation_status,
  validation_message
FROM MenuPricing
WHERE client_id = 'your-client-id-here'
ORDER BY 
  CASE validation_status
    WHEN 'error' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'good' THEN 3
    WHEN 'info' THEN 4
    ELSE 5
  END;
```

### **Find Pricing Problems:**
```sql
-- Items with high food cost (>35%)
SELECT item_name, actual_food_cost_pct, price_recommendation
FROM MenuPricing
WHERE client_id = 'your-client-id-here'
  AND actual_food_cost_pct > 35
ORDER BY actual_food_cost_pct DESC;
```

### **Import Statistics:**
```sql
-- Summary by import method
SELECT 
  import_method,
  COUNT(*) as total_items,
  AVG(import_confidence) as avg_confidence,
  COUNT(CASE WHEN validation_status = 'good' THEN 1 END) as good_items
FROM MenuPricing
WHERE client_id = 'your-client-id-here'
GROUP BY import_method;
```

### **Category Analysis:**
```sql
-- Average food cost by category
SELECT 
  category,
  COUNT(*) as item_count,
  AVG(menu_price) as avg_price,
  AVG(actual_food_cost_pct) as avg_food_cost
FROM MenuPricing
WHERE client_id = 'your-client-id-here'
  AND actual_food_cost_pct IS NOT NULL
GROUP BY category
ORDER BY avg_food_cost DESC;
```

---

## 🛠️ Troubleshooting

### **Migration Failed:**
```sql
-- Check if columns already exist
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'menupricing'
  AND column_name LIKE '%import%' 
  OR column_name LIKE '%validation%';

-- If columns exist, migration already ran ✅
```

### **Performance Issues:**
```sql
-- Check table size
SELECT 
  pg_size_pretty(pg_total_relation_size('menupricing')) as total_size;

-- Update statistics
ANALYZE MenuPricing;

-- Rebuild indexes if needed
REINDEX TABLE MenuPricing;
```

### **Data Quality Issues:**
```sql
-- Find items with NULL prices
SELECT item_name, import_method, source_name
FROM MenuPricing
WHERE menu_price IS NULL OR menu_price = 0;

-- Find items without recipes
SELECT item_name, category, created_at
FROM MenuPricing
WHERE recipe_id IS NULL
ORDER BY created_at DESC;

-- Check import confidence scores
SELECT 
  CASE 
    WHEN import_confidence >= 0.9 THEN 'High'
    WHEN import_confidence >= 0.7 THEN 'Medium'
    ELSE 'Low'
  END as confidence_level,
  COUNT(*) as item_count
FROM MenuPricing
WHERE import_confidence IS NOT NULL
GROUP BY 1;
```

---

## ⚠️ Important Notes

### **Before Running:**
1. ✅ Backup your database
2. ✅ Test on staging first
3. ✅ Replace 'your-client-id-here' with actual ID
4. ✅ Review queries before executing

### **After Running:**
1. ✅ Run verification queries
2. ✅ Check column comments
3. ✅ Test application functionality
4. ✅ Monitor performance

### **Rollback Safety:**
- Rollback script is commented out by default
- Uncomment only if absolutely necessary
- Data will be lost if columns are dropped
- Keep backups before rollback

---

## 📋 Migration Checklist

```
Pre-Migration:
□ Database backup completed
□ Staging environment tested
□ Rollback plan prepared
□ Team notified

Migration:
□ Run migration SQL
□ Verify success (no errors)
□ Check all columns created
□ Check indexes created

Post-Migration:
□ Run verification queries
□ Test import functionality
□ Monitor performance
□ Update documentation

Sign-off:
□ Developer: _____________ Date: _______
□ DBA: _____________ Date: _______
```

---

## 🎯 Example Usage Flow

### **Scenario: First Installation**

```sql
-- 1. Run migration
-- Copy 033_menu_import_enhancements.sql
-- Paste in Supabase SQL Editor
-- Click Run

-- 2. Verify
SELECT column_name 
FROM information_schema.columns
WHERE table_name = 'menupricing'
  AND column_name = 'validation_status';
-- Should return 1 row ✅

-- 3. Test with sample data
INSERT INTO MenuPricing (
  client_id, item_name, menu_price, 
  validation_status, validation_message
) VALUES (
  'test-client', 'Test Item', 10.00,
  'good', 'Food cost 30% is within ideal range'
);

-- 4. Query test data
SELECT * FROM MenuPricing WHERE item_name = 'Test Item';

-- 5. Clean up
DELETE FROM MenuPricing WHERE item_name = 'Test Item';

-- 6. Ready for production! 🎉
```

---

## 💡 Pro Tips

1. **Use the Complete Bundle for Development**
   - All queries in one place
   - Easy to run tests
   - Comprehensive toolset

2. **Use Basic Migration for Production**
   - Clean and minimal
   - Less room for error
   - Faster execution

3. **Keep Management Queries Handy**
   - Save to Supabase favorites
   - Create dashboard views
   - Schedule regular reports

4. **Monitor Import Quality**
   - Check confidence scores weekly
   - Review validation status distribution
   - Track pricing trends

5. **Regular Maintenance**
   - Run ANALYZE monthly
   - Check for orphaned data
   - Update validation after recipe changes

---

## 📞 Support

**Questions?**
- Check TESTING_PROTOCOL.md for detailed procedures
- Review DAY_1, DAY_2, DAY_3 completion docs
- Consult menu-import/ library code

**Issues?**
- Check verification queries first
- Review error messages in application logs
- Use troubleshooting section above

---

**Files Ready for Download! 🎉**

All SQL files are in `/mnt/user-data/outputs/` ready to use!
