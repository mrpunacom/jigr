# Test Menu Data - Sample Spreadsheet for MENU Import Testing

**Purpose:** Sample menu pricing data to test the MENU import system  
**Format:** Copy this into Google Sheets for testing  
**Date:** November 20, 2025

---

## 📋 TEST MENU SPREADSHEET FORMAT

### Option 1: Simple Format (Most Common)

```
Category          | Item Name                  | Price  | Target Food Cost %
-----------------|----------------------------|--------|-------------------
Salads           | Caesar Salad               | $12.00 | 28%
Salads           | Greek Salad                | $11.00 | 30%
Salads           | Cobb Salad                 | $14.00 | 32%
Appetizers       | Garlic Bread               | $6.00  | 25%
Appetizers       | Buffalo Wings (6pc)        | $9.00  | 35%
Appetizers       | Calamari                   | $11.00 | 33%
Mains            | Fish & Chips               | $16.00 | 30%
Mains            | Chicken Schnitzel          | $18.00 | 28%
Mains            | Eye Fillet Steak (250g)    | $32.00 | 35%
Mains            | Vegetarian Pasta           | $15.00 | 22%
Desserts         | Chocolate Brownie          | $8.00  | 20%
Desserts         | Crème Brûlée               | $9.00  | 25%
Desserts         | Pavlova                    | $7.00  | 18%
```

---

### Option 2: Extended Format (With Descriptions)

```
Category    | Item Name           | Price  | Target FC% | Description                           | Notes
------------|---------------------|--------|------------|---------------------------------------|------------------
Salads      | Caesar Salad        | $12.00 | 28%        | Cos lettuce, bacon, parmesan, egg     | Popular item
Salads      | Greek Salad         | $11.00 | 30%        | Feta, olives, tomato, cucumber        | Summer special
Mains       | Eye Fillet (250g)   | $32.00 | 35%        | Premium NZ beef, seasonal vegetables  | Signature dish
Mains       | Chicken Schnitzel   | $18.00 | 28%        | Crumbed chicken, chips, salad         | Best seller
Desserts    | Pavlova             | $7.00  | 18%        | Meringue, cream, fresh berries        | Kiwi classic
```

---

### Option 3: Minimal Format (Name + Price Only)

```
Item Name                    | Price
----------------------------|--------
Caesar Salad                | $12.00
Greek Salad                 | $11.00
Buffalo Wings (6pc)         | $9.00
Fish & Chips                | $16.00
Chicken Schnitzel           | $18.00
Eye Fillet Steak (250g)     | $32.00
Chocolate Brownie           | $8.00
Pavlova                     | $7.00
```

---

## 🧪 TEST SCENARIOS

### Test Case 1: Perfect Data (Happy Path)
**Expected:** All items import cleanly, no warnings

```
Category | Item Name      | Price  | Target FC%
---------|---------------|--------|------------
Salads   | Caesar Salad  | $12.00 | 28%
Mains    | Fish & Chips  | $16.00 | 30%
```

**Expected Result:**
- ✅ 2 items detected
- ✅ Categories detected
- ✅ Prices parsed correctly
- ✅ Food cost targets captured
- ✅ Confidence score: 0.95+

---

### Test Case 2: Missing Target Food Cost %
**Expected:** Import succeeds, but warns about missing targets

```
Category | Item Name      | Price
---------|---------------|--------
Salads   | Caesar Salad  | $12.00
Mains    | Fish & Chips  | $16.00
```

**Expected Result:**
- ✅ Items imported
- ⚠️ Warning: "Target food cost % not specified - consider adding"
- ✅ Confidence score: 0.90

---

### Test Case 3: Price Formatting Variations
**Expected:** System handles different price formats

```
Item Name           | Price
--------------------|--------
Caesar Salad        | $12.00
Greek Salad         | 11
Buffalo Wings       | $9
Fish & Chips        | 16.00
```

**Expected Result:**
- ✅ All prices normalized to decimal format
- ✅ "$", missing decimals handled
- ✅ Confidence score: 0.85+

---

### Test Case 4: Category Detection
**Expected:** AI detects categories from item names if column missing

```
Item Name
--------------------
SALADS
Caesar Salad - $12
Greek Salad - $11

MAINS
Fish & Chips - $16
Chicken Schnitzel - $18
```

**Expected Result:**
- ✅ Categories inferred: "Salads", "Mains"
- ✅ Prices extracted from item names
- ✅ Confidence score: 0.80+

---

### Test Case 5: Edge Cases (Error Handling)

**A) Invalid Prices**
```
Item Name        | Price
-----------------|--------
Caesar Salad     | TBD
Greek Salad      | Market Price
Buffalo Wings    | Call for pricing
```

**Expected Result:**
- ❌ Items flagged for review
- ⚠️ Warning: "Invalid price format - please enter numeric value"

**B) Duplicate Items**
```
Item Name        | Price
-----------------|--------
Caesar Salad     | $12.00
Caesar Salad     | $11.00
```

**Expected Result:**
- ⚠️ Warning: "Duplicate item detected - using latest price ($11.00)"

**C) Extremely High/Low Prices**
```
Item Name        | Price
-----------------|--------
Water            | $0.50
Lobster Tail     | $150.00
```

**Expected Result:**
- ✅ Imported successfully
- 💡 Info: "Unusual price detected - please verify"

---

## 📊 SAMPLE FULL RESTAURANT MENU

### Café "The Kiwi Kitchen" - Test Dataset

```
Category          | Item Name                       | Price  | Target FC% | Description
------------------|---------------------------------|--------|------------|------------------------------------------
BREAKFAST
Breakfast         | Big Breakfast                   | $18.00 | 30%        | Eggs, bacon, sausage, hash browns, toast
Breakfast         | Eggs Benedict                   | $16.00 | 28%        | Poached eggs, ham, hollandaise on muffin
Breakfast         | Pancake Stack                   | $14.00 | 22%        | 3 pancakes, maple syrup, berries
Breakfast         | Smashed Avocado on Toast        | $15.00 | 25%        | Sourdough, poached egg, feta

SALADS
Salads            | Caesar Salad                    | $12.00 | 28%        | Cos lettuce, bacon, parmesan, croutons
Salads            | Greek Salad                     | $11.00 | 30%        | Feta, olives, tomato, cucumber
Salads            | Garden Salad                    | $9.00  | 25%        | Mixed greens, cherry tomatoes

APPETIZERS
Appetizers        | Garlic Bread                    | $6.00  | 20%        | Toasted ciabatta, garlic butter
Appetizers        | Buffalo Wings (6pc)             | $9.00  | 35%        | Spicy sauce, blue cheese dip
Appetizers        | Calamari                        | $11.00 | 33%        | Fried squid, lemon aioli

MAINS
Mains             | Fish & Chips                    | $16.00 | 30%        | Beer-battered fish, chips, tartare
Mains             | Chicken Schnitzel               | $18.00 | 28%        | Crumbed chicken, chips, salad
Mains             | Eye Fillet Steak (250g)         | $32.00 | 35%        | Premium NZ beef, seasonal veg
Mains             | Lamb Shank                      | $24.00 | 32%        | Slow-cooked, mash, red wine jus
Mains             | Vegetarian Pasta                | $15.00 | 22%        | Penne, seasonal vegetables
Mains             | Beef Burger                     | $17.00 | 30%        | 200g patty, cheese, bacon, chips

DESSERTS
Desserts          | Chocolate Brownie               | $8.00  | 20%        | Warm brownie, vanilla ice cream
Desserts          | Crème Brûlée                    | $9.00  | 25%        | Classic French custard
Desserts          | Pavlova                         | $7.00  | 18%        | Meringue, cream, fresh berries
Desserts          | Cheesecake                      | $8.00  | 22%        | New York style, berry coulis

KIDS MENU
Kids              | Kids Fish & Chips               | $10.00 | 28%        | Smaller portion, kids drink
Kids              | Kids Pasta                      | $9.00  | 20%        | Plain or tomato sauce
Kids              | Chicken Nuggets & Chips         | $10.00 | 25%        | 6 nuggets, tomato sauce

BEVERAGES
Beverages         | Flat White                      | $4.50  | 15%        | Double shot espresso, milk
Beverages         | Cappuccino                      | $4.50  | 15%        | Single shot, frothy milk
Beverages         | Orange Juice (Fresh)            | $5.00  | 40%        | Freshly squeezed
Beverages         | Soft Drink                      | $3.50  | 60%        | Coke, Sprite, Fanta
```

---

## ✅ TESTING CHECKLIST

### Pre-Test Setup
- [ ] Copy sample data into Google Sheets
- [ ] Share sheet with JiGR test account
- [ ] Verify OAuth connection working
- [ ] Clear any existing test menu items

### Import Testing
- [ ] **Test 1:** Import simple 3-item menu (Happy Path)
- [ ] **Test 2:** Import full 30-item restaurant menu
- [ ] **Test 3:** Import menu with missing target FC%
- [ ] **Test 4:** Import menu with price formatting variations
- [ ] **Test 5:** Import menu with categories in headers
- [ ] **Test 6:** Test error handling (invalid prices)
- [ ] **Test 7:** Test duplicate item detection
- [ ] **Test 8:** Test extreme price values

### Validation Testing
- [ ] Verify all prices parsed correctly
- [ ] Check category assignment accurate
- [ ] Confirm target food cost % captured
- [ ] Validate confidence scores reasonable
- [ ] Review any warnings/errors displayed

### UI/UX Testing
- [ ] Sheet selector shows all sheets
- [ ] Preview displays correctly formatted
- [ ] Validation warnings clear and helpful
- [ ] Success message appears after import
- [ ] Loading states smooth (no flashing)
- [ ] Mobile responsive on iPad Air

### Edge Case Testing
- [ ] Empty spreadsheet (no data)
- [ ] Single row (just headers)
- [ ] 100+ items (performance test)
- [ ] Special characters in item names
- [ ] Very long item names (50+ chars)
- [ ] Negative prices (error case)

---

## 📝 TEST RESULTS TEMPLATE

```
TEST RUN: [Date/Time]
TESTER: [Name]
DEVICE: [iPad Air / Desktop]

TEST CASE: [Test Case #]
RESULT: [PASS / FAIL / WARNING]
CONFIDENCE SCORE: [0.00-1.00]
ITEMS IMPORTED: [X of Y]

ISSUES FOUND:
1. [Description]
2. [Description]

SCREENSHOTS:
[Link to screenshots]

NOTES:
[Any additional observations]
```

---

## 🎯 SUCCESS CRITERIA

### Import Accuracy
- ✅ 95%+ items detected correctly
- ✅ 98%+ prices parsed accurately
- ✅ 90%+ categories assigned correctly
- ✅ 85%+ confidence scores

### Performance
- ✅ <5 seconds for 30-item menu
- ✅ <15 seconds for 100-item menu
- ✅ No timeout errors
- ✅ Smooth on iPad Air (2013)

### User Experience
- ✅ Clear error messages
- ✅ Helpful warnings
- ✅ No confusing states
- ✅ Easy to understand preview
- ✅ Simple confirmation flow

---

## 📚 RELATED DOCUMENTS

- **Implementation Guide:** `MENU_IMPORT_1_WEEK_PLAN.md`
- **Testing Protocol:** `TESTING_PROTOCOL.md`
- **API Endpoints:** `/api/menu/import/*`
- **Database Schema:** Migration 033

---

**Status:** Ready for Testing  
**Last Updated:** November 20, 2025  
**Next Step:** Run through testing protocol with this data
