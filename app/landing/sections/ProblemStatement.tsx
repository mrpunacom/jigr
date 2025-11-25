'use client'


export default function ProblemStatement() {
  const problems = [
    {
      icon: 'tabler--clock',
      title: "Manual Logging",
      description: "Spending 2-3 hours per week on manual temperature logging and paperwork",
      impact: "2-3 hours/week on paperwork"
    },
    {
      icon: 'tabler--currency-dollar',
      title: "Expensive Solutions",
      description: "Paying $200+/month for systems built for big chains, not small operators",
      impact: "$200+/month for basic tools"
    },
    {
      icon: 'tabler--alert-triangle',
      title: "Risk of Fines",
      description: "Missing or incorrect records leading to MPI violations and potential closure",
      impact: "Missing records = enforcement"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Compliance Shouldn't Be{' '}
            <span className="text-red-600">This Hard</span>{' '}
            <span className="text-gray-500">(Or Expensive)</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Small hospitality businesses face unique challenges that existing solutions ignore
          </p>
        </div>

        {/* Problems Grid */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {problems.map((problem, index) => {
            return (
              <div key={index} className="text-center group">
                {/* Icon Container */}
                <div className="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors duration-200">
                  <span className={`icon-[${problem.icon}] w-10 h-10 text-red-500`}></span>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {problem.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed mb-6">
                  {problem.description}
                </p>

                {/* Impact Highlight */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-semibold text-lg">
                    {problem.impact}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-500 mb-6">
            Sound familiar? There's a better way...
          </p>
          <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-primary mx-auto"></div>
        </div>
      </div>
    </section>
  )
}