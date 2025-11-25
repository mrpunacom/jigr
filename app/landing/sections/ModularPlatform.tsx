'use client'


export default function ModularPlatform() {
  const currentFeatures = [
    {
      icon: "tabler--circle-check",
      title: "Delivery Compliance",
      description: "Smart OCR extraction of delivery dockets",
      status: "available"
    }
  ]

  const comingModules = [
    {
      icon: "tabler--package",
      title: "Inventory Management",
      description: "Track stock levels and automate ordering",
      timeline: "Q2 2026",
      status: "coming"
    },
    {
      icon: "tabler--calculator",
      title: "Recipe Costing",
      description: "Calculate exact food costs and profit margins",
      timeline: "Q2 2026", 
      status: "coming"
    },
    {
      icon: "tabler--book-open",
      title: "Order Guides",
      description: "Streamlined supplier ordering and management",
      timeline: "Q3 2026",
      status: "coming"
    },
    {
      icon: "tabler--users",
      title: "Staff Training",
      description: "Digital training modules and compliance tracking",
      timeline: "2027",
      status: "coming"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Start Simple. <span className="text-primary">Grow When Ready.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            JiGR grows with your business. Start with compliance, add modules as you need them.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-700 font-medium">
              💡 One platform. One login. Only pay for what you need.
            </p>
          </div>
        </div>

        {/* Current vs Coming Soon */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Available Now */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm mr-4">
                AVAILABLE NOW
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Ready to Use</h3>
            </div>

            <div className="space-y-4">
              {currentFeatures.map((feature, index) => {
                return (
                  <div key={index} className="bg-white rounded-xl shadow-md border-2 border-green-200 p-6">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                        <span className={`icon-[${feature.icon}] w-6 h-6 text-green-600`}></span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {feature.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {feature.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            ✓ Ready to use
                          </span>
                          <button className="text-primary hover:text-primary-dark font-medium text-sm">
                            Try it now →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Coming Soon */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-bold text-sm mr-4">
                COMING SOON
              </div>
              <h3 className="text-2xl font-bold text-gray-900">In Development</h3>
            </div>

            <div className="space-y-4">
              {comingModules.map((module, index) => {
                return (
                  <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                        <span className={`icon-[${module.icon}] w-6 h-6 text-gray-600`}></span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-900 mb-2">
                          {module.title}
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {module.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            <span className="icon-[tabler--clock] w-3 h-3 inline mr-1"></span>
                            {module.timeline}
                          </span>
                          <button className="text-gray-500 hover:text-gray-700 text-sm">
                            Get notified →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Integration Benefits */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl text-white p-8 mb-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              All Modules Share Data
            </h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Enter information once, use it everywhere. Your compliance data automatically flows 
              into inventory tracking, recipe costing, and order management.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📋</div>
              <h4 className="font-bold mb-2">Enter Once</h4>
              <p className="opacity-80 text-sm">
                Delivery data captured during compliance flows everywhere
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🔄</div>
              <h4 className="font-bold mb-2">Use Everywhere</h4>
              <p className="opacity-80 text-sm">
                Same data powers inventory, costing, and ordering
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💰</div>
              <h4 className="font-bold mb-2">Save Time & Money</h4>
              <p className="opacity-80 text-sm">
                No duplicate data entry or multiple subscriptions
              </p>
            </div>
          </div>
        </div>

        {/* Roadmap Timeline */}
        <div className="relative">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            JiGR Development Roadmap
          </h3>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 h-full"></div>
            
            <div className="space-y-12">
              {/* Now */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold">
                    NOW - 2026
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">Delivery Compliance</h4>
                  <p className="text-gray-600 text-sm">Smart OCR, alerts, reporting</p>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full"></div>
                <div className="w-1/2 pl-8"></div>
              </div>

              {/* Q2 2026 */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-8"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full"></div>
                <div className="w-1/2 pl-8">
                  <div className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold">
                    Q2 2026
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">Inventory + Recipe Costing</h4>
                  <p className="text-gray-600 text-sm">Stock tracking, automated reordering, profit analysis</p>
                </div>
              </div>

              {/* Q3 2026 */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="bg-purple-500 text-white px-4 py-2 rounded-lg font-bold">
                    Q3 2026
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">Order Guides</h4>
                  <p className="text-gray-600 text-sm">Streamlined supplier management</p>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full"></div>
                <div className="w-1/2 pl-8"></div>
              </div>

              {/* 2027 */}
              <div className="relative flex items-center">
                <div className="w-1/2 pr-8"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-orange-500 rounded-full"></div>
                <div className="w-1/2 pl-8">
                  <div className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold">
                    2027
                  </div>
                  <h4 className="font-bold text-gray-900 mt-2">Staff Training</h4>
                  <p className="text-gray-600 text-sm">Digital training modules, compliance tracking</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Early Access CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Get Early Access to New Modules
            </h3>
            <p className="text-gray-600 mb-6">
              Start with compliance today and be first to access new modules as they launch.
              Existing customers get priority access and special pricing.
            </p>
            <div className="space-y-3">
              <button className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-4 rounded-lg text-lg transition-colors duration-200 min-h-[44px]">
                Start with Compliance - $49/month
              </button>
              <p className="text-sm text-gray-500">
                ✓ Lock in current pricing ✓ Early access to all modules ✓ Priority support
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}