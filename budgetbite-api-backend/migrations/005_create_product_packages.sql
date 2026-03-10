-- Create product_packages table for package-based ingredient pricing cache
-- Stores purchasable package info (e.g., "Hellmann's Mayo 30oz jar - $5.99")
-- rather than unit-based estimates. Run in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS product_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT NOT NULL,
  product_title TEXT NOT NULL,
  package_size TEXT,
  price DECIMAL(10, 2) NOT NULL,
  price_per_unit DECIMAL(10, 2),
  image_url TEXT,
  source TEXT DEFAULT 'spoonacular',
  confidence DECIMAL(3, 2) DEFAULT 0.85,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ingredient_name UNIQUE(ingredient_name)
);

CREATE INDEX IF NOT EXISTS idx_product_packages_ingredient ON product_packages(ingredient_name);
CREATE INDEX IF NOT EXISTS idx_product_packages_last_updated ON product_packages(last_updated);

ALTER TABLE product_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON product_packages FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert"
  ON product_packages FOR INSERT TO authenticated WITH CHECK (true);

-- Auto-update last_updated on row modification
CREATE OR REPLACE FUNCTION update_product_packages_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_packages_last_updated
  BEFORE UPDATE ON product_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_product_packages_last_updated();
