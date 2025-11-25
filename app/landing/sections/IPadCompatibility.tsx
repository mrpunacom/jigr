'use client'


export default function IPadCompatibility() {
  const benefits = [
    {
      icon: 'tabler--currency-dollar',
      title: "Pick up refurbished iPad Air for $150-250",
      description: "No need for expensive new hardware"
    },
    {
      icon: 'tabler--check',
      title: "No expensive new tablets required", 
      description: "Use what you already have"
    },
    {
      icon: 'tabler--bolt',
      title: "Fast performance, no lag",
      description: "Optimized specifically for older hardware"
    },
    {
      icon: 'tabler--award',
      title: "Same professional results",
      description: "Full compliance features on any supported device"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Works on the{' '}
              <span className="text-primary">iPad You Already Have</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              We're the <span className="font-bold text-accent">ONLY</span> compliance platform 
              that works perfectly on iPad Air (2013) - because we know small businesses 
              use older, affordable hardware.
            </p>

            {/* Benefits List */}
            <div className="space-y-6 mb-8">
              {benefits.map((benefit, index) => {
                return (
                  <div key={index} className="flex items-start">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                      <span className={`icon-[${benefit.icon}] w-4 h-4 text-green-600`}></span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {benefit.title}
                      </h4>
                      <p className="text-gray-600">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Cost Comparison */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h4 className="font-bold text-gray-900 mb-4 text-center">
                Total Solution Cost Comparison
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* JiGR Solution */}
                <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                  <h5 className="font-semibold text-green-700 mb-2 text-center">
                    JiGR Solution
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Hardware</span>
                      <span className="font-medium">$199-299</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Software</span>
                      <span className="font-medium">$49/mo</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-green-700">
                        <span>Year 1 Total</span>
                        <span>$787-887</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitor Solution */}
                <div className="bg-white rounded-lg p-4 border-2 border-red-300">
                  <h5 className="font-semibold text-red-700 mb-2 text-center">
                    Competitors
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Hardware</span>
                      <span className="font-medium">$600+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Software</span>
                      <span className="font-medium">$200+/mo</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-red-700">
                        <span>Year 1 Total</span>
                        <span>$3,000+</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-lg font-bold text-green-700">
                  Save over $2,100 in your first year! 💰
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            {/* Main iPad Visual */}
            <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-2xl">
              {/* iPad Frame */}
              <div className="bg-black rounded-2xl p-3 shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="bg-white rounded-lg aspect-[4/3] p-6 flex flex-col">
                  {/* JiGR App Interface */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">JiGR</span>
                      </div>
                      <span className="font-semibold">Compliance Dashboard</span>
                    </div>
                    <div className="text-sm text-gray-500">iPad Air (2013)</div>
                  </div>

                  {/* Mock Dashboard */}
                  <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-100 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">✓</div>
                        <div className="text-xs text-green-700">Compliant</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">47</div>
                        <div className="text-xs text-blue-700">Documents</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-xs font-medium mb-2">Recent Deliveries</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Fresh Direct</span>
                          <span className="text-green-600">2.5°C ✓</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Food Co</span>
                          <span className="text-green-600">1.8°C ✓</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                Fast ⚡
              </div>
              <div className="absolute -bottom-4 -right-4 bg-accent text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                $150-250
              </div>
              <div className="absolute top-1/2 -right-8 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                2013+ ✓
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 to-orange-50 rounded-3xl transform translate-x-4 translate-y-4"></div>
          </div>
        </div>

        {/* Supporting Information */}
        <div className="mt-16 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Why This Matters for Your Business
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
              Most compliance platforms force you to buy expensive new hardware. 
              We built JiGR to work with the tablets you already have or can afford.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">73%</div>
                <p className="text-sm text-gray-600">
                  Of small cafés use iPads older than 3 years
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">$600+</div>
                <p className="text-sm text-gray-600">
                  Average cost competitors require for new hardware
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">2013</div>
                <p className="text-sm text-gray-600">
                  Oldest iPad JiGR supports perfectly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-xl text-gray-600 mb-6">
            Test JiGR on your current iPad right now
          </p>
          <button className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px]">
            Try Free on Your iPad
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Works on iPad Air (2013) and all newer models
          </p>
        </div>
      </div>
    </section>
  )
}