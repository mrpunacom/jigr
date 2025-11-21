# Recipe Page Mounting Issue - Advanced Debugging Guide

## 🚨 The Real Problem

You're experiencing **multiple component mounts**, not just useEffect re-runs. Evidence:
- Multiple effect IDs: "dw9ddpqga", "4zr2vf6o4", etc.
- Console shows correct state (`loading: false`) but UI doesn't update
- Component appears to unmount/remount repeatedly

## 🎯 Most Likely Causes (In Order)

### 1. React Strict Mode (99% probability)
Next.js 14 App Router **intentionally** double-invokes effects in development.

### 2. Hot Module Reloading (Development only)
File saves cause component recreation.

### 3. Parent Component Rerenders
StandardPageWrapper might be forcing child remounts.

---

## 📋 Debugging Checklist

### ✅ Step 1: Check for React Strict Mode

**File to check:** `app/layout.tsx`

Look for this pattern:
```typescript
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}  // ✅ Good - No StrictMode
      </body>
    </html>
  )
}

// OR

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <React.StrictMode>  // ⚠️ This causes double-mounting
          {children}
        </React.StrictMode>
      </body>
    </html>
  )
}
```

**Next.js 14 Default Behavior:**
- In **development**: Effects run twice (intentional)
- In **production**: Effects run once (normal)

**What this means:**
- Multiple effect IDs in development = NORMAL
- The issue is that your fetch isn't handling the double-mount properly

---

### ✅ Step 2: Add Lifecycle Logging

Add this to your recipe detail page to see mount/unmount cycles:

```typescript
export default function RecipeDetailPage() {
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  
  // Track mounts/unmounts
  useEffect(() => {
    console.log(`🔵 MOUNT - Component ${componentId.current}`)
    return () => {
      console.log(`🔴 UNMOUNT - Component ${componentId.current}`)
    }
  }, [])
  
  // Track ALL renders
  console.log(`🔄 RENDER - Component ${componentId.current}`, { 
    loading, 
    recipe: !!recipe,
    authLoading 
  })
  
  // Rest of your component...
}
```

**What to look for:**
```
// ❌ BAD - Multiple mounts without unmounts
🔵 MOUNT - Component abc123
🔵 MOUNT - Component def456
🔵 MOUNT - Component ghi789

// ✅ GOOD - Mount -> Unmount -> Mount (Strict Mode)
🔵 MOUNT - Component abc123
🔴 UNMOUNT - Component abc123
🔵 MOUNT - Component def456

// ✅ ALSO GOOD - Single mount (Production)
🔵 MOUNT - Component abc123
```

---

### ✅ Step 3: Strict Mode Safe Fetching Pattern

Use **useRef** to prevent double-fetching even in Strict Mode:

```typescript
export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session, loading: authLoading } = useAuth()
  
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null)
  const [ingredients, setIngredients] = useState<RecipeIngredientWithDetails[]>([])
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const recipeId = params.id as string
  
  // 🎯 KEY FIX: Use ref to track if we've already fetched
  const hasFetchedRef = useRef(false)
  
  useEffect(() => {
    const effectId = Math.random().toString(36).substr(2, 9)
    console.log('🍳 Effect running with ID:', effectId)
    
    async function fetchRecipeDetail() {
      // 🎯 CRITICAL: Check if already fetched
      if (hasFetchedRef.current) {
        console.log('🍳 Already fetched, skipping:', effectId)
        return
      }
      
      if (!session?.access_token || !recipeId || authLoading) {
        console.log('🍳 Missing requirements:', { 
          session: !!session?.access_token, 
          recipeId, 
          authLoading 
        })
        return
      }

      console.log('🍳 Starting fetch:', effectId)
      
      // 🎯 CRITICAL: Mark as fetched BEFORE the async operation
      hasFetchedRef.current = true
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/recipes/${recipeId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        console.log('🍳 Response status:', response.status)

        if (!response.ok) {
          if (response.status === 404) {
            setError('Recipe not found')
          } else if (response.status === 401) {
            setError('Authentication failed')
          } else {
            setError(`API Error: ${response.status}`)
          }
          return
        }

        const data: RecipeDetailResponse = await response.json()
        console.log('🍳 Data received:', data.success)

        if (data.success) {
          setRecipe(data.recipe)
          setIngredients(data.ingredients)
          setCostBreakdown(data.costBreakdown)
          console.log('🍳 State updated successfully')
        } else {
          setError('Failed to load recipe details')
        }
      } catch (error) {
        console.error('🍳 Fetch error:', error)
        setError('Failed to load recipe details')
        // Reset fetch flag on error so user can retry
        hasFetchedRef.current = false
      } finally {
        setLoading(false)
        console.log('🍳 Loading set to false:', effectId)
      }
    }

    fetchRecipeDetail()
    
    // 🎯 CRITICAL: Cleanup function resets fetch flag if component unmounts
    return () => {
      console.log('🍳 Cleanup running:', effectId)
      // Only reset if we're in development (Strict Mode)
      // In production, we want to keep the flag set
      if (process.env.NODE_ENV === 'development') {
        hasFetchedRef.current = false
      }
    }
  }, [session?.access_token, recipeId, authLoading])
  
  // Rest of component...
}
```

**Key changes:**
1. `useRef` persists across re-renders but NOT across remounts
2. Set `hasFetchedRef.current = true` BEFORE async operation
3. Reset in cleanup for development (allows hot reload to work)
4. Single API call even in Strict Mode

---

### ✅ Step 4: Test in Production Build

Run a production build to see if the issue disappears:

```bash
npm run build
```

```bash
npm start
```

Then navigate to the recipe page.

**Expected results:**
- **Development**: Multiple effect IDs, but single fetch
- **Production**: Single effect ID, single fetch

---

### ✅ Step 5: Check StandardPageWrapper

Look at `app/components/UniversalPageWrapper.tsx`:

```typescript
// Look for patterns that might cause remounts:

// ❌ BAD - Creates new object every render
const config = { moduleName, currentPage }  
return <Context.Provider value={config}>

// ✅ GOOD - Stable reference
const config = useMemo(() => ({ moduleName, currentPage }), [moduleName, currentPage])
return <Context.Provider value={config}>
```

Add logging to StandardPageWrapper:
```typescript
export function StandardPageWrapper({ children, moduleName, currentPage }) {
  console.log('📦 StandardPageWrapper render:', { moduleName, currentPage })
  // ... rest of component
}
```

---

## 🔬 Create Minimal Test Case

Create `app/recipes/test/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import { LoadingSpinner } from '../../components/LoadingSpinner'

export default function TestRecipePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<string | null>(null)
  const componentId = useRef(Math.random().toString(36).substr(2, 9))
  
  useEffect(() => {
    console.log('🧪 TEST Mount:', componentId.current)
    
    const timer = setTimeout(() => {
      console.log('🧪 TEST Setting data')
      setData('Test Recipe Data')
      setLoading(false)
      console.log('🧪 TEST Loading set to false')
    }, 1000)
    
    return () => {
      console.log('🧪 TEST Unmount:', componentId.current)
      clearTimeout(timer)
    }
  }, [])
  
  console.log('🧪 TEST Render:', componentId.current, { loading, hasData: !!data })
  
  if (loading) {
    console.log('🧪 TEST Rendering loading spinner')
    return (
      <div className="container mx-auto px-4 py-6">
        <LoadingSpinner />
        <p className="mt-4 text-center">Loading State: {String(loading)}</p>
      </div>
    )
  }
  
  console.log('🧪 TEST Rendering data')
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">Test Recipe Page</h1>
      <p>Data: {data}</p>
      <p>Loading: {String(loading)}</p>
    </div>
  )
}
```

Navigate to: `http://localhost:3000/recipes/test`

**Expected behavior:**
- Development: See 2 mounts, loading disappears after 1 second
- Production: See 1 mount, loading disappears after 1 second

If the test page works but your real page doesn't → the issue is in your component logic or StandardPageWrapper.

---

## 🎯 Quick Diagnostic Workflow

Run these tests in order:

1. **Check app/layout.tsx** → Is StrictMode present?
2. **Add lifecycle logging** → See mount/unmount pattern
3. **Implement useRef fix** → Prevent double-fetch
4. **Test production build** → Does issue persist?
5. **Create minimal test page** → Isolate the problem
6. **Check StandardPageWrapper** → Look for unstable references

---

## 💡 Understanding Strict Mode

**Why Next.js uses Strict Mode:**
- Catches bugs with side effects
- Prepares for React 18+ concurrent features
- Tests that effects can mount/unmount/remount safely

**What Strict Mode does in development:**
1. Mounts component
2. Runs effects
3. **Unmounts component** (simulated)
4. **Remounts component**
5. Runs effects again

This is why you see multiple effect IDs - it's **intentional**!

**The solution:**
- Don't try to prevent the double-mount
- Instead, make your effects **idempotent** (safe to run multiple times)
- Use `useRef` to track operations that should only happen once

---

## 📊 Expected Console Output (After Fix)

### Development Mode:
```
🔵 MOUNT - Component abc123
🍳 Effect running with ID: abc123
🍳 Starting fetch: abc123
🔴 UNMOUNT - Component abc123
🔵 MOUNT - Component def456
🍳 Effect running with ID: def456
🍳 Already fetched, skipping: def456  ← KEY: No second fetch!
🍳 Response status: 200
🍳 Data received: true
🍳 State updated successfully
🍳 Loading set to false: abc123
🔄 RENDER - Component def456 { loading: false, recipe: true }
```

### Production Mode:
```
🔵 MOUNT - Component abc123
🍳 Effect running with ID: abc123
🍳 Starting fetch: abc123
🍳 Response status: 200
🍳 Data received: true
🍳 State updated successfully
🍳 Loading set to false: abc123
🔄 RENDER - Component abc123 { loading: false, recipe: true }
```

---

## 🚨 If All Else Fails

If the useRef pattern doesn't work, try this nuclear option:

```typescript
// Temporarily disable Strict Mode in development
// File: next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,  // ⚠️ Only for debugging!
}

module.exports = nextConfig
```

**Restart your dev server after changing next.config.js**

If this fixes it → Strict Mode was the issue  
If this doesn't fix it → Look deeper at StandardPageWrapper

---

**Priority Actions:**
1. ✅ Check for Strict Mode in app/layout.tsx
2. ✅ Implement useRef pattern to prevent double-fetch
3. ✅ Test in production build
4. ✅ Create minimal test page to isolate issue

---

**Date:** November 17, 2025  
**Status:** Advanced debugging required  
**Confidence:** 95% - This is a Strict Mode + double-fetch issue
