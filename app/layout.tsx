import { Inter, Playfair_Display } from 'next/font/google'
import { FeedbackWidget } from './components/testing/FeedbackWidget'
import ConsoleManager from './components/ConsoleManager'
import { ServiceWorkerManager } from './components/ServiceWorkerManager'
import { ExplanationProvider } from './components/explanation/ExplanationProvider'
import { UniversalFooter } from './components/UniversalFooter'
// import BackgroundManager from './components/BackgroundManager' // DISABLED: Now using UniversalModuleHeader for backgrounds
import './globals.css'
import '../styles/ipad-responsive.css'

const inter = Inter({ subsets: ['latin'] })
const playfair = Playfair_Display({ subsets: ['latin'] })

export const metadata = {
  title: 'Hospitality Compliance System',
  description: 'Complete OCR-enhanced document compliance for hospitality industry',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen relative`}>
        {/* Dynamic Background Manager - DISABLED: Now using UniversalModuleHeader for backgrounds */}
        {/* <BackgroundManager /> */}
        
        <ExplanationProvider
          defaultPermissions={['read']}
          defaultUserRole="STAFF"
        >
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
            
            {/* Universal Footer */}
            <UniversalFooter />
          </div>
          
          {/* Service Worker for Offline Support */}
          <ServiceWorkerManager />
          
          {/* Console Management - Auto-enable quiet mode */}
          <ConsoleManager />
          
          {/* Testing Feedback Widget - Only visible with ?testing=true parameter */}
          <FeedbackWidget />
        </ExplanationProvider>
      </body>
    </html>
  )
}