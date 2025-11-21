-- Migration 033: Menu Import Enhancements
-- Adds import tracking and validation columns to MenuPricing table

-- Add import-related columns
ALTER TABLE MenuPricing 
ADD COLUMN IF NOT EXISTS import_method VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS target_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS actual_food_cost_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS price_recommendation DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS import_notes TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DECIMAL(3,2);

-- Add validation status columns
ALTER TABLE MenuPricing
ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS validation_message TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_menu_pricing_validation_status 
  ON MenuPricing(validation_status);

CREATE INDEX IF NOT EXISTS idx_menu_pricing_import_method 
  ON MenuPricing(import_method);

-- Comments for documentation
COMMENT ON COLUMN MenuPricing.import_method IS 
  'How this menu item was imported: manual, google_sheets, website_url';

COMMENT ON COLUMN MenuPricing.target_food_cost_pct IS 
  'Target food cost percentage (e.g., 28 = 28%)';

COMMENT ON COLUMN MenuPricing.actual_food_cost_pct IS 
  'Calculated actual food cost % based on recipe cost';

COMMENT ON COLUMN MenuPricing.validation_status IS 
  'Pricing validation status: pending, good, warning, error, info';

COMMENT ON COLUMN MenuPricing.validation_message IS 
  'Human-readable validation message explaining the status';

COMMENT ON COLUMN MenuPricing.price_recommendation IS 
  'System-recommended price based on target food cost %';

COMMENT ON COLUMN MenuPricing.import_confidence IS 
  'AI confidence score (0.00-1.00) for parsed data accuracy';
