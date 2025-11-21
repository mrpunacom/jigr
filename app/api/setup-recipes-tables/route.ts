// API endpoint to set up recipes tables manually
// GET /api/setup-recipes-tables

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['recipe_categories', 'recipes', 'recipe_ingredients'])
      .eq('table_schema', 'public')

    if (checkError) {
      console.log('Could not check existing tables (this is expected):', checkError.message)
    }

    // Create recipe_categories table
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS recipe_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          category_name VARCHAR(100) NOT NULL,
          display_order INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(client_id, category_name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_recipe_categories_client ON recipe_categories(client_id);
        ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
      `
    })

    // Create recipes table
    const { error: recipesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS recipes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
          recipe_name VARCHAR(255) NOT NULL,
          recipe_number VARCHAR(50),
          recipe_description TEXT,
          number_of_portions INTEGER NOT NULL DEFAULT 1,
          portion_size VARCHAR(100),
          portion_unit VARCHAR(50),
          prep_time_minutes INTEGER,
          cook_time_minutes INTEGER,
          total_time_minutes INTEGER,
          difficulty_level VARCHAR(50),
          total_cost DECIMAL(10,4) DEFAULT 0,
          cost_per_portion DECIMAL(10,4) DEFAULT 0,
          menu_price DECIMAL(10,2),
          food_cost_percentage DECIMAL(5,2),
          instructions TEXT,
          cooking_notes TEXT,
          plating_notes TEXT,
          allergen_info TEXT,
          dietary_flags TEXT,
          recipe_yield VARCHAR(100),
          storage_instructions TEXT,
          is_active BOOLEAN DEFAULT true,
          last_costed TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          UNIQUE(client_id, recipe_name)
        );
        
        CREATE INDEX IF NOT EXISTS idx_recipes_client ON recipes(client_id);
        CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category_id);
        ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
      `
    })

    // Create recipe_ingredients table
    const { error: ingredientsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS recipe_ingredients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
          ingredient_name VARCHAR(255) NOT NULL,
          ingredient_type VARCHAR(50) DEFAULT 'inventory',
          item_id UUID,
          sub_recipe_id UUID,
          quantity DECIMAL(10,4) NOT NULL,
          unit VARCHAR(50) NOT NULL,
          unit_cost DECIMAL(10,4) DEFAULT 0,
          extended_cost DECIMAL(10,4) DEFAULT 0,
          prep_notes TEXT,
          display_order INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        
        CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
        ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
      `
    })

    const errors = []
    if (categoriesError) errors.push(`Categories table: ${categoriesError.message}`)
    if (recipesError) errors.push(`Recipes table: ${recipesError.message}`)
    if (ingredientsError) errors.push(`Ingredients table: ${ingredientsError.message}`)

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Some tables could not be created',
        details: errors
      }, { status: 500 })
    }

    // Add default categories for all existing clients
    const { data: clients } = await supabase
      .from('clients')
      .select('id')

    if (clients && clients.length > 0) {
      for (const client of clients) {
        const defaultCategories = [
          { client_id: client.id, category_name: 'Main Courses', display_order: 1 },
          { client_id: client.id, category_name: 'Appetizers', display_order: 2 },
          { client_id: client.id, category_name: 'Desserts', display_order: 3 },
          { client_id: client.id, category_name: 'Beverages', display_order: 4 }
        ]

        for (const category of defaultCategories) {
          await supabase
            .from('recipe_categories')
            .insert(category)
            .onConflict('client_id, category_name')
            .ignoreDuplicates()
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe tables created successfully!',
      tables_created: [
        'recipe_categories',
        'recipes', 
        'recipe_ingredients'
      ],
      clients_updated: clients?.length || 0
    })

  } catch (error) {
    console.error('Error setting up recipe tables:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}