'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PublicPageBackgroundWithGradient } from '@/app/components/backgrounds/PublicPageBackground'

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Redirect authenticated users to dashboard
        router.push('/dashboard')
      }
    }
    
    checkAuth()
  }, [router])
  return (
    <PublicPageBackgroundWithGradient
      backgroundImage="restaurant.jpg"
      gradientStart="rgba(0,0,0,0.4)"
      gradientEnd="rgba(0,0,0,0.6)"
      additionalOverlay="rgba(0,0,0,0.2)"
    >
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="https://rggdywqnvpuwssluzfud.supabase.co/storage/v1/object/public/branding/JigrLogoStackWhite.png" 
            alt="JiGR Logo" 
            className="h-32 w-auto md:h-40 object-contain"
          />
        </div>

        {/* Tagline */}
        <div className="text-center mb-6">
          <h2 className="text-white/90 text-sm md:text-base font-medium tracking-wider uppercase mb-6">
            MODULAR HOSPITALITY SOLUTION
          </h2>
        </div>

        {/* Main Headline */}
        <div className="text-center mb-8 max-w-4xl">
          <h1 className="font-playfair text-white font-bold mb-4 leading-tight">
            <span className="text-2xl md:text-4xl lg:text-5xl">your </span>
            <span className="italic text-3xl md:text-5xl lg:text-6xl">affordable</span>
            <span className="text-2xl md:text-4xl lg:text-5xl"> measuring tool</span>
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-light">
            built by a restaurateur, for restaurateurs
          </p>
        </div>

        {/* Call to Action Links - iPad Cache Bust v2 */}
        <div className="flex items-center justify-center gap-16 md:gap-8 lg:gap-6 mt-8">
          <Link 
            href="/login"
            className="text-white hover:text-white/80 font-semibold text-3xl md:text-4xl transition-colors duration-200"
          >
            LOGIN
          </Link>
          <div className="w-px h-8 bg-white/50"></div>
          <Link 
            href="/register"
            className="text-white hover:text-white/80 font-semibold text-3xl md:text-4xl transition-colors duration-200"
          >
            REGISTER
          </Link>
        </div>


        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className="flex justify-center items-center gap-3 mb-2 flex-wrap">
            <Link 
              href="/privacy-policy"
              className="text-white/60 hover:text-white/80 text-xs transition-colors duration-200"
            >
              Privacy Policy
            </Link>
            <div className="w-px h-3 bg-white/30"></div>
            <Link 
              href="/cookie-policy"
              className="text-white/60 hover:text-white/80 text-xs transition-colors duration-200"
            >
              Cookie Policy
            </Link>
            <div className="w-px h-3 bg-white/30"></div>
            <Link 
              href="/champion/program"
              className="text-white/60 hover:text-white/80 text-xs transition-colors duration-200"
            >
              JiGR Heroes
            </Link>
          </div>
          <p className="text-white/50 text-xs">
            © 2025 JiGR | Modular Hospitality Solution
          </p>
        </div>
      </div>
    </PublicPageBackgroundWithGradient>
  )
}