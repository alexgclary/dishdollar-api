-- Create ingredient_prices table for caching grocery price lookups
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS ingredient_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name TEXT NOT NULL,
  ingredient_hash TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  store_identifier TEXT NOT NULL,
  price DECIMAL(8,2) NOT NULL,
  product_name TEXT,
  brand TEXT,
  size TEXT,
  product_url TEXT,
  is_on_sale BOOLEAN DEFAULT false,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'low',
  spoonacular_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Unique constraint to prevent duplicate cache entries
  CONSTRAINT unique_ingredient_price UNIQUE (ingredient_hash, zip_code, store_identifier)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_lookup
ON ingredient_prices (ingredient_hash, zip_code, store_identifier);

-- Create index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_expires
ON ingredient_prices (expires_at);

-- Create index for source-based queries
CREATE INDEX IF NOT EXISTS idx_ingredient_prices_source
ON ingredient_prices (source);

-- Enable Row Level Security
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to manage all rows
CREATE POLICY "Service role can manage ingredient prices"
ON ingredient_prices
FOR ALL
USING (true)
WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ingredient_prices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredient_prices_updated_at
  BEFORE UPDATE ON ingredient_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_ingredient_prices_updated_at();

-- Cleanup function for expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_ingredient_prices()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ingredient_prices
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
