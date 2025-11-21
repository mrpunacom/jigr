# MENU Import - Comprehensive Testing Protocol

**Document:** Testing Protocol & Quality Assurance  
**Module:** MENU Import System  
**Version:** 1.0  
**Date:** November 20, 2025  
**Status:** Ready for Execution

---

## 🎯 Testing Objectives

### Primary Goals
1. **Functional Completeness** - All features work as designed
2. **Data Accuracy** - Import accuracy >95%
3. **Error Handling** - Graceful failure with helpful messages
4. **Performance** - Fast on iPad Air (2013)
5. **User Experience** - Intuitive, no confusion

### Success Metrics
- ✅ All test cases pass
- ✅ Zero critical bugs
- ✅ <3 minor bugs acceptable
- ✅ <5 second import time for 30 items
- ✅ Confidence scores >0.85 average

---

## 📋 PRE-TEST SETUP

### Environment Preparation

**1. Database State**
```sql
-- Check existing menu items
SELECT COUNT(*) FROM MenuPricing WHERE restaurant_id = '[test_restaurant_id]';

-- Clear test data if needed
DELETE FROM MenuPricing 
WHERE restaurant_id = '[test_restaurant_id]' 
AND import_method = 'google_sheets';

-- Verify clean state
SELECT * FROM MenuPricing WHERE restaurant_id = '[test_restaurant_id]';
```

**2. Google Sheets Setup**
- [ ] Create test Google Sheet with sample data (use TEST_MENU_DATA.md)
- [ ] Share with test account email
- [ ] Verify OAuth connection active
- [ ] Test sheet has multiple tabs (for tab selection testing)

**3. Test Account Setup**
- [ ] Login as test restaurant owner
- [ ] Verify restaurant_id in session
- [ ] Check all permissions active
- [ ] Clear browser cache (fresh start)

**4. Device Testing Checklist**
- [ ] iPad Air (2013) - iOS 12 / Safari 12
- [ ] Modern iPad - Latest iOS
- [ ] Desktop - Chrome (latest)
- [ ] Desktop - Safari (latest)
- [ ] Mobile phone - iOS Safari

---

## 🧪 TEST SUITE 1: FUNCTIONAL TESTING

### Test 1.1: OAuth Connection

**Objective:** Verify Google Sheets OAuth flow works

**Steps:**
1. Navigate to `/menu/import`
2. Click "Connect Google Sheets"
3. Authorize Google account
4. Verify redirect back to sheet selector

**Expected Results:**
- ✅ OAuth popup opens
- ✅ Google authorization screen appears
- ✅ Success redirect to `/menu/import/google/select-sheet`
- ✅ No console errors

**Pass Criteria:** Can successfully connect Google account

---

### Test 1.2: Sheet Selection

**Objective:** User can select correct spreadsheet and tab

**Steps:**
1. From sheet selector page
2. View list of available spreadsheets
3. Select test spreadsheet
4. View list of tabs/sheets
5. Select "Menu Pricing" tab
6. Click "Continue"

**Expected Results:**
- ✅ All spreadsheets listed
- ✅ Spreadsheet name displayed correctly
- ✅ All tabs/sheets listed
- ✅ Can select correct tab
- ✅ "Continue" button enabled after selection

**Pass Criteria:** Can navigate to correct sheet/tab

---

### Test 1.3: Data Preview (Simple Menu)

**Objective:** System correctly parses 3-item simple menu

**Test Data:**
```
Category | Item Name      | Price  | Target FC%
---------|---------------|--------|------------
Salads   | Caesar Salad  | $12.00 | 28%
Mains    | Fish & Chips  | $16.00 | 30%
Desserts | Pavlova       | $7.00  | 18%
```

**Steps:**
1. Import above data
2. View preview screen
3. Check parsed data accuracy

**Expected Results:**
- ✅ 3 items detected
- ✅ Categories assigned correctly
- ✅ Prices: $12.00, $16.00, $7.00
- ✅ Target FC%: 28%, 30%, 18%
- ✅ Confidence scores >0.90
- ✅ No warnings/errors

**Pass Criteria:** All data parsed accurately

---

### Test 1.4: Data Preview (Full Restaurant Menu)

**Objective:** System handles 30-item complex menu

**Test Data:** Use full sample from TEST_MENU_DATA.md

**Steps:**
1. Import 30-item restaurant menu
2. Review preview screen
3. Check all categories detected
4. Verify prices parsed
5. Check confidence scores

**Expected Results:**
- ✅ 30 items detected
- ✅ 8 categories: Breakfast, Salads, Appetizers, Mains, Desserts, Kids, Beverages
- ✅ All prices numeric and accurate
- ✅ Target FC% captured where present
- ✅ Average confidence >0.85
- ✅ No critical errors

**Pass Criteria:** >95% data accuracy

---

### Test 1.5: Import Confirmation

**Objective:** User can confirm and complete import

**Steps:**
1. From preview screen
2. Click "Confirm Import"
3. Wait for processing
4. Verify success message
5. Navigate to MENU console
6. Verify items appear

**Expected Results:**
- ✅ Processing indicator shows
- ✅ <5 seconds for 30 items
- ✅ Success toast appears
- ✅ Redirects to MENU console
- ✅ All items visible in list
- ✅ No duplicate items

**Pass Criteria:** All items imported to database

---

## 🧪 TEST SUITE 2: DATA ACCURACY

### Test 2.1: Price Formatting Variations

**Test Data:**
```
Item Name        | Price
-----------------|--------
Caesar Salad     | $12.00    (standard)
Greek Salad      | 11        (no $ no decimals)
Buffalo Wings    | $9        (no decimals)
Fish & Chips     | 16.00     (no $)
Steak            | $32.50    (cents)
```

**Expected Results:**
- ✅ All prices converted to decimal: 12.00, 11.00, 9.00, 16.00, 32.50
- ✅ Currency symbols removed
- ✅ Decimals added where missing
- ✅ Confidence >0.85

**Pass Criteria:** All price formats handled correctly

---

### Test 2.2: Category Detection (Missing Column)

**Test Data:**
```
Item Name
-----------------------
SALADS
Caesar Salad - $12
Greek Salad - $11

MAINS  
Fish & Chips - $16
Steak - $32
```

**Expected Results:**
- ✅ Categories inferred: "Salads", "Mains"
- ✅ Prices extracted from names: 12, 11, 16, 32
- ✅ Item names cleaned (no prices in name)
- ✅ Confidence >0.80

**Pass Criteria:** AI detects categories from structure

---

### Test 2.3: Special Characters

**Test Data:**
```
Item Name                  | Price
---------------------------|--------
Fish & Chips               | $16.00  (ampersand)
Crème Brûlée              | $9.00   (accents)
Entrée - Eye Fillet       | $32.00  (dash, accent)
"Chef's Special" Burger    | $18.00  (quotes)
```

**Expected Results:**
- ✅ Special characters preserved
- ✅ Accents display correctly
- ✅ Quotes handled
- ✅ Prices parsed correctly
- ✅ No encoding errors

**Pass Criteria:** Unicode/special chars work

---

### Test 2.4: Long Item Names

**Test Data:**
```
Item Name                                                              | Price
-----------------------------------------------------------------------|--------
Grilled Free-Range Chicken Breast with Seasonal Roasted Vegetables...  | $24.00
The Ultimate Angus Beef Burger with Bacon, Cheese, and Special Sauce   | $19.00
```

**Expected Results:**
- ✅ Full names imported (no truncation)
- ✅ Display truncates with ellipsis in UI
- ✅ Tooltip shows full name on hover
- ✅ Database stores complete name

**Pass Criteria:** Long names handled properly

---

## 🧪 TEST SUITE 3: ERROR HANDLING

### Test 3.1: Invalid Prices

**Test Data:**
```
Item Name        | Price
-----------------|----------------
Caesar Salad     | TBD
Greek Salad      | Market Price
Buffalo Wings    | Call
Fish & Chips     | ??
```

**Expected Results:**
- ⚠️ Items flagged with validation warnings
- ⚠️ Error: "Invalid price format - please enter numeric value"
- ⚠️ Items excluded from import or require manual fix
- ✅ Other valid items still importable
- ✅ User can edit prices in preview

**Pass Criteria:** Clear error messages, allows fixing

---

### Test 3.2: Duplicate Items

**Test Data:**
```
Item Name        | Price
-----------------|--------
Caesar Salad     | $12.00
Greek Salad      | $11.00
Caesar Salad     | $11.50  (duplicate)
```

**Expected Results:**
- ⚠️ Warning: "Duplicate 'Caesar Salad' detected"
- 💡 Options: Keep first, Keep last, Keep both (rename)
- ✅ User can choose action
- ✅ Preview shows conflict clearly

**Pass Criteria:** Duplicate detection works, user control

---

### Test 3.3: Extremely Low/High Prices

**Test Data:**
```
Item Name        | Price
-----------------|--------
Water            | $0.50    (very low)
Tap Water        | $0.00    (free)
Lobster Tail     | $150.00  (very high)
Wine (Vintage)   | $500.00  (extremely high)
```

**Expected Results:**
- 💡 Info: "Unusual price detected - please verify"
- ⚠️ Items flagged but importable
- ✅ User can confirm intentional
- ✅ No hard blocking errors

**Pass Criteria:** Warnings but not errors

---

### Test 3.4: Empty Spreadsheet

**Test Data:** Blank spreadsheet with only headers

**Expected Results:**
- ⚠️ Error: "No menu items found in spreadsheet"
- ✅ Helpful message: "Please add at least one menu item"
- ✅ Option to go back and select different sheet
- ✅ No crash or blank screen

**Pass Criteria:** Graceful handling of empty data

---

### Test 3.5: Missing Required Columns

**Test Data:** Spreadsheet with only item names (no prices)

**Expected Results:**
- ⚠️ Error: "Price column required"
- 💡 Suggestion: "Add a 'Price' column to your spreadsheet"
- ✅ Shows example of correct format
- ✅ Option to cancel and fix

**Pass Criteria:** Clear guidance on missing data

---

## 🧪 TEST SUITE 4: PERFORMANCE

### Test 4.1: Small Menu (3-10 items)

**Metrics:**
- Import time: <2 seconds
- Preview render: <1 second
- Save to database: <1 second

**Pass Criteria:** Fast, no lag

---

### Test 4.2: Medium Menu (30-50 items)

**Metrics:**
- Import time: <5 seconds
- Preview render: <2 seconds
- Save to database: <2 seconds

**Pass Criteria:** Smooth experience

---

### Test 4.3: Large Menu (100+ items)

**Metrics:**
- Import time: <15 seconds
- Preview render: <5 seconds
- Save to database: <5 seconds
- No browser timeout
- Progress indicator visible

**Pass Criteria:** Works without errors

---

### Test 4.4: iPad Air (2013) Specific

**Device:** iPad Air 1st gen, iOS 12, Safari 12

**Tests:**
- [ ] Page loads without errors
- [ ] OAuth popup works
- [ ] Sheet selector responsive
- [ ] Preview scrolls smoothly
- [ ] No memory warnings
- [ ] Touch targets adequate (44px min)
- [ ] No layout breaking

**Pass Criteria:** Fully functional on legacy device

---

## 🧪 TEST SUITE 5: USER EXPERIENCE

### Test 5.1: Loading States

**Checks:**
- [ ] Loading spinner shows during OAuth
- [ ] Progress bar during sheet fetch
- [ ] Skeleton loaders in preview
- [ ] "Importing..." message during save
- [ ] No blank screens at any point

**Pass Criteria:** Always clear what's happening

---

### Test 5.2: Error Messages

**Checks:**
- [ ] Errors use friendly language
- [ ] Suggest corrective actions
- [ ] No technical jargon
- [ ] Red/yellow color coding clear
- [ ] Actionable (not dead ends)

**Pass Criteria:** Non-technical users understand

---

### Test 5.3: Success Feedback

**Checks:**
- [ ] Success toast appears
- [ ] Shows count: "30 items imported successfully"
- [ ] Auto-redirect to MENU console
- [ ] Items visible immediately
- [ ] Celebration feeling (positive UX)

**Pass Criteria:** Clear confirmation of success

---

### Test 5.4: Mobile Responsiveness

**Devices:**
- [ ] iPhone (portrait)
- [ ] iPhone (landscape)
- [ ] iPad (portrait)
- [ ] iPad (landscape)

**Checks:**
- [ ] No horizontal scroll
- [ ] Touch targets 44px minimum
- [ ] Text readable without zoom
- [ ] Buttons accessible
- [ ] Tables scroll or stack

**Pass Criteria:** Works on all sizes

---

## 🧪 TEST SUITE 6: INTEGRATION

### Test 6.1: Database Integrity

**Checks:**
```sql
-- After import, verify:
SELECT 
  id,
  restaurant_id,
  item_name,
  category,
  price,
  target_food_cost_pct,
  import_method,
  validation_status
FROM MenuPricing
WHERE import_method = 'google_sheets'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected:**
- ✅ All fields populated correctly
- ✅ restaurant_id matches session
- ✅ import_method = 'google_sheets'
- ✅ Timestamps accurate
- ✅ No NULL in required fields

**Pass Criteria:** Data integrity maintained

---

### Test 6.2: Row Level Security (RLS)

**Checks:**
1. Login as Restaurant A
2. Import menu items
3. Logout and login as Restaurant B
4. Try to view Restaurant A's items

**Expected:**
- ✅ Restaurant A sees only their items
- ✅ Restaurant B cannot see A's items
- ✅ No cross-restaurant data leakage
- ✅ Direct ID access blocked

**Pass Criteria:** RLS working correctly

---

### Test 6.3: Concurrent Imports

**Scenario:** Two users from same restaurant import simultaneously

**Checks:**
- [ ] No database conflicts
- [ ] Both imports complete
- [ ] No duplicate items (unless intentional)
- [ ] All items from both imports visible

**Pass Criteria:** Handles concurrent operations

---

## 📊 TEST RESULTS TRACKING

### Results Template

```
==================================
TEST RUN SUMMARY
==================================
Date: [YYYY-MM-DD]
Tester: [Name]
Device: [Device/Browser]
Duration: [HH:MM]

FUNCTIONAL TESTS:
[ ] Test 1.1: OAuth - PASS/FAIL
[ ] Test 1.2: Sheet Selection - PASS/FAIL
[ ] Test 1.3: Simple Preview - PASS/FAIL
[ ] Test 1.4: Full Menu - PASS/FAIL
[ ] Test 1.5: Confirmation - PASS/FAIL

DATA ACCURACY TESTS:
[ ] Test 2.1: Price Formats - PASS/FAIL
[ ] Test 2.2: Category Detection - PASS/FAIL
[ ] Test 2.3: Special Characters - PASS/FAIL
[ ] Test 2.4: Long Names - PASS/FAIL

ERROR HANDLING TESTS:
[ ] Test 3.1: Invalid Prices - PASS/FAIL
[ ] Test 3.2: Duplicates - PASS/FAIL
[ ] Test 3.3: Extreme Prices - PASS/FAIL
[ ] Test 3.4: Empty Data - PASS/FAIL
[ ] Test 3.5: Missing Columns - PASS/FAIL

PERFORMANCE TESTS:
[ ] Test 4.1: Small Menu - PASS/FAIL
[ ] Test 4.2: Medium Menu - PASS/FAIL
[ ] Test 4.3: Large Menu - PASS/FAIL
[ ] Test 4.4: iPad Air - PASS/FAIL

UX TESTS:
[ ] Test 5.1: Loading States - PASS/FAIL
[ ] Test 5.2: Error Messages - PASS/FAIL
[ ] Test 5.3: Success Feedback - PASS/FAIL
[ ] Test 5.4: Mobile Responsive - PASS/FAIL

INTEGRATION TESTS:
[ ] Test 6.1: Database - PASS/FAIL
[ ] Test 6.2: RLS - PASS/FAIL
[ ] Test 6.3: Concurrent - PASS/FAIL

==================================
BUGS FOUND:
==================================
1. [Critical/Major/Minor] - Description
2. [Critical/Major/Minor] - Description

==================================
OVERALL RESULT: PASS / FAIL / NEEDS WORK
==================================
```

---

## 🎯 SIGN-OFF CRITERIA

### Before Production Deployment:

**Critical Requirements (Must Pass):**
- ✅ All Test Suite 1 (Functional) tests pass
- ✅ All Test Suite 3 (Error Handling) tests pass
- ✅ Test 4.4 (iPad Air) passes
- ✅ Test 6.2 (RLS Security) passes
- ✅ Zero critical bugs
- ✅ Zero data loss scenarios

**Important (Should Pass):**
- ✅ >90% of Test Suite 2 (Data Accuracy) tests pass
- ✅ Test Suite 4 (Performance) acceptable
- ✅ <5 minor bugs total

**Nice to Have:**
- ✅ All tests pass
- ✅ Zero minor bugs
- ✅ Performance exceeds targets

---

## 📝 POST-TEST ACTIONS

### If Tests Pass:
1. Sign off on testing document
2. Create production deployment ticket
3. Schedule deployment window
4. Prepare rollback plan
5. Deploy to production
6. Monitor for 24 hours

### If Tests Fail:
1. Document all failures
2. Prioritize bugs (Critical → Minor)
3. Create bug fix tickets
4. Assign to developers
5. Retest after fixes
6. Repeat until sign-off criteria met

---

## 📚 RELATED DOCUMENTS

- **Test Data:** `TEST_MENU_DATA.md`
- **Implementation Plan:** `MENU_IMPORT_1_WEEK_PLAN.md`
- **Day 3 Summary:** `DAY_3_COMPLETE_MENU_IMPORT.md`

---

**Document Status:** Ready for Testing  
**Last Updated:** November 20, 2025  
**Next Step:** Execute test suite and document results
