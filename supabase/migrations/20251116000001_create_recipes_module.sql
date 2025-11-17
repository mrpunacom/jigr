-- Recipe Management Module Migration
-- Creates core tables for recipe management functionality
-- Based on JiGR_Inventory_Recipe_Database_Schema.md

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Recipe Categories Table
CREATE TABLE recipe_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  category_name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(client_id, category_name)
);

-- 2. Recipes Table 
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category_id UUID REFERENCES recipe_categories(id) ON DELETE SET NULL,
  
  -- Recipe Identification
  recipe_name VARCHAR(255) NOT NULL,
  recipe_number VARCHAR(50),
  recipe_description TEXT,
  
  -- Yield Information
  number_of_portions INTEGER NOT NULL DEFAULT 1,
  portion_size VARCHAR(100),
  portion_unit VARCHAR(50),
  
  -- Timing Information
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  total_time_minutes INTEGER,
  difficulty_level VARCHAR(50),
  
  -- Costing (calculated values stored for performance)
  total_cost DECIMAL(10,4) DEFAULT 0,
  cost_per_portion DECIMAL(10,4) DEFAULT 0,
  
  -- Menu Pricing
  menu_price DECIMAL(10,2),
  food_cost_percentage DECIMAL(5,2),
  
  -- Recipe Details
  instructions TEXT,
  cooking_notes TEXT,
  plating_notes TEXT,
  allergen_info TEXT,
  dietary_flags TEXT,
  recipe_yield VARCHAR(100),
  storage_instructions TEXT,
  
  -- Status & Tracking
  is_active BOOLEAN DEFAULT true,
  last_costed TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(client_id, recipe_name)
);

-- 3. Recipe Ingredients Table
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  
  -- Ingredient Information
  ingredient_name VARCHAR(255) NOT NULL,
  ingredient_type VARCHAR(50) DEFAULT 'inventory', -- 'inventory' or 'sub_recipe'
  
  -- For inventory items (when ingredient_type = 'inventory')
  item_id UUID, -- References inventory_items when implemented
  
  -- For sub-recipes (when ingredient_type = 'sub_recipe') 
  sub_recipe_id UUID, -- References sub_recipes when implemented
  
  -- Quantity Information
  quantity DECIMAL(10,4) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  
  -- Cost Tracking (stored for historical accuracy)
  unit_cost DECIMAL(10,4) DEFAULT 0,
  extended_cost DECIMAL(10,4) DEFAULT 0,
  
  -- Additional Information
  prep_notes TEXT,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_recipe_categories_client ON recipe_categories(client_id);
CREATE INDEX idx_recipes_client ON recipes(client_id);
CREATE INDEX idx_recipes_category ON recipes(category_id);
CREATE INDEX idx_recipes_name ON recipes(recipe_name);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_client ON recipe_ingredients(client_id);

-- Enable Row Level Security
ALTER TABLE recipe_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for recipe_categories
CREATE POLICY "Users can view their client's recipe categories"
ON recipe_categories FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert recipe categories for their client"
ON recipe_categories FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their client's recipe categories"
ON recipe_categories FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for recipes
CREATE POLICY "Users can view their client's recipes"
ON recipes FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert recipes for their client"
ON recipes FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their client's recipes"
ON recipes FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

-- RLS Policies for recipe_ingredients
CREATE POLICY "Users can view their client's recipe ingredients"
ON recipe_ingredients FOR SELECT
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert recipe ingredients for their client"
ON recipe_ingredients FOR INSERT
WITH CHECK (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their client's recipe ingredients"
ON recipe_ingredients FOR UPDATE
USING (
  client_id IN (
    SELECT client_id FROM client_users 
    WHERE user_id = auth.uid()
  )
);

-- Insert default recipe categories for new clients
INSERT INTO recipe_categories (client_id, category_name, display_order) 
SELECT DISTINCT client_id, 'Main Courses', 1 FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_categories 
  WHERE recipe_categories.client_id = clients.id 
  AND category_name = 'Main Courses'
);

INSERT INTO recipe_categories (client_id, category_name, display_order) 
SELECT DISTINCT client_id, 'Appetizers', 2 FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_categories 
  WHERE recipe_categories.client_id = clients.id 
  AND category_name = 'Appetizers'
);

INSERT INTO recipe_categories (client_id, category_name, display_order) 
SELECT DISTINCT client_id, 'Desserts', 3 FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_categories 
  WHERE recipe_categories.client_id = clients.id 
  AND category_name = 'Desserts'
);

INSERT INTO recipe_categories (client_id, category_name, display_order) 
SELECT DISTINCT client_id, 'Beverages', 4 FROM clients
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_categories 
  WHERE recipe_categories.client_id = clients.id 
  AND category_name = 'Beverages'
);

-- Add trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipe_categories_updated_at BEFORE UPDATE ON recipe_categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_recipe_ingredients_updated_at BEFORE UPDATE ON recipe_ingredients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();