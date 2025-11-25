'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-20 w-full bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-primary">
                JiGR
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                href="/signin"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
              <button className="bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 min-h-[44px]">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
          {/* Left Column - Content */}
          <div className="lg:col-span-6 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Affordable Compliance for{' '}
              <span className="text-primary">Small NZ Hospitality</span> Businesses
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-8">
              Professional food safety compliance without breaking the bank. 
              Built by a restaurateur, for restaurateurs.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px] hover:scale-105 transform">
                Start Free Trial - 20 Documents Free
              </button>
              <button className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 min-h-[44px] flex items-center justify-center gap-2">
                <span className="icon-[tabler--player-play] w-5 h-5"></span>
                Watch Demo
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="icon-[tabler--circle-check] w-4 h-4 text-green-500"></span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="icon-[tabler--circle-check] w-4 h-4 text-green-500"></span>
                <span>2-minute setup</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="icon-[tabler--circle-check] w-4 h-4 text-green-500"></span>
                <span>iPad Air (2013) compatible</span>
              </div>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="lg:col-span-6 mt-12 lg:mt-0">
            <div className="relative">
              {/* Glass Morphism Container */}
              <div className="bg-white/20 backdrop-blur-md shadow-2xl border border-white/30 rounded-3xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-700">
                {/* iPad Mockup */}
                <div className="bg-black rounded-xl p-2 shadow-2xl">
                  <div className="bg-gray-900 rounded-lg aspect-[4/3] flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4 mx-auto">
                        <div className="text-2xl font-bold">JiGR</div>
                      </div>
                      <div className="text-sm text-gray-300 mb-4">
                        Delivery Compliance Dashboard
                      </div>
                      
                      {/* Mock Interface Elements */}
                      <div className="space-y-2">
                        <div className="bg-green-500 h-2 rounded w-full"></div>
                        <div className="bg-green-400 h-2 rounded w-3/4 mx-auto"></div>
                        <div className="bg-amber-400 h-2 rounded w-1/2 mx-auto"></div>
                        <div className="text-xs text-green-400 mt-2">
                          ✓ All temperatures compliant
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                ✓ Compliant
              </div>
              <div className="absolute -bottom-4 -right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                2 sec scan
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-300 rounded-full mt-2 animate-bounce"></div>
        </div>
      </div>
    </section>
  )
}