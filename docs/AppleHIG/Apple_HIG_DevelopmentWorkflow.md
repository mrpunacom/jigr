# Apple HIG Development Workflow
## Step-by-Step Checklist for JiGR Feature Development

---

## 🎯 PRE-DEVELOPMENT PHASE

### 1. FEATURE PLANNING
```
□ Define the primary user task this feature solves
□ Identify the core content (what users care about most)
□ List all required user interactions
□ Sketch basic flow (Entry → Action → Result)
□ Identify Apple components that fit the pattern
□ Plan for error states and edge cases
```

**Questions to Answer:**
- What's the one thing users need to accomplish?
- Does Apple have a standard pattern for this?
- What's the shortest path to task completion?
- Where could users get confused or stuck?

---

## 📝 DESIGN PHASE

### 2. COMPONENT SELECTION
```
□ Check if standard iOS component exists
□ Review Apple HIG for this component type
□ Identify required states (default, active, disabled, loading, error)
□ Plan touch target sizes (44pt × 44pt minimum)
□ Consider keyboard alternatives (iPad)
```

**Standard Components to Consider First:**
- Buttons (Primary, Secondary, Text)
- Lists (Plain, Grouped, Inset Grouped)
- Text Fields (with appropriate keyboard)
- Switches (for binary choices)
- Navigation Bar
- Tab Bar
- Sheets/Modals (for focused tasks)
- Alerts (for critical decisions)

### 3. LAYOUT PLANNING
```
□ Identify page type (List, Detail, Form, Dashboard)
□ Plan visual hierarchy (Primary → Secondary → Tertiary)
□ Define spacing system (4pt, 8pt, 12pt, 16pt, 20pt, 24pt)
□ Plan for both portrait and landscape orientations
□ Consider multitasking on iPad (Split View)
□ Respect safe areas (nav bar, tab bar, notches)
```

**Layout Templates:**
```
List Page:     Nav Bar → Search → List → Tab Bar
Detail Page:   Nav Bar → Hero Content → Details → Actions → Tab Bar
Form Page:     Nav Bar → Scrollable Fields → Submit Button
Dashboard:     Nav Bar → Cards/Stats → Quick Actions → Tab Bar
```

### 4. TYPOGRAPHY & COLOR
```
□ Choose font sizes from standard scale (11pt, 15pt, 17pt, 20pt, 28pt, 34pt)
□ Select font weights (Regular, Semibold, Bold)
□ Plan text hierarchy (Title → Body → Caption)
□ Choose colors from iOS palette or define semantic colors
□ Verify 4.5:1 contrast ratio minimum
□ Plan both light and dark mode colors
```

**Typography Hierarchy Template:**
```
Page Title:          34pt Bold
Section Heading:     20pt Semibold
Card/Item Title:     17pt Semibold
Body Text:           15pt Regular
Secondary Info:      13pt Regular
Caption:             12pt Regular
```

---

## 💻 DEVELOPMENT PHASE

### 5. SETUP COMPONENT STRUCTURE
```
□ Create component file with PascalCase naming
□ Import required dependencies (styled-components, React)
□ Define styled components
□ Set up state management (useState, useContext)
□ Add prop types/TypeScript interfaces
```

**Component Boilerplate:**
```jsx
// components/[ComponentName].jsx
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  // Styles here
`;

const [ComponentName] = ({ prop1, prop2, ...props }) => {
  const [state, setState] = React.useState(initialState);
  
  return (
    <Container {...props}>
      {/* Component content */}
    </Container>
  );
};

export default [ComponentName];
```

### 6. IMPLEMENT TOUCH TARGETS
```
□ Set min-width: 44pt
□ Set min-height: 44pt
□ Add padding for visual comfort (typically 12pt-20pt)
□ Test with actual finger on device
□ Ensure 8pt minimum spacing between targets
```

**Touch Target Template:**
```css
.interactive-element {
  min-width: 44pt;
  min-height: 44pt;
  padding: 12pt 20pt; /* Visual comfort */
  
  /* Remove iOS tap flash */
  -webkit-tap-highlight-color: transparent;
  
  /* Improve responsiveness */
  touch-action: manipulation;
}
```

### 7. ADD VISUAL FEEDBACK
```
□ Implement default state styling
□ Add :active state (opacity 0.7 or background change)
□ Add :disabled state (opacity 0.4)
□ Add :focus-visible for keyboard navigation
□ Ensure transition is smooth (0.15s ease)
```

**Feedback Template:**
```css
.button {
  transition: opacity 0.15s ease;
  
  &:active {
    opacity: 0.7;
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 3px solid rgba(0, 122, 255, 0.5);
    outline-offset: 2px;
  }
}
```

### 8. IMPLEMENT LOADING STATES
```
□ Add loading state to component
□ Show spinner for indeterminate operations
□ Show progress bar for determinate operations
□ Disable interaction during loading
□ Provide "Cancel" option if appropriate
```

**Loading State Pattern:**
```jsx
const Button = ({ onClick, loading, children }) => {
  return (
    <StyledButton 
      onClick={onClick} 
      disabled={loading}
    >
      {loading ? <Spinner /> : children}
    </StyledButton>
  );
};
```

### 9. IMPLEMENT ERROR STATES
```
□ Design error message layout
□ Use red color for errors (rgb(255, 59, 48))
□ Provide clear, actionable error text
□ Include recovery action (Retry button)
□ Log errors for debugging
```

**Error State Pattern:**
```jsx
{error && (
  <ErrorContainer>
    <ErrorIcon />
    <ErrorMessage>{error.message}</ErrorMessage>
    <RetryButton onClick={handleRetry}>Try Again</RetryButton>
  </ErrorContainer>
)}
```

### 10. ADD ACCESSIBILITY
```
□ Add aria-label to all interactive elements
□ Add alt text to all images
□ Use semantic HTML (button, nav, main, etc.)
□ Ensure proper heading hierarchy (h1 → h2 → h3)
□ Add role attributes where needed
□ Support keyboard navigation
```

**Accessibility Checklist:**
```jsx
// Good example
<button 
  onClick={handleSave}
  aria-label="Save document"
  disabled={!canSave}
>
  Save
</button>

// Image with alt text
<img 
  src={deliveryImage} 
  alt="Delivery docket showing temperature reading of 3°C"
/>

// List with proper semantics
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/console">Console</a></li>
  </ul>
</nav>
```

---

## 🧪 TESTING PHASE

### 11. VISUAL TESTING
```
□ Test on actual iPad Air (2013)
□ Test in Safari 12 browser
□ Test in portrait orientation
□ Test in landscape orientation
□ Test at various content lengths
□ Check spacing and alignment
□ Verify colors match design
```

**Visual Test Checklist:**
- [ ] Component renders correctly
- [ ] Touch targets are clearly visible
- [ ] Text is legible (not too small)
- [ ] Colors have sufficient contrast
- [ ] Layout doesn't break with long text
- [ ] No overlapping elements

### 12. INTERACTION TESTING
```
□ Tap all buttons (verify 44pt target)
□ Test all gestures (tap, long-press, swipe)
□ Verify visual feedback on touch
□ Test disabled states (shouldn't respond)
□ Test loading states (show spinner)
□ Test error states (show error message)
□ Verify forms prevent submission when invalid
```

**Interaction Test Script:**
1. Tap each button → Should show immediate visual feedback
2. Tap disabled button → Should do nothing
3. Submit form with invalid data → Should show error
4. Trigger loading state → Should show spinner, disable interaction
5. Swipe list items → Should reveal actions (if applicable)

### 13. ACCESSIBILITY TESTING
```
□ Enable VoiceOver (Settings → Accessibility)
□ Navigate entire feature with VoiceOver
□ Verify all elements are announced correctly
□ Test with keyboard only (iPad external keyboard)
□ Check tab order is logical
□ Verify focus indicators are visible
□ Test with "Reduce Motion" enabled
□ Test with "Increase Contrast" enabled
```

**VoiceOver Test Script:**
1. Turn on VoiceOver
2. Swipe through all interactive elements
3. Verify labels are clear and descriptive
4. Double-tap to activate elements
5. Navigate forms and verify field labels
6. Check error messages are announced

### 14. RESPONSIVE TESTING
```
□ Test at minimum viewport (iPad in Split View 1/3)
□ Test at maximum viewport (iPad full screen landscape)
□ Verify content adapts gracefully
□ Check safe areas are respected
□ Test with largest Dynamic Type size
□ Verify text doesn't overflow containers
```

**Dynamic Type Test:**
```
1. Settings → Display & Brightness → Text Size
2. Move slider to largest size
3. Open app and navigate to feature
4. Verify all text scales appropriately
5. Check buttons still work (not too small)
6. Ensure no text is cut off
```

### 15. PERFORMANCE TESTING
```
□ Test on actual iPad Air (2013) hardware
□ Verify animations are smooth (not janky)
□ Check load times are acceptable (<2 seconds)
□ Test with slow network (throttle to 3G)
□ Monitor memory usage (avoid leaks)
□ Test with large datasets
□ Verify images load progressively
```

**Performance Benchmarks:**
- Initial load: < 2 seconds
- Navigation: < 500ms
- Animations: 60fps (no frame drops)
- Touch response: < 100ms
- Image optimization: < 100KB per image

---

## 🎨 POLISH PHASE

### 16. REFINE ANIMATIONS
```
□ Use standard durations (0.2s quick, 0.3s standard, 0.4s slow)
□ Use ease or ease-in-out easing
□ Respect "Reduce Motion" setting
□ Ensure animations serve a purpose
□ Don't animate if not necessary
□ Test animations feel natural
```

**Animation Guidelines:**
```css
/* Quick transitions (buttons, highlights) */
transition: opacity 0.15s ease;

/* Standard transitions (modals, reveals) */
transition: transform 0.3s ease;

/* Slow transitions (complex layouts) */
transition: all 0.4s ease-in-out;

/* Respect Reduce Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01s !important;
    transition-duration: 0.01s !important;
  }
}
```

### 17. ADD HAPTIC FEEDBACK (Optional)
```
□ Identify key interactions that benefit from haptics
□ Use light haptic for selections
□ Use medium haptic for confirmations
□ Use heavy haptic for errors
□ Don't overuse haptics (becomes annoying)
```

**Haptic Patterns:**
```javascript
// Light - navigating items
navigator.vibrate(10);

// Medium - action completed
navigator.vibrate(20);

// Heavy - error or important event
navigator.vibrate([10, 30, 10]);

// Success pattern
navigator.vibrate([10, 50, 10]);
```

### 18. OPTIMIZE ASSETS
```
□ Compress images (< 100KB each)
□ Provide @2x images only (iPad Air 2013)
□ Use WebP where supported (not Safari 12)
□ Use SVG for icons (scalable, small file size)
□ Lazy load images below fold
□ Implement progressive image loading
```

**Asset Optimization Checklist:**
- [ ] Images compressed to < 100KB
- [ ] @2x retina images provided
- [ ] SVG icons inline for critical UI
- [ ] Lazy loading implemented
- [ ] Placeholder loading state shown

---

## 📋 PRE-LAUNCH CHECKLIST

### 19. FINAL VERIFICATION
```
□ Feature works as intended on target device
□ All interactions provide visual feedback
□ All text is legible (minimum 11pt)
□ All touch targets meet 44pt × 44pt minimum
□ All colors meet 4.5:1 contrast ratio
□ VoiceOver announces everything correctly
□ Feature works in both light and dark mode
□ Feature respects "Reduce Motion" setting
□ Loading states show for operations > 2s
□ Error states provide clear recovery path
□ Safe areas are respected (no clipping)
□ Feature works in portrait and landscape
□ Feature adapts to iPad Split View
□ No console errors or warnings
□ Performance is acceptable on target hardware
```

### 20. CODE QUALITY CHECK
```
□ Code follows PascalCase naming convention
□ Components are properly documented
□ No hardcoded magic numbers (use constants)
□ No TODO comments left in code
□ PropTypes or TypeScript types defined
□ Unused imports removed
□ Console.logs removed
□ Code is DRY (no repetition)
□ Functions are small and focused
□ Components are reusable
```

### 21. DOCUMENTATION
```
□ Component usage documented
□ Props/parameters explained
□ Edge cases documented
□ Accessibility notes included
□ Known limitations listed
□ Examples provided
```

**Documentation Template:**
```jsx
/**
 * IOSButton - Standard iOS-style button component
 * 
 * @param {string} children - Button text
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Disable button
 * @param {boolean} loading - Show loading spinner
 * @param {string} variant - 'primary' | 'secondary' | 'destructive'
 * 
 * Accessibility:
 * - Meets 44pt × 44pt touch target requirement
 * - Provides visual feedback on touch
 * - Supports keyboard navigation
 * - Has proper aria-label
 * 
 * Usage:
 * <IOSButton 
 *   onClick={handleSave} 
 *   loading={isSaving}
 *   variant="primary"
 * >
 *   Save Document
 * </IOSButton>
 */
```

---

## 🚀 DEPLOYMENT CHECKLIST

### 22. PRE-DEPLOYMENT
```
□ All tests passing
□ No linting errors
□ Build succeeds without warnings
□ Feature flag implemented (if needed)
□ Rollback plan documented
□ Monitoring/logging in place
```

### 23. POST-DEPLOYMENT
```
□ Monitor error logs
□ Check performance metrics
□ Gather user feedback
□ Fix critical bugs immediately
□ Document lessons learned
```

---

## 🔄 ITERATION CHECKLIST

### 24. USER FEEDBACK REVIEW
```
□ Collect feedback from actual users
□ Identify pain points
□ List suggested improvements
□ Prioritize changes
□ Plan iteration
```

**Questions to Ask:**
- Is the feature easy to discover?
- Is the flow intuitive?
- Are users getting stuck anywhere?
- Is the feature fast enough?
- Are error messages clear?

### 25. ANALYTICS REVIEW
```
□ Check feature usage metrics
□ Identify drop-off points
□ Monitor error rates
□ Track completion rates
□ Measure performance
```

---

## 📚 QUICK DECISION TREES

### "Should I use a Modal or Sheet?"
```
Use Modal (Alert) when:
├─ Critical decision required
├─ 1-2 button choices
└─ Brief message (< 3 lines)

Use Sheet when:
├─ Form input needed
├─ Multiple options to show
├─ Content longer than 3 lines
└─ User might want to swipe to dismiss
```

### "What Button Style?"
```
Primary (Filled):
└─ Most important action, 1 per screen

Secondary (Outlined):
└─ Alternative action, secondary importance

Text Button:
└─ Least important, navigation, cancels

Destructive (Red):
└─ Dangerous action (delete, remove)
```

### "List or Cards?"
```
Use List when:
├─ Showing many items (>10)
├─ Items are similar type
├─ Quick scanning needed
└─ Standard iOS pattern applies

Use Cards when:
├─ Showing few items (<10)
├─ Items are different types
├─ Each needs visual distinction
└─ More visual emphasis desired
```

---

## 🎯 JIGR-SPECIFIC CONSIDERATIONS

### HOSPITALITY CONTEXT CHECKS
```
□ Task can be completed in < 30 seconds
□ Works with wet/gloved hands (larger targets)
□ High contrast for bright kitchen environment
□ Minimal steps to completion
□ Offline capability considered
□ Fast loading even on slow WiFi
□ Can be interrupted and resumed
```

### COMPLIANCE FOCUS (DISGUISED)
```
□ Feature feels helpful, not regulatory
□ Language is positive and actionable
□ Benefits are clear to user
□ No compliance jargon
□ "Helping you succeed" not "keeping you compliant"
```

### BUDGET-CONSCIOUS OPERATORS
```
□ Feature provides clear value
□ Saves time (quantify if possible)
□ Reduces errors/waste
□ Simple to learn (minimal training)
□ Doesn't require additional hardware
```

---

## 📱 DEVICE-SPECIFIC FINAL CHECKS

### iPad Air (2013) - Safari 12 Specific
```
□ Tested on actual device (not simulator)
□ Works in Safari 12 browser
□ No modern CSS that Safari 12 doesn't support
□ @2x retina images provided (not @3x)
□ Performance acceptable on older hardware
□ Battery consumption reasonable
□ No memory leaks
□ Touch ID patterns used (not Face ID)
```

**Safari 12 Compatibility Check:**
```css
/* Avoid these in Safari 12 */
❌ CSS Grid (limited support)
❌ CSS Variables in media queries
❌ backdrop-filter (requires -webkit prefix)
❌ Flexbox gap property

/* Use these instead */
✅ Flexbox (full support)
✅ CSS Variables (basic support)
✅ -webkit-backdrop-filter (prefixed version)
✅ Margin for spacing
```

---

## 🏁 SIGN-OFF CHECKLIST

### Before Marking Feature "COMPLETE"
```
✅ Feature works on iPad Air (2013)
✅ Feature works in Safari 12
✅ All touch targets ≥ 44pt × 44pt
✅ All text ≥ 11pt font size
✅ All colors meet 4.5:1 contrast
✅ VoiceOver works correctly
✅ Both light & dark mode work
✅ "Reduce Motion" respected
✅ Loading states implemented
✅ Error states implemented
✅ Safe areas respected
✅ Works in portrait & landscape
✅ Works in iPad Split View
✅ Performance acceptable
✅ No console errors
✅ Code reviewed
✅ Documentation complete
✅ User tested
✅ Analytics in place
✅ Rollback plan ready
```

**Definition of Done:**
1. ✅ Builds without errors
2. ✅ All tests pass
3. ✅ Meets accessibility standards
4. ✅ Works on target device
5. ✅ User feedback is positive
6. ✅ Performance meets benchmarks
7. ✅ Documentation complete
8. ✅ Ready for production

---

## 💡 REMEMBER

**The Golden Rules:**
1. If it feels un-Apple-like, it probably is
2. When in doubt, use the standard component
3. 44pt × 44pt minimum - no exceptions
4. Test on actual device - simulator lies
5. Accessibility is not optional
6. Clarity beats cleverness every time
7. Fast feels better than fancy
8. Users should never wonder "what now?"

**Steve's Mantra for JiGR:**
> "Built by a restaurateur, for restaurateurs.  
> Simple, fast, reliable.  
> Feels like it belongs on an iPad."

---

*Development Workflow v1.0 | For JiGR Development | Claude Code Reference*
