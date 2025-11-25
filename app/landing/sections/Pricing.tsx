'use client'


export default function Pricing() {
  const plans = [
    {
      name: "LITE",
      price: "FREE",
      period: "to try",
      description: "Perfect for new clients and seasonal businesses",
      features: [
        "20 documents/month",
        "Basic compliance reports",
        "Email support",
        "Works on any iPad"
      ],
      overage: "$0.50 per additional document",
      cta: "Try It Free",
      ctaVariant: "secondary",
      popular: false
    },
    {
      name: "PROFESSIONAL",
      price: "$49",
      period: "NZD/month",
      description: "Most popular for established cafés and restaurants",
      features: [
        "500 documents/month",
        "Advanced analytics",
        "Temperature trend reports",
        "Priority support",
        "Multi-user access",
        "Custom branding"
      ],
      cta: "Start Professional",
      ctaVariant: "primary",
      popular: true
    },
    {
      name: "PROFESSIONAL PLUS",
      price: "$99", 
      period: "NZD/month",
      description: "For growing businesses with multiple needs",
      features: [
        "1,000 documents/month",
        "Compliance + Inventory + Recipe modules",
        "Multi-location support",
        "All features included",
        "Phone support",
        "Custom integrations"
      ],
      cta: "Start Plus",
      ctaVariant: "secondary",
      popular: false
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Pricing That Makes Sense{' '}
            <span className="text-primary">For Small Business</span> Budgets
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transparent pricing designed for hospitality operators, not enterprise budgets
          </p>
          
          {/* Comparison Note */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-red-700 font-medium">
              💸 Competitors charge <span className="font-bold">$200-400/month</span> for similar features
            </p>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl shadow-lg border-2 p-8 flex flex-col relative ${
                plan.popular 
                  ? 'border-primary shadow-xl transform scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-accent text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                    <span className="icon-[tabler--star-filled] w-4 h-4"></span>
                    MOST POPULAR
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center mb-4">
                  <span className={`font-bold ${
                    plan.price === 'FREE' 
                      ? 'text-4xl text-green-600' 
                      : 'text-5xl text-primary'
                  }`}>
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">{plan.period}</span>
                </div>
                <p className="text-gray-600 text-sm">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="icon-[tabler--check] w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5"></span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Overage Info */}
              {plan.overage && (
                <div className="bg-gray-50 rounded-lg p-3 mb-6">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Overage:</span> {plan.overage}
                  </p>
                </div>
              )}

              {/* CTA Button */}
              <button 
                className={`w-full font-semibold py-4 rounded-lg transition-colors duration-200 min-h-[44px] ${
                  plan.ctaVariant === 'primary'
                    ? 'bg-accent hover:bg-accent-dark text-white shadow-lg hover:shadow-xl'
                    : 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
                }`}
              >
                {plan.cta}
              </button>

              {/* Money Back Guarantee */}
              {plan.popular && (
                <div className="text-center mt-4">
                  <p className="text-xs text-gray-500">
                    ✓ 30-day money back guarantee
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="icon-[tabler--check] w-8 h-8 text-green-600"></span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Setup Fees</h4>
            <p className="text-gray-600">Get started immediately with no upfront costs</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="icon-[tabler--arrow-right] w-8 h-8 text-blue-600"></span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Cancel Anytime</h4>
            <p className="text-gray-600">No long-term contracts or cancellation fees</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="icon-[tabler--star] w-8 h-8 text-purple-600"></span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Your Data Stays Yours</h4>
            <p className="text-gray-600">Export everything if you ever need to leave</p>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gradient-to-r from-primary to-accent rounded-2xl text-white p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Total Cost of Ownership</h3>
            <p className="text-lg opacity-90">
              See how much you really save with JiGR
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* JiGR Column */}
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="text-xl font-bold mb-4 text-center">JiGR Solution</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Refurbished iPad Air (2013)</span>
                  <span>$150-250</span>
                </div>
                <div className="flex justify-between">
                  <span>JiGR Professional</span>
                  <span>$49/month</span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>First Year Total</span>
                    <span>$738-838</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitor Column */}
            <div className="bg-white/10 rounded-xl p-6">
              <h4 className="text-xl font-bold mb-4 text-center">Typical Competitor</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Required new tablet</span>
                  <span>$600+</span>
                </div>
                <div className="flex justify-between">
                  <span>Software subscription</span>
                  <span>$200+/month</span>
                </div>
                <div className="border-t border-white/20 pt-2 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>First Year Total</span>
                    <span>$3,000+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-2xl font-bold">
              Save over <span className="text-yellow-300">$2,200</span> in your first year!
            </p>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Questions about pricing? 
          </p>
          <button className="text-primary hover:text-primary-dark font-medium underline">
            View detailed FAQ →
          </button>
        </div>
      </div>
    </section>
  )
}