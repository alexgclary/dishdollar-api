-- Create scraped_recipes table for the 3-layer recipe scraping pipeline
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS scraped_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source attribution (Layer 1)
  source_url TEXT NOT NULL UNIQUE,
  source_domain TEXT NOT NULL,
  source_author TEXT,
  discovery_query TEXT,

  -- Raw extracted data (Layer 2 - Firecrawl output)
  raw_title TEXT,
  raw_ingredients JSONB,
  raw_instructions JSONB,
  raw_prep_time INTEGER,
  raw_cook_time INTEGER,
  raw_servings INTEGER,

  -- Normalized data (Layer 3 - Claude output)
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  total_time INTEGER,
  servings INTEGER DEFAULT 4,
  cuisines JSONB DEFAULT '[]'::jsonb,
  diets JSONB DEFAULT '[]'::jsonb,
  estimated_cost DECIMAL(6,2),

  -- Scraping metadata
  scrape_status TEXT NOT NULL DEFAULT 'pending',
  scrape_error TEXT,
  robots_txt_allowed BOOLEAN DEFAULT true,
  extraction_method TEXT DEFAULT 'firecrawl',
  normalization_model TEXT,
  content_hash TEXT,

  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  extracted_at TIMESTAMPTZ,
  normalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for URL deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_scraped_recipes_url
ON scraped_recipes (source_url);

-- Index for querying by pipeline status
CREATE INDEX IF NOT EXISTS idx_scraped_recipes_status
ON scraped_recipes (scrape_status);

-- Index for domain-based queries
CREATE INDEX IF NOT EXISTS idx_scraped_recipes_domain
ON scraped_recipes (source_domain);

-- Index for discovery query lookups
CREATE INDEX IF NOT EXISTS idx_scraped_recipes_query
ON scraped_recipes (discovery_query);

-- GIN indexes for JSONB array filtering
CREATE INDEX IF NOT EXISTS idx_scraped_recipes_cuisines
ON scraped_recipes USING GIN (cuisines);

CREATE INDEX IF NOT EXISTS idx_scraped_recipes_diets
ON scraped_recipes USING GIN (diets);

-- Enable Row Level Security
ALTER TABLE scraped_recipes ENABLE ROW LEVEL SECURITY;

-- Service role can manage all rows
CREATE POLICY "Service role can manage scraped recipes"
ON scraped_recipes
FOR ALL
USING (true)
WITH CHECK (true);

-- Anon users can read normalized recipes only
CREATE POLICY "Anon users can read normalized scraped recipes"
ON scraped_recipes
FOR SELECT
USING (scrape_status = 'normalized');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scraped_recipes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scraped_recipes_updated_at
  BEFORE UPDATE ON scraped_recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_scraped_recipes_timestamp();
