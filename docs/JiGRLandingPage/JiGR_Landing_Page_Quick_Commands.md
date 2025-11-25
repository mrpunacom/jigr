# JiGR Landing Page - Quick Start Commands

**For:** Claude Code Implementation  
**Project:** JiGR SaaS Landing Page  
**Reference:** See full prompt in `Claude_Code_Prompt_JiGR_Landing_Page.md`

---

## 🚀 INITIAL SETUP COMMANDS

### Create New Next.js Project

```bash
npx create-next-app@latest jigr-landing --typescript --tailwind --app
```

### Navigate to Project

```bash
cd jigr-landing
```

### Install Additional Dependencies

```bash
npm install lucide-react
```

### Start Development Server

```bash
npm run dev
```

---

## 📁 PROJECT STRUCTURE TO CREATE

### Create components directory

```bash
mkdir -p app/components/landing
```

### Create sections directory

```bash
mkdir -p app/components/landing/sections
```

### Create utilities directory

```bash
mkdir -p app/lib
```

---

## 🎨 TAILWIND CONFIG

### Update tailwind.config.ts with JiGR colors

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          dark: '#1e40af',
          light: '#60a5fa',
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          light: '#fbbf24',
        },
      },
    },
  },
  plugins: [],
}
export default config
```

---

## 📄 KEY FILE TEMPLATES

### Hero Section Component Path

```bash
app/components/landing/sections/Hero.tsx
```

### Problem Statement Component Path

```bash
app/components/landing/sections/ProblemStatement.tsx
```

### Solution Overview Component Path

```bash
app/components/landing/sections/SolutionOverview.tsx
```

### Features Component Path

```bash
app/components/landing/sections/Features.tsx
```

### Pricing Component Path

```bash
app/components/landing/sections/Pricing.tsx
```

### FAQ Component Path

```bash
app/components/landing/sections/FAQ.tsx
```

### CTA Component Path

```bash
app/components/landing/sections/FinalCTA.tsx
```

### Footer Component Path

```bash
app/components/landing/sections/Footer.tsx
```

---

## 🎯 PRIMARY CTA BUTTON TEMPLATE

### Primary CTA Button (Copy for reuse)

```tsx
<button className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px]">
  Start Free Trial - 20 Documents Free
</button>
```

### Secondary CTA Button (Copy for reuse)

```tsx
<button className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 min-h-[44px]">
  Watch Demo
</button>
```

---

## 🎨 GLASS MORPHISM EFFECT

### Glass Effect Class (Add to component)

```tsx
className="bg-white/80 backdrop-blur-md shadow-lg border border-gray-200 rounded-xl"
```

---

## 📱 RESPONSIVE CONTAINER

### Standard Section Container

```tsx
<section className="w-full py-16 md:py-24">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content here */}
  </div>
</section>
```

---

## 🎯 HERO SECTION TEMPLATE

### Hero Headline Style

```tsx
<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
  Affordable Compliance for Small NZ Hospitality Businesses
</h1>
```

### Hero Subheadline Style

```tsx
<p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8">
  Professional food safety compliance without breaking the bank. Built by a restaurateur, for restaurateurs.
</p>
```

---

## 📊 PRICING CARD TEMPLATE

### Pricing Card Structure

```tsx
<div className="bg-white rounded-xl shadow-lg border-2 border-gray-200 p-8 flex flex-col">
  <div className="text-center mb-6">
    <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
    <div className="flex items-baseline justify-center mb-4">
      <span className="text-5xl font-bold text-primary">$49</span>
      <span className="text-gray-600 ml-2">/month</span>
    </div>
  </div>
  
  <ul className="space-y-4 mb-8 flex-grow">
    <li className="flex items-start">
      <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" /* checkmark icon */>
      <span className="text-gray-700">500 documents/month</span>
    </li>
    {/* More features */}
  </ul>
  
  <button className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-4 rounded-lg transition-colors duration-200 min-h-[44px]">
    Start Professional
  </button>
</div>
```

---

## 🎨 FEATURE CARD TEMPLATE

### Feature Card Structure

```tsx
<div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
    {/* Icon here */}
  </div>
  <h3 className="text-xl font-semibold text-gray-900 mb-2">
    Smart AI Extraction
  </h3>
  <p className="text-gray-600 leading-relaxed">
    Automatically reads temperatures, supplier names, dates, and signatures - even handwritten notes
  </p>
</div>
```

---

## ❓ FAQ ACCORDION TEMPLATE

### FAQ Item Structure

```tsx
<div className="border-b border-gray-200 py-4">
  <button className="w-full flex items-center justify-between text-left">
    <h3 className="text-lg font-semibold text-gray-900">
      Do I need to buy new iPads?
    </h3>
    <svg className="w-6 h-6 text-gray-500" /* chevron icon */>
  </button>
  <div className="mt-4 text-gray-600 leading-relaxed">
    No! JiGR works perfectly on iPad Air (2013) and newer...
  </div>
</div>
```

---

## 🎯 MAIN PAGE STRUCTURE

### app/page.tsx Main Structure

```tsx
import Hero from './components/landing/sections/Hero'
import ProblemStatement from './components/landing/sections/ProblemStatement'
import SolutionOverview from './components/landing/sections/SolutionOverview'
import Features from './components/landing/sections/Features'
import Pricing from './components/landing/sections/Pricing'
import iPadCompatibility from './components/landing/sections/iPadCompatibility'
import SocialProof from './components/landing/sections/SocialProof'
import ModularPlatform from './components/landing/sections/ModularPlatform'
import FAQ from './components/landing/sections/FAQ'
import FinalCTA from './components/landing/sections/FinalCTA'
import Footer from './components/landing/sections/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      <ProblemStatement />
      <SolutionOverview />
      <Features />
      <Pricing />
      <iPadCompatibility />
      <SocialProof />
      <ModularPlatform />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}
```

---

## 📝 METADATA TEMPLATE

### app/layout.tsx Metadata

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'JiGR - Affordable Compliance for NZ Hospitality',
  description: 'Professional food safety compliance for small NZ restaurants, cafés, and bars. Works on iPad Air (2013). From $49/month.',
  keywords: 'food safety, compliance, hospitality, New Zealand, restaurant, cafe, temperature tracking',
  openGraph: {
    title: 'JiGR - Affordable Compliance for NZ Hospitality',
    description: 'Professional food safety compliance without breaking the bank',
    type: 'website',
  },
}
```

---

## 🎨 SMOOTH SCROLL

### Add smooth scroll behavior to globals.css

```css
html {
  scroll-behavior: smooth;
}
```

---

## 📊 GOOGLE ANALYTICS SETUP

### Install Analytics Package

```bash
npm install @next/third-parties
```

### Add to app/layout.tsx

```tsx
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  )
}
```

---

## 🚀 BUILD & DEPLOY COMMANDS

### Build for Production

```bash
npm run build
```

### Test Production Build Locally

```bash
npm run start
```

### Deploy to Netlify (if using Netlify CLI)

```bash
netlify deploy --prod
```

---

## ✅ TESTING CHECKLIST COMMANDS

### Run TypeScript Check

```bash
npx tsc --noEmit
```

### Check for ESLint Issues

```bash
npm run lint
```

### Format Code with Prettier (if installed)

```bash
npx prettier --write .
```

---

## 📱 MOBILE TESTING

### Test Responsive Design in Browser
- Open DevTools (F12)
- Toggle Device Toolbar (Ctrl+Shift+M)
- Select "iPad Air" from device dropdown
- Test in both portrait (768x1024) and landscape (1024x768)

---

## 🎯 QUICK REFERENCE LINKS

### Full Comprehensive Prompt Document

```
Claude_Code_Prompt_JiGR_Landing_Page.md
```

### JiGR Platform Summary

```
JiGR_Platform_Comprehensive_Summary.md
```

---

## 💡 TIPS FOR CLAUDE CODE

When working with Claude Code on this landing page:

1. **Start with the prompt**: Share the full `Claude_Code_Prompt_JiGR_Landing_Page.md` document first
2. **Build incrementally**: Implement one section at a time (Hero → Footer sequence)
3. **Test frequently**: After each section, test on iPad Air dimensions
4. **Reference the summary**: Use `JiGR_Platform_Comprehensive_Summary.md` for accurate content
5. **Keep it simple**: Remember Safari 12 constraints - core Tailwind utilities only

### Sample Conversation Starter for Claude Code:

```
I need you to build a SaaS landing page for JiGR, a hospitality compliance platform. 

Please read this comprehensive prompt document first:
[paste Claude_Code_Prompt_JiGR_Landing_Page.md]

Then reference this platform summary for accurate content:
[paste JiGR_Platform_Comprehensive_Summary.md]

Let's start by building the Hero section. Remember:
- Must work on iPad Air (2013) with Safari 12
- TailwindCSS core utilities only
- Minimum 44px touch targets
- <2 second page load target

Ready to begin?
```

---

**Good luck building!** 🚀

These commands and templates should make it easy to copy-paste exactly what you need while working with Claude Code.
