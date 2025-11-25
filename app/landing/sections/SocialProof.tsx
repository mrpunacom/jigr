'use client'


export default function SocialProof() {
  const testimonials = [
    {
      quote: "JiGR saves me hours every week. I used to dread temperature logging - now it takes seconds.",
      author: "Maria S.",
      role: "Café Owner",
      location: "Auckland",
      rating: 5,
      highlight: "Saves hours weekly"
    },
    {
      quote: "Finally a compliance system I can actually afford. And it works on our old iPads!",
      author: "John K.",
      role: "Bar Manager", 
      location: "Wellington",
      rating: 5,
      highlight: "Affordable solution"
    },
    {
      quote: "My team actually uses it because it's so simple. That's never happened with compliance software before.",
      author: "Sarah L.",
      role: "Head Chef",
      location: "Christchurch",
      rating: 5,
      highlight: "Team adoption"
    }
  ]

  const stats = [
    {
      icon: "tabler--users",
      number: "50+",
      label: "NZ hospitality businesses",
      description: "Already trusting JiGR"
    },
    {
      icon: "tabler--star",
      number: "4.8",
      label: "Average rating",
      description: "From verified users"
    },
    {
      icon: "tabler--trending-up",
      number: "95%",
      label: "Would recommend",
      description: "To other operators"
    }
  ]

  return (
    <section className="w-full py-16 md:py-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Built By <span className="text-primary">Restaurateurs</span>,{' '}
            <br />For <span className="text-accent">Restaurateurs</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real feedback from real operators who understand the daily grind
          </p>
        </div>

        {/* Testimonials */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-200">
              {/* Rating Stars */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="icon-[tabler--star-filled] w-5 h-5 text-yellow-400"></span>
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-6">
                <span className="icon-[tabler--quote] absolute -top-2 -left-1 w-8 h-8 text-gray-300"></span>
                <p className="text-gray-700 leading-relaxed pl-6">
                  "{testimonial.quote}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.author}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {testimonial.role}
                  </p>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <span className="icon-[tabler--map-pin] w-3 h-3 mr-1"></span>
                    {testimonial.location}
                  </div>
                </div>
                
                {/* Highlight Badge */}
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                  {testimonial.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {stats.map((stat, index) => {
            return (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className={`icon-[${stat.icon}] w-8 h-8 text-primary`}></span>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.number}
                </div>
                <div className="font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <p className="text-gray-600 text-sm">
                  {stat.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Founder Story */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Content */}
            <div>
              <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium inline-block mb-4">
                Founder's Story
              </div>
              
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
                "I Built JiGR Because I Needed It"
              </h3>
              
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  After 15 years running cafés in New Zealand, I was sick of spending 
                  hours every week on manual compliance paperwork. Every solution on 
                  the market was built for big chains with big budgets.
                </p>
                <p>
                  So I built JiGR for operators like us - small business owners who 
                  need professional compliance without enterprise prices or complexity.
                </p>
                <p className="text-gray-900 font-medium">
                  "JiGR works on the iPads you already have, costs what you can afford, 
                  and takes seconds not hours."
                </p>
              </div>

              <div className="mt-6 flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                <div>
                  <p className="font-semibold text-gray-900">Chris Puna</p>
                  <p className="text-gray-600 text-sm">Founder & CEO, Former Restaurant Owner</p>
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-white">
                <div className="text-center">
                  <div className="text-6xl mb-4">🍽️</div>
                  <h4 className="text-xl font-bold mb-2">Built by someone who gets it</h4>
                  <p className="opacity-90">
                    Real restaurant experience solving real restaurant problems
                  </p>
                  
                  <div className="mt-6 space-y-2 text-sm opacity-80">
                    <div>✓ 15+ years in hospitality</div>
                    <div>✓ Owned cafés in Auckland & Wellington</div>
                    <div>✓ Faced MPI inspections</div>
                    <div>✓ Knows the struggle</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Trusted by hospitality operators across New Zealand
          </p>
          
          {/* Customer Logos Placeholder */}
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="bg-gray-200 rounded-lg px-6 py-3 text-gray-500 font-medium">
              Auckland Café Group
            </div>
            <div className="bg-gray-200 rounded-lg px-6 py-3 text-gray-500 font-medium">
              Wellington Eats
            </div>
            <div className="bg-gray-200 rounded-lg px-6 py-3 text-gray-500 font-medium">
              South Island Dining
            </div>
          </div>
          
          <div className="mt-8">
            <button className="bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl min-h-[44px]">
              Join These Smart Operators
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}