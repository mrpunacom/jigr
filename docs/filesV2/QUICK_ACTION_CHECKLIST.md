# Recipe Loading Issue - Quick Action Checklist

## 🚨 Problem Summary
Multiple component mounts causing infinite loading despite correct state values.

---

## ✅ Actions (Do in Order)

### 1. First Check: React Strict Mode

```bash
# Open this file
app/layout.tsx
```

Look for:
```typescript
<React.StrictMode>
  {children}
</React.StrictMode>
```

**If present:** This is causing double-mounts (normal in development)  
**Solution:** Apply the useRef fix from FIXED_recipe_detail_page_V2.tsx

---

### 2. Apply the useRef Fix

**File to edit:** `app/recipes/[id]/page.tsx`

**Add these lines:**

```typescript
// After your existing useState declarations:
const hasFetchedRef = useRef(false)
```

```typescript
// At the start of your fetch function:
if (hasFetchedRef.current) {
  console.log('Already fetched, skipping')
  return
}

// Right before your API call:
hasFetchedRef.current = true
```

```typescript
// In your useEffect cleanup:
return () => {
  if (process.env.NODE_ENV === 'development') {
    hasFetchedRef.current = false
  }
}
```

**Full example in:** `FIXED_recipe_detail_page_V2.tsx`

---

### 3. Test the Minimal Page

```bash
# Create this file
app/recipes/test/page.tsx
```

**Copy content from:** `TestRecipePage.tsx`

**Navigate to:** http://localhost:3000/recipes/test

**Expected:** Loading spinner disappears after 1 second

**If test page works but main page doesn't:**
→ Issue is in your component logic or StandardPageWrapper

**If test page also fails:**
→ Deeper React/Next.js issue

---

### 4. Check StandardPageWrapper

```bash
# Open this file
app/components/UniversalPageWrapper.tsx
```

**Add logging:**
```typescript
export function StandardPageWrapper({ children, moduleName, currentPage }) {
  console.log('📦 StandardPageWrapper render:', { moduleName, currentPage })
  // ... rest of component
}
```

**Look for:**
- Unstable object references in context providers
- useEffect that might trigger parent rerenders
- State that changes on every render

---

### 5. Production Test

```bash
npm run build
```

```bash
npm start
```

Navigate to recipe page.

**If works in production but not development:**
→ Confirmed Strict Mode issue, useRef fix will solve it

**If still broken in production:**
→ Deeper issue, need more investigation

---

## 📊 Expected Console Output (After Fix)

### Development Mode (Strict Mode):
```
🔵 MOUNT - Component abc123
🍳 Effect running with ID: abc123
🍳 Starting fetch: abc123
🔴 UNMOUNT - Component abc123
🔵 MOUNT - Component def456
🍳 Effect running with ID: def456
🍳 Already fetched, skipping: def456  ← KEY!
🍳 Response status: 200
🍳 Loading set to false
🔄 RENDER { loading: false, recipe: true }
```

### Production Mode:
```
🔵 MOUNT - Component abc123
🍳 Effect running with ID: abc123
🍳 Starting fetch: abc123
🍳 Response status: 200
🍳 Loading set to false
🔄 RENDER { loading: false, recipe: true }
```

---

## 🎯 Success Criteria

- [ ] Only ONE API call per page load (check Network tab)
- [ ] Loading spinner disappears after data loads
- [ ] Recipe content displays correctly
- [ ] No console errors
- [ ] Works consistently on refresh

---

## 🚑 Emergency Workaround

If nothing works, temporarily disable Strict Mode:

```bash
# Edit next.config.js
```

```javascript
const nextConfig = {
  reactStrictMode: false,  // ⚠️ Only for debugging!
}
```

**Restart dev server**

If this fixes it → Strict Mode was the issue  
If this doesn't fix it → Look at StandardPageWrapper

---

## 📁 Files You Need

1. **RECIPE_MOUNTING_ISSUE_DEBUG_GUIDE.md** - Comprehensive guide
2. **FIXED_recipe_detail_page_V2.tsx** - Complete fixed component
3. **TestRecipePage.tsx** - Minimal test to isolate issue
4. **This file** - Quick reference checklist

---

## 💡 Key Insight

**The Problem:** Next.js Strict Mode double-mounts components  
**Why It Breaks:** Your fetch doesn't account for double-execution  
**The Fix:** Use `useRef` to track if fetch already happened  
**Result:** Single API call, even with double-mount

---

## 📞 If Still Stuck

Check these in order:

1. Is hasFetchedRef set BEFORE the async fetch?
2. Is cleanup function resetting the ref in development?
3. Does the test page work?
4. Does production build work?
5. Is StandardPageWrapper causing issues?

**Most likely you're 99% there** - just need the useRef pattern! 🎯

---

**Date:** November 17, 2025  
**Status:** Debugging in progress  
**Confidence:** 95% - This is a Strict Mode issue
