'use client'

import { useState } from 'react'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0) // Start with first FAQ open

  const faqs = [
    {
      question: "Do I need to buy new iPads?",
      answer: "No! JiGR works perfectly on iPad Air (2013) and newer. You can use the iPads you already have, or pick up affordable refurbished units for $150-250. We're the only compliance platform designed specifically for older, affordable hardware."
    },
    {
      question: "What if I'm not tech-savvy?",
      answer: "JiGR is designed for busy hospitality workers, not IT professionals. If you can take a photo, you can use JiGR. Setup takes less than 15 minutes, and we're here to help with onboarding and ongoing support."
    },
    {
      question: "Can I try it before committing?",
      answer: "Absolutely! Start with our LITE plan - process 20 documents free every month with no credit card required. Only pay if you need more. You can upgrade, downgrade, or cancel anytime."
    },
    {
      question: "Will this work for my specific business?",
      answer: "JiGR works for any food business handling deliveries: restaurants, cafés, bars, catering, bakeries, food trucks. If you receive temperature-sensitive deliveries and need compliance records, JiGR will help you stay compliant."
    },
    {
      question: "What happens to my data if I cancel?",
      answer: "Your data is always yours. Export everything before canceling, and we'll keep your data available for 90 days after cancellation. No data hostage situations - you own your compliance records."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use bank-level encryption, secure cloud storage in New Zealand, and complete data isolation between clients. Your competitors can never see your data. We're GDPR compliant and follow NZ privacy laws."
    },
    {
      question: "Can I add my team?",
      answer: "Yes! Invite unlimited team members with role-based access. Staff can upload documents, managers can review and generate reports, and owners can access everything. Perfect for multi-location businesses."
    },
    {
      question: "Do you integrate with my POS/accounting software?",
      answer: "API access is coming in our Enterprise tier (late 2026). Currently, you can export data to CSV for import into other systems like Xero, MYOB, or your POS system. Manual export takes seconds."
    },
    {
      question: "How accurate is the OCR/AI extraction?",
      answer: "Our AI reads handwritten temperatures with 95%+ accuracy, even messy handwriting. Supplier names, dates, and signatures are extracted automatically. You can always review and correct before saving - but you rarely need to."
    },
    {
      question: "What if my internet goes down?",
      answer: "JiGR works offline! Photos are stored locally on your iPad and sync automatically when internet returns. Your compliance workflow never stops, even with connectivity issues."
    }
  ]

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about JiGR. Still have questions? 
            <span className="text-primary"> We're here to help.</span>
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between text-left p-6 hover:bg-gray-50 rounded-xl transition-colors duration-200 min-h-[44px]"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <span className="icon-[tabler--chevron-up] w-6 h-6 text-gray-500"></span>
                  ) : (
                    <span className="icon-[tabler--chevron-down] w-6 h-6 text-gray-500"></span>
                  )}
                </div>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <div className="w-full h-px bg-gray-200 mb-4"></div>
                  <p className="text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-16 bg-gradient-to-r from-blue-50 to-orange-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            We're real people who understand hospitality. Get in touch and we'll help you 
            figure out if JiGR is right for your business.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 min-h-[44px]">
              📧 Email Support
            </button>
            <button className="border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 min-h-[44px]">
              📞 Book a Call
            </button>
            <button className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold px-6 py-3 rounded-lg transition-colors duration-200 min-h-[44px]">
              📚 Help Center
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-500">
            <p>💬 Average response time: 2 hours during business hours</p>
            <p>🕐 NZ business hours: Mon-Fri 9am-5pm NZST</p>
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Popular Help Articles
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <a 
              href="#" 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 text-center group"
            >
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary">
                iPad Setup Guide
              </h4>
              <p className="text-sm text-gray-600">
                Step-by-step setup for any iPad
              </p>
            </a>
            
            <a 
              href="#" 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 text-center group"
            >
              <div className="text-2xl mb-2">📸</div>
              <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary">
                Taking Perfect Photos
              </h4>
              <p className="text-sm text-gray-600">
                Tips for best OCR results
              </p>
            </a>
            
            <a 
              href="#" 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200 text-center group"
            >
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary">
                Team Management
              </h4>
              <p className="text-sm text-gray-600">
                Adding users and permissions
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}