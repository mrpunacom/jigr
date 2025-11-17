# Apple HIG Quick Reference Card
## Ultra-Fast Lookup for Claude Code

---

## ⚡ INSTANT CHECKS

### Component Sizing
```
Touch Target:        44pt × 44pt minimum
Button Height:       44pt minimum (48pt ideal)
Text Field Height:   44pt minimum
Tab Bar Height:      49pt (iPhone), 50pt (iPad)
Nav Bar Height:      44pt (iPhone), 50pt (iPad)
List Row Height:     44pt minimum (52-60pt comfortable)
```

### Spacing Scale
```
4pt   8pt   12pt   16pt   20pt   24pt   32pt
│     │     │      │      │      │      │
Tight Small Medium Standard Large XL   Max
```

### Typography Scale
```
11pt  = Minimum readable (accessibility requirement)
12pt  = Caption, secondary info
15pt  = Body text standard
17pt  = Heading small, button labels
20pt  = Heading medium
28pt  = Heading large
34pt  = Large title (nav bar)
```

### Font Weights
```
300 = Light      (secondary content)
400 = Regular    (body text)
500 = Medium     (subtle emphasis)
600 = Semibold   (headings)
700 = Bold       (strong emphasis, CTAs)
```

### Color Contrast
```
WCAG AA:  4.5:1 minimum for normal text
WCAG AA:  3:1 minimum for large text (18pt+)
WCAG AAA: 7:1 ratio (preferred for important content)
```

---

## 🎯 MUST-HAVE CHECKLIST

Every Component Must Have:
- [ ] Minimum 44pt × 44pt touch target
- [ ] Default state
- [ ] Highlighted state (on touch)
- [ ] Disabled state (when applicable)
- [ ] VoiceOver label
- [ ] Dynamic Type support
- [ ] Light mode styling
- [ ] Dark mode styling
- [ ] Visual feedback (instant on touch)

---

## 🚫 NEVER DO THIS

❌ Touch target < 44pt × 44pt
❌ Text contrast < 4.5:1 ratio
❌ Color-only indicators (add icon/text)
❌ Missing VoiceOver labels
❌ No visual feedback on tap
❌ Font size < 11pt
❌ Ignore Dynamic Type
❌ Stack modals on modals
❌ Custom gestures without button alternatives
❌ Animation without "Reduce Motion" fallback

---

## ✅ ALWAYS DO THIS

✅ 44pt × 44pt minimum touch targets
✅ Immediate visual feedback on tap
✅ Support Dynamic Type
✅ 4.5:1+ contrast ratio
✅ VoiceOver labels on all interactive elements
✅ Loading states for operations > 2 seconds
✅ Clear error messages (not just "Error")
✅ System fonts (San Francisco)
✅ Test on actual device
✅ Respect safe areas

---

## 📱 SAFARI 12 / IPAD AIR (2013) SPECIFICS

### CSS Must-Haves
```css
/* System Font Stack */
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;

/* Remove tap highlight */
-webkit-tap-highlight-color: transparent;

/* Safe Area Support */
padding: env(safe-area-inset-top) env(safe-area-inset-right) 
         env(safe-area-inset-bottom) env(safe-area-inset-left);

/* Touch Action */
touch-action: manipulation; /* Prevents 300ms delay */

/* Smooth Scrolling */
-webkit-overflow-scrolling: touch;
```

### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1, 
      maximum-scale=1, user-scalable=no, viewport-fit=cover">
```

### Resolution Specifics
```
Physical:  2048 × 1536 pixels
Logical:   1024 × 768 points
Ratio:     @2x Retina (2.0)
PPI:       264
```

---

## 🎨 SYSTEM COLORS (iOS)

```css
/* Primary Actions */
--ios-blue:    rgb(0, 122, 255);
--ios-green:   rgb(52, 199, 89);
--ios-red:     rgb(255, 59, 48);
--ios-orange:  rgb(255, 149, 0);
--ios-yellow:  rgb(255, 204, 0);
--ios-purple:  rgb(175, 82, 222);
--ios-teal:    rgb(90, 200, 250);

/* Semantic Usage */
Primary Action:      Blue
Success:            Green
Error/Destructive:  Red
Warning:            Orange
Highlight:          Yellow
```

---

## 🔄 COMMON PATTERNS

### Button States
```css
.button {
  /* Default */
  background: var(--ios-blue);
  opacity: 1;
}
.button:active {
  /* Highlighted (on touch) */
  opacity: 0.7;
}
.button:disabled {
  /* Disabled */
  opacity: 0.4;
  cursor: not-allowed;
}
```

### List Cell
```html
<div class="cell" style="
  min-height: 44pt;
  padding: 12pt 16pt;
  display: flex;
  align-items: center;
  border-bottom: 0.5px solid rgba(0,0,0,0.1);
">
  <div class="cell-content">Title</div>
  <div class="cell-chevron">›</div>
</div>
```

### Loading State
```html
<!-- Indeterminate (unknown duration) -->
<div class="spinner"></div>

<!-- Determinate (known duration) -->
<progress value="50" max="100"></progress>

<!-- Skeleton (content placeholder) -->
<div class="skeleton-loader"></div>
```

---

## ⚡ PERFORMANCE TIPS

### Asset Optimization
```
Images:     WebP format (Safari 12 doesn't support, use JPEG/PNG)
Icons:      Inline SVG or Icon Font
Retina:     Provide @2x only (not @3x for iPad Air 2013)
Size:       Compress images to < 100KB each
Lazy Load:  Images below fold
```

### CSS Performance
```css
/* GPU Acceleration */
transform: translateZ(0);
will-change: transform; /* Use sparingly */

/* Avoid */
box-shadow: heavy /* Use sparingly, GPU intensive */
filter: blur()    /* Very GPU intensive on old devices */
```

---

## 🧪 TESTING PROTOCOL

### Must Test
1. **On Actual iPad Air (2013)** - No substitutes
2. **Safari 12** - Specific browser target
3. **Both Orientations** - Portrait and landscape
4. **All Dynamic Type Sizes** - Especially largest
5. **Light and Dark Mode** - Both themes
6. **VoiceOver Enabled** - Accessibility check
7. **Reduce Motion On** - Disable animations
8. **Slow Network** - Test loading states

### Quick Test Checklist
- [ ] Tap all buttons (check 44pt target)
- [ ] Read all text (check 11pt minimum)
- [ ] Check contrast (use browser inspector)
- [ ] Navigate with VoiceOver
- [ ] Test at largest text size
- [ ] Rotate device
- [ ] Check in dark mode
- [ ] Verify safe areas respected

---

## 📐 LAYOUT TEMPLATES

### Standard Screen Layout
```
┌─────────────────────────────┐
│  Nav Bar (50pt)             │ ← Safe area top
├─────────────────────────────┤
│                             │
│                             │
│  Content Area               │
│  (scrollable)               │
│                             │
│                             │
├─────────────────────────────┤
│  Tab Bar (50pt)             │ ← Safe area bottom
└─────────────────────────────┘

Margins: 20pt left/right (iPad)
```

### Form Layout
```
┌─────────────────────────────┐
│  Label (17pt semibold)      │
│  ┌───────────────────────┐  │
│  │ Input Field (44pt)    │  │ ← 44pt height
│  └───────────────────────┘  │
│  Helper text (12pt gray)    │
│                             │
│  [Spacing: 20pt]            │
│                             │
│  Next Label...              │
└─────────────────────────────┘
```

### Card Layout
```
┌─────────────────────────────┐
│  Card (rounded 12pt)        │
│  ┌───────────────────────┐  │
│  │ Padding: 16pt         │  │
│  │                       │  │
│  │ Title (17pt semibold) │  │
│  │ Body (15pt regular)   │  │
│  │                       │  │
│  │ [Button (44pt)]       │  │
│  └───────────────────────┘  │
│  [Spacing: 16pt]            │
│  Next Card...               │
└─────────────────────────────┘
```

---

## 🎯 JIGR-SPECIFIC REMINDERS

### Hospitality Context
- Keep interfaces **simple and quick** (busy restaurant environment)
- **Large touch targets** (gloves, wet hands)
- **High contrast** (bright kitchen lighting)
- **Fast loading** (potentially spotty WiFi)
- **Offline-capable** where possible

### User Profile
- **Budget-conscious** operators
- **Minimal tech training** assumed
- **Time-sensitive** tasks (during service)
- **Compliance-focused** (but disguise this)

### Device Constraints
- **iPad Air 2013** - older hardware
- **Safari 12** - limited features
- **No Face ID** - Touch ID patterns only
- **Home button device** - traditional navigation

---

## 📱 CODE SNIPPETS

### Responsive Touch Target
```jsx
const Button = styled.button`
  /* Minimum touch target */
  min-width: 44pt;
  min-height: 44pt;
  
  /* Remove iOS tap highlight */
  -webkit-tap-highlight-color: transparent;
  
  /* Improve touch responsiveness */
  touch-action: manipulation;
  
  /* Visual feedback */
  transition: opacity 0.15s ease;
  
  &:active {
    opacity: 0.7;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
```

### Dynamic Type Support
```css
/* Use relative units */
.body-text {
  font-size: 1rem; /* 15pt base */
}

/* Use text-size-adjust */
body {
  -webkit-text-size-adjust: 100%;
}

/* Support user zoom */
<meta name="viewport" content="width=device-width, 
      initial-scale=1, maximum-scale=3">
```

### Safe Area Handling
```css
.container {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}

/* With fallback for older browsers */
.container {
  padding: 20px; /* fallback */
  padding: env(safe-area-inset-top, 20px) 
           env(safe-area-inset-right, 20px)
           env(safe-area-inset-bottom, 20px) 
           env(safe-area-inset-left, 20px);
}
```

---

## 🔍 DEBUGGING TIPS

### Visual Touch Target Check
```javascript
// Add this to see all touch targets
document.querySelectorAll('button, a, input').forEach(el => {
  const rect = el.getBoundingClientRect();
  if (rect.width < 44 || rect.height < 44) {
    el.style.border = '2px solid red';
    console.warn('Touch target too small:', el);
  }
});
```

### Contrast Ratio Check
```javascript
// Browser DevTools > Elements > Computed > 
// Look for "contrast ratio" warning in color picker
```

### VoiceOver Quick Test
```
Enable: Settings > Accessibility > VoiceOver
Navigate: Swipe right/left
Activate: Double-tap
Hint: Triple-tap with two fingers (help)
```

---

## 💡 FINAL REMINDERS

**When in doubt:**
1. Check if Apple has a standard component (probably yes)
2. Use that component (don't reinvent)
3. Test on actual device (simulator lies)
4. Follow the 44pt rule (always)
5. Support Dynamic Type (non-negotiable)
6. Provide visual feedback (instant)
7. Check accessibility (VoiceOver, contrast)

**The Golden Rule:**  
If it doesn't feel like an iOS app, users will notice and trust it less.

---

*Quick Reference v1.0 | For JiGR Development | iPad Air (2013) Safari 12 Target*
