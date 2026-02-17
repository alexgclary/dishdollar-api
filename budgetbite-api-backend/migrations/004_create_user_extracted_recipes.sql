-- Create user_extracted_recipes table for saving extraction history
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_extracted_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_url TEXT NOT NULL,
  recipe_title TEXT NOT NULL,
  recipe_data JSONB NOT NULL DEFAULT '{}',
  extracted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate extractions of the same URL per user
  CONSTRAINT unique_user_recipe_url UNIQUE (user_id, recipe_url)
);

-- Index for fetching a user's extraction history
CREATE INDEX IF NOT EXISTS idx_extracted_recipes_user
ON user_extracted_recipes (user_id, extracted_at DESC);

-- Enable Row Level Security
ALTER TABLE user_extracted_recipes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own extracted recipes
CREATE POLICY "Users can view own extracted recipes"
ON user_extracted_recipes
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own extracted recipes
CREATE POLICY "Users can insert own extracted recipes"
ON user_extracted_recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own extracted recipes
CREATE POLICY "Users can delete own extracted recipes"
ON user_extracted_recipes
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own extracted recipes (for re-extraction)
CREATE POLICY "Users can update own extracted recipes"
ON user_extracted_recipes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role can manage all rows (for backend API)
CREATE POLICY "Service role can manage extracted recipes"
ON user_extracted_recipes
FOR ALL
USING (true)
WITH CHECK (true);
