'use client'

import Link from 'next/link'

export default function Footer() {
  const footerSections = {
    product: {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Roadmap", href: "/roadmap" },
        { name: "Demo", href: "/demo" }
      ]
    },
    company: {
      title: "Company", 
      links: [
        { name: "About", href: "/about" },
        { name: "Contact", href: "/contact" },
        { name: "Careers", href: "/careers" },
        { name: "Press Kit", href: "/press" }
      ]
    },
    resources: {
      title: "Resources",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "API Docs", href: "/api" },
        { name: "System Status", href: "/status" },
        { name: "Blog", href: "/blog" }
      ]
    },
    legal: {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Cookie Policy", href: "/cookies" },
        { name: "GDPR", href: "/gdpr" }
      ]
    }
  }

  const socialLinks = [
    { name: "LinkedIn", href: "#", icon: "icon-[tabler--brand-linkedin]" },
    { name: "Facebook", href: "#", icon: "icon-[tabler--brand-facebook]" },
    { name: "Instagram", href: "#", icon: "icon-[tabler--brand-instagram]" }
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Content */}
        <div className="py-12 lg:py-16">
          <div className="grid lg:grid-cols-6 gap-8">
            
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="text-3xl font-bold text-white mb-4">
                JiGR
              </div>
              <p className="text-gray-300 text-lg mb-6 max-w-md">
                Affordable compliance for small New Zealand hospitality businesses. 
                Built by a restaurateur, for restaurateurs.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="icon-[tabler--map-pin] w-5 h-5 flex-shrink-0"></span>
                  <span>Auckland, New Zealand</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="icon-[tabler--mail] w-5 h-5 flex-shrink-0"></span>
                  <a href="mailto:hello@jigr.co.nz" className="hover:text-white transition-colors">
                    hello@jigr.co.nz
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="icon-[tabler--phone] w-5 h-5 flex-shrink-0"></span>
                  <a href="tel:+6449999999" className="hover:text-white transition-colors">
                    +64 4 999 9999
                  </a>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 mt-6">
                {socialLinks.map((social) => {
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors duration-200"
                      aria-label={social.name}
                    >
                      <span className={`${social.icon} w-5 h-5`}></span>
                    </a>
                  )
                })}
              </div>
            </div>

            {/* Links Sections */}
            {Object.entries(footerSections).map(([key, section]) => (
              <div key={key}>
                <h4 className="font-semibold text-white text-lg mb-4">
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-300 hover:text-white transition-colors duration-200"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h4 className="font-semibold text-white text-lg mb-2">
                Stay Updated
              </h4>
              <p className="text-gray-300">
                Get notified when new modules launch and receive hospitality compliance tips.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:w-96">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-accent focus:outline-none min-h-[44px]"
              />
              <button className="bg-accent hover:bg-accent-dark text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors duration-200 min-h-[44px] whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Copyright */}
            <div className="text-gray-400">
              <p>
                © 2026 JiGR Limited. All rights reserved.{' '}
                <span className="text-accent">Built with ❤️ in New Zealand</span> for hospitality.
              </p>
            </div>

            {/* Additional Links */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-400">
              <span>🇳🇿 Proudly Kiwi</span>
              <span>📱 iPad Air 2013+ Compatible</span>
              <span>🔒 Bank-Level Security</span>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="border-t border-gray-800 py-6">
          <div className="text-center text-gray-500 text-sm space-y-2">
            <p>
              <strong>JiGR</strong> is a registered trademark of JiGR Limited, Auckland, New Zealand.
            </p>
            <p>
              iPad and iPad Air are trademarks of Apple Inc. JiGR is not affiliated with Apple Inc.
            </p>
            <p>
              All prices in New Zealand Dollars (NZD). GST included where applicable.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}