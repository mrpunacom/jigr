'use client'

import Hero from './sections/Hero'
import ProblemStatement from './sections/ProblemStatement'
import SolutionOverview from './sections/SolutionOverview'
import Features from './sections/Features'
import Pricing from './sections/Pricing'
import IPadCompatibility from './sections/IPadCompatibility'
import SocialProof from './sections/SocialProof'
import ModularPlatform from './sections/ModularPlatform'
import FAQ from './sections/FAQ'
import FinalCTA from './sections/FinalCTA'
import Footer from './sections/Footer'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Hero />
      <ProblemStatement />
      <SolutionOverview />
      <Features />
      <Pricing />
      <IPadCompatibility />
      <SocialProof />
      <ModularPlatform />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  )
}