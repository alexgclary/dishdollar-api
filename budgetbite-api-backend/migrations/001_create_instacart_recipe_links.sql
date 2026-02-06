-- Create instacart_recipe_links table for caching Instacart recipe URLs
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS instacart_recipe_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL,
  ingredients_hash TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 4,
  instacart_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,

  -- Unique constraint to prevent duplicate cache entries
  CONSTRAINT unique_recipe_cache UNIQUE (recipe_id, ingredients_hash, servings)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_instacart_links_lookup
ON instacart_recipe_links (recipe_id, ingredients_hash, servings);

-- Create index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_instacart_links_expires
ON instacart_recipe_links (expires_at);

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE instacart_recipe_links ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows the service role to manage all rows
CREATE POLICY "Service role can manage instacart links"
ON instacart_recipe_links
FOR ALL
USING (true)
WITH CHECK (true);

-- Optional: Create a function to clean up expired cache entries
-- Can be called periodically via a cron job or Supabase Edge Function
CREATE OR REPLACE FUNCTION cleanup_expired_instacart_links()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM instacart_recipe_links
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
