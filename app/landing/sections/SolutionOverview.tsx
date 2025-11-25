'use client'


export default function SolutionOverview() {
  const steps = [
    {
      icon: 'tabler--camera',
      title: "Snap",
      description: "Photo delivery docket with your iPad",
      detail: "Just point and shoot - no typing required"
    },
    {
      icon: 'tabler--brain',
      title: "Extract", 
      description: "AI extracts temperature & supplier data",
      detail: "Smart OCR reads handwritten temps automatically"
    },
    {
      icon: 'tabler--chart-bar',
      title: "Comply",
      description: "Instant compliance dashboard",
      detail: "Professional reports ready for inspections"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-primary">Snap.</span>{' '}
            <span className="text-accent">Extract.</span>{' '}
            <span className="text-green-600">Comply.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-4">
            Turn any iPad Air into a powerful compliance system
          </p>
        </div>

        {/* Process Steps */}
        <div className="relative">
          {/* Desktop Flow */}
          <div className="hidden lg:flex items-center justify-between mb-12">
            {steps.map((step, index) => {
              return (
                <div key={index} className="flex items-center">
                  {/* Step */}
                  <div className="text-center group">
                    <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:shadow-xl transition-shadow duration-200">
                      <span className={`icon-[${step.icon}] w-16 h-16 text-primary`}></span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 max-w-48">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  {index < steps.length - 1 && (
                    <div className="mx-8">
                      <span className="icon-[tabler--arrow-right] w-8 h-8 text-gray-400"></span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile/Tablet Stack */}
          <div className="lg:hidden space-y-8 mb-12">
            {steps.map((step, index) => {
              return (
                <div key={index} className="text-center">
                  <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 mx-auto">
                    <span className={`icon-[${step.icon}] w-12 h-12 text-primary`}></span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Step {index + 1}: {step.title}
                  </h3>
                  <p className="text-gray-600 mb-2">
                    {step.description}
                  </p>
                  <p className="text-sm text-gray-500">
                    {step.detail}
                  </p>
                  
                  {/* Connector */}
                  {index < steps.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300 mx-auto mt-6"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Visual Demo */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-8 mb-12">
          <div className="grid lg:grid-cols-3 gap-8 items-center">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-gray-100 rounded-xl aspect-[4/3] mb-4 flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className={`w-12 h-12 rounded-lg mb-2 mx-auto flex items-center justify-center ${
                      index === 0 ? 'bg-blue-100' : 
                      index === 1 ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <span className={`icon-[${step.icon}] w-6 h-6 ${
                        index === 0 ? 'text-blue-600' : 
                        index === 1 ? 'text-orange-600' : 'text-green-600'
                      }`}></span>
                    </div>
                    <p className="text-sm text-gray-600">{step.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closer */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            That's it. Really.
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            No complex setup. No training. No expensive hardware. 
            Just professional compliance in seconds.
          </p>
          
          <button className="bg-accent hover:bg-accent-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px] hover:scale-105 transform">
            Try It Free - 20 Documents
          </button>
        </div>
      </div>
    </section>
  )
}