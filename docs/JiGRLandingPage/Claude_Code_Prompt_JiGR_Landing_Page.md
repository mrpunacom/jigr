# Claude Code Prompt: JiGR SaaS Landing Page

**Project:** JiGR Modular Hospitality Platform  
**Task:** Build conversion-focused SaaS landing page  
**Target:** Next.js 14 with TailwindCSS, iPad Air (2013) compatible

---

## 🎯 PROJECT OVERVIEW

Build a professional, conversion-focused landing page for JiGR - a modular hospitality compliance platform designed for small New Zealand restaurants, cafés, and bars. The page must communicate affordability, simplicity, and the "built by a restaurateur, for restaurateurs" positioning.

---

## 📋 TECHNICAL REQUIREMENTS

### Platform & Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS (core utilities only - Safari 12 compatible)
- **Typography:** System fonts (San Francisco on Apple devices)
- **Icons:** Lucide React or inline SVG
- **Animations:** CSS-based, no heavy JavaScript (iPad Air performance)

### Critical Compatibility
- **Primary Target:** iPad Air (2013) running Safari 12
- **Performance:** <2 second initial page load
- **CSS:** Core Tailwind utilities only (no arbitrary values that Safari 12 won't support)
- **JavaScript:** ES6 compatible, minimal client-side processing

### Design Aesthetic
- **Style:** Apple-inspired glass morphism with hospitality warmth
- **Colors:** 
  - Primary: Professional blue (#2563eb or similar)
  - Accent: Warm orange/amber for CTAs (#f59e0b)
  - Backgrounds: Whites, light grays with subtle glass effects
  - Text: High contrast for readability
- **Touch Targets:** Minimum 44px for all interactive elements
- **Spacing:** Generous whitespace, easy to scan

---

## 🎨 PAGE STRUCTURE & SECTIONS

### Section 1: Hero (Above the Fold)

**Purpose:** Immediately communicate value proposition and drive action

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Logo                    [Sign In] [Start Free Trial]│
├─────────────────────────────────────────────────────┤
│                                                       │
│        Affordable Compliance for                     │
│        Small NZ Hospitality Businesses               │
│                                                       │
│   Professional food safety compliance without        │
│   breaking the bank. Built by a restaurateur,        │
│   for restaurateurs.                                 │
│                                                       │
│   [Start Free Trial - 20 Documents Free] [Watch Demo]│
│                                                       │
│   ✓ No credit card required  ✓ 2-minute setup       │
│                                                       │
│        [Hero Image: iPad showing app interface]      │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Affordable Compliance for Small NZ Hospitality Businesses"
- **Subheadline:** "Professional food safety compliance without breaking the bank. Built by a restaurateur, for restaurateurs."
- **Primary CTA:** "Start Free Trial - 20 Documents Free"
- **Secondary CTA:** "Watch Demo"
- **Trust Indicators:** "No credit card required • 2-minute setup • iPad Air (2013) compatible"

**Design Notes:**
- Hero image shows actual iPad Air with JiGR app interface
- Gradient background with subtle glass morphism effect
- CTAs must be prominent with orange/amber color for primary action
- Mobile-first responsive layout

---

### Section 2: Problem Statement

**Purpose:** Create urgency by highlighting pain points

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│              Compliance Shouldn't Be                 │
│              This Hard (Or Expensive)                │
│                                                       │
│  [Icon]          [Icon]           [Icon]             │
│  Manual          Expensive        Risk of            │
│  Logging         Solutions        Fines              │
│                                                       │
│  2-3 hours/week  $200+/month     Missing records     │
│  on paperwork    for basic tools  = enforcement      │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Compliance Shouldn't Be This Hard (Or Expensive)"
- **Pain Points:**
  1. **Manual Logging:** "Spending 2-3 hours per week on manual temperature logging and paperwork"
  2. **Expensive Solutions:** "Paying $200+/month for systems built for big chains, not small operators"
  3. **Risk of Fines:** "Missing or incorrect records leading to MPI violations and potential closure"

**Design Notes:**
- Three-column grid (stacks on mobile)
- Icons illustrating each pain point
- Neutral color palette to emphasize problems
- Clean, scannable format

---

### Section 3: Solution Overview

**Purpose:** Present JiGR as the simple, affordable solution

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│              Snap. Extract. Comply.                  │
│                                                       │
│  [Step 1 Visual]  →  [Step 2 Visual]  →  [Step 3]  │
│                                                       │
│  Photo delivery     AI extracts          Instant     │
│  docket with       temperature &         compliance  │
│  your iPad         supplier data         dashboard   │
│                                                       │
│              That's it. Really.                      │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Snap. Extract. Comply."
- **Subheadline:** "Turn any iPad Air into a powerful compliance system"
- **Process:**
  1. "Photo delivery docket with your iPad"
  2. "AI extracts temperature & supplier data"
  3. "Instant compliance dashboard"
- **Closer:** "That's it. Really."

**Design Notes:**
- Visual workflow showing three steps
- Arrows connecting steps for flow
- Screenshots from actual app
- Emphasis on simplicity and speed

---

### Section 4: Key Features

**Purpose:** Highlight main functionality and benefits

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│           Everything You Need. Nothing You Don't.    │
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Smart AI     │  │ Instant      │  │ Inspector   ││
│  │ Extraction   │  │ Alerts       │  │ Ready       ││
│  │              │  │              │  │             ││
│  │ Reads temps, │  │ Get notified │  │ Export      ││
│  │ suppliers,   │  │ immediately  │  │ compliance  ││
│  │ dates auto   │  │ of issues    │  │ reports     ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
│                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │ Multi-User   │  │ Audit Trail  │  │ Bolt-On     ││
│  │ Access       │  │              │  │ Modules     ││
│  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────┘
```

**Features to Highlight:**
1. **Smart AI Extraction:** "Automatically reads temperatures, supplier names, dates, and signatures - even handwritten notes"
2. **Instant Alerts:** "Get notified immediately when temperatures are out of safe range"
3. **Inspector Ready:** "Export professional compliance reports in seconds for health inspections"
4. **Multi-User Access:** "Add your team with role-based permissions (staff, manager, admin)"
5. **Complete Audit Trail:** "Every document tracked with timestamp, user, and photo evidence"
6. **Bolt-On Modules:** "Start with compliance, add inventory and recipe costing as you grow"

**Design Notes:**
- Card-based layout with icons
- Benefits-focused copy (what it does for them)
- Expandable cards or hover effects for more details
- Visual hierarchy emphasizing top 3 features

---

### Section 5: Pricing

**Purpose:** Show affordability and value, drive conversion

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│              Pricing That Makes Sense                │
│          For Small Business Budgets                  │
│                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   LITE   │  │    PRO   │  │ PRO PLUS │          │
│  │          │  │          │  │          │          │
│  │   FREE   │  │ $49/mo   │  │ $99/mo   │          │
│  │  to try  │  │          │  │          │          │
│  │          │  │ POPULAR  │  │          │          │
│  │ 20 docs  │  │ 500 docs │  │ All      │          │
│  │ + $0.50  │  │ Advanced │  │ Modules  │          │
│  │ per doc  │  │ reports  │  │ Included │          │
│  │          │  │          │  │          │          │
│  │ [Try It] │  │[Start]   │  │[Start]   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                       │
│  Compare to competitors: $200-400/month              │
└─────────────────────────────────────────────────────┘
```

**Pricing Tiers:**

**LITE (Lead Magnet):**
- **Price:** FREE to try
- **Includes:** 20 documents/month
- **Overage:** $0.50/document
- **CTA:** "Try It Free"
- **Perfect for:** "New clients, seasonal businesses"

**PROFESSIONAL (Most Popular):**
- **Price:** $49 NZD/month
- **Includes:** 
  - 500 documents/month
  - Advanced analytics
  - Priority support
  - Temperature trend reports
- **CTA:** "Start Professional"
- **Badge:** "MOST POPULAR"
- **Perfect for:** "Established cafés and restaurants"

**PROFESSIONAL PLUS (Premium):**
- **Price:** $99 NZD/month
- **Includes:**
  - Compliance + Inventory + Recipe modules
  - 1,000 documents/month
  - Multi-location support
  - All features included
- **CTA:** "Start Plus"
- **Perfect for:** "Growing businesses with multiple needs"

**Comparison Note:** "Compare to competitors: $200-400/month for similar features"

**Design Notes:**
- Three-column pricing table
- Middle tier highlighted as "Most Popular"
- All prices in NZD
- Clear feature comparison
- Emphasis on affordability vs. competitors

---

### Section 6: iPad Air Compatibility

**Purpose:** Address unique selling proposition and hardware affordability

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│         Works on the iPad You Already Have          │
│                                                       │
│  [iPad Air 2013 Image]                               │
│                                                       │
│  We're the ONLY compliance platform that works       │
│  perfectly on iPad Air (2013) - because we know      │
│  small businesses use older, affordable hardware.    │
│                                                       │
│  ✓ Pick up refurbished iPad Air for $150-250        │
│  ✓ No expensive new tablets required                │
│  ✓ Fast performance, no lag                         │
│  ✓ Same professional results                        │
│                                                       │
│  Total solution: $199-299 hardware + $49/mo software │
│  vs. Competitors: $600+ hardware + $200+/mo software │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Works on the iPad You Already Have"
- **Subheadline:** "We're the ONLY compliance platform that works perfectly on iPad Air (2013)"
- **Why It Matters:** "Because we know small businesses use older, affordable hardware"
- **Benefits:**
  - "Pick up refurbished iPad Air for $150-250"
  - "No expensive new tablets required"
  - "Fast performance, no lag"
  - "Same professional results"
- **Cost Comparison:** "Total solution: $199-299 hardware + $49/mo vs. Competitors: $600+ hardware + $200+/mo"

**Design Notes:**
- Image of actual iPad Air (2013) running JiGR
- Cost breakdown visualization
- Emphasis on affordability advantage
- Real-world pricing examples

---

### Section 7: Social Proof

**Purpose:** Build trust through testimonials and validation

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│         Built By Restaurateurs,                     │
│         For Restaurateurs                            │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ "Saves me   │  │ "Finally a  │  │ "My team    │ │
│  │  hours      │  │  system I   │  │  actually   │ │
│  │  every week"│  │  can afford"│  │  uses it"   │ │
│  │             │  │             │  │             │ │
│  │ - Maria S.  │  │ - John K.   │  │ - Sarah L.  │ │
│  │   Café Owner│  │   Bar Mgr   │  │   Chef      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                       │
│  Trusted by 50+ hospitality businesses across NZ     │
└─────────────────────────────────────────────────────┘
```

**Testimonials (Placeholder - to be collected from pilot clients):**
1. **Maria S., Café Owner, Auckland:** "JiGR saves me hours every week. I used to dread temperature logging - now it takes seconds."
2. **John K., Bar Manager, Wellington:** "Finally a compliance system I can actually afford. And it works on our old iPads!"
3. **Sarah L., Head Chef, Christchurch:** "My team actually uses it because it's so simple. That's never happened with compliance software before."

**Stats:**
- "Trusted by 50+ hospitality businesses across New Zealand"
- "4.8/5 average rating"
- "95% would recommend to other operators"

**Design Notes:**
- Card-based testimonial layout
- Photos of actual users (when available)
- Star ratings
- Business type and location
- Rotation or carousel for multiple testimonials

---

### Section 8: Modular Platform Vision

**Purpose:** Show expansion possibilities and long-term value

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│         Start Simple. Grow When Ready.               │
│                                                       │
│  [NOW]                    [COMING SOON]              │
│                                                       │
│  Delivery                 Inventory                  │
│  Compliance               Management                 │
│  ✓ Available             → Recipe Costing            │
│                           → Order Guides             │
│                           → Staff Training           │
│                                                       │
│  One platform. Only pay for what you need.           │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Start Simple. Grow When Ready."
- **Current:** "Delivery Compliance - Available Now"
- **Coming Soon:**
  - "Inventory Management - Q2 2026"
  - "Recipe Costing - Q2 2026"
  - "Order Guides - Q3 2026"
  - "Staff Training - 2027"
- **Value Prop:** "One platform. One login. Only pay for what you need."
- **Integration:** "All modules share data - enter once, use everywhere"

**Design Notes:**
- Timeline or roadmap visualization
- "Available Now" vs. "Coming Soon" differentiation
- Module icons or illustrations
- Emphasis on flexibility and scalability

---

### Section 9: FAQ

**Purpose:** Address common objections and questions

**Questions to Include:**

**Q1: "Do I need to buy new iPads?"**
A: No! JiGR works perfectly on iPad Air (2013) and newer. You can use the iPads you already have, or pick up affordable refurbished units for $150-250.

**Q2: "What if I'm not tech-savvy?"**
A: JiGR is designed for busy hospitality workers, not IT professionals. If you can take a photo, you can use JiGR. Setup takes less than 15 minutes, and we're here to help.

**Q3: "Can I try it before committing?"**
A: Absolutely! Start with our LITE plan - process 20 documents free every month with no credit card required. Only pay if you need more.

**Q4: "Will this work for my specific business?"**
A: JiGR works for any food business handling deliveries: restaurants, cafés, bars, catering, bakeries, food trucks. If you receive temperature-sensitive deliveries, JiGR will help you stay compliant.

**Q5: "What happens to my data if I cancel?"**
A: Your data is always yours. Export everything before canceling, and we'll keep your data available for 90 days after cancellation.

**Q6: "Is my data secure?"**
A: Yes. We use bank-level encryption, secure cloud storage, and complete data isolation between clients. Your competitors can never see your data.

**Q7: "Can I add my team?"**
A: Yes! Invite unlimited team members with role-based access (staff can upload, managers can review, owners can access everything).

**Q8: "Do you integrate with my POS/accounting software?"**
A: API access is coming in our Enterprise tier (late 2026). Currently, you can export data to CSV for import into other systems.

**Design Notes:**
- Accordion-style FAQ (click to expand)
- Organized by topic if many questions
- Search functionality if FAQ is long
- Link to help docs for more details

---

### Section 10: Final CTA

**Purpose:** Last chance conversion with urgency

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│       Ready to Simplify Your Compliance?             │
│                                                       │
│   Join 50+ NZ hospitality businesses already using   │
│   JiGR to save time and stay compliant.              │
│                                                       │
│   [Start Free Trial - 20 Documents Free]             │
│                                                       │
│   No credit card required • 2-minute setup           │
│   Cancel anytime • Export your data                  │
└─────────────────────────────────────────────────────┘
```

**Copy:**
- **Headline:** "Ready to Simplify Your Compliance?"
- **Social Proof:** "Join 50+ NZ hospitality businesses already using JiGR"
- **CTA:** "Start Free Trial - 20 Documents Free"
- **Trust Builders:**
  - "No credit card required"
  - "2-minute setup"
  - "Cancel anytime"
  - "Export your data"

**Design Notes:**
- Full-width section with gradient background
- Large, prominent CTA button
- White text on colored background for contrast
- Generous padding and spacing

---

### Section 11: Footer

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  JiGR Logo                                           │
│                                                       │
│  Product          Company         Resources          │
│  - Features       - About         - Help Center      │
│  - Pricing        - Contact       - API Docs         │
│  - Roadmap        - Careers       - Status           │
│                                                       │
│  Legal                            Connect             │
│  - Privacy        - Terms         [Social Icons]     │
│                                                       │
│  © 2026 JiGR. Built in New Zealand for hospitality. │
└─────────────────────────────────────────────────────┘
```

**Links:**
- **Product:** Features, Pricing, Roadmap, Demo
- **Company:** About, Contact, Careers (future), Press Kit
- **Resources:** Help Center, API Docs (future), System Status, Blog (future)
- **Legal:** Privacy Policy, Terms of Service, Cookie Policy
- **Social:** LinkedIn, Facebook, Instagram (when active)

**Design Notes:**
- Clean, organized footer
- Multiple columns (stacks on mobile)
- Subtle background color differentiation
- Links to all important pages
- Copyright and tagline

---

## 🎨 DESIGN SYSTEM SPECIFICATIONS

### Color Palette

```css
/* Primary Colors */
--primary-blue: #2563eb;
--primary-blue-dark: #1e40af;
--primary-blue-light: #60a5fa;

/* Accent Colors */
--accent-orange: #f59e0b;
--accent-orange-dark: #d97706;
--accent-orange-light: #fbbf24;

/* Backgrounds */
--bg-white: #ffffff;
--bg-gray-50: #f9fafb;
--bg-gray-100: #f3f4f6;
--bg-glass: rgba(255, 255, 255, 0.8);

/* Text */
--text-primary: #111827;
--text-secondary: #6b7280;
--text-muted: #9ca3af;

/* Borders */
--border-gray: #e5e7eb;
--border-gray-dark: #d1d5db;

/* Status Colors */
--success-green: #10b981;
--error-red: #ef4444;
--warning-yellow: #f59e0b;
```

### Typography

```css
/* Font Family */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Helvetica Neue', Arial, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Spacing System

```css
/* Consistent spacing scale */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-24: 6rem;     /* 96px */
```

### Border Radius

```css
--radius-sm: 0.375rem;  /* 6px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-full: 9999px;
```

### Shadows

```css
/* Subtle depth */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

/* Glass morphism effect */
--glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
```

---

## 🎯 CONVERSION OPTIMIZATION

### Primary CTAs (Orange/Amber)
- "Start Free Trial - 20 Documents Free"
- "Try JiGR Free"
- "Get Started Now"

### Secondary CTAs (Blue Outline)
- "Watch Demo"
- "See Pricing"
- "Learn More"

### CTA Placement Strategy
1. **Hero:** Above fold, immediately visible
2. **After Problem:** Once pain is established
3. **After Features:** When value is clear
4. **Pricing:** Direct conversion point
5. **Final CTA:** Last chance before footer

### Trust Elements Throughout
- "No credit card required"
- "2-minute setup"
- "Used by 50+ NZ businesses"
- "Cancel anytime"
- "Your data stays yours"

---

## 📱 RESPONSIVE BEHAVIOR

### Breakpoints
```css
/* Mobile First */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
```

### Mobile Considerations
- Stack all multi-column layouts
- Full-width CTAs for easy tapping
- Larger touch targets (minimum 44px)
- Simplified navigation (hamburger menu)
- Reduced animation for performance

### iPad Air Specific
- Optimize for 1024x768 resolution
- Test in both portrait and landscape
- Touch-friendly spacing throughout
- No hover states (focus on tap interactions)

---

## 🚀 PERFORMANCE REQUIREMENTS

### Page Load Targets
- **Initial Load:** <2 seconds
- **Time to Interactive:** <3 seconds
- **Largest Contentful Paint:** <2.5 seconds

### Optimization Strategies
- Lazy load images below fold
- Inline critical CSS
- Defer non-essential JavaScript
- Optimize images (WebP with fallbacks)
- Use system fonts (no web font loading)

### Testing Checklist
- [ ] Test on actual iPad Air (2013)
- [ ] Verify Safari 12 compatibility
- [ ] Check touch target sizes
- [ ] Test form submissions
- [ ] Verify all CTAs work
- [ ] Test on slow 3G connection
- [ ] Validate all links
- [ ] Check accessibility (WCAG AA)

---

## 📝 CONTENT GUIDELINES

### Voice & Tone
- **Friendly, not corporate:** "We know what it's like"
- **Supportive, not salesy:** "Here to help you succeed"
- **Honest, not hype:** "Simple. Affordable. Effective."
- **Professional, not stuffy:** "Built by operators, for operators"

### Writing Style
- Short sentences (15-20 words max)
- Active voice
- Specific benefits over features
- Numbers and specifics ("2-3 hours/week" vs. "saves time")
- Relatable scenarios from hospitality

### Avoid
- Jargon or technical terms
- Corporate speak ("synergy", "leverage", etc.)
- Overpromising or hype
- Comparison attacks on competitors
- Complex explanations

---

## ✅ IMPLEMENTATION CHECKLIST

### Pre-Development
- [ ] Review comprehensive summary document
- [ ] Understand target audience (small NZ hospitality)
- [ ] Note iPad Air (2013) constraints
- [ ] Review design system specifications

### Development
- [ ] Set up Next.js 14 project with App Router
- [ ] Configure TailwindCSS (core utilities only)
- [ ] Create reusable component library
- [ ] Build each section sequentially
- [ ] Implement responsive breakpoints
- [ ] Add smooth scroll navigation

### Content
- [ ] Replace placeholder copy with final content
- [ ] Add actual product screenshots
- [ ] Create/source hero image
- [ ] Gather testimonials (when available)
- [ ] Write meta descriptions and SEO tags

### Testing
- [ ] Test on iPad Air (2013) Safari 12
- [ ] Verify all CTAs link correctly
- [ ] Check mobile responsiveness
- [ ] Test form submissions
- [ ] Validate performance metrics
- [ ] Run accessibility audit
- [ ] Cross-browser testing

### Pre-Launch
- [ ] Set up analytics (Google Analytics 4)
- [ ] Configure conversion tracking
- [ ] Test contact forms
- [ ] Verify legal pages (Privacy, Terms)
- [ ] Set up monitoring/uptime alerts
- [ ] Create launch plan

---

## 🎁 BONUS ELEMENTS

### Micro-interactions
- Smooth scroll to sections
- Button hover effects (scale slightly)
- Form input focus states
- Success/error message animations
- Loading states for CTAs

### Easter Eggs (Optional)
- Konami code for special message
- "Built with ❤️ in NZ" in footer
- Testimonial rotation/carousel
- Subtle animations on scroll

---

## 📚 REFERENCE MATERIALS

### Inspiration Sites
- Stripe.com (clean, conversion-focused)
- Linear.app (minimal, beautiful)
- Vercel.com (developer-friendly, clear CTAs)
- Xero.com (small business positioning)

### JiGR Project Documents
- JiGR_Platform_Comprehensive_Summary.md (complete platform overview)
- JiGR_Implementation_Package_Summary.md (features and capabilities)
- README_START_HERE.md (project navigation)

---

## 🎯 SUCCESS METRICS

Track these KPIs post-launch:
- **Conversion Rate:** Target 3-5% visitors to trial signup
- **Bounce Rate:** Target <40%
- **Time on Page:** Target >2 minutes
- **CTA Click Rate:** Target >15%
- **Trial Signups:** Track daily/weekly
- **Source Attribution:** Where visitors come from

---

## 🔄 ITERATION PLAN

### Phase 1: Launch (Week 1)
- Basic landing page with all sections
- Working CTAs and forms
- Mobile responsive
- Performance optimized

### Phase 2: Enhancement (Week 2-4)
- Add video demo
- A/B test hero copy
- Add more testimonials
- Refine based on analytics

### Phase 3: Scale (Month 2+)
- Add blog section
- Create case studies
- Build help center
- Launch referral program

---

## 💡 FINAL NOTES FOR IMPLEMENTATION

**Remember:**
1. Mobile-first approach (iPad Air is primary device)
2. Performance over flashy effects
3. Clear value proposition throughout
4. Multiple conversion opportunities
5. Trust building at every stage

**Testing Priority:**
- iPad Air (2013) compatibility is non-negotiable
- All CTAs must work perfectly
- Forms must be simple and functional
- Page must load fast on slower connections

**Launch Criteria:**
- All sections complete and content-filled
- Tested on actual iPad Air hardware
- Forms working and delivering to correct endpoints
- Analytics tracking configured
- Performance metrics meet targets

---

## 📞 NEXT STEPS

1. **Read this prompt thoroughly**
2. **Review JiGR comprehensive summary document**
3. **Set up Next.js project with TailwindCSS**
4. **Build sections sequentially (Hero → Footer)**
5. **Test on iPad Air throughout development**
6. **Deploy to staging for review**
7. **Make revisions based on feedback**
8. **Launch to production**

---

**Good luck building an amazing landing page!** 🚀

Remember: This isn't just a landing page - it's the first impression small NZ hospitality businesses will have of JiGR. Make it count. Make it simple. Make it convert.

Built by a restaurateur, for restaurateurs. Let that authenticity shine through.
