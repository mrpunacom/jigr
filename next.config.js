/** @type {import('next').NextConfig} */
const nextConfig = {
  // Re-enable Strict Mode - now properly handled with useRef pattern
  reactStrictMode: true,
  // Image optimization
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  
  // Netlify-specific configurations
  trailingSlash: false,
  output: 'standalone',
  
  // API route specific settings
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
  
  // External packages configuration (moved from experimental)
  serverExternalPackages: ['resend'],
  
  // Build configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Build performance optimizations
  experimental: {
    // Enable build worker threads for faster builds
    workerThreads: false,
    // Optimize CSS imports
    optimizeCss: true,
    // Enable build cache
    forceSwcTransforms: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console.logs in production builds
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Bundle analyzer setup for monitoring build sizes
  webpack: (config, { dev }) => {
    // Only in development for better DX
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }
    
    return config
  },
}

module.exports = nextConfig