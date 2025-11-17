'use client'

import { ConsolePageWrapper } from '@/app/components/UniversalPageWrapper'
import { ModuleCard } from '@/app/components/ModuleCard'
import { ChefHat, DollarSign, Clock, Users, Plus } from 'lucide-react'

export default function RecipesConsolePage() {
  return (
    <ConsolePageWrapper moduleName="recipes">
      {/* Recipe Overview Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Total Recipes */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Recipes</h3>
            <div className="text-3xl font-bold text-blue-600 mb-2">24</div>
            <p className="text-sm text-gray-600">Active recipes in system</p>
          </div>
        </ModuleCard>

        {/* Average Food Cost */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Food Cost</h3>
            <div className="text-3xl font-bold text-green-600 mb-2">28.5%</div>
            <p className="text-sm text-gray-600">Across all recipes</p>
          </div>
        </ModuleCard>

        {/* Prep Time */}
        <ModuleCard>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Avg Prep Time</h3>
            <div className="text-3xl font-bold text-orange-600 mb-2">45m</div>
            <p className="text-sm text-gray-600">Average preparation time</p>
          </div>
        </ModuleCard>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Recent Recipes */}
        <ModuleCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Recipes</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Beef Wellington</span>
                <span className="text-xs text-green-600">32% cost</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Seafood Risotto</span>
                <span className="text-xs text-orange-600">28% cost</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Chocolate Soufflé</span>
                <span className="text-xs text-red-600">35% cost</span>
              </div>
            </div>
          </div>
        </ModuleCard>

        {/* Quick Actions */}
        <ModuleCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4 mr-2" />
                Add New Recipe
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Users className="h-4 w-4 mr-2" />
                View All Recipes
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <DollarSign className="h-4 w-4 mr-2" />
                Cost Analysis
              </button>
            </div>
          </div>
        </ModuleCard>
      </div>
    </ConsolePageWrapper>
  )
}