'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StandardPageWrapper } from '@/app/components/UniversalPageWrapper';

export default function RecipeImportHub() {
  const router = useRouter();

  return (
    <StandardPageWrapper moduleName="RECIPES" currentPage="import">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Import Recipes</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Choose how you'd like to add recipes to JiGR. From bulk spreadsheet imports to scanning cookbooks—we've got you covered.
          </p>
        </div>

        {/* Import Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Google Sheets Import */}
          <ImportCard
            icon="📊"
            title="Import from Google Sheets"
            description="Bulk import 50+ recipes from your spreadsheet in minutes"
            badge="FASTEST"
            badgeColor="bg-green-500"
            features={[
              "Upload entire recipe collection at once",
              "Automatic ingredient cost calculations", 
              "Validates data before importing",
              "Perfect for migrating from Excel"
            ]}
            onClick={() => router.push('/recipes/import/google')}
            comingSoon={false}
          />

          {/* Photo OCR Import */}
          <ImportCard
            icon="📸"
            title="Photograph Recipe"
            description="Scan from cookbook, magazine, or handwritten note with AI"
            badge="NEW"
            badgeColor="bg-blue-500"
            features={[
              "Works with iPad camera or photo upload",
              "AI extracts text from images automatically",
              "Handles handwritten recipes",
              "Perfect for family recipes & cookbooks"
            ]}
            onClick={() => router.push('/recipes/import/photo')}
            comingSoon={true}
          />

          {/* Website URL Import */}
          <ImportCard
            icon="🌐"
            title="Import from Website"
            description="Copy recipe from AllRecipes, BBC Food, NYT Cooking, and more"
            badge="EASY"
            badgeColor="bg-purple-500"
            features={[
              "Works with 1000+ recipe websites",
              "Automatically extracts structured data",
              "No copy-pasting required",
              "Respects copyright for restaurant use"
            ]}
            onClick={() => router.push('/recipes/import/url')}
            comingSoon={true}
          />

          {/* Manual Entry */}
          <ImportCard
            icon="✏️"
            title="Create Manually"
            description="Enter recipe details by hand with our guided form"
            badge=""
            badgeColor=""
            features={[
              "Full control over every detail",
              "Step-by-step guided process",
              "Real-time cost calculations",
              "Perfect for custom creations"
            ]}
            onClick={() => router.push('/recipes/new')}
            comingSoon={false}
          />
        </div>

        {/* Stats Banner */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">40×</div>
              <div className="text-sm text-gray-600">Faster Onboarding</div>
              <div className="text-xs text-gray-500">20 hours → 30 minutes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-600">Recipe Sources</div>
              <div className="text-xs text-gray-500">Every format covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">1st</div>
              <div className="text-sm text-gray-600">In Industry</div>
              <div className="text-xs text-gray-500">No competitor has this</div>
            </div>
          </div>
        </div>

        {/* Development Notice */}
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-8">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>Development Status:</strong> Google Sheets import is fully functional. Photo OCR and Website URL imports are coming soon with AI-powered text extraction.
              </p>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg">
          <h3 className="font-medium mb-2 flex items-center gap-2 text-yellow-800">
            ⚖️ Copyright & Usage Notice
          </h3>
          <p className="text-sm text-yellow-700 leading-relaxed">
            Only import recipes for personal or business use in your restaurant. 
            Do not redistribute copyrighted recipes. Respect original recipe creators. 
            When importing from websites or publications, recipes are for your internal 
            kitchen use only.
          </p>
        </div>

        {/* Back to Recipes */}
        <div className="mt-8 text-center">
          <Link 
            href="/recipes"
            className="inline-flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Recipes
          </Link>
        </div>
    </StandardPageWrapper>
  );
}

// Import Card Component
function ImportCard({
  icon,
  title,
  description,
  badge,
  badgeColor,
  features,
  onClick,
  comingSoon = false
}: {
  icon: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  features: string[];
  onClick: () => void;
  comingSoon?: boolean;
}) {
  return (
    <div className={`bg-white/70 backdrop-blur-sm rounded-lg shadow-sm border border-white/20 p-6 relative ${comingSoon ? 'opacity-75' : 'hover:shadow-md'} transition-all duration-200`}>
      {/* Badge */}
      {badge && (
        <span className={`absolute top-4 right-4 px-2 py-1 text-xs font-bold rounded text-white ${badgeColor}`}>
          {badge}
        </span>
      )}

      {/* Coming Soon Overlay */}
      {comingSoon && (
        <div className="absolute top-4 left-4 px-2 py-1 text-xs font-bold rounded bg-gray-500 text-white">
          COMING SOON
        </div>
      )}

      {/* Icon & Title */}
      <div className="mb-4">
        <div className="text-5xl mb-3">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>

      {/* Features List */}
      <div className="mb-6">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start text-sm text-gray-700">
              <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <button
        onClick={onClick}
        disabled={comingSoon}
        className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors TouchTarget ${
          comingSoon 
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {comingSoon ? (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Coming Soon
          </>
        ) : (
          <>
            Get Started
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>
    </div>
  );
}