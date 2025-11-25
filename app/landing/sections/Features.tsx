'use client'


export default function Features() {
  const features = [
    {
      icon: 'tabler--brain',
      title: "Smart AI Extraction",
      description: "Automatically reads temperatures, supplier names, dates, and signatures - even handwritten notes",
      highlight: "Even reads messy handwriting"
    },
    {
      icon: 'tabler--bell',
      title: "Instant Alerts",
      description: "Get notified immediately when temperatures are out of safe range",
      highlight: "Real-time notifications"
    },
    {
      icon: 'tabler--file-check',
      title: "Inspector Ready",
      description: "Export professional compliance reports in seconds for health inspections",
      highlight: "Professional PDF reports"
    },
    {
      icon: 'tabler--users',
      title: "Multi-User Access",
      description: "Add your team with role-based permissions (staff, manager, admin)",
      highlight: "Unlimited team members"
    },
    {
      icon: 'tabler--clock',
      title: "Complete Audit Trail",
      description: "Every document tracked with timestamp, user, and photo evidence",
      highlight: "Full traceability"
    },
    {
      icon: 'tabler--puzzle',
      title: "Bolt-On Modules",
      description: "Start with compliance, add inventory and recipe costing as you grow",
      highlight: "Pay only for what you need"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Everything You Need.{' '}
            <span className="text-gray-500">Nothing You Don't.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built specifically for small hospitality businesses who need compliance without complexity
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const isPrimary = index < 3 // Highlight top 3 features
            
            return (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-md border-2 p-6 hover:shadow-lg transition-shadow duration-200 group ${
                  isPrimary ? 'border-primary/20 hover:border-primary/40' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                  isPrimary ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  <span className={`icon-[${feature.icon}] w-6 h-6 ${
                    isPrimary ? 'text-primary' : 'text-gray-600'
                  }`}></span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                  {isPrimary && (
                    <span className="ml-2 text-xs bg-accent text-white px-2 py-1 rounded-full">
                      POPULAR
                    </span>
                  )}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Highlight */}
                <div className={`text-sm font-medium px-3 py-1 rounded-full inline-block ${
                  isPrimary 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  ✓ {feature.highlight}
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              How JiGR Compares
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">JiGR</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-600">Other Platforms</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">Works on old iPads</td>
                  <td className="text-center py-3 px-4 text-green-600">✓ iPad Air 2013+</td>
                  <td className="text-center py-3 px-4 text-red-500">✗ Requires new hardware</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">Monthly cost</td>
                  <td className="text-center py-3 px-4 text-green-600">✓ From $49 NZD</td>
                  <td className="text-center py-3 px-4 text-red-500">✗ $200+ NZD</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">Setup time</td>
                  <td className="text-center py-3 px-4 text-green-600">✓ 2 minutes</td>
                  <td className="text-center py-3 px-4 text-red-500">✗ Hours or days</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-700">Built for small business</td>
                  <td className="text-center py-3 px-4 text-green-600">✓ By restaurateurs</td>
                  <td className="text-center py-3 px-4 text-red-500">✗ Enterprise-focused</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            Ready to see how simple compliance can be?
          </p>
          <button className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px]">
            Start Your Free Trial
          </button>
        </div>
      </div>
    </section>
  )
}