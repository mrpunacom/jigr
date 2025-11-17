# Apple Human Interface Guidelines Protocol
## Condensed Reference for Claude Code - JiGR Development

---

## 🎯 CORE DESIGN PRINCIPLES

### 1. **CLARITY**
- Every element must be legible at a glance
- Text should be readable, icons should be precise, controls should be obvious
- Use clear visual hierarchy: important content gets priority in size, color, and position
- Minimum font size: **11pt** (critical for accessibility)
- Avoid visual clutter - if it doesn't serve the user's task, remove it

### 2. **DEFERENCE**
- Content is king - the UI should never compete with content
- Interface elements should help users understand and interact with content, not distract from it
- Use subtle, unobtrusive design elements
- Let content fill the screen, use ample white space
- Hide complexity until needed (progressive disclosure)

### 3. **DEPTH**
- Use visual layers to convey hierarchy and relationships
- Employ subtle shadows, translucency, and motion to create depth
- Help users understand spatial relationships between elements
- Use realistic motion to reinforce interactions

---

## 📐 VISUAL DESIGN FOUNDATIONS

### TYPOGRAPHY

**System Fonts**
- **Primary**: San Francisco (SF) - optimized for Apple displays
- **Alternative**: New York - for editorial/reading experiences
- Always support **Dynamic Type** - users must be able to adjust text size

**Font Size Guidelines**
```
Minimum readable size: 11pt
Body text: 15-17pt
Headings (Large): 28-34pt
Headings (Medium): 22-28pt
Headings (Small): 17-20pt
Caption/Secondary: 12-13pt
```

**Font Weight Hierarchy**
```
Ultra Light (100) - rare, decorative only
Light (300) - secondary content
Regular (400) - body text, standard
Medium (500) - subtle emphasis
Semibold (600) - headings, important info
Bold (700) - strong emphasis, CTAs
Heavy (800/900) - rare, display only
```

**Best Practices**
- Limit to 2-3 font weights per screen
- Use weight and size to create hierarchy, not multiple typefaces
- Test legibility across different screen sizes and brightness levels
- Never use italic as primary text style
- Maintain consistent line height (1.4-1.6 for body text)

### COLOR

**System Colors (iOS/iPadOS)**
```css
/* Primary System Colors */
Blue: rgb(0, 122, 255)      /* Default tint, links, primary actions */
Green: rgb(52, 199, 89)     /* Success, positive actions */
Red: rgb(255, 59, 48)       /* Errors, destructive actions */
Orange: rgb(255, 149, 0)    /* Warnings, alerts */
Yellow: rgb(255, 204, 0)    /* Caution, highlights */
Purple: rgb(175, 82, 222)   /* Special features */
Teal: rgb(90, 200, 250)     /* Alternative accents */

/* Neutral Colors */
Gray: Various shades for backgrounds and separators
Label (Text): Adapts to light/dark mode automatically
```

**Usage Rules**
- **NEVER use the same color for different meanings**
- Use color to reinforce meaning, not as the sole indicator
- Always provide text labels or icons alongside color-coded information
- Ensure 4.5:1 contrast ratio minimum (WCAG AA standard)
- Support both light and dark mode color schemes
- Use system colors when possible - they automatically adapt to accessibility settings

**Color Palette Strategy**
```
Primary: Brand/main actions (1 color)
Secondary: Supporting actions (1-2 colors)
Semantic: Success/Error/Warning (3 colors - green/red/orange)
Neutrals: Text, backgrounds, borders (grayscale palette)
```

### LAYOUT & SPACING

**Safe Areas**
- Content must respect safe areas to avoid overlap with:
  - Navigation bars (44pt height on iPhone, 50pt on iPad)
  - Tab bars (49pt on iPhone, 50pt on iPad)
  - Status bar (varies by device)
  - Rounded corners and notches
  - Home indicator (34pt bottom margin on newer devices)

**Standard Spacing System**
```
4pt  - Minimal spacing (tight elements)
8pt  - Small spacing (related items)
12pt - Medium spacing (grouped content)
16pt - Standard spacing (between sections)
20pt - Large spacing (major separators)
24pt - Extra large spacing (distinct sections)
32pt+ - Maximum spacing (page-level separation)
```

**Grid System**
- Use 8pt grid for alignment consistency
- Maintain consistent margins: 16pt (phone), 20pt (iPad portrait), 24pt+ (iPad landscape)
- Align elements to the grid for visual harmony
- Use multiples of 4pt for all dimensions

**Visual Hierarchy Rules**
```
Priority 1 (Primary Content): Largest, boldest, positioned prominently
Priority 2 (Secondary Actions): Medium size, accessible but not dominant
Priority 3 (Tertiary Info): Smallest, subtle, positioned peripherally
```

### IMAGERY & ICONS

**SF Symbols**
- Use Apple's SF Symbols library whenever possible (5000+ icons)
- Benefits: Automatically adapt to Dynamic Type, support multiple weights
- Always align icons with text baseline
- Standard icon sizes: 20pt, 24pt, 28pt (scale with text)

**Custom Icons**
- Maintain consistent stroke width across icon set
- Use simple, recognizable shapes
- Design for multiple sizes (don't just scale one size)
- Provide 2x and 3x resolutions (@2x, @3x)
- Test at small sizes for clarity

**Images**
- Use high-resolution images (2x, 3x for Retina displays)
- Optimize file sizes for performance
- Provide alt text for accessibility
- Use appropriate aspect ratios (4:3, 16:9, 1:1)

---

## 🎛️ COMPONENTS & CONTROLS

### BUTTONS

**Types**
```
Primary: Filled background, highest emphasis (CTAs)
Secondary: Outlined or text-only, medium emphasis
Tertiary: Text-only, lowest emphasis
Destructive: Red color, indicates dangerous actions
```

**Touch Targets**
- Minimum size: **44pt × 44pt** (critical for finger accuracy)
- Ideal size: 48pt × 48pt or larger
- Maintain minimum 8pt spacing between tappable elements

**States**
```css
Default: Base appearance
Highlighted: Visual feedback on touch (darken 10-15%)
Selected: Persistent selected state (if applicable)
Disabled: Reduced opacity (40-50%), no interaction
Loading: Show spinner, disable interaction
```

**Best Practices**
- Use verbs for button labels ("Save", "Delete", "Continue")
- Position primary action on the right (confirm on right, cancel on left)
- Never use more than 2 buttons side-by-side
- Make destructive actions require confirmation

### NAVIGATION

**Navigation Bar**
- Height: 44pt (iPhone), 50pt (iPad)
- Title options:
  - Large Title: 34pt, bold (scrolls away)
  - Standard Title: 17pt, semibold (fixed)
- Back button always on left with chevron
- Action buttons on right (max 2-3)

**Tab Bar**
- Height: 49pt (iPhone), 50pt (iPad)
- Position: Always at bottom on iPhone/iPad
- Items: 3-5 tabs maximum
- Icons + labels: 25-28pt icons, 10pt labels
- Active state: Tinted with primary color
- Badge: Red dot or number for notifications

**Navigation Patterns**
```
Hierarchical: Drill down through screens (Settings-style)
Flat: Switch between peer categories (Tab Bar)
Content-Driven: Navigate through content (Photos)
```

### FORM CONTROLS

**Text Fields**
- Height: 44pt minimum (for tap target)
- Always show clear button (×) when text is entered
- Use appropriate keyboard types:
  ```
  Default: Standard QWERTY
  Email: @ and . keys prominent
  Number: Numeric keypad
  Phone: Phone number pad
  URL: .com key, / key
  ```
- Provide input validation feedback in real-time
- Show character count for limited fields

**Switches**
- Standard size: 51pt × 31pt (not customizable)
- Use for binary on/off choices
- Always show current state clearly
- Tint color for "on" state

**Pickers**
- Use for selecting from predefined lists
- Wheel picker: Best for dates, times, short lists
- Menu picker: Better for longer lists (iOS 14+)
- Always show current selection

**Sliders**
- Use for selecting values from a continuous range
- Min value on left, max value on right
- Show current value if precision matters
- Consider haptic feedback at key values

### LISTS & TABLES

**Table Views**
```
Plain Style: Sections with headers, full-width cells
Grouped Style: Rounded sections, inset from edges
Inset Grouped: Modern style, card-like sections
```

**Cell Design**
- Row height: 44pt minimum (better: 52-60pt for comfort)
- Cell types:
  ```
  Basic: Title only
  Subtitle: Title + subtitle
  Right Detail: Title + right-aligned detail
  Left Detail: Left-aligned detail + title
  Custom: Fully customized layout
  ```
- Always show chevron (›) if cell is tappable
- Use swipe actions for common operations (delete, archive)

**Best Practices**
- Group related items into sections
- Use section headers sparingly (clear, concise)
- Provide search for lists over 20 items
- Show loading states for dynamic content
- Implement pull-to-refresh for updated content

### MODALS & OVERLAYS

**Modal Types**
```
Sheet: Covers part of screen, swipeable to dismiss
Full Screen: Covers entire screen, requires explicit dismiss
Popover: iPad only, anchored to button or region
Alert: Critical decisions, 1-2 action buttons maximum
Action Sheet: List of choices, includes cancel option
```

**Modal Rules**
- Always provide clear dismiss mechanism (Close button, swipe down)
- Use sparingly - modals interrupt workflow
- Never stack modals (no modal over modal)
- Keep modal content focused on single task
- Prefer sheets over full-screen on iPhone
- Use popovers on iPad for contextual choices

---

## 🔄 INTERACTION PATTERNS

### GESTURES

**Standard Gestures**
```
Tap: Primary selection (buttons, cells, items)
Double Tap: Zoom in/out (maps, images)
Long Press: Contextual actions, reordering
Swipe: Navigate between screens, delete cells
Pan: Drag items, scroll content
Pinch: Zoom in/out (images, maps)
Rotate: Rotate objects (rare, specific use cases)
```

**Gesture Guidelines**
- Always provide button alternatives for gestures
- Never require gestures for core functionality
- Show gesture hints for non-obvious interactions
- Provide haptic feedback for gesture completion
- Test gestures don't conflict with system gestures

### FEEDBACK

**Visual Feedback**
```
Immediate: Highlight on touch
In Progress: Activity indicator, progress bar
Completion: Checkmark, success message
Error: Error icon, red color, descriptive message
```

**Haptic Feedback**
```
Selection: Light tap (navigating items)
Impact: Medium bump (action completed)
Notification: Success/Warning/Error pattern
```

**Loading States**
```
Indeterminate: Spinner (unknown duration)
Determinate: Progress bar (known duration)
Skeleton: Content placeholder while loading
Pull-to-Refresh: Standard iOS pattern
```

**Feedback Principles**
- Provide immediate visual feedback for all interactions
- Use appropriate haptic feedback (don't overuse)
- Always communicate errors clearly
- Show progress for operations over 2 seconds
- Never leave users waiting without feedback

### ANIMATIONS

**Standard Durations**
```
Quick: 0.2-0.3s (button highlights, small changes)
Standard: 0.3-0.4s (screen transitions, reveals)
Slow: 0.4-0.6s (complex transitions, emphasis)
```

**Animation Principles**
- Use animations to:
  - Provide feedback
  - Indicate relationships between elements
  - Guide attention
  - Maintain continuity during transitions
- Keep animations subtle and purposeful
- Match system animation speeds
- Respect user's "Reduce Motion" accessibility setting

---

## ♿ ACCESSIBILITY REQUIREMENTS

### CRITICAL REQUIREMENTS

**Text & Readability**
- Support Dynamic Type (users can adjust text size)
- Maintain 4.5:1 contrast ratio minimum
- Never rely on color alone to convey information
- Provide text alternatives for all images
- Use clear, simple language

**Touch & Interaction**
- Minimum touch target: 44pt × 44pt
- Provide button labels, not just icons
- Support VoiceOver screen reader
- All interactive elements must be reachable
- Provide keyboard equivalents where applicable

**Visual**
- Support both Light and Dark Mode
- Reduce transparency option (increase contrast)
- Increase contrast option (higher contrast ratios)
- Differentiate without color option (patterns, icons)
- Bold text option (use semibold as default bold)

**Motion**
- Respect "Reduce Motion" setting
- Provide alternatives to parallax effects
- Avoid excessive animation
- Test with motion reduction enabled

**Hearing**
- Provide captions for video content
- Offer visual alternatives to audio alerts
- Include haptic feedback as alternative to sounds

### VOICEOVER SUPPORT

**Label Requirements**
```
Buttons: Clear action labels ("Save Document", not just "Save")
Images: Descriptive alt text ("Photo of sunset over beach")
Controls: Purpose + current state ("Volume slider, 50%")
Hints: Optional guidance ("Double tap to open")
```

**Best Practices**
- Set accessibility labels for all interactive elements
- Group related elements logically
- Provide meaningful trait information
- Test with VoiceOver enabled
- Support VoiceOver gestures

---

## 📱 iPAD-SPECIFIC CONSIDERATIONS

### LAYOUT DIFFERENCES

**Screen Real Estate**
- Utilize larger screen with multi-column layouts
- Use popovers instead of sheets/modals
- Show master-detail views (sidebar + content)
- Consider Split View and Slide Over multitasking

**Touch & Interaction**
- Controls can be positioned at screen edges (easier to reach)
- Support drag and drop between apps
- Provide toolbar with additional actions
- Consider Apple Pencil interactions where relevant

**Navigation**
- Tab bar labels rendered larger, appear beside icons
- Navigation bars slightly taller (50pt vs 44pt)
- Consider sidebar navigation for complex hierarchies
- Utilize trailing navigation for contextual actions

**Keyboard**
- Support external keyboard shortcuts
- Provide keyboard-only navigation
- Show keyboard shortcuts in interface (hold ⌘)
- Implement proper tab order

### MULTITASKING

**Safe Area Considerations**
- Don't place critical controls in center (could be obscured in Split View)
- Respect safe area insets in all orientations
- Test in all Split View configurations (1/3, 1/2, 2/3)
- Adapt layout gracefully to size changes

**Resize Adaptability**
- Implement size classes properly:
  ```
  Compact Width: iPhone-like layouts
  Regular Width: iPad full screen layouts
  ```
- Test all size class combinations
- Provide appropriate content for each size

---

## 🚨 COMMON MISTAKES TO AVOID

### DESIGN MISTAKES
❌ Using custom controls that don't match system behavior
❌ Ignoring safe areas (content hidden by navigation/tab bars)
❌ Making touch targets smaller than 44pt × 44pt
❌ Using color as the only indicator of state or meaning
❌ Overusing animations or making them too slow
❌ Creating custom navigation patterns that confuse users
❌ Hiding core functionality behind non-obvious gestures
❌ Not testing on actual devices (simulators miss critical issues)

### INTERACTION MISTAKES
❌ No visual feedback on button press
❌ No loading states for network operations
❌ Unclear error messages ("Error 500" vs "Unable to save document")
❌ Disabled buttons without explanation why
❌ Multiple modals stacked on each other
❌ Gestures that conflict with system gestures

### ACCESSIBILITY MISTAKES
❌ Not supporting Dynamic Type
❌ Missing VoiceOver labels
❌ Low contrast text (below 4.5:1 ratio)
❌ Relying only on color to convey information
❌ Not respecting "Reduce Motion" preference
❌ Touch targets smaller than 44pt × 44pt

---

## 🎨 DESIGN WORKFLOW

### STEP 1: PLAN
1. Identify primary user task
2. Sketch visual hierarchy (what's most important?)
3. Choose appropriate navigation pattern
4. List required components
5. Consider accessibility from start

### STEP 2: DESIGN
1. Start with Apple's templates (Sketch/Figma HIG templates)
2. Use system components first (customize only if needed)
3. Apply 8pt grid for alignment
4. Use SF Symbols for icons
5. Implement proper spacing system
6. Design for both light and dark modes
7. Create all interaction states (default, highlighted, disabled)

### STEP 3: PROTOTYPE
1. Add realistic content (don't use Lorem Ipsum)
2. Implement transitions and animations
3. Test gesture interactions
4. Verify touch target sizes
5. Test with Dynamic Type at various sizes

### STEP 4: VALIDATE
1. Check contrast ratios (use accessibility tools)
2. Test with VoiceOver enabled
3. Test on actual devices (multiple sizes)
4. Test in all orientations
5. Test multitasking on iPad
6. Enable "Reduce Motion" and test
7. Test with external keyboard (iPad)
8. Test in both light and dark modes

---

## 📚 QUICK REFERENCE CHECKLISTS

### BEFORE IMPLEMENTING COMPONENT
- [ ] Is this a standard component? (Use system components first)
- [ ] What are the touch target sizes? (Minimum 44pt × 44pt)
- [ ] Does it work with Dynamic Type?
- [ ] Does it provide clear visual feedback?
- [ ] Does it have all necessary states? (default, highlighted, selected, disabled)
- [ ] Are colors meeting contrast requirements?
- [ ] Is there a VoiceOver label?

### BEFORE SHIPPING SCREEN
- [ ] Tested on iPhone and iPad
- [ ] Tested in portrait and landscape
- [ ] Tested with largest Dynamic Type size
- [ ] Tested with VoiceOver enabled
- [ ] Tested in light and dark mode
- [ ] Tested with "Reduce Motion" enabled
- [ ] All touch targets meet minimum size
- [ ] Safe areas respected
- [ ] Loading states implemented
- [ ] Error states implemented
- [ ] Keyboard type appropriate for input fields

### ACCESSIBILITY AUDIT
- [ ] All images have alt text
- [ ] All buttons have descriptive labels
- [ ] Color is not sole indicator of meaning
- [ ] Minimum 4.5:1 contrast ratio achieved
- [ ] Dynamic Type supported
- [ ] VoiceOver labels present and clear
- [ ] Haptic feedback for important actions
- [ ] Reduce Motion setting respected
- [ ] Keyboard navigation works (iPad)
- [ ] Touch targets minimum 44pt × 44pt

---

## 💡 KEY PRINCIPLES TO REMEMBER

1. **Content First**: UI elements should enhance content, not compete with it
2. **Consistency**: Follow patterns users already know from iOS
3. **Clarity Over Cleverness**: Clear beats clever every time
4. **Accessibility is Not Optional**: Design for everyone from the start
5. **Test on Real Devices**: Simulators don't reveal everything
6. **Respect System Conventions**: Don't reinvent standard behaviors
7. **Progressive Disclosure**: Show complexity only when needed
8. **Feedback is Essential**: Never leave users guessing
9. **Performance Matters**: Fast, responsive UI is part of good design
10. **Iterate Based on Testing**: Design decisions should be validated with real users

---

## 🔗 OFFICIAL RESOURCES

- Apple HIG Website: https://developer.apple.com/design/human-interface-guidelines/
- SF Symbols App: Download from Apple Developer site
- Design Templates: Sketch/Figma HIG templates available
- WWDC Design Sessions: Annual updates on design best practices
- Accessibility Tools: Xcode Accessibility Inspector

---

## 📝 NOTES FOR JIGR DEVELOPMENT

### iPad Air (2013) Specific Considerations
- Safari 12 is the target browser
- Screen resolution: 2048 × 1536 pixels (264 PPI)
- Viewport: 1024 × 768 points (@2x Retina)
- No Face ID (use Touch ID patterns)
- No modern gestures (home button device)
- Test thoroughly on actual target device
- Consider performance limitations of older hardware
- Use CSS media queries for precise targeting
- Optimize assets for 2x Retina (@2x only, no @3x needed)

### Web-Specific Adaptations
- Use CSS to replicate native iOS components
- Implement touch-friendly interactions with proper preventDefault
- Use `-webkit-tap-highlight-color: transparent` to prevent flash on tap
- Implement haptic feedback via Vibration API (where supported)
- Use system fonts: `-apple-system, BlinkMacSystemFont, "SF Pro Text"`
- Test 44pt touch targets in actual browser (not just design)
- Consider viewport meta tag for proper scaling
- Use CSS safe area insets: `padding: env(safe-area-inset-*)`

---

## SUMMARY FOR CLAUDE CODE

When designing components for JiGR:

1. **Start with system standards** - Don't reinvent unless absolutely necessary
2. **Ensure 44pt × 44pt minimum touch targets** - Non-negotiable
3. **Support Dynamic Type** - Text must scale
4. **Provide clear feedback** - Visual, haptic, and audio where appropriate
5. **Test accessibility** - VoiceOver, contrast, motion reduction
6. **Respect conventions** - Users expect iOS patterns
7. **Keep it simple** - Clarity over complexity
8. **Test on target device** - iPad Air (2013) with Safari 12

**The Golden Rule**: If it feels un-Apple-like, it probably is. Follow the system, earn user trust.

---

*Document Version: 1.0*  
*Created: November 2025*  
*Target Platform: iOS/iPadOS 12+ (JiGR compatibility)*  
*Based on: Apple Human Interface Guidelines (2024-2025)*
