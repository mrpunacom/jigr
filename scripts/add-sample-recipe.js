// Add Sample Recipe for Beach Bistro1
// Run with: node scripts/add-sample-recipe.js

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addSampleRecipe() {
  try {
    console.log('🔍 Finding Beach Bistro1 client...')
    
    // Find Beach Bistro1 client
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .ilike('name', '%beach bistro%')
      .limit(1)

    if (clientError) {
      throw clientError
    }

    if (!clients || clients.length === 0) {
      console.error('❌ Beach Bistro1 client not found')
      process.exit(1)
    }

    const clientId = clients[0].id
    console.log(`✅ Found client: ${clients[0].name} (${clientId})`)

    // Check if recipes table exists and add sample recipe
    console.log('🍳 Adding sample recipe...')

    const sampleRecipe = {
      client_id: clientId,
      recipe_name: 'Fish & Chips - Classic',
      recipe_description: 'Fresh beer-battered fish with golden chips and mushy peas',
      category_name: 'Main Course',
      number_of_portions: 1,
      portion_size: '1',
      portion_size_unit: 'serving',
      prep_time_minutes: 20,
      cook_time_minutes: 15,
      total_time_minutes: 35,
      difficulty_level: 'Medium',
      cost_per_portion: 8.50,
      menu_price: 24.90,
      food_cost_percentage: 34.1,
      total_cost: 8.50,
      instructions: `1. Prepare batter with flour, beer, and seasonings
2. Cut fresh fish into portions and coat in seasoned flour
3. Dip fish in batter and deep fry at 180°C for 4-5 minutes
4. Fry chips until golden and crispy
5. Serve immediately with mushy peas and tartar sauce

Chef Notes:
- Use fresh fish daily
- Maintain oil temperature for best results
- Season chips while hot`,
      cooking_notes: 'Oil temperature is critical - too low and the batter will be greasy, too high and it will burn before fish is cooked through.',
      plating_notes: 'Serve on warmed plates with lemon wedge and side of mushy peas. Garnish with fresh parsley.',
      allergen_info: 'Contains: Fish, Gluten (flour), Eggs (batter). May contain traces of dairy.',
      dietary_flags: 'Contains Fish, Contains Gluten',
      recipe_yield: '1 portion',
      storage_instructions: 'Best served fresh. Fish can be pre-portioned and refrigerated for up to 24 hours.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      recipe_number: 'BB001',
      last_costed: new Date().toISOString()
    }

    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert(sampleRecipe)
      .select()
      .single()

    if (recipeError) {
      console.error('❌ Error adding recipe:', recipeError)
      
      // If table doesn't exist, show helpful message
      if (recipeError.code === '42P01') {
        console.log('💡 The recipes table doesn\'t exist yet. You may need to run database migrations first.')
      }
      return
    }

    console.log('✅ Sample recipe added successfully!')
    console.log(`📝 Recipe ID: ${recipe.id}`)
    console.log(`🍽️  Recipe Name: ${recipe.recipe_name}`)
    console.log(`💰 Cost per Portion: $${recipe.cost_per_portion}`)
    console.log(`🏷️  Menu Price: $${recipe.menu_price}`)
    console.log(`📊 Food Cost %: ${recipe.food_cost_percentage}%`)
    
    console.log('\n🔗 To view this recipe, go to:')
    console.log(`   /recipes/${recipe.id}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the script
addSampleRecipe()