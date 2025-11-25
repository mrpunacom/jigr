'use client'


export default function FinalCTA() {
  const trustElements = [
    "No credit card required",
    "2-minute setup", 
    "Cancel anytime",
    "Export your data",
    "30-day money back guarantee"
  ]

  return (
    <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary via-primary-dark to-accent relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        {/* Header */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Ready to Simplify Your{' '}
            <span className="text-yellow-300">Compliance?</span>
          </h2>
          
          <p className="text-xl md:text-2xl opacity-90 leading-relaxed max-w-3xl mx-auto mb-8">
            Join <span className="font-bold text-yellow-300">50+ New Zealand</span> hospitality 
            businesses already using JiGR to save time and stay compliant.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="icon-[tabler--star-filled] w-5 h-5 text-yellow-400"></span>
              ))}
            </div>
            <span className="text-lg font-medium ml-2 opacity-90">
              4.8/5 from verified users
            </span>
          </div>
        </div>

        {/* Main CTA */}
        <div className="mb-12">
          <button className="group bg-accent hover:bg-accent-dark text-gray-900 font-bold text-xl md:text-2xl px-12 py-6 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 min-h-[60px] inline-flex items-center gap-3">
            Start Free Trial - 20 Documents Free
            <span className="icon-[tabler--arrow-right] w-6 h-6 group-hover:translate-x-1 transition-transform duration-200"></span>
          </button>
          
          <p className="text-lg opacity-75 mt-4">
            No commitment. See results in minutes, not months.
          </p>
        </div>

        {/* Trust Elements */}
        <div className="grid md:grid-cols-5 gap-6 mb-12">
          {trustElements.map((element, index) => (
            <div key={index} className="flex items-center justify-center gap-2">
              <span className="icon-[tabler--check] w-5 h-5 text-green-400 flex-shrink-0"></span>
              <span className="text-sm md:text-base opacity-90">
                {element}
              </span>
            </div>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 rounded-lg transition-colors duration-200 min-h-[44px] flex items-center gap-2">
            📺 Watch 2-Minute Demo
          </button>
          <button className="text-white hover:text-yellow-300 font-medium underline hover:no-underline transition-colors duration-200">
            Talk to a Real Person →
          </button>
        </div>

        {/* Urgency/Scarcity (Optional) */}
        <div className="mt-12 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium">
              Limited Time: Lock in current pricing
            </span>
          </div>
          <p className="text-sm opacity-75">
            Early customers get lifetime access to current pricing, even as we add new modules. 
            Start now and save $100s per year forever.
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-12 text-center">
          <p className="text-sm opacity-75 mb-2">
            Questions? We're here to help.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <a href="mailto:hello@jigr.co.nz" className="hover:text-yellow-300 transition-colors">
              📧 hello@jigr.co.nz
            </a>
            <a href="tel:+6449999999" className="hover:text-yellow-300 transition-colors">
              📞 +64 4 999 9999
            </a>
            <span className="opacity-60">
              🕐 Mon-Fri 9am-5pm NZST
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400"></div>
    </section>
  )
}